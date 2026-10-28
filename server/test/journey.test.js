import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { createApiClient, ApiError } from '../../mobile-app/src/services/httpClient.ts';
import {
  transactionDateForMonth,
  parseMoney,
  shiftMonth,
} from '../../mobile-app/src/utils/format.ts';

let mongo, server, client, baseUrl;

before(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { downloadDir: fileURLToPath(new URL('../.cache/mongodb', import.meta.url)) },
  });
  await connectDatabase(mongo.getUri());
  const app = createApp({
    jwtSecret: 'mobile-journey-secret-at-least-32-characters',
    rateLimitEnabled: false,
  });
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  client = createApiClient(baseUrl);
});

after(async () => {
  if (server?.listening)
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  await disconnectDatabase();
  if (mongo) await mongo.stop();
});

const expectStatus = (status) => (error) => error instanceof ApiError && error.status === status;

test('mobile HTTP client: registration, CRUD, month changes, budget, account isolation and logout', async () => {
  const { api } = client;
  const account = { name: 'E2E Student', email: 'journey@example.com', password: 'Student123!' };
  const registered = await api('/auth/register', { method: 'POST', body: account });
  const token = registered.token;
  assert.equal(registered.user.email, account.email);
  assert.ok(Date.parse(registered.expiresAt) > Date.now());
  assert.deepEqual((await api('/auth/me', { token })).user, registered.user);
  await assert.rejects(api('/auth/register', { method: 'POST', body: account }), expectStatus(409));
  await assert.rejects(
    api('/auth/login', { method: 'POST', body: { ...account, password: 'incorrect' } }),
    expectStatus(401),
  );

  const month = '2026-09';
  const date = transactionDateForMonth(month, '2026-10-28');
  assert.equal(date, '2026-09-01');
  assert.equal((await api(`/summary?month=${month}`, { token })).count, 0);
  const incomeInput = {
    type: 'income',
    amount: parseMoney('3000000'),
    category: 'Gia đình',
    date,
    note: 'Tiền sinh hoạt',
  };
  const expenseInput = {
    type: 'expense',
    amount: parseMoney('1600000'),
    category: 'Nhà ở',
    date,
    note: 'Tiền trọ E2E',
  };
  const income = await api('/transactions', { token, method: 'POST', body: incomeInput });
  const expense = await api('/transactions', { token, method: 'POST', body: expenseInput });
  const id = expense.transaction.id;
  const summary = await api(`/summary?month=${month}`, { token });
  assert.equal(summary.income, 3000000);
  assert.equal(summary.expense, 1600000);
  assert.equal(summary.balance, 1400000);
  assert.deepEqual(summary.categories, [{ category: 'Nhà ở', amount: 1600000 }]);

  await api(`/budgets/${month}`, { token, method: 'PUT', body: { limit: 2000000 } });
  const budgetSummary = await api(`/summary?month=${month}`, { token });
  assert.equal(budgetSummary.budget, 2000000);
  assert.equal(budgetSummary.expense / budgetSummary.budget, 0.8);
  const search = new URLSearchParams({
    month,
    type: 'expense',
    category: 'Nhà ở',
    q: 'trọ',
    limit: '1',
  });
  const matches = await api(`/transactions?${search}`, { token });
  assert.equal(matches.total, 1);
  assert.equal(matches.items[0].id, id);

  const updated = await api(`/transactions/${id}`, {
    token,
    method: 'PUT',
    body: { ...expenseInput, amount: 2100000, date: '2026-10-01' },
  });
  assert.equal(updated.transaction.amount, 2100000);
  assert.equal((await api(`/summary?month=${month}`, { token })).expense, 0);
  assert.equal((await api('/summary?month=2026-10', { token })).expense, 2100000);

  const other = await api('/auth/register', {
    method: 'POST',
    body: { ...account, email: 'other-journey@example.com' },
  });
  await assert.rejects(api(`/transactions/${id}`, { token: other.token }), expectStatus(404));
  assert.equal((await api('/transactions', { token: other.token })).total, 0);
  assert.equal((await api(`/budgets/${month}`, { token: other.token })).limit, null);

  // A fresh client represents reopening the app with the saved token.
  const reopened = createApiClient(baseUrl);
  assert.deepEqual((await reopened.api('/auth/me', { token })).user, registered.user);
  assert.equal((await reopened.api(`/transactions/${id}`, { token })).transaction.amount, 2100000);
  await api(`/transactions/${id}`, { token, method: 'DELETE' });
  await assert.rejects(api(`/transactions/${id}`, { token }), expectStatus(404));
  assert.equal((await api('/summary?month=2026-10', { token })).expense, 0);
  assert.equal(
    (await api(`/transactions?month=${month}`, { token })).items[0].id,
    income.transaction.id,
  );

  const invalidated = [];
  client.setUnauthorizedHandler((expiredToken) => invalidated.push(expiredToken));
  assert.equal(await api('/auth/logout', { token, method: 'POST' }), null);
  await assert.rejects(api('/auth/me', { token }), expectStatus(401));
  assert.deepEqual(invalidated, [token]);
  const login = await api('/auth/login', { method: 'POST', body: account });
  assert.notEqual(login.token, token);
  assert.equal((await api(`/summary?month=${month}`, { token: login.token })).income, 3000000);
  assert.equal((await api(`/budgets/${month}`, { token: login.token })).limit, 2000000);
  client.setUnauthorizedHandler(undefined);
});

test('mobile HTTP client preserves sessions during database outages and supports cancellation', async () => {
  const account = await client.api('/auth/register', {
    method: 'POST',
    body: { name: 'Offline Student', email: 'offline@example.com', password: 'Student123!' },
  });
  let invalidated = false;
  client.setUnauthorizedHandler(() => {
    invalidated = true;
  });
  await disconnectDatabase();
  try {
    await assert.rejects(client.api('/auth/me', { token: account.token }), expectStatus(503));
    assert.equal(invalidated, false);
  } finally {
    await connectDatabase(mongo.getUri());
  }
  assert.equal((await client.api('/auth/me', { token: account.token })).user.id, account.user.id);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client.api('/health', { signal: controller.signal }), /đã được hủy/);
  client.setUnauthorizedHandler(undefined);
});

test('transaction date follows the selected month and VND validation rejects invalid amounts', () => {
  assert.equal(transactionDateForMonth('2026-10', '2026-10-28'), '2026-10-28');
  assert.equal(transactionDateForMonth('2024-02', '2026-10-28'), '2024-02-01');
  assert.equal(transactionDateForMonth('2027-01', '2026-12-31'), '2027-01-01');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  for (const value of ['0', '-1', '1.5', '1,000', '1000000000001', ''])
    assert.throws(() => parseMoney(value));
  assert.equal(parseMoney('1000000000000'), 1e12);
});

test('mobile client validates the response envelope and keeps HTTP status authoritative', async (context) => {
  const invalidBodies = [
    { user: { id: 'legacy-response' } },
    { status: 201, message: 'Mismatched status', data: {} },
    { status: 200, message: 'Missing data' },
    { status: 200, message: null, data: {} },
  ];
  const fetchMock = context.mock.method(globalThis, 'fetch');
  const isolatedClient = createApiClient('http://client-contract.test/api');
  for (const body of invalidBodies) {
    fetchMock.mock.mockImplementation(
      async () => new Response(JSON.stringify(body), { status: 200 }),
    );
    await assert.rejects(isolatedClient.api('/health'), expectStatus(200));
  }

  fetchMock.mock.mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          status: 200,
          message: 'Success',
          data: { user: { id: 'contract-user' } },
        }),
        { status: 200 },
      ),
  );
  assert.deepEqual(await isolatedClient.api('/auth/me'), { user: { id: 'contract-user' } });

  let expiredToken;
  isolatedClient.setUnauthorizedHandler((token) => {
    expiredToken = token;
  });
  fetchMock.mock.mockImplementation(async () => new Response('not-json', { status: 401 }));
  await assert.rejects(isolatedClient.api('/auth/me', { token: 'expired' }), expectStatus(401));
  assert.equal(expiredToken, 'expired');
});

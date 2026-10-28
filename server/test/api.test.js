import { before, after, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { User, Transaction, Budget } from '../src/model/index.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const secret = 'integration-test-secret-at-least-32-characters';

function assertEnvelope(response) {
  assert.match(response.headers['content-type'], /application\/json/);
  assert.deepEqual(Object.keys(response.body).sort(), ['data', 'message', 'status']);
  assert.equal(response.body.status, response.status);
  assert.equal(typeof response.body.message, 'string');
  assert.ok(response.body.message.length > 0);
  if (response.status >= 400 && response.body.data?.database !== 'disconnected') {
    assert.equal(response.body.data, null);
  }
}

let mongo, app, token, otherToken, ownerId;
const auth = () => ({ Authorization: `Bearer ${token}` });
const expense = {
  type: 'expense',
  amount: 50000,
  category: 'Ăn uống',
  date: '2026-10-27',
  note: 'Bữa trưa',
};

before(async () => {
  const cache = fileURLToPath(new URL('../.cache/mongodb', import.meta.url));
  await mkdir(cache, { recursive: true });
  mongo = await MongoMemoryServer.create({ binary: { downloadDir: cache } });
  await connectDatabase(mongo.getUri());
  app = createApp({ jwtSecret: secret, rateLimitEnabled: false });
  const owner = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Minh Anh', email: 'owner@example.com', password: 'Student123!' })
    .expect(201)
    .expect(assertEnvelope);
  token = owner.body.data.token;
  ownerId = owner.body.data.user.id;
  const other = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Sinh viên B', email: 'other@example.com', password: 'Student123!' })
    .expect(201)
    .expect(assertEnvelope);
  otherToken = other.body.data.token;
});
beforeEach(async () => {
  await Transaction.deleteMany({});
  await Budget.deleteMany({});
});
after(async () => {
  await disconnectDatabase();
  if (mongo) await mongo.stop();
});

test('health, registration, duplicate email, login validation and password hashing', async () => {
  await request(app).get('/api/health').expect(200).expect(assertEnvelope);
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'Minh Anh', email: 'OWNER@example.com', password: 'Student123!' })
    .expect(409)
    .expect(assertEnvelope);
  await request(app)
    .post('/api/auth/register')
    .send({ name: 'X', email: 'bad', password: 'x' })
    .expect(400)
    .expect(assertEnvelope);
  await request(app)
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'wrongpass' })
    .expect(401)
    .expect(assertEnvelope);
  await request(app)
    .post('/api/auth/login')
    .send({ email: ' OWNER@EXAMPLE.COM ', password: 'Student123!' })
    .expect(200)
    .expect(assertEnvelope);
  const user = await User.findById(ownerId).select('+passwordHash');
  assert.notEqual(user.passwordHash, 'Student123!');
  assert.match(user.passwordHash, /^\$2/);
  const me = await request(app).get('/api/auth/me').set(auth()).expect(200).expect(assertEnvelope);
  assert.deepEqual(Object.keys(me.body.data.user).sort(), ['email', 'id', 'name']);
});

test('CRUD recalculates income, expense, balance and categories after every change', async () => {
  const created = await request(app)
    .post('/api/transactions')
    .set(auth())
    .send(expense)
    .expect(201)
    .expect(assertEnvelope);
  const id = created.body.data.transaction.id;
  await request(app).get(`/api/transactions/${id}`).set(auth()).expect(200).expect(assertEnvelope);
  await request(app)
    .post('/api/transactions')
    .set(auth())
    .send({ ...expense, type: 'income', category: 'Gia đình', amount: 3000000 })
    .expect(201)
    .expect(assertEnvelope);
  let summary = await request(app)
    .get('/api/summary?month=2026-10')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(summary.body.data.income, 3000000);
  assert.equal(summary.body.data.expense, 50000);
  assert.equal(summary.body.data.balance, 2950000);
  await request(app)
    .put(`/api/transactions/${id}`)
    .set(auth())
    .send({ ...expense, amount: 100000 })
    .expect(200)
    .expect(assertEnvelope);
  summary = await request(app)
    .get('/api/summary?month=2026-10')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(summary.body.data.balance, 2900000);
  assert.deepEqual(summary.body.data.categories, [{ category: 'Ăn uống', amount: 100000 }]);
  await request(app)
    .delete(`/api/transactions/${id}`)
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  summary = await request(app)
    .get('/api/summary?month=2026-10')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(summary.body.data.expense, 0);
  assert.equal(summary.body.data.balance, 3000000);
  await request(app).get(`/api/transactions/${id}`).set(auth()).expect(404).expect(assertEnvelope);
});

test('ownership is enforced on lists, details, updates, deletes, summaries and budgets', async () => {
  const created = await request(app)
    .post('/api/transactions')
    .set(auth())
    .send({ ...expense, userId: 'injected' })
    .expect(201)
    .expect(assertEnvelope);
  assert.equal(created.body.data.transaction.userId, ownerId);
  const id = created.body.data.transaction.id;
  const otherAuth = { Authorization: `Bearer ${otherToken}` };
  await request(app)
    .get(`/api/transactions/${id}`)
    .set(otherAuth)
    .expect(404)
    .expect(assertEnvelope);
  await request(app)
    .put(`/api/transactions/${id}`)
    .set(otherAuth)
    .send(expense)
    .expect(404)
    .expect(assertEnvelope);
  await request(app)
    .delete(`/api/transactions/${id}`)
    .set(otherAuth)
    .expect(404)
    .expect(assertEnvelope);
  const list = await request(app)
    .get('/api/transactions')
    .set(otherAuth)
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(list.body.data.total, 0);
  const summary = await request(app)
    .get('/api/summary?month=2026-10')
    .set(otherAuth)
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(summary.body.data.count, 0);
  await request(app)
    .put('/api/budgets/2026-10')
    .set(auth())
    .send({ limit: 100000 })
    .expect(200)
    .expect(assertEnvelope);
  const budget = await request(app)
    .get('/api/budgets/2026-10')
    .set(otherAuth)
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(budget.body.data.limit, null);
});

test('search, category/type/month filters, pagination and escaped regex', async () => {
  await Transaction.create([
    { ...expense, userId: ownerId },
    { ...expense, userId: ownerId, category: 'Đi lại', note: 'Xe buýt' },
    { ...expense, userId: ownerId, date: '2026-09-30' },
  ]);
  const list = await request(app)
    .get('/api/transactions?month=2026-10&type=expense&q=trưa&limit=1')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(list.body.data.total, 1);
  assert.equal(list.body.data.items.length, 1);
  const category = await request(app)
    .get('/api/transactions')
    .query({ category: 'Đi lại' })
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(category.body.data.total, 1);
  const regex = await request(app)
    .get('/api/transactions')
    .query({ q: '.*' })
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(regex.body.data.total, 0);
  const second = await request(app)
    .get('/api/transactions?month=2026-10&limit=1&page=2')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(second.body.data.items.length, 1);
  assert.equal(second.body.data.pages, 2);
});

test('reject invalid money, date, category, month, pagination and missing bodies', async () => {
  for (const input of [
    { ...expense, amount: 0 },
    { ...expense, amount: -1 },
    { ...expense, amount: 1.5 },
    { ...expense, amount: '100' },
    { ...expense, date: '2026-02-30' },
    { ...expense, category: 'Gia đình' },
    { ...expense, note: 'x'.repeat(501) },
  ]) {
    await request(app)
      .post('/api/transactions')
      .set(auth())
      .send(input)
      .expect(400)
      .expect(assertEnvelope);
  }
  await request(app).post('/api/transactions').set(auth()).expect(400).expect(assertEnvelope);
  await request(app)
    .get('/api/summary?month=2026-13')
    .set(auth())
    .expect(400)
    .expect(assertEnvelope);
  await request(app)
    .get('/api/transactions?limit=1000')
    .set(auth())
    .expect(400)
    .expect(assertEnvelope);
  await request(app)
    .get('/api/transactions/not-an-id')
    .set(auth())
    .expect(400)
    .expect(assertEnvelope);
  await request(app).get('/api/transactions').expect(401).expect(assertEnvelope);
});

test('monthly budget updates remain unique and expense reflects an exceeded budget', async () => {
  await request(app)
    .put('/api/budgets/2026-10')
    .set(auth())
    .send({ limit: 10000 })
    .expect(200)
    .expect(assertEnvelope);
  await request(app)
    .put('/api/budgets/2026-10')
    .set(auth())
    .send({ limit: 20000 })
    .expect(200)
    .expect(assertEnvelope);
  await request(app)
    .post('/api/transactions')
    .set(auth())
    .send(expense)
    .expect(201)
    .expect(assertEnvelope);
  const summary = await request(app)
    .get('/api/summary?month=2026-10')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(summary.body.data.budget, 20000);
  assert.equal(summary.body.data.expense, 50000);
  assert.equal(await Budget.countDocuments({ userId: ownerId, month: '2026-10' }), 1);
  await request(app)
    .put('/api/budgets/2026-10')
    .set(auth())
    .send({ limit: 0 })
    .expect(400)
    .expect(assertEnvelope);
});

test('session, transactions and budget survive an API and database connection restart', async () => {
  const created = await request(app)
    .post('/api/transactions')
    .set(auth())
    .send(expense)
    .expect(201)
    .expect(assertEnvelope);
  await request(app)
    .put('/api/budgets/2026-10')
    .set(auth())
    .send({ limit: 2000000 })
    .expect(200)
    .expect(assertEnvelope);
  await disconnectDatabase();
  await connectDatabase(mongo.getUri());
  app = createApp({ jwtSecret: secret, rateLimitEnabled: false });
  await request(app).get('/api/auth/me').set(auth()).expect(200).expect(assertEnvelope);
  await request(app)
    .get(`/api/transactions/${created.body.data.transaction.id}`)
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  const budget = await request(app)
    .get('/api/budgets/2026-10')
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(budget.body.data.limit, 2000000);
});

test('logout revokes bearer token and expired sessions are rejected', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'Student123!' })
    .expect(200)
    .expect(assertEnvelope);
  const headers = { Authorization: `Bearer ${login.body.data.token}` };
  await request(app).post('/api/auth/logout').set(headers).expect(200).expect(assertEnvelope);
  await request(app).get('/api/auth/me').set(headers).expect(401).expect(assertEnvelope);
  const expired = jwt.sign({}, secret, {
    subject: ownerId,
    jwtid: new mongoose.Types.ObjectId().toString(),
    expiresIn: -1,
    issuer: 'vi-sinh-vien',
    audience: 'vi-sinh-vien-mobile',
  });
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${expired}`)
    .expect(401)
    .expect(assertEnvelope);
});

test('database disconnect returns a controlled 503 instead of exposing database errors', async () => {
  await disconnectDatabase();
  try {
    await request(app).get('/api/health').expect(503).expect(assertEnvelope);
    const response = await request(app)
      .get('/api/transactions')
      .set(auth())
      .expect(503)
      .expect(assertEnvelope);
    assert.equal(response.body.message, 'Dịch vụ tạm thời gián đoạn. Vui lòng thử lại.');
    assert.equal(response.body.stack, undefined);
  } finally {
    await connectDatabase(mongo.getUri());
  }
});

test('parser, authorization and unknown endpoint errors use the response envelope', async () => {
  await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{"email":')
    .expect(400)
    .expect(assertEnvelope);
  await request(app)
    .post('/api/auth/login')
    .send({ padding: 'x'.repeat(17_000) })
    .expect(413)
    .expect(assertEnvelope);
  await request(app).get('/api/transactions').expect(401).expect(assertEnvelope);
  await request(app).get('/api/unknown').set(auth()).expect(404).expect(assertEnvelope);
  await request(app).get('/unknown').expect(404).expect(assertEnvelope);
});

test('logout and delete return HTTP 200 with message and null data', async () => {
  const created = await request(app)
    .post('/api/transactions')
    .set(auth())
    .send(expense)
    .expect(201)
    .expect(assertEnvelope);
  const deleted = await request(app)
    .delete(`/api/transactions/${created.body.data.transaction.id}`)
    .set(auth())
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(deleted.body.data, null);

  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'owner@example.com', password: 'Student123!' })
    .expect(200)
    .expect(assertEnvelope);
  const logout = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${login.body.data.token}`)
    .expect(200)
    .expect(assertEnvelope);
  assert.equal(logout.body.data, null);
});

test('both authentication and API rate limits use the response envelope', async () => {
  const limitedApp = createApp({ jwtSecret: secret });
  for (let index = 0; index < 30; index++) {
    await request(limitedApp).post('/api/auth/login').send({}).expect(400).expect(assertEnvelope);
  }
  await request(limitedApp).post('/api/auth/login').send({}).expect(429).expect(assertEnvelope);

  const apiLimitedApp = createApp({ jwtSecret: secret });
  for (let index = 0; index < 180; index++) {
    await request(apiLimitedApp).get('/api/health').expect(200).expect(assertEnvelope);
  }
  await request(apiLimitedApp).get('/api/health').expect(429).expect(assertEnvelope);
});

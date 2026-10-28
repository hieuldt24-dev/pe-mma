// Isolated UI integration server. Never reads Atlas credentials or production data.
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const mongo = await MongoMemoryServer.create({
  binary: { downloadDir: fileURLToPath(new URL('../.cache/mongodb', import.meta.url)) },
});
await connectDatabase(mongo.getUri());
const app = createApp({
  jwtSecret: 'ui-integration-only-secret-at-least-32-characters',
  corsOrigins: ['http://localhost:8081', 'http://127.0.0.1:8081'],
  rateLimitEnabled: false,
});
const server = app.listen(3001, '127.0.0.1', () =>
  console.log('Isolated test API ready at http://127.0.0.1:3001/api. Data is temporary.'),
);
const stop = () =>
  server.close(() =>
    disconnectDatabase()
      .then(() => mongo.stop())
      .then(() => process.exit(0)),
  );
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

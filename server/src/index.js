import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

try {
  const config = loadConfig();
  const app = createApp(config);
  await connectDatabase(config.mongodbUri);
  const server = app.listen(config.port, '0.0.0.0', () =>
    console.log(`Ví Sinh Viên API đang chạy tại cổng ${config.port}`),
  );
  const shutdown = () => server.close(() => disconnectDatabase().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error(
    `Không thể khởi động API (${error.name}). Kiểm tra server/.env, Atlas Network Access và Database User.`,
  );
  await disconnectDatabase();
  process.exit(1);
}

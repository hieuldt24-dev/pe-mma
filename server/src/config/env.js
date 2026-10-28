import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export function loadConfig() {
  dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });
  return {
    mongodbUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    port: Number(process.env.PORT ?? 3000),
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:8081,http://127.0.0.1:8081')
      .split(',')
      .map((value) => value.trim()),
  };
}

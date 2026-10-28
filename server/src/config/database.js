import mongoose from 'mongoose';
import { initializeModels } from '../model/index.js';

mongoose.set('bufferCommands', false);
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

export async function connectDatabase(uri) {
  if (!uri || uri.includes('USERNAME')) throw new Error('Điền MONGODB_URI thật trong server/.env.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  await initializeModels();
}

export function disconnectDatabase() {
  return mongoose.disconnect();
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

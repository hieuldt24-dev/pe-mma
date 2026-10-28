import mongoose from 'mongoose';
import { fail } from '../service/validation.js';

export function validateTransactionId(_req, _res, next, id) {
  if (!mongoose.isObjectIdOrHexString(id)) fail('ID giao dịch không hợp lệ.');
  next();
}

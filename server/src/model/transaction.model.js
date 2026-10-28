import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 1, max: 1e12 },
    category: { type: String, required: true },
    date: { type: String, required: true },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true },
);
transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });

export const Transaction = model('Transaction', transactionSchema);

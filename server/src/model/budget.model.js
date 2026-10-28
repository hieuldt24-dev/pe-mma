import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true },
    limit: { type: Number, min: 1, max: 1e12, required: true },
  },
  { timestamps: true },
);
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget = model('Budget', budgetSchema);

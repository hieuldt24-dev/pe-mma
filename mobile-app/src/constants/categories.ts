import type { TransactionType } from '@/types/finance';

export const categories: Record<TransactionType, string[]> = {
  income: ['Gia đình', 'Làm thêm', 'Học bổng', 'Quà tặng', 'Thu khác'],
  expense: ['Ăn uống', 'Nhà ở', 'Đi lại', 'Học tập', 'Mua sắm', 'Giải trí', 'Sức khỏe', 'Chi khác'],
};
export const categoryColors = [
  '#176B4A',
  '#D6A346',
  '#6E9AB3',
  '#B17A93',
  '#8F93C2',
  '#74A48D',
  '#CE8972',
  '#929D8C',
];

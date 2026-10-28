export const currency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
export const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const currentMonth = () => today().slice(0, 7);
export function transactionDateForMonth(month: string, currentDate = today()) {
  return currentDate.startsWith(`${month}-`) ? currentDate : `${month}-01`;
}
export const monthLabel = (month: string) =>
  `Tháng ${Number(month.slice(5))}, ${month.slice(0, 4)}`;
export const dateLabel = (date: string) => date.split('-').reverse().join('/');
export function shiftMonth(month: string, offset: number) {
  const date = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
export function parseMoney(text: string) {
  if (!/^\d+$/.test(text.trim()))
    throw new Error('Nhập số tiền VND nguyên, không có dấu chấm hoặc dấu phẩy.');
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1e12)
    throw new Error('Số tiền phải từ 1 đến 1.000.000.000.000 đồng.');
  return value;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';

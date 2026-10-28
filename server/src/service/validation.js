export const categories = {
  income: ['Gia đình', 'Làm thêm', 'Học bổng', 'Quà tặng', 'Thu khác'],
  expense: ['Ăn uống', 'Nhà ở', 'Đi lại', 'Học tập', 'Mua sắm', 'Giải trí', 'Sức khỏe', 'Chi khác'],
};

export function fail(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

export function monthValue(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(value) ||
    +value.slice(0, 4) < 2000 ||
    +value.slice(0, 4) > 2100
  ) {
    fail('Tháng phải có định dạng YYYY-MM, năm từ 2000 đến 2100.');
  }
  return value;
}

export function money(value) {
  if (!Number.isSafeInteger(value) || value <= 0 || value > 1_000_000_000_000)
    fail('Số tiền phải là số nguyên VND từ 1 đến 1.000.000.000.000.');
  return value;
}

export function transactionInput(body) {
  const { type, amount, category, date } = body;
  if (!['income', 'expense'].includes(type)) fail('Loại giao dịch không hợp lệ.');
  money(amount);
  if (!categories[type].includes(category)) fail('Danh mục không phù hợp với loại giao dịch.');
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    fail('Ngày phải có định dạng YYYY-MM-DD.');
  const parsed = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    fail('Ngày giao dịch không tồn tại.');
  monthValue(date.slice(0, 7));
  if (body.note !== undefined && typeof body.note !== 'string') fail('Ghi chú không hợp lệ.');
  const note = (body.note ?? '').trim();
  if (note.length > 500) fail('Ghi chú tối đa 500 ký tự.');
  return { type, amount, category, date, note };
}

export function credentials(body, register = false) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email không hợp lệ.');
  if (
    typeof body.password !== 'string' ||
    body.password.length < 8 ||
    Buffer.byteLength(body.password, 'utf8') > 72
  )
    fail('Mật khẩu cần ít nhất 8 ký tự và tối đa 72 byte.');
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (register && (name.length < 2 || name.length > 60)) fail('Họ tên cần từ 2 đến 60 ký tự.');
  return { email, password: body.password, name };
}

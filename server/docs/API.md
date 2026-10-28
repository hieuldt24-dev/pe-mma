# Hợp đồng REST API

Base URL `/api`. JSON, UTF-8. Mọi endpoint ngoài health, register và login cần `Authorization: Bearer <token>`.

## Response chuẩn

Mọi response JSON nghiệp vụ, health và lỗi đều có đúng ba trường:

```json
{
  "status": 200,
  "message": "Lấy thông tin tài khoản thành công.",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Minh Anh",
      "email": "student@example.com"
    }
  }
}
```

- `status`: số nguyên, luôn khớp HTTP status thực tế. Thành công dùng 200 hoặc 201; lỗi dùng 4xx/5xx.
- `message`: chuỗi thông báo về kết quả thao tác.
- `data`: payload của endpoint. Không có dữ liệu thì trả `null`; lỗi thông thường cũng trả `null`.
- Health cung cấp dữ liệu chẩn đoán: `data.database` là `connected` hoặc `disconnected`, kể cả khi HTTP status là 503.
- Logout và xóa giao dịch chuyển từ 204 sang **200**, để luôn trả được JSON và message.
- HEAD không có body và CORS preflight OPTIONS có thể trả 204; đây là phản hồi giao thức, không phải JSON nghiệp vụ.

Ví dụ tạo giao dịch thành công: HTTP 201, `{ "status": 201, "message": "Thêm giao dịch thành công.", "data": { "transaction": { ... } } }`.

Ví dụ xóa/đăng xuất thành công:

```json
{
  "status": 200,
  "message": "Xóa giao dịch thành công.",
  "data": null
}
```

Ví dụ lỗi xác thực:

```json
{
  "status": 401,
  "message": "Vui lòng đăng nhập.",
  "data": null
}
```

Mobile `api<T>()` kiểm tra envelope, dùng HTTP status để xử lý lỗi/401 và trả về trực tiếp `response.data` cho screen. Vì vậy screen tiếp tục đọc `result.user`, `result.transaction`, `result.items` mà không tự bóc thêm `data`. `ApiResponse<T>` mô tả JSON đầy đủ trên đường truyền.

## Endpoint

Trong bảng dưới, cột kết quả mô tả **HTTP status và payload bên trong `data`**, không phải toàn bộ response JSON.

| Method | Path | Input | Kết quả |
|---|---|---|---|
| GET | /health | | 200 hoặc 503, `{database:"connected" hoặc "disconnected"}` |
| POST | /auth/register | `{name,email,password}` | 201 `{token,user,expiresAt}` |
| POST | /auth/login | `{email,password}` | 200 `{token,user,expiresAt}` |
| GET | /auth/me | | `{user:{id,name,email}}` |
| POST | /auth/logout | | 200, `null`, thu hồi phiên hiện tại |
| GET | /transactions | `?month=YYYY-MM&type=income/expense&category=...&q=...&page=1&limit=20` | `{items,total,page,limit,pages}` |
| POST | /transactions | TransactionInput | 201 `{transaction}` |
| GET | /transactions/:id | | `{transaction}` |
| PUT | /transactions/:id | Toàn bộ TransactionInput | `{transaction}` |
| DELETE | /transactions/:id | | 200, `null` |
| GET | /summary | `?month=YYYY-MM` bắt buộc | `{month,income,expense,balance,count,budget,categories:[{category,amount}]}` |
| GET | /budgets/:month | | `{month,limit:number hoặc null}` |
| PUT | /budgets/:month | `{limit:number}` | `{month,limit}` |

TransactionInput: `{type:"income"|"expense",amount:number,category:string,date:"YYYY-MM-DD",note?:string}`. Phản hồi giao dịch bổ sung `id`, `userId`. VND nguyên, 1–1.000.000.000.000. Ghi chú tối đa 500 ký tự. Ngày hợp lệ trong 2000–2100. Danh mục được kiểm tra theo `server/src/service/validation.js`.

Tên 2–60 ký tự; email chuẩn hóa chữ thường; mật khẩu ít nhất 8 ký tự, tối đa 72 byte UTF-8. Phiên JWT có hạn 7 ngày và được đối chiếu session trong database mỗi request. Logout thu hồi session phía server. Token không được log.

`month` là tháng lịch theo ngày người dùng nhập, không chuyển UTC. Tổng thu, tổng chi, số dư trong summary chỉ tính tháng được chọn; số dư = thu − chi. Ngân sách so sánh với tổng chi tháng đó. `null` nghĩa là chưa đặt ngân sách.

Danh sách mặc định trả mọi tháng; `page` từ 1, `limit` từ 1 đến 50. Tìm kiếm chuỗi thường, không diễn giải regex. Giao dịch luôn sắp xếp ngày giảm dần. PUT thay toàn bộ các trường nhập; trường `userId` từ client bị bỏ qua. Dữ liệu luôn lọc bởi tài khoản từ token.

Mã lỗi: 400 validation, 401 thiếu/hết hạn/thu hồi phiên, 404 ID không tồn tại hoặc thuộc tài khoản khác, 409 email trùng hoặc xung đột unique, 413 payload quá lớn, 429 giới hạn request, 503 database/dịch vụ gián đoạn. Thao tác ghi không tự retry để tránh trùng giao dịch. Cần tải lại danh sách trước khi thử lại nếu kết nối đứt sau thao tác ghi.

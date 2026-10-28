# Ví Sinh Viên REST API

Backend Express, Mongoose và MongoDB Atlas. Phiên JWT được đối chiếu với collection sessions, cho phép thu hồi ngay khi logout.

```sh
npm ci
npm run dev
```

Cần `server/.env` với `MONGODB_URI`, `JWT_SECRET` ngẫu nhiên tối thiểu 32 ký tự, `PORT=3000` và `CORS_ORIGINS` nếu chạy web. Entry point luôn đọc `.env` theo thư mục server, không phụ thuộc thư mục đang đứng.

```text
src/
├── config/       # Đọc .env, kết nối/ngắt MongoDB và khởi tạo index
├── controller/   # Nhận request, gọi service, trả HTTP response
├── model/        # Schema User, Session, Transaction, Budget và index
├── routes/       # Khai báo endpoint, gắn controller và middleware
├── service/      # Nghiệp vụ, truy vấn dữ liệu, validation và DTO
├── middleware/   # Xác thực, kiểm tra ID, rate limit và xử lý lỗi
├── app.js        # Cấu hình Express và đăng ký API router
└── index.js      # Khởi động server, kết nối DB và đóng khi nhận signal
```

Luồng xử lý: `routes → middleware → controller → service → model`.
`config/env.js` đọc biến môi trường; `config/database.js` quản lý kết nối MongoDB và tạo collection/index. `app.js` chỉ tạo ứng dụng, không tự mở kết nối hay lắng nghe cổng, để có thể kiểm thử độc lập.

Controller, error handler và rate limiter dùng chung `src/utils/response.js` để trả `{ status, message, data }`. `status` khớp HTTP status; thao tác không có payload và lỗi thông thường trả `data: null`. Logout/xóa trả HTTP 200 để có JSON body. Mobile HTTP client tự lấy phần `data` cho screen.

- `test/api.test.js`: kiểm thử API với một MongoDB thử riêng.

API không dùng dữ liệu giả hoặc bộ nhớ làm lưu trữ khi chạy `npm start`/`npm run dev`. Nếu Atlas chưa cấu hình hoặc không kết nối được, server dừng và không khởi động chế độ giả lập.

Hợp đồng: [docs/API.md](docs/API.md). Kiểm tra bằng `npm test`.

`test/journey.test.js` dùng chính HTTP client TypeScript của mobile gọi Express qua cổng localhost với MongoDB tạm. Kiểm tra hành trình đăng ký → CRUD → đổi tháng → ngân sách/báo cáo → đổi tài khoản → đăng xuất/đăng nhập lại, cùng lỗi DB và hủy request. Lệnh test cần Node.js 22.22+ để đọc TypeScript bằng `--experimental-strip-types`.

`node test/start-ui-server.js` chỉ dành cho kiểm thử UI với database tạm, cổng 3001. Nó không đọc `.env` và không được dùng làm backend sản phẩm. Database tạm bị xóa khi dừng tiến trình. Bản mobile thông thường dùng API cổng 3000.

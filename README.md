# Ví Sinh Viên

Ứng dụng quản lý thu chi và ngân sách cá nhân cho sinh viên sử dụng React Native, REST API và MongoDB Atlas.

## Hai thư mục chính

```text
PE/
  mobile-app/   Expo + TypeScript: màn hình, UI/UX, điều hướng và gọi API
  server/       Express + Mongoose: API, xác thực, phân quyền và MongoDB Atlas
```

Mỗi phần có package.json và lockfile riêng. package.json ở gốc cung cấp lệnh chạy nhanh.

## Cài đặt

Yêu cầu Node.js 22.22 trở lên trong nhánh 22 hoặc Node LTS mới hơn tương thích SDK 58, npm và MongoDB Atlas.

```sh
npm --prefix server ci
npm --prefix mobile-app ci
```

Điền MONGODB_URI thật vào server/.env. File này đã có JWT secret ngẫu nhiên trên máy hiện tại. Khi clone sang máy khác, copy server/.env.example thành server/.env và thay URI cùng JWT_SECRET. Trên Atlas, tạo database user, cấp quyền database và thêm IP máy chạy backend vào Network Access. Dùng database vi_sinh_vien, URL-encode ký tự đặc biệt trong mật khẩu của URI.

Copy mobile-app/.env.example thành mobile-app/.env và đặt EXPO_PUBLIC_API_URL:

- Web trên máy chạy server: http://localhost:3000/api
- Android emulator tiêu chuẩn: http://10.0.2.2:3000/api
- Điện thoại thật: http://IP-LAN-MAY-CHAY-SERVER:3000/api, cùng Wi-Fi và cho phép cổng 3000 trong mạng riêng.

MongoDB URI và JWT secret chỉ đặt trong server. Biến EXPO_PUBLIC_* được đưa vào bundle, không chứa bí mật. Dùng HTTPS cho API khi triển khai thật.

## Chạy

Terminal thứ nhất, từ gốc dự án:

```sh
npm run server
```

Server chỉ nhận request sau khi kết nối MongoDB và tạo index thành công. Kiểm tra http://localhost:3000/api/health trả `status: 200` và `data.database: "connected"`.

Terminal thứ hai:

```sh
npm start
```

Dùng Expo Go tương thích SDK 58 hoặc development build. Nếu Expo Go trên thiết bị chưa hỗ trợ SDK này, cần development build. Có thể chạy web bằng `npm --prefix mobile-app run web`. Restart Expo sau khi thay .env.

Chọn Đăng ký ngay để tạo tài khoản. Database thật không có tài khoản hoặc giao dịch tạo sẵn.

## Chức năng

- Đăng ký, đăng nhập, giữ phiên 7 ngày, khôi phục phiên và đăng xuất thu hồi session.
- SecureStore trên Android/iOS; localStorage cho bản web thử nghiệm. Mật khẩu băm bằng bcrypt, không lưu trên thiết bị.
- JWT và session được kiểm tra mỗi request; dữ liệu được lọc bằng userId từ token.
- Thêm, sửa, xem chi tiết, xóa có xác nhận; validation VND nguyên dương, danh mục và ngày thực tế.
- Tìm ghi chú/danh mục, lọc loại/danh mục/tháng và phân trang.
- Tổng thu, tổng chi, số dư theo tháng; cập nhật khi trở lại màn hình sau CRUD.
- Ngân sách riêng mỗi tháng; nhắc nhở từ 80%, khi hết hoặc vượt hạn mức.
- Biểu đồ thu/chi và phân bổ chi tiêu theo danh mục.
- Loading, dữ liệu rỗng, lỗi API, timeout, hết phiên và thử lại. Lỗi mạng khi khôi phục phiên không tự xóa token.

## Kiểm tra

```sh
npm run format:check
npm run typecheck
npm run lint
npm test
```

Định dạng lại mã nguồn mobile, server và test bằng `npm run format`. Quy tắc nằm trong `.prettierrc.json`: thụt lề 2 dấu cách, nháy đơn, dấu chấm phẩy và độ rộng dòng mục tiêu 100 ký tự. Các lệnh format dùng Prettier 3.6.2 qua npx; lần đầu cần tải formatter vào npm cache.

Test chạy API thật với MongoDB thử nghiệm cục bộ, không đọc server/.env hoặc truy cập Atlas. Lần đầu cần tải MongoDB binary. Database thử nghiệm không thay thế Atlas khi chạy sản phẩm.

Kiểm tra đóng gói:

```sh
cd mobile-app
npx expo export --platform android --platform web
```

Hợp đồng API: [server/docs/API.md](server/docs/API.md).
Kiểm thử, demo và hỏi đáp PE: [server/docs/PE-CHECKLIST.md](server/docs/PE-CHECKLIST.md).

## Phạm vi đã xác minh

Đã kiểm tra API với MongoDB thử nghiệm, đóng gói Android/web và thao tác giao diện web. Cần cấu hình Atlas URI để kiểm tra kết nối thật; cần kiểm tra SecureStore và đóng/mở app trên thiết bị Android/iOS. Ảnh trong mobile-app/docs/evidence dùng tài khoản và dữ liệu thử riêng.

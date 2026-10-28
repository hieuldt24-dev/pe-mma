# Mobile app

Phần màn hình và UI/UX dùng Expo SDK 58, TypeScript và Expo Router.

```sh
npm ci
npm start
```

Cấu hình `EXPO_PUBLIC_API_URL` trong `.env` từ `.env.example`. Backend chạy riêng trong `../server`.

## Cấu trúc

```text
mobile-app/
├── assets/                    # Icon, splash và tài nguyên tĩnh
├── src/
│   ├── app/                   # Route và layout của Expo Router
│   ├── screens/               # Giao diện, state và xử lý của từng màn hình
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── transactions/      # Danh sách, thêm, sửa, chi tiết
│   │   ├── budget/
│   │   ├── reports/
│   │   └── profile/
│   ├── components/
│   │   ├── common/            # Button, Field, Card, Screen, trạng thái UI
│   │   ├── transactions/      # TransactionForm, TransactionRow
│   │   └── budget/            # BudgetProgress
│   ├── config/                # Cấu hình URL API từ biến môi trường
│   ├── constants/             # Danh mục và hằng số nghiệp vụ
│   ├── contexts/              # AuthProvider, MonthProvider và hook context
│   ├── hooks/                 # Hook tái sử dụng, tải dữ liệu khi focus
│   ├── services/              # HTTP client, timeout và xử lý lỗi API
│   ├── storage/               # Lưu phiên: SecureStore / localStorage
│   ├── theme/                 # Màu sắc và token giao diện
│   ├── types/                 # Kiểu dữ liệu TypeScript
│   └── utils/                 # Định dạng tiền, ngày và helper
├── app.json
├── package.json
└── tsconfig.json
```

File màn hình trong `src/app/` chỉ export màn hình tương ứng từ `src/screens/`; `_layout.tsx` định nghĩa navigator và gắn provider. Giữ nguyên đường dẫn route, nhóm `(private)`, `(tabs)` và tham số `[id]`.

Dùng alias `@/` trỏ tới `src/`, ví dụ `@/screens/auth/LoginScreen`, `@/components/common/ui`, `@/services/api`. Thêm màn hình bằng cách tạo component trong `screens/` và route tương ứng trong `app/`. Component dùng chung đặt trong `components/common/`; component riêng cho một nghiệp vụ đặt trong thư mục tương ứng.

Tham khảo cấu trúc `src/` và alias của [Expo Router](https://docs.expo.dev/router/reference/src-directory/).

Không đặt logic kết nối database hoặc secret backend ở đây. App gọi REST API; server xác thực và quyết định quyền truy cập.

`npm run typecheck` kiểm tra TypeScript; `npm run lint` kiểm tra mã nguồn. Các route dùng Stack.Protected để loại màn hình yêu cầu đăng nhập khỏi lịch sử khi phiên kết thúc.

## Luồng sử dụng

1. Khởi động backend bằng `npm run server` tại gốc dự án, cấu hình `EXPO_PUBLIC_API_URL` rồi chạy `npm run web` hoặc `npm start`.
2. Đăng ký hoặc đăng nhập. App lưu token và xác minh lại qua `/auth/me` khi mở lại; lỗi mạng cho phép thử lại, token hết hạn chuyển về đăng nhập.
3. Chọn tháng trên tổng quan/giao dịch/ngân sách/báo cáo. Thêm giao dịch mặc định theo tháng đang chọn; sau lưu, app mở chi tiết và cập nhật tháng theo ngày giao dịch.
4. Chỉnh sửa quay về chi tiết hiện có. Về danh sách hoặc xóa giao dịch sẽ đóng các màn hình giao dịch phía trên, tải lại danh sách và giữ đúng tháng. Trang trống sau khi xóa được chuyển về trang cuối còn dữ liệu.
5. Lưu ngân sách theo tháng; không đổi tháng trong khi đang lưu. Các màn hình đọc lại số liệu khi được focus.
6. Đăng xuất có xác nhận, thu hồi phiên trên server rồi xóa phiên trên thiết bị. Nếu mất kết nối, hiển thị lỗi để thử lại; phiên đã hết hạn hoặc bị thu hồi được dọn khỏi thiết bị.

Các thao tác ghi chặn gửi đồng thời. Khi request ghi bị timeout, tải lại dữ liệu trước khi thử lại vì server có thể đã xử lý request.

API trả envelope `{ status, message, data }`, với `status` khớp HTTP status. `services/httpClient.ts` kiểm tra cấu trúc response, ném `ApiError` khi lỗi và trả trực tiếp `data` khi thành công; screen không tự bóc envelope lần nữa. Xóa/đăng xuất thành công trả HTTP 200 với `data: null`.

Chạy `npm test` tại gốc để kiểm tra HTTP client mobile → Express → MongoDB tạm. Đây là kiểm thử tích hợp qua HTTP, không thay thế kiểm thử thao tác UI hoặc SecureStore trên thiết bị.

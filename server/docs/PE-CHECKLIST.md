# Kiểm thử và trình bày PE

## Kiểm thử tự động

Lệnh từ gốc: `npm test`. API Express và MongoDB thật trong tiến trình thử nghiệm, không gọi Atlas. Các nhóm kiểm tra:

1. Health; đăng ký; trùng email; thông tin đăng nhập sai/đúng; mật khẩu băm; không lộ passwordHash.
2. CRUD và tính lại thu, chi, số dư sau thêm/sửa/xóa.
3. Tài khoản thứ hai không đọc/sửa/xóa giao dịch, xem thống kê hoặc ngân sách của tài khoản thứ nhất.
4. Tìm kiếm, lọc danh mục/loại/tháng, phân trang và chuỗi regex được xử lý như văn bản.
5. Số tiền 0/âm/thập phân/chuỗi; ngày không tồn tại; danh mục sai; thiếu body; ID, tháng và phân trang sai.
6. Ngân sách tháng upsert duy nhất và tổng chi vượt hạn mức.
7. Tạo lại app và kết nối MongoDB vẫn đọc được phiên, giao dịch và ngân sách.
8. Logout thu hồi token ngay; token hết hạn bị từ chối.
9. Ngắt database trả lỗi 503 có kiểm soát, không trả stack trace.
10. HTTP client thật của mobile gọi Express qua localhost: đăng ký → thêm thu/chi → tìm kiếm → ngân sách → sửa giao dịch sang tháng khác → đổi tài khoản → xóa → đăng xuất → đăng nhập lại và khôi phục dữ liệu.
11. Client giữ phiên khi DB trả 503; request đã hủy trả lỗi hủy; ngày giao dịch mới theo tháng đang chọn, kiểm tra VND và chuyển tháng qua năm.
12. Mọi response JSON có `status`, `message`, `data`; status khớp HTTP status. Kiểm tra cả lỗi parser 400/413, lỗi xác thực, endpoint không tồn tại, hai rate limiter 429 và DB 503. Xóa/đăng xuất trả 200 với `data: null`; client tự lấy phần data và từ chối envelope không hợp lệ.

## Xác minh ngày 28 tháng 10 năm 2026

Đã bổ sung kiểm thử tích hợp dùng HTTP client mobile với Express và MongoDB tạm. Các sửa điều hướng, chặn gửi lặp và phân trang được kiểm tra tĩnh/đóng gói; cần thao tác lại trên web và thiết bị theo kịch bản bên dưới. Công cụ điều khiển trình duyệt đã dừng vì không xác định được URL hiện tại đủ chắc chắn, nên lần sửa này chưa xác minh tương tác UI.

## Đã thao tác trên UI web ngày 27 tháng 10 năm 2026

Môi trường: Expo web + REST API thật cổng 3001 + MongoDB thử nghiệm riêng. Tài khoản và số tiền dưới đây là dữ liệu thử.

- Đăng ký tài khoản, vào dashboard.
- Thêm khoản thu Gia đình 3.000.000đ.
- Thêm khoản chi Nhà ở 1.500.000đ, sửa thành 1.600.000đ, xác nhận chi tiết và danh sách.
- Lưu ngân sách 2.000.000đ; UI hiển thị đã dùng 80%, còn 400.000đ và lời nhắc.
- Tải lại trình duyệt; phiên và dữ liệu vẫn khôi phục.
- Dashboard hiển thị thu 3.000.000đ, chi 1.600.000đ và số dư 1.400.000đ.
- Báo cáo hiển thị phân bổ Nhà ở chiếm 100% khoản chi.
- Đăng xuất qua hộp thoại; tải lại và mở trực tiếp /budget vẫn trở về đăng nhập. Đăng nhập lại khôi phục đúng dữ liệu.
- Dừng API rồi tải lại trang: hiển thị lỗi kết nối và nút thử lại, không mở dữ liệu khi chưa xác minh phiên.

Ảnh minh chứng nằm trong `mobile-app/docs/evidence/` tại gốc dự án. Đây là xác minh web, không thay thế kiểm thử SecureStore trên Android/iOS hoặc kiểm thử Atlas thật.

## Cần xác minh với môi trường nộp bài

- Điền Atlas URI và cho phép IP máy chạy server.
- Đăng ký hai tài khoản mới trên ứng dụng mobile.
- Đăng nhập sai; kiểm tra thông báo lỗi.
- Đóng hẳn app rồi mở lại; xác nhận không cần đăng nhập lại.
- Đăng xuất rồi đóng/mở app; xác nhận trở về đăng nhập.
- CRUD; kiểm tra số dư và báo cáo sau từng thao tác.
- Tìm kiếm ghi chú/danh mục và kết hợp các bộ lọc.
- Đặt ngân sách; kiểm tra dưới 80%, từ 80%, hết và vượt hạn mức.
- Đổi tài khoản; xác nhận dữ liệu riêng.
- Ngắt mạng; kiểm tra lỗi và thử lại. Khi server không nhận được logout, app báo lỗi và giữ màn hình để người dùng thử lại; không thông báo đăng xuất thành công khi chưa thu hồi được phiên.
- Khởi động lại API; kiểm tra giao dịch và ngân sách vẫn được lưu trong Atlas.

## Kịch bản demo 5–7 phút

Giới thiệu nhu cầu sinh viên quản lý tiền gia đình gửi, lương làm thêm, tiền trọ và sinh hoạt. Giải thích kiến trúc mobile → REST API → MongoDB Atlas.

Đăng nhập → thêm khoản thu → thêm chi phí → xem số dư → tìm kiếm/lọc → sửa giao dịch → đặt ngân sách và xem báo cáo → xóa có xác nhận → đóng/mở lại app → đăng xuất → đổi tài khoản.

Chuẩn bị source code, báo cáo ngắn, ảnh các màn hình và video có minh chứng lưu phiên/lưu dữ liệu.

## Câu hỏi nên chuẩn bị

- Vì sao chỉ backend kết nối Atlas? Để giữ secret và thực thi quyền truy cập tại một nơi.
- Vì sao useState không đủ để giữ đăng nhập? Trạng thái bị mất khi tiến trình app kết thúc; token được lưu bằng SecureStore và xác minh lại qua /auth/me.
- JWT chưa hết hạn nhưng đã logout có dùng được không? Không, middleware còn kiểm tra session trong database.
- Vì sao sửa userId trong request không lấy được dữ liệu người khác? Backend bỏ qua userId client và luôn dùng tài khoản từ token, kể cả truy vấn theo ID.
- Số dư tính thế nào? Tổng thu trừ tổng chi trong tháng đã chọn; không phải số dư ngân hàng hoặc tổng tích lũy mọi tháng.
- Vì sao số tiền là số nguyên? Ứng dụng dùng VND, không hỗ trợ phần lẻ; tránh sai số trong phép cộng số tiền lẻ.
- Vì sao không tự retry POST khi timeout? Máy chủ có thể đã lưu trước khi kết nối đứt; tải lại trước để tránh tạo trùng.

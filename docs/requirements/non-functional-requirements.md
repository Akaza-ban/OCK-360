# Yêu cầu phi chức năng — OKR360 V1

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU; chưa yêu cầu nào được đo

Tài liệu này ghi các yêu cầu về chất lượng, kèm cách kiểm tra. Cột **Trạng thái** có hai giá trị:

- **Đã có:** con số hoặc hành vi đã nằm trong tài liệu hoặc mã nguồn hiện có, cột Nguồn cho biết ở đâu. Số như `01` hay `05 §7.1` là tài liệu cùng số trong `docs/`.
- **Đề xuất:** con số mới, đặt làm mốc ban đầu cho một công ty 50–300 nhân viên. Có thể đổi trước khi kiểm thử.

## Tải tham chiếu

Mọi yêu cầu hiệu năng được đo với bộ dữ liệu sau. Đây là giả định để kiểm thử, không phải số liệu thực tế.

| Thông số | Giá trị | Trạng thái |
|---|---|---|
| Số người dùng | 300 | Đã có (01, mức trên của quy mô) |
| Objective mỗi người mỗi chu kỳ | 5 | Đã có (mặc định `max_objectives_per_user`) |
| Key Result mỗi Objective | 3 | Đề xuất |
| Check-in lưu trữ | 8 chu kỳ, mỗi KR một check-in mỗi tuần, 13 tuần mỗi chu kỳ | Đề xuất |
| Người dùng hoạt động đồng thời | 60 | Đề xuất |

## Hiệu năng

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-PERF-001 | API đọc danh sách có phân trang: P95 ≤ 500 ms. | Kiểm thử tải | — | Đề xuất |
| NFR-PERF-002 | API ghi, gồm check-in và cộng dồn tiến độ: P95 ≤ 800 ms. | Kiểm thử tải | — | Đề xuất |
| NFR-PERF-003 | Đọc cây OKR toàn công ty: P95 ≤ 1 giây. | Kiểm thử tải | Mã có từ 08; con số là đề xuất | Đề xuất |
| NFR-PERF-004 | Dashboard và báo cáo: P95 ≤ 2 giây. | Kiểm thử tải | — | Đề xuất |
| NFR-PERF-005 | Xuất XLSX hoặc PDF hoàn tất trong 10 giây. | Kiểm thử tải | — | Đề xuất |
| NFR-PERF-006 | Giao diện dùng được ngay sau khi check-in hoặc lưu Objective, không chờ AI. | Kiểm thử tích hợp với dịch vụ AI giả chậm | 04, BR-096 | Đã có |

## Độ tin cậy

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-REL-001 | Thao tác gốc và sự kiện cho AI được ghi trong cùng một transaction. Thao tác lỗi thì không còn sự kiện; thao tác thành công thì chắc chắn có sự kiện. | Kiểm thử tích hợp | 05 §7.1 | Đã có |
| NFR-REL-002 | Chạy lại job hoặc hai worker cùng nhận việc không tạo kết quả trùng. | Kiểm thử tích hợp | 05 §7.2, AC-UC30 | Đã có |
| NFR-REL-003 | Job nhắc nhở chạy lại không gửi trùng thông báo. | Kiểm thử tích hợp | 05 §6 | Đã có |
| NFR-REL-004 | Tắt dịch vụ AI, mọi tính năng không dùng AI vẫn chạy; khối AI hiện "Chưa có phân tích". | Kiểm thử với dịch vụ AI giả lỗi | 04, AC-UC27 | Đã có |
| NFR-REL-005 | Sao lưu database mỗi ngày, giữ 7 bản gần nhất, và thử khôi phục ít nhất một lần trước khi đưa vào dùng. | Diễn tập khôi phục | — | Đề xuất |

## Tự động hóa bằng AI

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-AI-001 | Vướng mắc liên phòng đến người phụ trách trong vòng 15 phút sau khi check-in. | Kiểm thử đầu cuối | 01 G7, AC-UC29 | Đã có |
| NFR-AI-002 | Bản nháp 1-1 sẵn sàng trong vòng 1 giờ sau khi đóng đợt. | Kiểm thử đầu cuối với đợt 300 người | 01 G7, AC-UC31 | Đã có |
| NFR-AI-003 | Cảnh báo nhận xét 360 trả kết quả trong tối đa 5 giây, quá giờ thì cho nộp. | Kiểm thử với dịch vụ AI giả chậm | UC19, AC-UC19 | Đã có |
| NFR-AI-004 | Mỗi lần gọi dịch vụ AI ở luồng chạy nền chờ tối đa 30 giây. | Kiểm thử với dịch vụ AI giả chậm | `aiPipeline.js` | Đề xuất |
| NFR-AI-005 | Hạn mức gọi AI được áp theo từng luồng, mỗi ngày. Số lần gọi ghi nhận khớp với số lần gọi thật. | Kiểm thử tích hợp | UC27, 05 §7.2 | Đã có |
| NFR-AI-006 | Phần gọi dịch vụ AI nằm sau một lớp giao tiếp riêng, để đổi nhà cung cấp mà không sửa nghiệp vụ. | Rà soát kiến trúc | — | Đề xuất |

## Bảo mật

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-SEC-001 | JWT hết hạn sau 30 phút. V1 không có refresh token. | Kiểm thử API | UC01, 01 | Đã có |
| NFR-SEC-002 | Mật khẩu mới có tối thiểu 8 ký tự. | Kiểm thử biên | UC03, AC-UC03 | Đã có |
| NFR-SEC-003 | Mật khẩu chỉ lưu dạng băm, dùng Argon2id (ADR-006). | Rà soát database, kiểm thử | AC-UC01, `password_hash` | Đã có |
| NFR-SEC-004 | Quá 5 lần sai trong 15 phút với một tài khoản thì trả `429`. Sai thông tin và tài khoản bị khóa có cùng một phản hồi `401`. | Kiểm thử API | AC-UC01 | Đã có |
| NFR-SEC-005 | Mọi API trừ đăng nhập đều xác thực và kiểm tra quyền ở backend. | Kiểm thử phân quyền theo từng API | BR-002 | Đã có |
| NFR-SEC-006 | Mọi kết nối dùng HTTPS. | Rà soát triển khai | 01 §6 | Đã có |
| NFR-SEC-007 | Khóa dịch vụ AI chỉ nằm ở backend. Trình duyệt không bao giờ gọi AI trực tiếp. | Rà soát code và bản build frontend | `AiWorker.jsx` | Đã có |
| NFR-SEC-008 | Mật khẩu, token và khóa bí mật không xuất hiện trong log hay nhật ký. | Rà soát mẫu log | 05 §6 | Đã có |

## Ẩn danh và riêng tư

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-PRIV-001 | Sau khi đóng đợt, ngay cả người đọc được toàn bộ database cũng không nối được điểm với người chấm. | Kiểm thử schema | 05 §3.1 | Đã có |
| NFR-PRIV-002 | Mọi API, báo cáo, file xuất và nhật ký không chứa cặp người chấm và người được chấm của nhóm ẩn danh. | Kiểm thử API, rà soát file xuất | BR-060 | Đã có |
| NFR-PRIV-003 | Nhận xét không kèm tên và không hiện theo thứ tự nộp. | Kiểm thử API | `review.js` | Đã có |
| NFR-PRIV-004 | Nội dung gửi cho dịch vụ AI không chứa họ tên, email hay số điện thoại; đơn vị chỉ xuất hiện dạng mã kèm danh bạ. | Ghi lại nội dung gửi đi trong môi trường test | AC-UC32 | Đã có |
| NFR-PRIV-005 | Lịch sử chạy và hộp thư sự kiện không có cột chứa nội dung. | Kiểm thử schema | 05 §7.1, 05 §7.4 | Đã có |
| NFR-PRIV-006 | Cảnh báo nhận xét 360 không tạo dòng lịch sử chạy, để thời điểm chạy không giúp đoán ai đã chấm. | Kiểm thử schema | 05 §7.4 | Đã có |

## Trải nghiệm và trợ năng

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-UX-001 | Dùng tốt từ màn hình rộng 375 px. | Kiểm thử giao diện | 04 | Đã có |
| NFR-UX-002 | Mức tự tin và tiến độ không chỉ thể hiện bằng màu, luôn kèm chữ và phần trăm. | Rà soát giao diện | 04 | Đã có |
| NFR-UX-003 | Các chức năng chính dùng được bằng bàn phím; modal khóa phím Tab và đóng được bằng `Escape`. | Kiểm thử bàn phím | 04 | Đã có |
| NFR-UX-004 | Mọi ô nhập có nhãn; nút chỉ có biểu tượng có tên cho trình đọc màn hình. | Rà soát giao diện | 04 | Đã có |
| NFR-UX-005 | Hỗ trợ hai phiên bản gần nhất của Chrome, Edge và Firefox. | Kiểm thử giao diện | — | Đề xuất |

## Vận hành

| Mã | Yêu cầu | Cách kiểm tra | Nguồn | Trạng thái |
|---|---|---|---|---|
| NFR-OPS-001 | Lỗi API dùng định dạng `ProblemDetails`. Giao diện chỉ hiện thông báo ngắn kèm mã tra cứu, không hiện chi tiết kỹ thuật. | Kiểm thử API | 08, 04 | Đã có |
| NFR-OPS-002 | Admin và HR xem được trạng thái, số lần thử, thời gian chạy và lỗi của từng lần chạy tự động. | Kiểm thử API | UC28, AC-UC28 | Đã có |
| NFR-OPS-003 | Khi đóng đợt 360 có nhiều bản nháp cần tạo, các việc được xử lý dần qua hàng đợi, không làm chậm API. | Kiểm thử tải | 01 §6 | Đã có |

**Liên quan:** [Quy tắc nghiệp vụ](business-rules.md) · [Phạm vi](../01-scope.md) · [Thiết kế dữ liệu](../05-data-model.md)

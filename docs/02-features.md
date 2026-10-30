# Phân rã chức năng

> Trạng thái thiết kế: TARGET V1 — Phân rã chức năng hệ thống

## Các cấp phân rã

Hệ thống được phân rã theo 4 cấp, mỗi cấp chi tiết hơn cấp trên:

```text
[Công ty]    Nâng cao chất lượng sản phẩm
               KR: Giảm lỗi khách hàng báo từ 50 xuống 20 lỗi/tháng
               KR: Tăng điểm hài lòng khách hàng từ 7,0 lên 8,5
  └ [Phòng Dev]  Cải thiện quy trình kiểm thử
                   KR: Tăng độ phủ test từ 40% lên 70%
                   KR: 100% pull request được review trước khi merge
      └ [Cá nhân]  Viết test cho module thanh toán
                     KR: Viết 50 test case
```

## F05 Check-in và tiến độ

Cập nhật tiến độ Key Result hằng tuần; hệ thống tự tính và cộng dồn tiến độ lên các cấp trên.

- **F05.1 Check-in Key Result**
- **F05.2 Tự tính và cộng dồn tiến độ**
- F05.3 Lịch sử check-in và biểu đồ tiến độ
- F05.4 Phản hồi check-in

Check-in: giá trị hiện tại, mức tự tin (Đúng hướng / Có rủi ro / Chệch hướng), ghi chú, vướng mắc, người check-in, thời điểm. Mỗi lần check-in là một bản ghi mới; bản cũ được giữ nguyên làm lịch sử.

Tiến độ Key Result tính theo công thức (hiện tại − ban đầu) / (đích − ban đầu), giới hạn từ 0% đến 100%. Mẫu: đã viết 25/50 test case → 50%.

## F06 Đánh giá 360 độ

Thu thập đánh giá từ quản lý, đồng nghiệp, cấp dưới và tự đánh giá; nhóm đồng nghiệp và cấp dưới được ẩn danh.

- F06.1 Quản lý bộ tiêu chí (mẫu phiếu)
- **F06.2 Tạo và mở đợt đánh giá**
- F06.3 Đề cử đồng nghiệp
- F06.4 Duyệt người đánh giá
- **F06.5 Điền phiếu đánh giá**
- F06.6 Theo dõi và đóng đợt
- **F06.7 Kết quả 360 cá nhân**

Mẫu phiếu: danh sách tiêu chí (tên, mô tả, bắt buộc hay không, thang 1–5) và câu hỏi mở.

Đợt đánh giá: tên, chu kỳ, mẫu phiếu, người được đánh giá, hạn đề cử, hạn nộp phiếu, trạng thái.

Phiếu đánh giá: người được đánh giá, nhóm người đánh giá (Tự đánh giá / Quản lý / Đồng nghiệp / Cấp dưới), điểm từng tiêu chí (1–5 hoặc "Không đủ thông tin"), câu trả lời mở, trạng thái (Nháp / Đã nộp).

Kết quả 360: điểm theo tiêu chí, điểm theo nhóm người đánh giá, chênh lệch tự đánh giá so với người khác, nhận xét không kèm tên. Nhóm dưới 3 phiếu không được hiển thị riêng.

Mẫu tiêu chí: Tinh thần làm việc nhóm · Giao tiếp · Chủ động giải quyết vấn đề · Chất lượng công việc · Hỗ trợ và chia sẻ kiến thức.

## F07 Kết quả cuối kỳ

Gộp điểm OKR và điểm 360 thành một điểm cuối kỳ cho mỗi nhân viên.

- F07.1 Chốt điểm OKR
- **F07.2 Tổng hợp điểm OKR + 360**
- F07.3 Công bố kết quả

Kết quả cuối kỳ: tiến độ OKR, điểm OKR (thang 1–5), điểm 360, điểm cuối kỳ, xếp loại.

Mẫu: tiến độ OKR 83% → điểm OKR 4,32; điểm 360 là 4,20; điểm cuối kỳ = 0,6 × 4,32 + 0,4 × 4,20 = **4,27**, xếp loại Tốt.

## F08 Dashboard

Trang tổng quan theo vai trò.

- F08.1 Dashboard cá nhân: tiến độ OKR của tôi, Key Result cần check-in, phiếu đánh giá cần điền
- F08.2 Dashboard đội nhóm: tiến độ OKR phòng ban, thành viên chưa check-in, OKR có rủi ro
- F08.3 Dashboard công ty: tiến độ theo phòng ban, tỷ lệ check-in, tỷ lệ hoàn thành đánh giá

## F09 Báo cáo

- F09.1 Báo cáo tiến độ OKR (theo chu kỳ, phòng ban, cấp)
- F09.2 Báo cáo tỷ lệ check-in (theo tuần, phòng ban, người)
- F09.3 Báo cáo kết quả cuối kỳ
- F09.4 Xuất Excel / PDF theo bộ lọc đang chọn

## F10 Thông báo và nhắc nhở

- F10.1 Thông báo trong ứng dụng (chuông, đã đọc / chưa đọc)
- F10.2 Email thông báo
- F10.3 Nhắc nhở tự động

Các sự kiện nhắc: Key Result chưa check-in 7 ngày, chưa đề cử đồng nghiệp, còn phiếu chưa nộp, kết quả đã được công bố.

## F11 Nhật ký hoạt động

- F11.1 Ghi nhật ký
- F11.2 Xem và lọc nhật ký

Bản ghi nhật ký: người thực hiện, hành động, phân hệ, đối tượng, thời điểm. Nhật ký không chứa nội dung phiếu đánh giá và không ghi ai đánh giá ai trong nhóm ẩn danh.

## F12 Hồ sơ cá nhân

- F12.1 Cập nhật thông tin (họ tên, số điện thoại, ảnh đại diện)
- F12.2 Đổi mật khẩu
- F12.3 Xem quyền của tôi

Email, vai trò, phòng ban và quản lý trực tiếp chỉ được xem, không tự sửa.

## Ngoài phạm vi V1

Tích hợp Jira / GitLab / Slack, các phương pháp KPI / BSC / MBO, tính lương, đăng nhập một lần (SSO), ứng dụng di động riêng, AI gợi ý OKR. Chi tiết ở [01-scope.md](01-scope.md).

**Liên quan:** [Phạm vi](01-scope.md) · [Use case](03-use-cases.md)

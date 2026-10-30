# Tiêu chí chấp nhận — OKR360 V1

> Trạng thái thiết kế: TARGET V1 — Bước 1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU

Các tiêu chí mô tả hành vi mục tiêu của sản phẩm, viết sao cho kiểm thử được (thủ công hoặc tự động). Mã HTTP được dùng để mô tả hành vi API ở mức yêu cầu; hợp đồng API chi tiết sẽ được chốt ở bước thiết kế OpenAPI.

## AC-UC01 — Đăng nhập

- Thông tin đúng của tài khoản đang hoạt động → trả về token Bearer, thời điểm hết hạn và hồ sơ an toàn (không có mật khẩu/hash).
- Sai email, sai mật khẩu hoặc tài khoản bị khóa → cùng một phản hồi `401`, không tiết lộ tài khoản có tồn tại hay không.
- Quá 5 lần sai trong 15 phút với một tài khoản → `429`.
- API được bảo vệ từ chối token thiếu, sai hoặc hết hạn bằng `401`.

## AC-UC02 — Đăng xuất

- Đăng xuất xóa token và trạng thái đăng nhập phía client.
- Sau đăng xuất, truy cập trang được bảo vệ → chuyển về trang đăng nhập.

## AC-UC03 — Hồ sơ cá nhân

- Người dùng sửa được họ tên, số điện thoại, ảnh đại diện; email, vai trò, phòng ban, quản lý trực tiếp chỉ đọc.
- Đổi mật khẩu yêu cầu mật khẩu cũ đúng và mật khẩu mới ≥ 8 ký tự; sai → `400`.

## AC-UC04 — Quản lý phòng ban

- Admin và HR thêm, sửa, ngưng hoạt động phòng ban; vai trò khác → `403`.
- Gán phòng ban cha tạo thành vòng lặp → `409`.
- Không ngưng hoạt động phòng ban còn nhân viên đang hoạt động → `409`.

## AC-UC05 — Quản lý người dùng

- Admin và HR thêm, sửa, bật/tắt người dùng; HR gán vai trò `ADMIN` → `403`.
- Email trùng → `409`.
- Gán quản lý trực tiếp tạo vòng lặp (A báo cáo B, B báo cáo A) hoặc tự quản lý chính mình → `409`.
- Người dùng bị tắt không đăng nhập được và không được phân công làm người đánh giá mới.

## AC-UC06 — Quản lý chu kỳ

- Chu kỳ mới ở trạng thái `DRAFT`; ngày kết thúc phải sau ngày bắt đầu, sai → `400`.
- Kích hoạt khi đã có chu kỳ `ACTIVE` khác → `409`.
- Sau khi đóng (`CLOSED`), mọi thao tác tạo/sửa/xóa OKR và check-in trong chu kỳ → `409`; tiến độ cuối kỳ được chốt.
- Không chuyển ngược trạng thái (`CLOSED` → `ACTIVE`).

## AC-UC07 — Xem cây OKR

- Mọi vai trò xem được cây OKR của chu kỳ đã chọn: công ty → phòng ban → cá nhân.
- Mỗi nút hiện tiêu đề, người sở hữu, % tiến độ và màu mức tự tin của lần check-in gần nhất.
- Lọc theo phòng ban, người sở hữu, cấp, mức tự tin cho kết quả nhất quán khi kết hợp nhiều bộ lọc.
- OKR đã xóa mềm không xuất hiện.

## AC-UC08 — Tạo/sửa Objective

- Tạo OKR công ty: chỉ Admin. OKR phòng ban: Admin hoặc trưởng phòng của phòng đó. OKR cá nhân: chính chủ, quản lý trực tiếp, Admin. Sai quyền → `403`.
- Thiếu tiêu đề, sai chu kỳ, vượt số Objective tối đa của người sở hữu → `400`.
- Thành công → `201`, ghi người tạo, ghi nhật ký.

## AC-UC09 — Quản lý Key Result

- Mỗi Objective có từ 1 đến 5 KR; thêm KR thứ 6 → `400`.
- KR kiểu số/phần trăm bắt buộc có giá trị đầu, giá trị đích khác nhau và đơn vị; KR kiểu hoàn thành không cần.
- Tổng trọng số các thành phần của Objective khác 100% → `400`.
- Sửa giá trị đầu/đích của KR đã có check-in → tiến độ được tính lại theo công thức mới, lịch sử check-in giữ nguyên.

## AC-UC10 — Liên kết lên mục tiêu cấp trên

- OKR phòng ban chỉ liên kết lên OKR công ty; OKR cá nhân liên kết lên OKR phòng ban hoặc OKR công ty. Sai cấp → `400`.
- Objective cha phải cùng chu kỳ và chưa bị xóa; sai → `400`.
- Liên kết tạo vòng lặp → `409`.
- Sau khi liên kết, tiến độ Objective cha được tính lại ngay.

## AC-UC11 — Xóa mềm OKR

- Xóa đặt `deleted_at`, `deleted_by`, trả `204`, không xóa vật lý.
- Objective còn Objective con đang liên kết → `409`, yêu cầu gỡ liên kết trước.
- Sau khi xóa, tiến độ Objective cha được tính lại và OKR biến mất khỏi cây, dashboard, báo cáo.

## AC-UC12 — Check-in Key Result

- Chỉ người phụ trách KR được check-in; người khác → `403`.
- Chu kỳ không ở trạng thái `ACTIVE` → `409`.
- Mỗi check-in tạo bản ghi mới (giá trị, mức tự tin, ghi chú, thời điểm, người check-in); không sửa hay xóa bản ghi cũ.
- Ngay sau khi lưu, tiến độ KR, Objective và mọi Objective tổ tiên phản ánh giá trị mới.
- Mức tự tin "Chệch hướng" → quản lý trực tiếp nhận thông báo.

## AC-UC13 — Lịch sử và biểu đồ tiến độ

- Hiển thị danh sách check-in mới nhất trước, kèm bình luận của quản lý.
- Biểu đồ có đường tiến độ thực tế và đường kỳ vọng tuyến tính từ ngày bắt đầu đến ngày kết thúc chu kỳ.

## AC-UC14 — Phản hồi check-in

- Chỉ quản lý trực tiếp của người check-in được bình luận; người khác → `403`.
- Người check-in nhận thông báo khi có bình luận mới.

## AC-UC15 — Bộ tiêu chí đánh giá

- Chỉ HR tạo/sửa mẫu phiếu; mẫu có ít nhất 1 tiêu chí chấm điểm.
- Mẫu đang được dùng bởi đợt ở trạng thái khác `DRAFT` → không sửa được (`409`), chỉ nhân bản thành mẫu mới.

## AC-UC16 — Tạo và mở đợt đánh giá

- Chỉ HR tạo đợt; đợt gắn đúng một chu kỳ và một mẫu phiếu.
- Hạn đề cử phải trước hạn nộp phiếu; sai → `400`.
- Chuyển trạng thái chỉ theo thứ tự `DRAFT` → `NOMINATION` → `COLLECTING` → `CLOSED` → `PUBLISHED`.
- Khi mở `COLLECTING`, hệ thống sinh đủ phiếu: tự đánh giá, quản lý trực tiếp, đồng nghiệp đã duyệt, mọi cấp dưới trực tiếp.

## AC-UC17 — Đề cử đồng nghiệp

- Chỉ đề cử khi đợt ở `NOMINATION`; mỗi người đề cử từ 3 đến 5 đồng nghiệp, ngoài khoảng này → `400`.
- Không đề cử chính mình, quản lý trực tiếp, cấp dưới trực tiếp hay người dùng bị tắt → `400`.

## AC-UC18 — Duyệt người đánh giá

- Chỉ quản lý trực tiếp (hoặc HR khi nhân viên không có quản lý) duyệt; người khác → `403`.
- Quản lý được thêm hoặc bớt đồng nghiệp; danh sách sau duyệt vẫn phải có 3–5 người.
- Nhân viên đến hạn mà chưa đề cử → quản lý tự chọn đủ số người.

## AC-UC19 — Điền phiếu đánh giá

- Người dùng chỉ thấy và điền được phiếu được giao cho mình.
- Lưu nháp không bắt buộc đủ tiêu chí; nộp phiếu bắt buộc mọi tiêu chí có điểm 1–5 hoặc "Không đủ thông tin".
- Có thể sửa phiếu đã nộp khi đợt còn `COLLECTING`; sau `CLOSED` → `409`.

## AC-UC20 — Theo dõi và đóng đợt

- HR thấy tỷ lệ nộp theo phòng ban và số phiếu còn thiếu của từng người đánh giá; không thấy người đó còn thiếu phiếu cho ai nếu phiếu thuộc nhóm ẩn danh.
- HR gửi nhắc cho người chưa nộp bằng một thao tác.
- Đóng đợt → các phiếu chưa nộp bị hủy, không tính vào kết quả.

## AC-UC21 — Xem kết quả 360

- Nhân viên chỉ xem kết quả của mình và chỉ khi đợt `PUBLISHED`; trước đó → `403`.
- Quản lý xem kết quả của cấp dưới trực tiếp từ khi đợt `CLOSED`; HR xem tất cả. Admin không xem được.
- Kết quả gồm: điểm trung bình theo tiêu chí, theo nhóm người đánh giá, chênh lệch tự đánh giá so với trung bình người khác, nhận xét không kèm tên.
- Nhóm đồng nghiệp hoặc cấp dưới có dưới 3 phiếu hợp lệ → không hiển thị điểm riêng của nhóm đó.

## AC-UC22 — Tổng hợp và công bố kết quả cuối kỳ

- Chỉ tính khi chu kỳ và đợt đánh giá đã `CLOSED`; chưa đủ điều kiện → `409`.
- Điểm OKR, điểm 360, điểm tổng hợp được tính đúng công thức: điểm OKR = 1 + 4 × tiến độ OKR; điểm cuối kỳ = 0,6 × điểm OKR + 0,4 × điểm 360 (kiểm thử bằng bộ dữ liệu mẫu có kết quả tính tay).
- Người thiếu dữ liệu được đánh dấu "Thiếu dữ liệu", không bị gán điểm 0.
- Công bố gửi thông báo cho từng nhân viên; mỗi người chỉ thấy kết quả của chính mình.

## AC-UC23 — Dashboard

- Dashboard cá nhân hiện: tiến độ OKR của tôi, KR quá 7 ngày chưa check-in, phiếu đánh giá cần điền.
- Dashboard đội nhóm (Manager) hiện tiến độ OKR phòng ban, thành viên chưa check-in tuần này, OKR có mức tự tin "Có rủi ro"/"Chệch hướng".
- Dashboard công ty (Admin, HR) hiện tiến độ trung bình theo phòng ban, tỷ lệ check-in, tỷ lệ hoàn thành đánh giá.
- Số liệu trên dashboard khớp với báo cáo cùng bộ lọc.

## AC-UC24 — Báo cáo

- Báo cáo chỉ chứa dữ liệu trong phạm vi quyền của người xem (Manager chỉ thấy phòng ban mình phụ trách).
- File XLSX/PDF xuất ra khớp số liệu đang hiển thị với cùng bộ lọc.
- Báo cáo 360 tổng hợp theo phòng ban áp dụng ngưỡng ẩn danh như AC-UC21.

## AC-UC25 — Thông báo và nhắc nhở

- Thông báo trong ứng dụng có trạng thái đã đọc/chưa đọc, đánh dấu tất cả đã đọc.
- Nhắc nhở được gửi đúng lịch đã định (KR chưa check-in 7 ngày, chưa đề cử, còn phiếu chưa nộp), mỗi sự kiện tối đa một lần mỗi ngày cho mỗi người.

## AC-UC26 — Nhật ký hoạt động

- Chỉ Admin, HR xem; vai trò khác → `403`.
- Mỗi bản ghi có người thực hiện, hành động, phân hệ, đối tượng, thời điểm; lọc theo người, phân hệ, thời gian.
- Nhật ký không chứa nội dung phiếu đánh giá và không chứa cặp người đánh giá–người được đánh giá của nhóm ẩn danh.

**Liên quan:** [User stories](08-invest-requirements.md) · [Use case](03-use-cases.md)

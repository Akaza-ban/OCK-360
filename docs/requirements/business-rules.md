# Quy tắc nghiệp vụ — OKR360 V1

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU

Tài liệu này gom các quy tắc đang nằm rải rác trong use case, tiêu chí chấp nhận và thiết kế database vào một chỗ, mỗi quy tắc có một mã để OpenAPI, code và test tham chiếu tới. Tài liệu không đặt thêm quy tắc mới, chỉ ghi lại các quyết định đã chốt. Cột **Nguồn** cho biết quy tắc lấy từ đâu: số như `03` hay `05 §2.2` là tài liệu cùng số trong `docs/`, `UC` là use case, `AC` là tiêu chí chấp nhận, `F` là tính năng. Khi có khác biệt, nguồn đó được đọc lại và cập nhật cùng lúc.

## Vai trò và phân quyền

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-001 | V1 chỉ có 4 vai trò `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`. Mỗi người có đúng một vai trò, và mọi vai trò kế thừa toàn bộ quyền của `EMPLOYEE`. | 03, 08 | Tất cả |
| BR-002 | Backend là nơi kiểm tra quyền cuối cùng, theo vai trò, quan hệ báo cáo và quyền sở hữu. Việc ẩn nút trên giao diện không phải biện pháp bảo mật. | 03, 08 | Tất cả |
| BR-003 | Manager chỉ thao tác trên đơn vị mình phụ trách và nhân viên dưới quyền trực tiếp. Trưởng phòng phụ trách phòng ban và mọi team bên trong; team lead chỉ phụ trách team của mình. | 03 | US08, US18, US24 |
| BR-004 | HR không được gán vai trò Admin. | UC05, AC-UC05 | US05 |
| BR-005 | Admin không xem được kết quả 360 của người khác, báo cáo kết quả 360 và bản nháp 1-1. | 03, AC-UC21, AC-UC31 | US21, US24, US31 |

## Tổ chức và người dùng

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-010 | Cây tổ chức không có vòng lặp. Team phải nằm ngay dưới một phòng ban và không có đơn vị con. | UC04, AC-UC04, 05 §2.0 | US04 |
| BR-011 | Không ngưng hoạt động phòng ban hoặc team còn nhân viên đang hoạt động. | UC04, AC-UC04 | US04 |
| BR-012 | Email là duy nhất trong số tài khoản chưa xóa, nên người quay lại làm việc dùng lại được email cũ. | AC-UC05, 05 §2.4 | US05 |
| BR-013 | Không được tự quản lý chính mình và không tạo vòng lặp quản lý. | UC05, AC-UC05 | US05 |
| BR-014 | Người dùng bị tắt không đăng nhập được và không được phân công làm người đánh giá mới. | UC05, AC-UC05 | US05 |
| BR-015 | Người dùng không tự sửa được email, vai trò, phòng ban và quản lý trực tiếp của mình. | UC03, AC-UC03 | US03 |
| BR-016 | Quan hệ báo cáo đi theo quản lý trực tiếp, không suy ra từ cây đơn vị. | 05 §2.0 | US05 |

## Chu kỳ OKR

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-020 | Chu kỳ đi một chiều `DRAFT` → `ACTIVE` → `CLOSED`, không chuyển ngược. | AC-UC06, 05 §2.5 | US06 |
| BR-021 | Tại một thời điểm chỉ có một chu kỳ `ACTIVE`. | UC06, AC-UC06 | US06 |
| BR-022 | Tạo và sửa OKR được phép khi chu kỳ ở `DRAFT` hoặc `ACTIVE`. Check-in chỉ được phép khi `ACTIVE`. Chu kỳ `CLOSED` chỉ đọc. | 03, AC-UC06, AC-UC12 | US06, US08, US12 |
| BR-023 | Khi đóng chu kỳ, tiến độ cuối kỳ được chốt một lần và không đổi kể cả khi công thức thay đổi sau này. | UC06, 05 §2.2 | US06 |

## OKR và Key Result

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-030 | OKR có 4 cấp: công ty, phòng ban, team, cá nhân. Quyền tạo và sửa theo ma trận vai trò ở 03. | 03, AC-UC08 | US08 |
| BR-031 | OKR phòng ban gắn với đơn vị loại phòng ban; OKR team gắn với đơn vị loại team. | AC-UC08, 05 §2.1 | US08 |
| BR-032 | Mỗi người có số Objective tối đa theo cấu hình của chu kỳ. | UC08, AC-UC08 | US08 |
| BR-033 | Mỗi Objective có từ 1 đến 5 Key Result. | UC09, AC-UC09 | US09 |
| BR-034 | Key Result kiểu số hoặc phần trăm phải có giá trị đầu, giá trị đích khác nhau và đơn vị. Kiểu hoàn thành thì không cần. | AC-UC09 | US09 |
| BR-035 | Cấp cha hợp lệ: phòng ban nối lên công ty; team nối lên phòng ban hoặc công ty; cá nhân nối lên team, phòng ban hoặc công ty. | AC-UC10, 05 §2.1 | US10 |
| BR-036 | Objective cha phải cùng chu kỳ, chưa bị xóa và không tạo vòng lặp. | AC-UC10 | US10 |
| BR-037 | OKR được xóa mềm, không xóa vật lý. Objective còn Objective con đang liên kết thì không xóa được. | UC11, AC-UC11 | US11 |

## Check-in và tiến độ

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-040 | Chỉ người phụ trách Key Result mới được check-in. | UC12, AC-UC12, 05 §2.3 | US12 |
| BR-041 | Check-in chỉ thêm mới, không sửa và không xóa. Nhập sai thì tạo check-in mới. | AC-UC12, 05 §2.3 | US12 |
| BR-042 | Tiến độ KR = (hiện tại − ban đầu) / (đích − ban đầu), giới hạn 0–100%. Công thức đúng cả với mục tiêu giảm. | F05, 05 §2.2 | US12 |
| BR-043 | Tiến độ được tính lại dọc theo chuỗi Objective cấp trên trong cùng một lần lưu. | 03, AC-UC12 | US12 |
| BR-044 | Tiến độ Objective là trung bình cộng của các KR và Objective con, chia đều. V1 không có trọng số tự đặt. | 05 §2.2, `okr.js` | US12 |
| BR-045 | Mức tự tin của Objective là mức xấu nhất trong các KR đã có check-in. | `okr.js` | US07 |
| BR-046 | Chọn "Chệch hướng" thì quản lý trực tiếp nhận thông báo. | UC12, AC-UC12 | US12 |
| BR-047 | Chỉ quản lý trực tiếp được bình luận vào check-in, và bình luận không sửa được check-in. | UC14, AC-UC14 | US14 |

## Đánh giá 360 độ

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-050 | Đợt đi một chiều, mỗi lần một bước: `DRAFT` → `NOMINATION` → `COLLECTING` → `CLOSED` → `PUBLISHED`. | AC-UC16, 05 §2.5 | US16 |
| BR-051 | Mỗi chu kỳ có tối đa một đợt 360. Đợt gắn đúng một chu kỳ và một mẫu phiếu. | README §4.1, AC-UC16 | US16 |
| BR-052 | Mẫu phiếu có ít nhất 1 tiêu chí chấm điểm. Mẫu đã được đợt ngoài `DRAFT` dùng thì không sửa được, chỉ nhân bản. | AC-UC15 | US15 |
| BR-053 | Mỗi người đề cử 3–5 đồng nghiệp, không gồm chính mình, quản lý trực tiếp, cấp dưới trực tiếp hay người bị tắt. | UC17, AC-UC17 | US17 |
| BR-054 | Sau khi duyệt, danh sách vẫn có 3–5 đồng nghiệp. Nhân viên đến hạn chưa đề cử thì quản lý tự chọn đủ số. | UC18, AC-UC18 | US18 |
| BR-055 | Khi mở thu phiếu, hệ thống chụp lại quan hệ báo cáo, sinh phiếu và khóa tỷ trọng OKR/360 của chu kỳ. Mọi tính toán của đợt dùng bản chụp này. | UC16, 05 §2.5, 05 §2.6 | US16 |
| BR-056 | Nộp phiếu bắt buộc mọi tiêu chí có điểm 1–5 hoặc "Không đủ thông tin". Lưu nháp thì không bắt buộc. | AC-UC19 | US19 |
| BR-057 | Sửa được phiếu đã nộp khi đợt còn `COLLECTING`. Sau khi đóng, người chấm không sửa và không xem lại được nội dung. | AC-UC19 | US19 |
| BR-058 | Khi đóng đợt, phiếu chưa nộp bị hủy, và câu trả lời bị tách vĩnh viễn khỏi người chấm. | UC20, 05 §3.1 | US20 |
| BR-059 | Nhóm Đồng nghiệp hoặc Cấp dưới dưới 3 phiếu thì gộp hai nhóm. Gộp rồi vẫn dưới 3 thì ẩn và không tính vào điểm. | UC21, 05 §3.2 | US21 |
| BR-060 | Không màn hình, báo cáo, file xuất, API hay nhật ký nào cho biết ai đánh giá ai trong nhóm ẩn danh. | 03, 08, AC-UC26 | US19, US21 |
| BR-061 | HR chỉ thấy số phiếu còn thiếu của mỗi người chấm, không thấy còn thiếu phiếu cho ai nếu phiếu thuộc nhóm ẩn danh. | UC20, AC-UC20 | US20 |
| BR-062 | Điểm 360 là trung bình các nhóm được hiển thị, không tính tự đánh giá. | 05 §3.2 | US21 |
| BR-063 | Nhân viên xem kết quả của mình khi đợt `PUBLISHED`. Quản lý xem kết quả của cấp dưới trực tiếp từ khi `CLOSED`. HR xem của mọi người. | UC21, AC-UC21 | US21 |

## Kết quả cuối kỳ

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-070 | Chỉ tổng hợp khi chu kỳ và đợt đánh giá đều đã `CLOSED`. Trước khi công bố, HR tổng hợp lại được; sau khi công bố, kết quả không đổi. | UC22, AC-UC22 | US22 |
| BR-071 | Điểm OKR = 1 + 4 × tiến độ OKR, thang 1–5. | AC-UC22, 05 §5 | US22 |
| BR-072 | Điểm cuối kỳ = tỷ trọng OKR × điểm OKR + (1 − tỷ trọng OKR) × điểm 360. Mặc định 0,6 và 0,4. | AC-UC22, 05 §5 | US22 |
| BR-073 | Xếp loại: từ 4,5 Xuất sắc; từ 3,5 Tốt; từ 2,5 Đạt; dưới 2,5 Cần cải thiện. | 05 §5 | US22 |
| BR-074 | Thiếu điểm OKR hoặc điểm 360 thì ghi "Thiếu dữ liệu", không cho 0 điểm và không xếp loại. | UC22, AC-UC22, 05 §5 | US22 |
| BR-075 | Mỗi nhân viên chỉ thấy kết quả của chính mình. | UC22, AC-UC22 | US22 |

## Báo cáo, thông báo và nhật ký

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-080 | Báo cáo chỉ chứa dữ liệu trong phạm vi quyền của người xem, và báo cáo 360 áp ngưỡng ẩn danh. Báo cáo kết quả cuối kỳ của Manager chỉ gồm nhân viên dưới quyền trực tiếp. | UC24, AC-UC24, BR-063 | US24 |
| BR-081 | Mỗi người nhận tối đa một lần nhắc cho mỗi sự kiện mỗi ngày. | UC25, AC-UC25, 05 §6 | US25 |
| BR-082 | Sự kiện nhắc gồm: KR chưa check-in 7 ngày, chưa đề cử, còn phiếu chưa nộp. | UC25, AC-UC25 | US25 |
| BR-083 | Nhật ký chỉ thêm mới, và không chứa mật khẩu, token, điểm, nhận xét hay cặp người chấm và người được chấm của nhóm ẩn danh. | UC26, AC-UC26, 05 §6 | US26 |

## Tự động hóa bằng AI

| Mã | Quy tắc | Nguồn | Story |
|---|---|---|---|
| BR-090 | AI không chấm điểm, không xếp loại, không sửa số liệu OKR hay 360. Kết quả AI chỉ là nhãn, cảnh báo, thông báo, ghi chú hoặc bản nháp. | 03, AC-UC32 | US32 |
| BR-091 | Mọi nội dung do AI tạo đều có nhãn "Do AI tạo". | 03, 04 | US29–US34 |
| BR-092 | Nội dung gửi cho người khác ngoài chính người viết luôn là bản nháp, có người duyệt rồi mới gửi. Nhân viên không bao giờ thấy bản gốc của AI. | 03, UC31, 05 §7.3 | US31 |
| BR-093 | Trước khi gửi cho dịch vụ AI, tên người được đổi thành mã; đơn vị được gửi dạng mã kèm danh bạ tên. Email và số điện thoại không bao giờ được gửi. Bảng mã chỉ nằm trong bộ nhớ của lần chạy. | 03, AC-UC32, 05 §7.4 | US32 |
| BR-094 | Nhận xét 360 chỉ được gửi cho AI ở hai luồng: Bản nháp 1-1 (đợt đã `CLOSED`, nhóm đủ ngưỡng, không kèm điểm từng phiếu) và Cảnh báo nhận xét (phiếu đang nộp, đã đổi tên thành mã). | 03 | US31, US34 |
| BR-095 | Văn bản người dùng gõ chỉ là dữ liệu, không phải lệnh cho AI. Kết quả sai khuôn JSON thì không hành động và ghi Lỗi. | 03, AC-UC32 | US32 |
| BR-096 | Luồng AI chạy nền sau khi thao tác gốc đã lưu xong. AI chậm hoặc lỗi không làm hỏng thao tác gốc. | 03, AC-UC32, 05 §7.1 | US32 |
| BR-097 | Lỗi thì thử lại sau 1, 5 và 15 phút, sau đó đánh dấu Lỗi. Mỗi đối tượng chỉ được một luồng xử lý một lần. | UC32, AC-UC32, 05 §7.2 | US32 |
| BR-098 | Mỗi luồng có hạn mức gọi AI mỗi ngày. Vượt hạn mức thì luồng tạm dừng tới hôm sau, sự kiện được đánh dấu Bỏ qua và Admin nhận cảnh báo. | 03, AC-UC32 | US27, US32 |
| BR-099 | Tắt một luồng thì sự kiện mới được đánh dấu Bỏ qua, không gọi AI. Mọi tính năng khác vẫn chạy. | UC27, AC-UC27 | US27 |
| BR-100 | Lịch sử chạy chỉ có số liệu kỹ thuật, không chứa nội dung gửi cho AI hay AI trả về. | UC28, AC-UC28, 05 §7.4 | US28 |
| BR-101 | Cảnh báo nhận xét 360 chờ tối đa 5 giây; AI lỗi hoặc quá giờ thì phiếu vẫn được nộp. Cảnh báo chỉ người viết thấy, không được lưu và không có dòng lịch sử chạy. | UC19, AC-UC19, 05 §7.4 | US34 |
| BR-102 | Vướng mắc không được chuyển về đơn vị của chính người báo hay phòng ban chứa team của họ. | AC-UC29, 05 §7.3 | US29 |
| BR-103 | Người phụ trách từ chối vướng mắc thì nó chuyển về quản lý trực tiếp của người check-in và được tính là một lần AI phân loại sai. | UC29, AC-UC29 | US29 |
| BR-104 | Mâu thuẫn giữa mức tự tin và ghi chú thì nhắc người check-in; 3 lần liên tiếp thì báo quản lý trực tiếp. | F13.4, AC-UC32 | US33 |
| BR-105 | Con số trong bản tin tuần lấy từ database, AI chỉ viết phần tóm tắt, tối đa 3 mục. Mỗi quản lý nhận một bản tin mỗi tuần. | UC30, AC-UC30 | US30 |
| BR-106 | Bản nháp 1-1 chỉ gửi được khi đợt đã `PUBLISHED`, không chứa câu trích nguyên văn hay điểm từng phiếu. Người không có nhóm nào đủ ngưỡng, hoặc nhóm đủ ngưỡng không có nhận xét mở, thì không có bản nháp. | UC31, AC-UC31 | US31 |

**Liên quan:** [Yêu cầu phi chức năng](non-functional-requirements.md) · [Use case](../03-use-cases.md) · [Tiêu chí chấp nhận](../06-acceptance-criteria.md) · [Thiết kế dữ liệu](../05-data-model.md)

# Thuật ngữ — OKR360

Các thuật ngữ dùng trong tài liệu, giao diện và code. Cột **Trong code** là tên bảng, enum hay class tương ứng, để đọc tài liệu và đọc code dùng cùng một từ.

## OKR và tiến độ

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| OKR | Objectives and Key Results: đặt mục tiêu (Objective) và đo bằng kết quả then chốt (Key Result) | — |
| Objective | Mục tiêu định tính cần đạt trong chu kỳ | `objectives` |
| Key Result (KR) | Kết quả đo được của một Objective; mỗi Objective có 1–5 KR | `key_results` |
| Kiểu đo của KR | Số (đầu → đích, hỗ trợ mục tiêu giảm), Phần trăm, Hoàn thành (0 hoặc 1) | `kr_type`: `NUMBER`, `PERCENT`, `BOOLEAN` |
| Cấp OKR | Công ty, phòng ban, team, cá nhân | `okr_level` |
| Liên kết cấp trên | Nối Objective vào Objective cha để tiến độ đóng góp lên trên | `objectives.parent_id` |
| Nối vượt cấp | Bỏ qua một cấp khi liên kết, ví dụ OKR cá nhân nối thẳng lên OKR phòng ban chưa chia team | — |
| Chu kỳ OKR | Kỳ làm việc chung, thường là một quý; đi một chiều Nháp → Đang chạy → Đã đóng | `okr_cycles`, `cycle_status` |
| Check-in | Lần cập nhật giá trị hiện tại của một KR, kèm mức tự tin, ghi chú, vướng mắc; chỉ thêm mới, không sửa | `checkins` |
| Mức tự tin | Đúng hướng, Có rủi ro, Chệch hướng; mức của Objective là mức xấu nhất trong các KR | `confidence_level` |
| Vướng mắc | Việc đang cản trở KR, người check-in ghi bằng văn bản tự do | `checkins.blocker` |
| Tiến độ KR | (hiện tại − ban đầu) / (đích − ban đầu), giới hạn 0–100% | `vw_key_result_progress` |
| Cộng dồn tiến độ | Tiến độ Objective là trung bình cộng các KR và Objective con, tính lại ngược lên tới gốc | `ProgressRollup` |
| Tiến độ kỳ vọng | Phần thời gian đã trôi qua của chu kỳ, vẽ thành vạch trên thanh tiến độ | — |
| Xóa mềm | Ẩn khỏi cây và báo cáo nhưng vẫn giữ trong database để truy vết | `deleted_at` |

## Tổ chức và phân quyền

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| Đơn vị | Phòng ban hoặc team; team nằm ngay dưới một phòng ban | `departments`, `org_unit_type` |
| Trưởng phòng, team lead | Người phụ trách phòng ban hoặc team, thường mang vai trò Manager | `departments.head_user_id` |
| Đơn vị mình phụ trách | Với trưởng phòng: phòng ban và mọi team bên trong; với team lead: team của mình | `AccessPolicy.managesUnit` |
| Quản lý trực tiếp | Người mà một nhân viên báo cáo trực tiếp; không suy ra từ cây đơn vị | `app_users.manager_id` |
| Nhân viên dưới quyền trực tiếp | Những người có quản lý trực tiếp là người dùng đang xét | `AccessPolicy.isDirectManager` |

## Đánh giá 360 độ

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| Đánh giá 360 độ | Đánh giá từ tự đánh giá, quản lý, đồng nghiệp và cấp dưới | — |
| Đợt 360 | Một lần đánh giá gắn với một chu kỳ; đi một chiều Nháp → Đề cử → Thu phiếu → Đã đóng → Đã công bố | `review_campaigns`, `campaign_status` |
| Mẫu phiếu | Bộ tiêu chí chấm 1–5 và câu hỏi mở dùng chung cho các đợt | `review_templates` |
| Nhóm người đánh giá | Tự đánh giá, Quản lý, Đồng nghiệp, Cấp dưới | `reviewer_group` |
| Đề cử | Người được đánh giá chọn 3–5 đồng nghiệp chấm mình | `nominations` |
| Phiếu, phân công | Việc một người phải chấm một người; không chứa điểm | `review_assignments` |
| Bản chụp quan hệ báo cáo | Quản lý trực tiếp và đơn vị của từng người được ghi lại lúc mở thu phiếu; mọi tính toán của đợt dùng bản chụp này | `campaign_participants` |
| Tách câu trả lời khỏi người chấm | Khi đóng đợt, liên kết giữa điểm và phiếu bị xóa, nên không ai nối được điểm với người chấm | `close_review_campaign()` |
| Ngưỡng ẩn danh | Nhóm Đồng nghiệp hoặc Cấp dưới chỉ hiện khi có từ 3 phiếu | `anonymity_threshold` |
| Nhóm gộp | Hai nhóm Đồng nghiệp và Cấp dưới gộp lại khi một nhóm dưới ngưỡng | `PEER_AND_REPORT` |

## Kết quả cuối kỳ

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| Điểm OKR | 1 + 4 × tiến độ OKR, thang 1–5 | `ScoreCalculator.okrScore` |
| Điểm 360 | Trung bình các nhóm được hiển thị, không tính tự đánh giá | `ReviewResultService.overallScore` |
| Tỷ trọng | Phần của điểm OKR trong điểm cuối kỳ, mặc định 0,6; khóa khi mở thu phiếu | `okr_cycles.okr_weight` |
| Điểm cuối kỳ | Tỷ trọng × điểm OKR + (1 − tỷ trọng) × điểm 360 | `final_results.final_score` |
| Xếp loại | Xuất sắc, Tốt, Đạt, Cần cải thiện, hoặc Thiếu dữ liệu | `result_grade` |
| Công bố | Đưa kết quả tới từng nhân viên; sau đó kết quả không đổi | `publishFinalResults` |

## Tự động hóa và AI

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| Tự động | Việc hệ thống tự làm theo luật cố định, không cần ai bấm nút, không gọi AI | — |
| Luồng tự động AI | Một trong 6 luồng dựng sẵn có bước gọi dịch vụ AI | `automation_flows`, `automation_flow` |
| Bộ lập lịch | Phần của Worker chạy việc theo giờ: bản tin tuần, nhắc nhở | `WorkerScheduler` |
| Bộ xử lý AI, Worker | Tiến trình chạy nền, nhận sự kiện và chạy luồng AI; là code, không phải AI | `main.worker.ts`, `FlowRunner` |
| Hộp thư sự kiện (outbox) | Bảng sự kiện do trigger ghi cùng transaction với thao tác gốc, Worker đọc sau | `domain_events` |
| Lần chạy, `run_key` | Một lần xử lý của một luồng trên một đối tượng; `run_key` chống chạy trùng | `automation_runs` |
| Hạn mức | Số lần gọi AI tối đa mỗi luồng mỗi ngày | `automation_flows.daily_quota` |
| AI Gateway | Đường duy nhất tới dịch vụ AI: đổi tên thành mã, gọi, kiểm tra khuôn | `AiGateway` |
| Đổi tên thành mã | Thay tên người bằng `NV-01`, đơn vị bằng `DV-01` kèm danh bạ trước khi gửi AI | `Masker` |
| Khuôn JSON | Cấu trúc câu trả lời AI bắt buộc phải theo; sai khuôn thì không hành động | `OutputValidator` |
| Do AI tạo | Nhãn bắt buộc trên mọi nội dung AI tạo | — |
| Nhãn AI | Kết quả phân loại vướng mắc và phát hiện check-in không khớp | `checkin_insights` |
| Ghi chú rà soát | Gợi ý của AI về chất lượng Objective mới tạo | `objective_review_notes` |
| Bản tin tuần | Số liệu đội và tối đa 3 việc cần chú ý, gửi Manager 8h sáng thứ Hai | `weekly_digests` |
| Bản nháp 1-1 | Tóm tắt nhận xét 360 do AI soạn, chờ người duyệt sửa rồi gửi | `one_on_one_drafts` |
| Cảnh báo nhận xét | Cảnh báo riêng người viết khi nhận xét dễ lộ danh tính hoặc xúc phạm; không lưu | `REVIEW_COMMENT_GUARD` |

## Kỹ thuật

| Thuật ngữ | Nghĩa | Trong code |
|---|---|---|
| JWT | Token đăng nhập, hết hạn sau 30 phút, gửi qua header `Authorization: Bearer` | `TokenService` |
| Problem Details | Định dạng lỗi chuẩn của API, có `errorCode` và `traceId` (mã tra cứu) | `ProblemDetailsFilter` |
| `operationId` | Tên duy nhất của một thao tác trong OpenAPI, trùng tên hàm controller | `openapi.yaml` |
| ADR | Bản ghi một quyết định kiến trúc kèm lý do và cái giá | `decisions.md` |

**Liên quan:** [Use case](03-use-cases.md) · [Quy tắc nghiệp vụ](requirements/business-rules.md) · [Đặc tả luồng AI](architecture/ai-flows.md)

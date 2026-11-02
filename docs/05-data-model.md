# 05. Data Model — OKR360

Tài liệu này giải thích **vì sao** database được thiết kế như vậy. Sơ đồ nằm ở [DATABASE.md](DATABASE.md); định nghĩa đầy đủ nằm trong các file dưới đây.

| File | Nội dung |
|---|---|
| [`src/database/okr360.sql`](../src/database/okr360.sql) | Schema PostgreSQL 15+: enum, bảng, ràng buộc, trigger, hàm đóng đợt 360, view |
| [`src/database/okr360.dbml`](../src/database/okr360.dbml) | Cùng schema ở dạng DBML, dán vào [dbdiagram.io](https://dbdiagram.io) để xem sơ đồ. Sinh tự động bằng `tools/generate-dbml.py` |
| [`src/database/seed_demo.sql`](../src/database/seed_demo.sql) | Dữ liệu demo giống hệt bản giao diện mẫu. Sinh tự động bằng `tools/generate-seed.mjs` |
| [`src/database/tests/schema_checks.sql`](../src/database/tests/schema_checks.sql) | 67 kiểm thử: số liệu tính đúng, ẩn danh sau khi đóng đợt, quy tắc của tự động hóa AI, và các thao tác sai bị chặn |

## 1. Danh sách bảng

| Nhóm | Bảng | Mục đích |
|---|---|---|
| Tổ chức | `departments` | Cây đơn vị: phòng ban và team (`unit_type`), có người phụ trách là trưởng phòng hoặc team lead (`head_user_id`) |
| | `app_users` | Tài khoản, vai trò, phòng ban, quản lý trực tiếp, khóa đăng nhập sau nhiều lần sai |
| OKR | `okr_cycles` | Chu kỳ theo quý, trạng thái, số Objective tối đa mỗi người, tỷ trọng OKR/360 |
| | `objectives` | Objective 4 cấp (công ty, phòng ban, team, cá nhân), nối với Objective cấp trên bằng `parent_id` |
| | `key_results` | 1–5 KR mỗi Objective, có kiểu, giá trị ban đầu, giá trị đích, người phụ trách |
| | `checkins` | Mỗi lần cập nhật KR: giá trị mới, mức tự tin, ghi chú, vướng mắc |
| | `checkin_comments` | Quản lý trực tiếp bình luận trên một check-in |
| Đánh giá 360 | `review_templates`, `review_criteria`, `review_questions` | Mẫu phiếu: tiêu chí chấm 1–5 và câu hỏi mở |
| | `review_campaigns` | Đợt đánh giá gắn với một chu kỳ, kèm ngưỡng ẩn danh và số đồng nghiệp tối thiểu/tối đa |
| | `campaign_participants` | Người được đánh giá, kèm bản chụp quản lý và phòng ban lúc mở thu phiếu |
| | `nominations`, `nomination_peers` | Danh sách đồng nghiệp mỗi người đề cử và trạng thái duyệt |
| | `review_assignments` | Ai phải chấm ai, thuộc nhóm nào, đã nộp chưa. Không chứa điểm |
| | `review_answers` | Điểm và nhận xét của từng phiếu |
| Kết quả và hệ thống | `final_results` | Điểm OKR, điểm 360, điểm cuối kỳ và xếp loại của mỗi người mỗi chu kỳ |
| | `notifications` | Thông báo trong ứng dụng và email |
| | `audit_logs` | Nhật ký thao tác, chỉ thêm mới |
| Tự động hóa AI | `automation_flows` | Cấu hình 6 luồng dựng sẵn: bật/tắt, lịch chạy, hạn mức gọi AI mỗi ngày |
| | `domain_events` | Hộp thư sự kiện: trigger ghi khi có check-in, Objective mới, đợt 360 đóng |
| | `automation_runs` | Lịch sử chạy từng luồng: trạng thái, số lần thử, token, lỗi. Không có nội dung |
| | `automation_daily_usage` | Số lần gọi AI mỗi luồng mỗi ngày, để áp hạn mức |
| | `checkin_insights` | Nhãn AI trên check-in và trạng thái xử lý vướng mắc được chuyển đến |
| | `objective_review_notes` | Ghi chú rà soát OKR mới tạo |
| | `weekly_digests` | Bản tin tuần cho quản lý |
| | `one_on_one_drafts` | Bản nháp tóm tắt 1-1 sau đợt 360, chờ người duyệt |

Quy ước chung:

- Mọi bảng nằm trong schema `okr360`. Khóa chính là `BIGINT GENERATED ALWAYS AS IDENTITY`.
- Thời gian dùng `TIMESTAMPTZ`; ngày của chu kỳ và hạn chót dùng `DATE`.
- Giá trị KR dùng `NUMERIC(14,4)` để không sai số khi chia; tiến độ lưu dạng 0–1 (`NUMERIC(5,4)`), giao diện nhân 100 khi hiển thị.
- Trạng thái dùng enum của PostgreSQL thay vì chuỗi tự do, để database từ chối giá trị lạ.

## 2. Các quyết định thiết kế

### 2.0 Cây tổ chức: phòng ban và team trong một bảng

Công ty phần mềm thường chia phòng ban thành team, ví dụ Phòng Dev có Team Thanh toán và Team Nền tảng. Thay vì thêm bảng `teams` riêng, `departments` là **cây đơn vị** với cột `unit_type`:

```text
Ban Giám đốc (gốc, đại diện công ty)
├── Phòng Dev            DEPARTMENT · trưởng phòng: Sơn
│   ├── Team Thanh toán  TEAM · team lead: Nam
│   └── Team Nền tảng    TEAM · team lead: Huy
├── Phòng QA             DEPARTMENT · chưa chia team
└── Phòng Kinh doanh     DEPARTMENT · chưa chia team
```

| Quy tắc | Ai chặn |
|---|---|
| Team phải có phòng ban cha | `ck_departments_team_has_parent` |
| Team không có đơn vị con (cây tổ chức tối đa 4 tầng, khớp 4 cấp OKR) | Trigger `check_org_unit_type` |
| Không có vòng lặp trong cây | Trigger `check_department_cycle` |

Dùng chung một bảng thì `app_users.department_id`, `objectives.department_id`, bản chụp `campaign_participants.department_id` và `checkin_insights.target_department_id` đều trỏ được tới phòng ban **hoặc** team mà không cần thêm cột. Nhân viên thuộc team thì `department_id` là team; phòng ban chưa chia team thì nhân viên thuộc thẳng phòng ban.

Quan hệ báo cáo vẫn đi theo `manager_id`, không suy ra từ cây đơn vị: thường team lead là quản lý trực tiếp của thành viên team, còn trưởng phòng là quản lý trực tiếp của các team lead.

### 2.1 Cây OKR: danh sách kề + CTE đệ quy

Mỗi Objective chỉ lưu `parent_id`. Cách này đơn giản khi thêm, sửa, chuyển Objective sang cha khác; đọc cả cây thì dùng view `vw_objective_tree` (CTE đệ quy), trả về gốc, độ sâu và đường dẫn.

Cây chỉ sâu tối đa 4 tầng (công ty → phòng ban → team → cá nhân), nên CTE đệ quy không tốn kém. Không cần các cấu trúc phức tạp hơn như nested set hay closure table.

Trigger `check_objective_rules` đảm bảo:

| Quy tắc | Ví dụ bị chặn |
|---|---|
| Cha phải cùng chu kỳ | Objective Q4 gắn vào Objective Q3 |
| Cấp hợp lệ: Phòng ban → Công ty; Team → Phòng ban hoặc Công ty; Cá nhân → Team, Phòng ban hoặc Công ty | Objective Phòng ban gắn vào Objective Cá nhân; OKR team gắn vào OKR team khác |
| OKR phòng ban gắn với đơn vị loại phòng ban; OKR team gắn với đơn vị loại team | OKR team gắn vào Phòng QA |
| Không xóa Objective còn Objective con | Xóa O "Tăng doanh thu" khi phòng Sales đang bám theo |
| Chu kỳ đã đóng thì chỉ đọc | Sửa tiêu đề Objective Q3 sau khi Q3 đóng |

Được nối **vượt cấp**: phòng ban chưa chia team thì Objective cá nhân nối thẳng lên Objective phòng ban (Minh ở Phòng QA), và một team mới lập có thể nối thẳng lên Objective công ty.

Vì cấp chỉ được đi xuống, cây OKR **không thể có vòng lặp**; trigger vẫn kiểm tra vòng lặp để phòng hờ.

### 2.2 Tiến độ: tính ở đâu, lưu ở đâu

| Giá trị | Cách có | Lý do |
|---|---|---|
| `key_results.current_value`, `current_confidence`, `last_checkin_at` | Trigger `apply_checkin_to_key_result` cập nhật mỗi khi thêm check-in | Màn danh sách không phải đọc bảng `checkins` |
| Tiến độ KR | View `vw_key_result_progress`: `(hiện tại − ban đầu) / (đích − ban đầu)`, giới hạn 0–1 | Công thức đúng cả khi mục tiêu là giảm (ví dụ giảm số bug từ 40 xuống 10) |
| `objectives.progress` | Tầng nghiệp vụ tính lại và lưu **trong cùng transaction** với check-in | Tiến độ Objective là trung bình của KR **và** Objective con, đi ngược lên tới gốc. Nếu tính mỗi lần đọc, dashboard công ty phải duyệt cả cây |
| `objectives.final_progress` | Chốt một lần khi đóng chu kỳ | Kết quả cuối kỳ không đổi kể cả khi sau này sửa công thức |

Công thức cộng dồn giữ nguyên như trong `src/frontend/src/lib/okr.js`, để database và giao diện cho ra cùng con số.

### 2.3 Check-in và nhật ký không sửa được

`checkins` và `audit_logs` có trigger `forbid_mutation` chặn mọi UPDATE và DELETE. Nhập sai thì tạo check-in mới. Nhờ vậy biểu đồ tiến độ theo thời gian luôn là lịch sử thật, không ai "chỉnh lại số cho đẹp".

Trigger `check_checkin_insert` còn chặn:

- check-in khi chu kỳ không ở trạng thái ACTIVE;
- người không phụ trách KR check-in hộ;
- KR Có/Không nhận giá trị khác 0 hoặc 1.

### 2.4 Xóa mềm

| Bảng | Cách xóa | Lý do |
|---|---|---|
| `app_users` | `deleted_at`, `is_active` | Người nghỉ việc vẫn phải còn trong lịch sử OKR, check-in, kết quả |
| `objectives`, `key_results` | `deleted_at`, `deleted_by` | Cho phép khôi phục; check-in cũ vẫn trỏ về KR |
| `review_templates` | `deleted_at` | Đợt cũ vẫn đọc được tiêu chí đã dùng |
| `departments` | `is_active` | Phòng ban giải thể vẫn hiện trong báo cáo kỳ cũ |

Email chỉ cần duy nhất trong số tài khoản chưa xóa (`uq_app_users_email_active` là unique index có điều kiện), nên người quay lại làm việc có thể dùng lại email cũ.

### 2.5 Trạng thái chỉ đi tiến

| Đối tượng | Luồng | Trigger |
|---|---|---|
| Chu kỳ | DRAFT → ACTIVE → CLOSED | `check_cycle_transition`; unique index có điều kiện đảm bảo chỉ một chu kỳ ACTIVE |
| Đợt 360 | DRAFT → NOMINATION → COLLECTING → CLOSED → PUBLISHED | `check_campaign_transition`; mỗi lần chỉ đi một bước |

Khi đợt 360 chuyển sang COLLECTING, trigger khóa tỷ trọng OKR/360 của chu kỳ (`weight_locked_at`). Mọi người đã bắt đầu được chấm theo một công thức thì không ai đổi công thức giữa chừng được.

### 2.6 Bản chụp quan hệ báo cáo

Nhóm của người chấm (Quản lý, Đồng nghiệp, Cấp dưới) phụ thuộc ai đang là quản lý của ai. Nếu một người chuyển phòng giữa đợt, kết quả sẽ bị tính sai nhóm.

Vì vậy khi mở thu phiếu, hệ thống ghi `campaign_participants.manager_user_id` và `department_id`. Mọi tính toán của đợt dùng bản chụp này, không dùng `app_users.manager_id` hiện tại.

## 3. Thiết kế ẩn danh 360

Đây là phần khó nhất của schema. Yêu cầu: người được đánh giá, quản lý và cả Nhân sự không biết đồng nghiệp hay cấp dưới nào chấm điểm nào.

### 3.1 Tách "ai phải chấm" khỏi "chấm bao nhiêu"

| Bảng | Biết gì | Không biết gì |
|---|---|---|
| `review_assignments` | A phải chấm B, thuộc nhóm nào, đã nộp chưa | Điểm |
| `review_answers` | Phiếu của nhóm nào, cho ai, điểm bao nhiêu | Ai chấm (sau khi đóng đợt) |

Trong lúc thu phiếu, `review_answers.assignment_id` còn trỏ về phân công, để người chấm lưu nháp và sửa phiếu của mình. Khi đóng đợt, hàm `close_review_campaign()` làm trong một transaction:

1. Chuyển đợt sang CLOSED.
2. Xóa câu trả lời của các phiếu chưa nộp.
3. Chuyển phân công chưa nộp sang CANCELLED.
4. Đặt `assignment_id = NULL` cho mọi câu trả lời của đợt.

Sau bước 4, ngay cả người có quyền đọc toàn bộ database cũng không nối được điểm với người chấm. Câu trả lời của cùng một phiếu vẫn được gom lại bằng `response_key` (UUID ngẫu nhiên), để đếm số phiếu chính xác.

### 3.2 Ngưỡng 3 phiếu

`vw_review_group_scores` trả điểm trung bình và số phiếu theo từng nhóm, nhưng **chưa** áp ngưỡng. Tầng nghiệp vụ áp quy tắc như `src/frontend/src/lib/review.js`:

1. Nhóm Đồng nghiệp hoặc Cấp dưới dưới 3 phiếu thì gộp hai nhóm.
2. Gộp rồi vẫn dưới 3 phiếu thì ẩn và không tính vào điểm 360.
3. Điểm 360 là trung bình các nhóm được hiển thị, không tính tự đánh giá.

API không bao giờ trả thẳng view này. View tiến độ cho Nhân sự (`vw_campaign_reviewer_progress`) chỉ có người chấm và số phiếu còn lại, không có người được đánh giá.

## 4. Ranh giới transaction

| Thao tác | Gồm những gì trong cùng một transaction |
|---|---|
| Check-in | Thêm `checkins` → trigger cập nhật KR → tính lại `progress` của Objective và mọi Objective cha → thêm `notifications` nếu KR chệch hướng → ghi `audit_logs` |
| Nộp phiếu 360 | Lưu `review_answers` → `review_assignments.status = SUBMITTED` → ghi `audit_logs` (không kèm điểm) |
| Duyệt đề cử | `nominations.status = APPROVED` → tạo `review_assignments` nhóm Đồng nghiệp |
| Mở thu phiếu | Đổi trạng thái đợt → ghi `campaign_participants` (bản chụp) → tạo phân công Tự đánh giá, Quản lý, Cấp dưới → trigger khóa tỷ trọng |
| Đóng đợt 360 | `SELECT close_review_campaign(id)` |
| Đóng chu kỳ | Chốt `final_progress` → tính `final_results` cho mọi người → `okr_cycles.status = CLOSED` |
| Công bố kết quả | Đợt sang PUBLISHED → `final_results.published_at` → thông báo `RESULT_PUBLISHED` |
| Một lần chạy luồng AI | Lấy sự kiện chưa xử lý (`FOR UPDATE SKIP LOCKED`) → tạo `automation_runs` (trùng `run_key` thì bỏ) → **gọi AI ngoài transaction** → mở transaction mới: ghi nhãn/ghi chú/bản tin/bản nháp + `notifications` + cập nhật lần chạy + `processed_at` của sự kiện |
| Gửi bản nháp 1-1 | `one_on_one_drafts.status = SENT` → thông báo `ONE_ON_ONE_SENT` → ghi `audit_logs` (không kèm nội dung) |

## 5. Điểm cuối kỳ

`final_results` lưu sẵn kết quả, không tính lại mỗi lần xem:

- Điểm OKR = 1 + 4 × tiến độ OKR cá nhân (thang 1–5).
- Điểm cuối kỳ = `okr_weight` × điểm OKR + (1 − `okr_weight`) × điểm 360. Mặc định 0,6 và 0,4.
- Xếp loại: từ 4,5 Xuất sắc; từ 3,5 Tốt; từ 2,5 Đạt; dưới 2,5 Cần cải thiện.
- Thiếu điểm OKR hoặc 360 thì `final_score = NULL` và `grade = INSUFFICIENT_DATA`. Ràng buộc `ck_final_results_missing` bắt hai cột này luôn đi cùng nhau, để không ai bị xếp loại bằng điểm 0.

## 6. Thông báo và nhật ký

**Chống gửi trùng.** Job nhắc nhở có thể chạy lại khi lỗi. `notifications` có `UNIQUE (user_id, dedupe_key)`, với `dedupe_key` = loại sự kiện + đối tượng + ngày (ví dụ `checkin_reminder:kr:12:2026-10-30`). Job dùng `INSERT … ON CONFLICT DO NOTHING`, nên mỗi người nhận tối đa một lần nhắc cho mỗi sự kiện mỗi ngày.

**Nhật ký an toàn.** `audit_logs.metadata` là JSONB để mỗi module ghi thông tin riêng, nhưng **không bao giờ** chứa:

- mật khẩu, hash mật khẩu, token;
- điểm hay nhận xét trong phiếu 360;
- cặp người chấm – người được chấm của nhóm Đồng nghiệp hoặc Cấp dưới.

Nộp phiếu chỉ ghi "người X nộp một phiếu trong đợt Y".

## 7. Tự động hóa bằng AI

### 7.1 Hộp thư sự kiện (outbox)

Check-in, tạo Objective và đóng đợt 360 không gọi AI. Trigger chỉ ghi một dòng vào `domain_events` **trong cùng transaction** với thao tác gốc:

| Sự kiện | Ghi khi | Luồng dùng |
|---|---|---|
| `CHECKIN_CREATED` | Thêm `checkins` | Chuyển vướng mắc, phát hiện check-in không khớp |
| `OBJECTIVE_CREATED` | Thêm `objectives` | Rà soát OKR mới tạo |
| `CAMPAIGN_CLOSED` | `review_campaigns.status` chuyển sang CLOSED | Bản nháp 1-1 |

Nếu check-in lỗi và bị rollback thì sự kiện cũng biến mất; nếu check-in lưu được thì chắc chắn có sự kiện. AI worker đọc sự kiện sau, nên AI chậm hay hỏng không làm check-in chậm hay hỏng theo.

`domain_events` chỉ có loại sự kiện và id đối tượng, **không chép nội dung** ghi chú hay nhận xét. Worker đọc nội dung từ bảng gốc khi xử lý, nên nếu đối tượng đã bị xóa mềm thì không còn gì để gửi đi.

Luồng **Bản tin tuần** không cần sự kiện: Bộ lập lịch tạo lần chạy lúc 8h sáng thứ Hai. Luồng **Cảnh báo nhận xét 360** chạy ngay khi bấm nộp, không qua hộp thư (xem 7.4).

### 7.2 Chống chạy trùng và thử lại

- `automation_runs` có `UNIQUE (flow, run_key)`. `run_key` là đối tượng mà luồng xử lý: `checkin:21`, `objective:9`, `user:3:week:2026-10-26`, `campaign:1:reviewee:4`. Job chạy lại hay hai worker cùng nhặt một sự kiện thì lần thứ hai bị database từ chối.
- Dịch vụ AI lỗi → `attempt_count` tăng, `next_attempt_at` đặt sau 1, 5, 15 phút. Quá 4 lần → `FAILED` kèm `error_message` (ràng buộc bắt buộc có lỗi).
- Luồng bị tắt hoặc vượt `daily_quota` → `SKIPPED`, không gọi AI.

### 7.3 AI chỉ ghi vào phần của mình

Không bảng OKR hay 360 nào có cột do AI ghi. Kết quả AI nằm ở 4 bảng riêng, mỗi bảng có trigger giữ nguyên đề xuất gốc của AI:

| Bảng | Người được sửa gì | Database chặn |
|---|---|---|
| `checkin_insights` | Người phụ trách đơn vị được chuyển đến (trưởng phòng hoặc team lead): `routing`, `handled_by`, `handled_at`, `handler_note` | Sửa nhãn AI đã ghi; người khác người phụ trách xử lý; đổi trạng thái sau khi đã xử lý; chuyển vướng mắc về chính đơn vị của người check-in hoặc phòng ban chứa team của họ |
| `objective_review_notes` | Người tạo Objective: `dismissed_at` | — |
| `weekly_digests` | Quản lý: `read_at` | Hai bản tin cùng tuần; quá 3 mục |
| `one_on_one_drafts` | Người duyệt: `edited_text`, `status` | Sửa `ai_strengths`/`ai_improvements`; tạo nháp khi đợt chưa đóng; người duyệt khác quản lý theo bản chụp; gửi khi đợt chưa công bố; người khác người duyệt gửi; sửa sau khi đã gửi |

Nhân viên chỉ thấy `edited_text` của bản nháp 1-1, không bao giờ thấy đề xuất gốc của AI.

### 7.4 Không để lộ dữ liệu qua phần tự động hóa

- `automation_runs` chỉ có số liệu kỹ thuật (trạng thái, thời gian, token, lỗi). Không có cột chứa nội dung gửi cho AI hay AI trả về, nên Admin xem lịch sử chạy không đọc được ghi chú check-in hay nhận xét 360.
- Luồng **Cảnh báo nhận xét 360** không bao giờ có dòng trong `automation_runs` (trigger chặn), chỉ cộng `automation_daily_usage`. Nếu mỗi lần nộp phiếu có một dòng lịch sử, thời điểm của dòng đó sẽ trùng với lúc một phiếu được nộp và có thể dùng để đoán ai đã chấm.
- Đổi tên người và tên phòng ban thành mã (`NV-01`, `PB-QA`) trước khi gửi cho AI là việc của tầng nghiệp vụ; bảng ánh xạ mã chỉ sống trong bộ nhớ của lần chạy, không lưu xuống database.
- Bản nháp 1-1 chỉ dùng nhận xét của nhóm đủ ngưỡng ẩn danh, lấy từ `review_answers` sau khi đợt đã CLOSED (lúc đó câu trả lời đã tách khỏi người chấm).

## 8. Dữ liệu demo và kiểm thử

### 8.1 Dữ liệu demo

`seed_demo.sql` **không viết tay**. Script `tools/generate-seed.mjs` đọc chính `src/frontend/src/lib/data.js` và dùng các hàm tính toán của giao diện (`okr.js`, `review.js`), nên database demo cho ra đúng con số mà bản giao diện mẫu đang hiển thị.

- Mật khẩu mọi tài khoản demo là `123456`, băm bằng bcrypt (`pgcrypto`).
- Chu kỳ Q3/2026 đi đủ vòng đời và đóng; đợt 360 Q3 đã công bố. Chu kỳ Q4/2026 đang chạy; đợt 360 Q4 đang thu phiếu.
- Đợt Q3 được đóng bằng `close_review_campaign()`, nên dữ liệu demo cũng đã ẩn danh thật.
- Phần AI có 17 lần chạy mẫu (một lần lỗi, một lần bỏ qua), 7 nhãn trên check-in (một vướng mắc đang chờ Phòng QA, một vướng mắc Phòng Dev đã nhận), 2 ghi chú rà soát, 2 bản tin tuần và 3 bản nháp 1-1 (một đã gửi, hai chờ HR duyệt).

Sinh lại khi sửa dữ liệu giả:

```bash
node src/database/tools/generate-seed.mjs > src/database/seed_demo.sql
```

### 8.2 Chạy thử

```bash
createdb okr360
psql -d okr360 -v ON_ERROR_STOP=1 -f src/database/okr360.sql
psql -d okr360 -v ON_ERROR_STOP=1 -f src/database/seed_demo.sql
psql -d okr360 -v ON_ERROR_STOP=1 -f src/database/tests/schema_checks.sql
```

Lệnh cuối in `Tất cả 67 kiểm thử PASS`. Kiểm thử chạy trong transaction và tự rollback, nên không làm bẩn dữ liệu demo. Nhóm kiểm thử:

| Nhóm | Ví dụ |
|---|---|
| Số liệu | Tiến độ KR, Objective, cây OKR 4 cấp khớp giao diện (Objective của Lan ở độ sâu 3; OKR Team Thanh toán 30,86%; OKR Phòng Dev 43,34%); điểm 360 của Lan theo nhóm Quản lý là 4,20; điểm cuối kỳ 4,48 xếp loại Tốt; Tú thiếu dữ liệu |
| Ẩn danh | Sau khi đóng đợt Q3, không còn câu trả lời nào có `assignment_id` |
| Quy tắc bị chặn | Hai chu kỳ ACTIVE; Objective sai cấp; OKR team nối lên OKR team; OKR team gắn nhầm phòng ban; team có đơn vị con; team không thuộc phòng nào; KR thứ 6; check-in hộ; sửa check-in; đề cử quản lý trực tiếp làm đồng nghiệp; chuyển trạng thái lùi; đổi tỷ trọng sau khi khóa; vòng lặp quản lý… |
| Tự động hóa AI | Check-in tự sinh sự kiện; vướng mắc chuyển tới team được team lead nhận; không chuyển vướng mắc về phòng ban chứa team của người báo; chạy trùng bị chặn; luồng cảnh báo nhận xét không có lịch sử từng lần; lịch sử chạy và hộp thư sự kiện không có cột nội dung; sửa nhãn AI; người khác trưởng phòng xử lý vướng mắc; quản lý gửi bản nháp của người do HR duyệt; gửi bản nháp khi đợt chưa công bố… |

Mỗi kiểm thử "bị chặn" còn so khớp nội dung lỗi, để chắc chắn bị chặn **đúng vì quy tắc đó** chứ không phải vì một lỗi khác.

Sinh lại DBML sau khi sửa schema:

```bash
python3 src/database/tools/generate-dbml.py "-d okr360" > src/database/okr360.dbml
```

## 9. Từ dữ liệu giả sang SQL

| `data.js` | Bảng | Ghi chú |
|---|---|---|
| `users` (`u1`…`u11`) | `app_users` | id lấy theo số sau `u`; `managerId` → `manager_id` |
| `departments` | `departments` | `headId` → `head_user_id`; `type` → `unit_type` |
| `cycles` | `okr_cycles` | `okrWeight` → `okr_weight` |
| `objectives` | `objectives` | `parentId` → `parent_id`; `progress` tính bằng `okr.js` |
| `keyResults` | `key_results` | `start`, `target` → `start_value`, `target_value` |
| `checkins` | `checkins` | Thêm theo thứ tự thời gian để trigger cập nhật KR đúng |
| `templates` | `review_templates`, `review_criteria`, `review_questions` | |
| `campaigns` | `review_campaigns` | Đi qua từng trạng thái thay vì ghi thẳng trạng thái cuối; `managerSnapshot` cho quan hệ báo cáo cũ (Q3 trước khi Phòng Dev chia team) |
| `nominations` | `nominations`, `nomination_peers` | |
| `reviewForms` | `review_assignments`, `review_answers` | Mỗi phiếu một `response_key` ngẫu nhiên |
| — | `campaign_participants` | Sinh khi mở thu phiếu |
| — | `final_results` | Tính bằng `finalScore()` và `grade()` của `okr.js` |
| `notifications` | `notifications` | `dedupe_key` = `demo:<id>` |
| `auditLogs` | `audit_logs` | Hành động trên giao diện đổi sang enum `audit_action` |
| `automationFlows`, `automationUsage` | `automation_flows`, `automation_daily_usage` | |
| `automationRuns` | `automation_runs` | `run_key` sinh từ đối tượng được xử lý; `event_id` tìm theo sự kiện trigger đã ghi |
| `checkinInsights` | `checkin_insights` | Ghi ở trạng thái OPEN rồi mới cập nhật ACKNOWLEDGED, để đi qua trigger kiểm tra trưởng phòng |
| `objectiveReviewNotes` | `objective_review_notes` | |
| `weeklyDigests` | `weekly_digests` | id người dùng và KR trong JSON được đổi sang id số |
| `oneOnOneDrafts` | `one_on_one_drafts` | Ghi ở trạng thái chờ duyệt rồi mới chuyển SENT, sau khi đợt Q3 đã công bố |

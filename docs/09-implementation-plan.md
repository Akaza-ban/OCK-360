# Kế hoạch triển khai và kiểm thử — OKR360 V1

> Trạng thái thiết kế: TARGET V1
>
> Trạng thái triển khai: CHƯA BẮT ĐẦU; backend chưa có, frontend là bản mẫu dùng dữ liệu giả

Tài liệu này biến thiết kế thành thứ tự làm việc: làm gì trước, thế nào là xong, kiểm thử ra sao. Danh sách test chi tiết nằm ở [danh mục test](test-cases.md); mã test được gắn vào [bảng truy vết](traceability.md).

## 1. Nguồn đúng khi tài liệu mâu thuẫn

Khi hai tài liệu nói khác nhau, theo thứ tự ưu tiên sau, rồi sửa tài liệu kém ưu tiên hơn trước khi viết code:

1. [Quyết định kiến trúc](architecture/decisions.md).
2. [Quy tắc nghiệp vụ](requirements/business-rules.md) và [tiêu chí chấp nhận](06-acceptance-criteria.md).
3. [Kiến trúc C4](architecture/c4.md) và [đặc tả luồng AI](architecture/ai-flows.md).
4. [OpenAPI](api/openapi.yaml) và [schema database](../src/database/okr360.sql).
5. [Sơ đồ class](architecture/class-diagrams.md), [sơ đồ sequence](architecture/sequence-diagrams.md), [cấu trúc thư mục](07-folder-structure.md).

Không viết code lách quanh một chỗ mâu thuẫn; sửa tài liệu và OpenAPI cùng lúc.

## 2. Các đợt triển khai

Phần lõi OKR và 360 làm trước, phần AI làm sau, vì AI chỉ đọc dữ liệu mà phần lõi tạo ra. Mỗi đợt kết thúc ở trạng thái chạy được và mọi test của đợt đều qua.

| Đợt | Phạm vi | Story | Xong khi |
|---|---|---|---|
| I1 Nền tảng | Dự án NestJS với `main.api.ts` và `main.worker.ts`; đọc và kiểm tra cấu hình; Kysely với kiểu sinh từ database; `ProblemDetailsFilter`; `compose.yaml` cho PostgreSQL; CI chạy lint, `dependency-cruiser` và `schema_checks.sql` | — | API và Worker khởi động được; thiếu biến môi trường thì dừng với thông báo rõ; 67 kiểm thử schema qua trong CI |
| I2 Đăng nhập, phân quyền | `AuthController`, `TokenService`, Argon2id, giới hạn đăng nhập sai; `JwtAuthGuard`, `RolesGuard`, `AccessPolicy`; hồ sơ | US01, US02, US03 | Test của UC01–UC03 qua; mọi thao tác trừ `login` trả `401` khi thiếu token |
| I3 Tổ chức | Phòng ban, team, người dùng, danh bạ | US04, US05 | Test của UC04–UC05 qua |
| I4 Chu kỳ và OKR | Chu kỳ, Objective, Key Result, liên kết, xóa mềm, `ProgressRollup` | US06–US11 | Test của UC06–UC11 qua; tiến độ khớp `okr.js` trên dữ liệu demo |
| I5 Check-in | Check-in, cộng dồn, lịch sử, bình luận | US12, US13, US14 | Test của UC12–UC14 qua; sự kiện `CHECKIN_CREATED` được ghi |
| I6 Đánh giá 360 | Mẫu phiếu, đợt, đề cử, duyệt, phiếu, đóng đợt, kết quả với ngưỡng ẩn danh | US15–US21 | Test của UC15–UC21 qua, trừ phần cảnh báo nhận xét; kiểm thử ẩn danh sau khi đóng đợt qua |
| I7 Kết quả cuối kỳ | Tổng hợp, xuất file, công bố | US22a, US22b | Test của UC22 qua; điểm khớp số tính tay trên dữ liệu demo |
| I8 Dashboard, báo cáo, thông báo, nhật ký | Ba dashboard, báo cáo và xuất file, nhắc nhở và email trong Worker, nhật ký | US23a, US23b, US23c, US24, US25, US26 | Test của UC23–UC26 qua; dashboard khớp báo cáo cùng bộ lọc |
| I9 Nền tảng AI | Hộp thư sự kiện, `FlowRunner`, `AiGateway`, `Masker`, `OutputValidator`, `FakeAiProvider`, hạn mức, thử lại, cấu hình và lịch sử chạy | US32a, US32b, US32c, US27, US28 | Test của UC27, UC28 và phần chung của UC32 qua, chạy bằng `FakeAiProvider` |
| I10 Các luồng AI | Chuyển vướng mắc, phát hiện không khớp, rà soát OKR, bản tin tuần, bản nháp 1-1, cảnh báo nhận xét | US29, US30, US31, US33, US34 | Test của UC29–UC31, phần AI của UC19 và UC32 qua; chọn và nối dịch vụ AI thật |
| I11 Nối frontend | Thay dữ liệu giả bằng `features/*/api.js` theo từng tính năng, giữ `VITE_USE_MOCK` cho demo | — | Mọi màn hình chạy với API thật; các trạng thái giao diện ở [kiến trúc thông tin](04-information-architecture.md) vẫn đúng |

Dịch vụ AI thật chỉ cần chọn ở I10. Từ I9 trở về trước, mọi test AI chạy bằng `FakeAiProvider` (ADR-005).

## 3. Tách story quá lớn

Ba story chưa đạt tiêu chí Small trong [đánh giá INVEST](08-invest-requirements.md) được tách như sau. Mã con dùng trong kế hoạch này; bảng truy vết vẫn theo story gốc.

| Story gốc | Story con | Nội dung | Đợt |
|---|---|---|---|
| US22 | US22a | Tổng hợp điểm OKR, 360, cuối kỳ, xếp loại; tổng hợp lại trước khi công bố | I7 |
| | US22b | Xuất file, công bố, thông báo từng người | I7 |
| US23 | US23a | Dashboard cá nhân | I8 |
| | US23b | Dashboard đội nhóm | I8 |
| | US23c | Dashboard công ty | I8 |
| US32 | US32a | Hộp thư sự kiện, đọc bằng `SKIP LOCKED`, `FlowRunner`, ghi lịch sử chạy | I9 |
| | US32b | `AiGateway`: đổi tên thành mã, gọi dịch vụ, kiểm tra khuôn | I9 |
| | US32c | Thử lại sau 1, 5, 15 phút; chống chạy trùng; hạn mức | I9 |

## 4. Chiến lược kiểm thử

| Mức | Kiểm tra gì | Công cụ đề xuất | Chạy ở |
|---|---|---|---|
| UNIT | Code thuần không cần database: `ScoreCalculator`, `ProgressRollup`, `AnonymityAggregator`, `Masker`, `OutputValidator` | Jest | Mỗi lần commit |
| INT | Repository với PostgreSQL thật: ràng buộc, trigger, view, transaction, `schema_checks.sql` | Jest, PostgreSQL trong Docker | Mỗi lần commit |
| API | Từng thao tác qua HTTP: quyền (`401`, `403`, được phép), dữ liệu sai (`400`), trạng thái (`409`), phản hồi khớp OpenAPI | Jest, Supertest, trình kiểm tra phản hồi theo OpenAPI | Mỗi lần commit |
| AI | Luồng AI với `FakeAiProvider`: lỗi, quá giờ, sai khuôn, câu kiểu "bỏ qua hướng dẫn", nội dung gửi đi không có tên thật | Jest | Mỗi lần commit |
| SEC, PRIV | Không lộ mật khẩu, token, người chấm ẩn danh qua API, log, file xuất | Jest, rà soát | Mỗi đợt |
| PERF | Thời gian phản hồi với tải tham chiếu | k6 | Trước khi đưa vào dùng |
| E2E | Kịch bản demo trong README chạy trên giao diện thật | Thủ công hoặc Playwright | Từ I11 |

Quy ước mã test:

- `TC-UCxx-nn`: một gạch đầu dòng trong tiêu chí chấp nhận AC-UCxx, theo đúng thứ tự trong tài liệu.
- `TC-NFR-...`: một yêu cầu phi chức năng, cùng mã với yêu cầu.

Khi sửa tiêu chí chấp nhận, sinh lại danh mục test để mã test luôn khớp.

## 5. Tiêu chí hoàn thành

### 5.1 Mỗi thao tác API

- Đường dẫn, phương thức, tham số, dữ liệu vào và ra khớp [OpenAPI](api/openapi.yaml), không có trường ngoài hợp đồng; tên hàm controller trùng `operationId`.
- Có test cho: thiếu token (`401`), sai vai trò hoặc sai phạm vi dữ liệu (`403`), mỗi vai trò trong `x-roles` được phép, dữ liệu sai (`400` kèm `errors`), mỗi lỗi `409` có trong hợp đồng.
- Mọi quy tắc trong `x-business-rules` có ít nhất một test.
- Lỗi trả về `application/problem+json` có `errorCode` và `traceId`.
- Thao tác ghi có ghi nhật ký khi use case yêu cầu; nhật ký không chứa mật khẩu, token, điểm, nhận xét hay cặp người chấm ẩn danh.
- Test chạy với PostgreSQL thật, không giả lập repository ở mức API.

### 5.2 Mỗi đợt

- Mọi test trong [danh mục test](test-cases.md) thuộc các use case của đợt đều qua.
- CI xanh: lint, `dependency-cruiser`, unit, integration, API, `schema_checks.sql`.
- Không có quy tắc nào bị lách bằng code; chỗ mâu thuẫn đã được sửa trong tài liệu.
- [Bảng truy vết](traceability.md) và README cập nhật nếu thiết kế đổi.

### 5.3 Trước khi đưa vào dùng

- Mọi test `TC-NFR-PERF-*` và `TC-NFR-SEC-*` qua với tải tham chiếu.
- Đã diễn tập khôi phục từ bản sao lưu (NFR-REL-005).
- Đã chọn dịch vụ AI và kiểm thử nội dung gửi đi không có tên, email, số điện thoại thật (NFR-PRIV-004).

## 6. Môi trường

| Môi trường | Gồm | Dùng cho |
|---|---|---|
| Máy phát triển | `compose.yaml`: PostgreSQL; API và Worker chạy bằng `npm run start:dev`; `FakeAiProvider` | Viết code, chạy test |
| CI | GitHub Actions với PostgreSQL dạng service container; nạp `okr360.sql` và `seed_demo.sql` trước khi test | Mỗi lần push và pull request |
| Chạy thật | Docker Compose sau reverse proxy HTTPS (ADR-007); dịch vụ AI thật | Sau I10 |

**Liên quan:** [Danh mục test](test-cases.md) · [Bảng truy vết](traceability.md) · [Cấu trúc thư mục](07-folder-structure.md) · [Quyết định kiến trúc](architecture/decisions.md)

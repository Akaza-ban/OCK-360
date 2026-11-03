# Quyết định kiến trúc — OKR360 V1

> Trạng thái thiết kế: TARGET V1

Mỗi quyết định ghi lý do và cái giá phải trả, để sau này biết điều gì có thể đổi. Trạng thái **Đã chốt** là quyết định đã có từ chủ dự án hoặc từ thiết kế hiện có. **Đề xuất** là lựa chọn mới ở bước kiến trúc, có hiệu lực cho tới khi bị thay thế.

| Mã                                                                     | Quyết định                                         | Trạng thái |
| ---------------------------------------------------------------------- | -------------------------------------------------- | ---------- |
| [ADR-001](#adr-001--backend-dùng-nestjs)                               | Backend dùng NestJS                                | Đã chốt    |
| [ADR-002](#adr-002--một-mã-nguồn-hai-tiến-trình)                       | Một mã nguồn, hai tiến trình API và Worker         | Đề xuất    |
| [ADR-003](#adr-003--database-giữ-luật-và-truy-vấn-bằng-kysely)         | Database giữ luật, truy vấn bằng Kysely            | Đề xuất    |
| [ADR-004](#adr-004--hộp-thư-sự-kiện-trong-postgresql-không-dùng-redis) | Hộp thư sự kiện trong PostgreSQL, không dùng Redis | Đề xuất    |
| [ADR-005](#adr-005--gọi-ai-qua-một-cổng-riêng)                         | Gọi AI qua một cổng riêng                          | Đề xuất    |
| [ADR-006](#adr-006--đăng-nhập-bằng-jwt-30-phút-và-argon2id)            | Đăng nhập bằng JWT 30 phút và Argon2id             | Đề xuất    |
| [ADR-007](#adr-007--v1-chạy-bằng-docker-compose)                       | V1 chạy bằng Docker Compose                        | Đề xuất    |

## ADR-001 — Backend dùng NestJS

- **Bối cảnh:** frontend và công cụ sinh dữ liệu đều dùng JavaScript.
- **Quyết định:** backend dùng NestJS với TypeScript.
- **Lý do:** một hệ ngôn ngữ cho cả dự án; NestJS có sẵn module, dependency injection và guard, hợp với kiến trúc ba tầng.
- **Cái giá:** NestJS không tự tách tầng; ranh giới API, Application, Infrastructure phải được giữ bằng cấu trúc thư mục và quy tắc import.

## ADR-002 — Một mã nguồn, hai tiến trình

- **Bối cảnh:** gọi AI có thể mất tới 30 giây và thử lại nhiều lần, trong khi check-in phải phản hồi ngay (BR-096).
- **Quyết định:** API và Worker dùng chung một mã nguồn NestJS, chạy thành hai tiến trình riêng. V1 không chia microservice.
- **Lý do:** Worker lỗi hoặc chậm không ảnh hưởng API, mà vẫn chỉ có một dự án để bảo trì.
- **Cái giá:** phải triển khai hai tiến trình; code dùng chung phải tránh phụ thuộc vào HTTP.

## ADR-003 — Database giữ luật và truy vấn bằng Kysely

- **Bối cảnh:** `okr360.sql` đã có trigger, view, CTE đệ quy, unique index có điều kiện và 67 kiểm thử.
- **Quyết định:** `okr360.sql` là nguồn gốc của schema. Backend truy vấn bằng Kysely, kiểu TypeScript sinh từ database. Không dùng ORM tự tạo migration.
- **Lý do:** Kysely viết được SQL đầy đủ (`FOR UPDATE SKIP LOCKED`, CTE, view) mà vẫn kiểm tra kiểu. ORM dễ sinh schema lệch với các trigger đã kiểm thử.
- **Cái giá:** viết truy vấn nhiều hơn so với ORM; cần thêm công cụ chạy migration SQL.

## ADR-004 — Hộp thư sự kiện trong PostgreSQL, không dùng Redis

- **Bối cảnh:** sự kiện phải được ghi cùng transaction với thao tác gốc (NFR-REL-001), và hệ thống phục vụ tối đa 300 người.
- **Quyết định:** Worker đọc `domain_events` theo chu kỳ bằng `FOR UPDATE SKIP LOCKED`, mặc định mỗi 30 giây. Bộ lập lịch chạy trong Worker. V1 không thêm Redis hay hàng đợi riêng.
- **Lý do:** đảm bảo không mất sự kiện mà không cần thêm thành phần vận hành. Độ trễ 30 giây vẫn đáp ứng mục tiêu 15 phút (NFR-AI-001). `UNIQUE (flow, run_key)` chặn chạy trùng kể cả khi có nhiều Worker.
- **Cái giá:** có độ trễ do đọc theo chu kỳ, và database nhận thêm một truy vấn định kỳ. Nếu tải tăng nhiều, cần đổi sang hàng đợi riêng.

## ADR-005 — Gọi AI qua một cổng riêng

- **Bối cảnh:** chưa chọn dịch vụ AI, và mọi nội dung phải đổi tên thành mã trước khi gửi (BR-093).
- **Quyết định:** mọi lời gọi AI đi qua AI Gateway, gồm đổi tên, gọi dịch vụ và đổi mã về tên. Nghiệp vụ chỉ biết một giao diện chung. Môi trường test dùng bản giả ghi lại nội dung gửi đi.
- **Lý do:** đổi nhà cung cấp không phải sửa nghiệp vụ (NFR-AI-006), không luồng nào quên đổi tên, và kiểm thử được NFR-PRIV-004.
- **Cái giá:** thêm một lớp trừu tượng; dùng được ít tính năng riêng của từng nhà cung cấp.

## ADR-006 — Đăng nhập bằng JWT 30 phút và Argon2id

- **Bối cảnh:** phạm vi V1 đã chốt JWT, không refresh token, không SSO.
- **Quyết định:** access token hết hạn sau 30 phút, gửi qua header `Authorization: Bearer`. Mật khẩu băm bằng Argon2id. Quyền được đọc lại từ database ở mỗi yêu cầu cần kiểm tra quan hệ báo cáo.
- **Lý do:** đơn giản và đúng phạm vi. Đọc quan hệ báo cáo từ database giúp đổi quản lý có hiệu lực ngay, không phải chờ token hết hạn.
- **Cái giá:** người dùng phải đăng nhập lại sau 30 phút; không thu hồi được token trước hạn. Tắt tài khoản cần kiểm tra thêm ở database để có hiệu lực ngay.

## ADR-007 — V1 chạy bằng Docker Compose

- **Bối cảnh:** hệ thống dùng nội bộ cho một công ty, tối đa 300 người.
- **Quyết định:** Web App, API, Worker và PostgreSQL chạy bằng Docker Compose trên một máy chủ, sau một reverse proxy lo HTTPS.
- **Lý do:** đủ cho quy mô V1, dễ dựng lại trên máy phát triển.
- **Cái giá:** có một điểm lỗi duy nhất, nên cần sao lưu (NFR-REL-005). Chưa có tự mở rộng hay cập nhật không gián đoạn.

**Liên quan:** [Kiến trúc C4](c4.md) · [Yêu cầu phi chức năng](../requirements/non-functional-requirements.md)

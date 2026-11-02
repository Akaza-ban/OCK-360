-- ============================================================
-- Dữ liệu mẫu OKR360 — SINH TỰ ĐỘNG, không sửa tay.
-- Nguồn: src/frontend/src/lib/data.js · Script: src/database/tools/generate-seed.mjs
-- Chạy sau okr360.sql. Mật khẩu của mọi tài khoản demo: 123456
-- ============================================================
BEGIN;
SET search_path TO okr360, public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Phòng ban và team (người phụ trách gán sau khi có người dùng)
INSERT INTO departments (id, name, parent_id, unit_type) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Ban Giám đốc', NULL, 'DEPARTMENT'),
  (2, 'Phòng Nhân sự', 1, 'DEPARTMENT'),
  (3, 'Phòng Dev', 1, 'DEPARTMENT'),
  (4, 'Phòng QA', 1, 'DEPARTMENT'),
  (5, 'Phòng Kinh doanh', 1, 'DEPARTMENT'),
  (6, 'Team Thanh toán', 3, 'TEAM'),
  (7, 'Team Nền tảng', 3, 'TEAM');

-- Người dùng (quản lý được thêm trước nhân viên của họ)
INSERT INTO app_users (id, email, password_hash, full_name, job_title, role, department_id, manager_id, is_active) OVERRIDING SYSTEM VALUE VALUES
  (1, 'hung@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Lê Văn Hùng', 'Quản trị hệ thống', 'ADMIN', 1, NULL, true),
  (2, 'mai@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Phạm Thu Mai', 'Trưởng phòng Nhân sự', 'HR', 2, NULL, true),
  (12, 'son@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Đinh Công Sơn', 'Trưởng phòng Dev', 'MANAGER', 3, NULL, true),
  (13, 'huy@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Trịnh Gia Huy', 'Team lead Nền tảng', 'MANAGER', 7, 12, true),
  (3, 'nam@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Trần Hoài Nam', 'Team lead Thanh toán', 'MANAGER', 6, 12, true),
  (4, 'lan@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Nguyễn Thị Lan', 'Lập trình viên', 'EMPLOYEE', 6, 3, true),
  (5, 'tu@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Võ Anh Tú', 'Lập trình viên', 'EMPLOYEE', 6, 3, true),
  (10, 'an@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Đỗ Minh An', 'Lập trình viên', 'EMPLOYEE', 6, 3, true),
  (6, 'ha@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Hoàng Thu Hà', 'Trưởng phòng QA', 'MANAGER', 4, NULL, true),
  (7, 'minh@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Bùi Đức Minh', 'Kỹ sư kiểm thử', 'EMPLOYEE', 4, 6, true),
  (11, 'binh@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Ngô Thanh Bình', 'Kỹ sư kiểm thử', 'EMPLOYEE', 4, 6, true),
  (8, 'linh@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Đặng Mỹ Linh', 'Trưởng phòng Kinh doanh', 'MANAGER', 5, NULL, true),
  (9, 'quan@okr360.vn', crypt('123456', gen_salt('bf', 10)), 'Lý Hoàng Quân', 'Nhân viên kinh doanh', 'EMPLOYEE', 5, 8, true);

UPDATE departments SET head_user_id = 1 WHERE id = 1;
UPDATE departments SET head_user_id = 2 WHERE id = 2;
UPDATE departments SET head_user_id = 12 WHERE id = 3;
UPDATE departments SET head_user_id = 6 WHERE id = 4;
UPDATE departments SET head_user_id = 8 WHERE id = 5;
UPDATE departments SET head_user_id = 3 WHERE id = 6;
UPDATE departments SET head_user_id = 13 WHERE id = 7;

-- Luồng tự động AI dựng sẵn
INSERT INTO automation_flows (flow, name, description, trigger_kind, schedule_cron, is_enabled, daily_quota, updated_by) VALUES
  ('BLOCKER_ROUTING', 'Chuyển vướng mắc đến đúng người', 'Phân loại vướng mắc trong check-in; vướng mắc phụ thuộc phòng khác được báo cho trưởng phòng đó.', 'EVENT', NULL, true, 500, 1),
  ('WEEKLY_DIGEST', 'Bản tin tuần cho quản lý', 'Tóm tắt check-in và vướng mắc tuần trước của đội, chọn tối đa 3 việc cần chú ý.', 'SCHEDULE', '0 8 * * 1', true, 50, 1),
  ('ONE_ON_ONE_DRAFT', 'Bản nháp buổi 1-1 sau đợt 360', 'Tóm tắt nhận xét mở của các nhóm đủ ngưỡng ẩn danh thành bản nháp cho quản lý duyệt.', 'EVENT', NULL, true, 300, 1),
  ('CHECKIN_MISMATCH', 'Phát hiện check-in không khớp', 'So mức tự tin với ghi chú; mâu thuẫn thì nhắc người check-in xem lại.', 'EVENT', NULL, true, 500, 1),
  ('OKR_REVIEW', 'Rà soát OKR mới tạo', 'Kiểm tra KR có đo được không, có trùng lặp không, có khớp mục tiêu cấp trên không.', 'EVENT', NULL, true, 300, 1),
  ('REVIEW_COMMENT_GUARD', 'Cảnh báo nhận xét 360 dễ lộ danh tính', 'Nhắc riêng người viết khi nhận xét có thể làm lộ danh tính hoặc có lời lẽ xúc phạm. Không lưu lịch sử từng lần.', 'ON_SUBMIT', NULL, true, 1000, 1);

-- Mẫu phiếu đánh giá
INSERT INTO review_templates (id, name, created_by) OVERRIDING SYSTEM VALUE VALUES (1, 'Mẫu đánh giá 360 chuẩn', 2);
INSERT INTO review_criteria (id, template_id, name, description, is_required, sort_order) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Tinh thần làm việc nhóm', 'Phối hợp, chia sẻ trách nhiệm với đồng đội.', true, 1),
  (2, 1, 'Giao tiếp', 'Trao đổi rõ ràng, lắng nghe và phản hồi kịp thời.', true, 2),
  (3, 1, 'Chủ động giải quyết vấn đề', 'Tự tìm cách gỡ vướng mắc trước khi cần nhắc.', true, 3),
  (4, 1, 'Chất lượng công việc', 'Kết quả đúng yêu cầu, ít phải làm lại.', true, 4),
  (5, 1, 'Hỗ trợ và chia sẻ kiến thức', 'Giúp người khác cùng tiến bộ.', false, 5);
INSERT INTO review_questions (id, template_id, question_text, sort_order) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Người này nên tiếp tục làm gì?', 1),
  (2, 1, 'Người này nên cải thiện điều gì?', 2);

-- ============ Chu kỳ Q3/2026 ============
INSERT INTO okr_cycles (id, name, start_date, end_date, planning_deadline, status, max_objectives_per_user, okr_weight, created_by) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Q3/2026', '2026-07-01', '2026-09-30', '2026-07-14', 'ACTIVE', 5, 0.6, 2);
INSERT INTO objectives (id, cycle_id, level, title, description, owner_user_id, department_id, parent_id, progress, created_by) OVERRIDING SYSTEM VALUE VALUES
  (15, 1, 'COMPANY', 'Ra mắt cổng thanh toán mới', NULL, 1, 1, NULL, 0.8708, 1),
  (16, 1, 'DEPARTMENT', 'Hoàn thành tích hợp cổng thanh toán', NULL, 3, 3, 15, 0.8740, 3),
  (17, 1, 'INDIVIDUAL', 'Tích hợp ví điện tử vào luồng thanh toán', NULL, 4, 3, 16, 0.9125, 4),
  (18, 1, 'INDIVIDUAL', 'Xây dựng trang đối soát giao dịch', NULL, 5, 3, 16, 1.0000, 5),
  (19, 1, 'INDIVIDUAL', 'Điều phối tích hợp với đối tác thanh toán', NULL, 3, 3, 16, 0.6667, 3),
  (20, 1, 'INDIVIDUAL', 'Kiểm thử toàn diện cổng thanh toán trước ra mắt', NULL, 6, 4, 15, 0.9183, 6);
INSERT INTO key_results (id, objective_id, title, kr_type, start_value, target_value, unit, assignee_user_id, sort_order) OVERRIDING SYSTEM VALUE VALUES
  (18, 15, 'Số giao dịch qua cổng mới', 'NUMBER', 0, 10000, 'giao dịch', 1, 1),
  (19, 16, 'Hoàn thành hạng mục tích hợp', 'NUMBER', 0, 12, 'hạng mục', 3, 2),
  (20, 17, 'Hỗ trợ ví điện tử', 'NUMBER', 0, 3, 'ví', 4, 3),
  (21, 17, 'Tỷ lệ thanh toán thành công qua ví', 'PERCENT', 90, 98, '%', 4, 4),
  (22, 18, 'Ra mắt trang đối soát', 'BOOLEAN', 0, 1, NULL, 5, 5),
  (23, 19, 'Ký biên bản nghiệm thu với đối tác', 'NUMBER', 0, 3, 'đối tác', 3, 6),
  (24, 20, 'Chạy kịch bản kiểm thử đầu cuối', 'NUMBER', 0, 200, 'kịch bản', 6, 7),
  (25, 20, 'Lỗi nghiêm trọng còn mở khi ra mắt', 'NUMBER', 12, 0, 'lỗi', 6, 8);
INSERT INTO checkins (id, key_result_id, value, confidence, note, blocker, created_by, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 22, 1, 'ON_TRACK', NULL, NULL, 5, '2026-09-25T17:00:00+07'),
  (2, 24, 184, 'ON_TRACK', NULL, NULL, 6, '2026-09-27T17:00:00+07'),
  (3, 25, 1, 'ON_TRACK', NULL, NULL, 6, '2026-09-27T17:05:00+07'),
  (4, 20, 3, 'ON_TRACK', NULL, NULL, 4, '2026-09-28T17:00:00+07'),
  (5, 21, 96.6, 'ON_TRACK', NULL, NULL, 4, '2026-09-28T17:00:00+07'),
  (6, 18, 8200, 'ON_TRACK', NULL, NULL, 1, '2026-09-29T17:00:00+07'),
  (7, 19, 11, 'ON_TRACK', NULL, NULL, 3, '2026-09-29T17:00:00+07'),
  (8, 23, 2, 'AT_RISK', 'Một đối tác lùi nghiệm thu sang quý sau.', NULL, 3, '2026-09-29T17:00:00+07');
-- Đợt Đánh giá 360 – Q3/2026: tạo ở DRAFT rồi đi tiến từng bước như vòng đời thật
INSERT INTO review_campaigns (id, cycle_id, template_id, name, nomination_deadline, submit_deadline, created_by) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 1, 'Đánh giá 360 – Q3/2026', '2026-09-10', '2026-09-28', 2);
INSERT INTO campaign_participants (campaign_id, reviewee_user_id, manager_user_id, department_id, snapshot_at) VALUES
  (1, 4, 3, 6, NOW()),
  (1, 6, NULL, 4, NOW()),
  (1, 3, NULL, 6, NOW());
UPDATE review_campaigns SET status = 'NOMINATION' WHERE id = 1;
UPDATE review_campaigns SET status = 'COLLECTING' WHERE id = 1;
INSERT INTO review_assignments (id, campaign_id, reviewee_user_id, reviewer_user_id, reviewer_group, status, submitted_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 4, 4, 'SELF', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (2, 1, 4, 3, 'MANAGER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (3, 1, 4, 5, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (4, 1, 4, 10, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (5, 1, 4, 7, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (6, 1, 4, 11, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (7, 1, 6, 6, 'SELF', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (8, 1, 6, 3, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (9, 1, 6, 8, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (10, 1, 6, 7, 'DIRECT_REPORT', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (11, 1, 6, 11, 'DIRECT_REPORT', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (12, 1, 3, 3, 'SELF', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (13, 1, 3, 6, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (14, 1, 3, 8, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (15, 1, 3, 2, 'PEER', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (16, 1, 3, 4, 'DIRECT_REPORT', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (17, 1, 3, 5, 'DIRECT_REPORT', 'SUBMITTED', '2026-09-28T08:00:00+07'),
  (18, 1, 3, 10, 'DIRECT_REPORT', 'SUBMITTED', '2026-09-28T08:00:00+07');
INSERT INTO review_answers (campaign_id, reviewee_user_id, reviewer_group, assignment_id, response_key, criterion_id, question_id, score, answer_text) VALUES
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', 1, NULL, 4, NULL),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', 2, NULL, 3, NULL),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', 3, NULL, 4, NULL),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', 4, NULL, 4, NULL),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', 5, NULL, 4, NULL),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', NULL, 1, NULL, 'Giữ nhịp viết test đều đặn.'),
  (1, 4, 'SELF', 1, '2222230e-9e4e-4e0c-853d-6e439d47c3c9', NULL, 2, NULL, 'Chủ động hỏi sớm khi bị chặn.'),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', 1, NULL, 4, NULL),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', 2, NULL, 4, NULL),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', 3, NULL, 4, NULL),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', 4, NULL, 5, NULL),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', 5, NULL, 4, NULL),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', NULL, 1, NULL, 'Chất lượng code rất ổn định.'),
  (1, 4, 'MANAGER', 2, '299e7e68-f39a-4aa9-bf90-c1c04e7795f0', NULL, 2, NULL, 'Nên chia sẻ nhiều hơn trong buổi họp đội.'),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', 1, NULL, 5, NULL),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', 2, NULL, 4, NULL),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', 3, NULL, 4, NULL),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', 4, NULL, 5, NULL),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', 5, NULL, 4, NULL),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', NULL, 1, NULL, 'Luôn sẵn lòng review code cho mọi người.'),
  (1, 4, 'PEER', 3, 'd2a1a05b-ad09-4469-a365-732d486d997f', NULL, 2, NULL, 'Có thể viết tài liệu kỹ hơn.'),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', 1, NULL, 5, NULL),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', 2, NULL, 4, NULL),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', 3, NULL, 4, NULL),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', 4, NULL, 4, NULL),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', 5, NULL, 5, NULL),
  (1, 4, 'PEER', 4, 'bdb1fc6c-ca21-4b7b-9873-8d6a5d4bd722', NULL, 1, NULL, 'Hướng dẫn mình rất kiên nhẫn.'),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', 1, NULL, 4, NULL),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', 2, NULL, 4, NULL),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', 3, NULL, 5, NULL),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', 4, NULL, 4, NULL),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', 5, NULL, 4, NULL),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', NULL, 1, NULL, 'Phản hồi bug rất nhanh.'),
  (1, 4, 'PEER', 5, '13fc41f6-e697-415f-a7c4-c1abc77fc532', NULL, 2, NULL, 'Nên báo trước khi đổi luồng thanh toán.'),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', 1, NULL, 4, NULL),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', 2, NULL, 4, NULL),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', 3, NULL, 4, NULL),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', 4, NULL, 4, NULL),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', 5, NULL, NULL, NULL),
  (1, 4, 'PEER', 6, '762ce16c-3bfc-43b2-bf95-6c394e7122ec', NULL, 2, NULL, 'Mô tả pull request rõ hơn sẽ giúp QA kiểm thử nhanh hơn.'),
  (1, 6, 'SELF', 7, 'e2241b66-b5d0-484a-8a8b-5db3ec71bd41', 1, NULL, 4, NULL),
  (1, 6, 'SELF', 7, 'e2241b66-b5d0-484a-8a8b-5db3ec71bd41', 2, NULL, 4, NULL),
  (1, 6, 'SELF', 7, 'e2241b66-b5d0-484a-8a8b-5db3ec71bd41', 3, NULL, 4, NULL),
  (1, 6, 'SELF', 7, 'e2241b66-b5d0-484a-8a8b-5db3ec71bd41', 4, NULL, 4, NULL),
  (1, 6, 'SELF', 7, 'e2241b66-b5d0-484a-8a8b-5db3ec71bd41', 5, NULL, 4, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', 1, NULL, 4, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', 2, NULL, 3, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', 3, NULL, 4, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', 4, NULL, 4, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', 5, NULL, 4, NULL),
  (1, 6, 'PEER', 8, '44fba695-96ae-41d6-8e33-5e1c51fb5c94', NULL, 1, NULL, 'Phối hợp release rất tốt.'),
  (1, 6, 'PEER', 9, '8710c992-d172-44c4-9c86-33d6b94cdf7b', 1, NULL, 4, NULL),
  (1, 6, 'PEER', 9, '8710c992-d172-44c4-9c86-33d6b94cdf7b', 2, NULL, 4, NULL),
  (1, 6, 'PEER', 9, '8710c992-d172-44c4-9c86-33d6b94cdf7b', 3, NULL, 3, NULL),
  (1, 6, 'PEER', 9, '8710c992-d172-44c4-9c86-33d6b94cdf7b', 4, NULL, 4, NULL),
  (1, 6, 'PEER', 9, '8710c992-d172-44c4-9c86-33d6b94cdf7b', 5, NULL, 3, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', 1, NULL, 5, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', 2, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', 3, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', 4, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', 5, NULL, 5, NULL),
  (1, 6, 'DIRECT_REPORT', 10, '932fdbfe-73ea-40fe-96e0-c4a24da14087', NULL, 1, NULL, 'Luôn bảo vệ đội khi bị dồn việc.'),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', 1, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', 2, NULL, 3, NULL),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', 3, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', 4, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', 5, NULL, 4, NULL),
  (1, 6, 'DIRECT_REPORT', 11, '1578de87-526a-44ee-b0fc-07f1fe7e4c41', NULL, 2, NULL, 'Họp 1-1 đều đặn hơn.'),
  (1, 3, 'SELF', 12, '6b97a2e2-c26c-40bb-92cb-00dc849b9aae', 1, NULL, 4, NULL),
  (1, 3, 'SELF', 12, '6b97a2e2-c26c-40bb-92cb-00dc849b9aae', 2, NULL, 4, NULL),
  (1, 3, 'SELF', 12, '6b97a2e2-c26c-40bb-92cb-00dc849b9aae', 3, NULL, 4, NULL),
  (1, 3, 'SELF', 12, '6b97a2e2-c26c-40bb-92cb-00dc849b9aae', 4, NULL, 4, NULL),
  (1, 3, 'SELF', 12, '6b97a2e2-c26c-40bb-92cb-00dc849b9aae', 5, NULL, 4, NULL),
  (1, 3, 'PEER', 13, 'd6d11ee0-1f1e-4e45-80a4-65bdbd2769a0', 1, NULL, 4, NULL),
  (1, 3, 'PEER', 13, 'd6d11ee0-1f1e-4e45-80a4-65bdbd2769a0', 2, NULL, 4, NULL),
  (1, 3, 'PEER', 13, 'd6d11ee0-1f1e-4e45-80a4-65bdbd2769a0', 3, NULL, 4, NULL),
  (1, 3, 'PEER', 13, 'd6d11ee0-1f1e-4e45-80a4-65bdbd2769a0', 4, NULL, 4, NULL),
  (1, 3, 'PEER', 13, 'd6d11ee0-1f1e-4e45-80a4-65bdbd2769a0', 5, NULL, 4, NULL),
  (1, 3, 'PEER', 14, '36251868-b39f-4d52-9ef8-188396e46c8a', 1, NULL, 4, NULL),
  (1, 3, 'PEER', 14, '36251868-b39f-4d52-9ef8-188396e46c8a', 2, NULL, 4, NULL),
  (1, 3, 'PEER', 14, '36251868-b39f-4d52-9ef8-188396e46c8a', 3, NULL, 3, NULL),
  (1, 3, 'PEER', 14, '36251868-b39f-4d52-9ef8-188396e46c8a', 4, NULL, 4, NULL),
  (1, 3, 'PEER', 14, '36251868-b39f-4d52-9ef8-188396e46c8a', 5, NULL, 4, NULL),
  (1, 3, 'PEER', 15, 'ea8ff4cd-1fad-4265-8b9e-4693e979d051', 1, NULL, 4, NULL),
  (1, 3, 'PEER', 15, 'ea8ff4cd-1fad-4265-8b9e-4693e979d051', 2, NULL, 3, NULL),
  (1, 3, 'PEER', 15, 'ea8ff4cd-1fad-4265-8b9e-4693e979d051', 3, NULL, 4, NULL),
  (1, 3, 'PEER', 15, 'ea8ff4cd-1fad-4265-8b9e-4693e979d051', 4, NULL, 5, NULL),
  (1, 3, 'PEER', 15, 'ea8ff4cd-1fad-4265-8b9e-4693e979d051', 5, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', 1, NULL, 5, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', 2, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', 3, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', 4, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', 5, NULL, 5, NULL),
  (1, 3, 'DIRECT_REPORT', 16, '710e8b02-2ea8-4f22-afda-4e8e40e304ae', NULL, 1, NULL, 'Gỡ vướng mắc cho đội rất nhanh.'),
  (1, 3, 'DIRECT_REPORT', 17, '4e87eac6-ebc7-47d5-9c94-e0475b0aaa86', 1, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 17, '4e87eac6-ebc7-47d5-9c94-e0475b0aaa86', 2, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 17, '4e87eac6-ebc7-47d5-9c94-e0475b0aaa86', 3, NULL, 5, NULL),
  (1, 3, 'DIRECT_REPORT', 17, '4e87eac6-ebc7-47d5-9c94-e0475b0aaa86', 4, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 17, '4e87eac6-ebc7-47d5-9c94-e0475b0aaa86', 5, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', 1, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', 2, NULL, 3, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', 3, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', 4, NULL, 4, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', 5, NULL, 5, NULL),
  (1, 3, 'DIRECT_REPORT', 18, '3ccdf5cd-a27c-40d5-bd58-19cedf1045d9', NULL, 2, NULL, 'Giao việc kèm bối cảnh rõ hơn.');
SELECT close_review_campaign(1);
UPDATE review_campaigns SET status = 'PUBLISHED' WHERE id = 1;
UPDATE okr_cycles SET status = 'CLOSED' WHERE id = 1;
UPDATE objectives SET final_progress = progress WHERE cycle_id = 1;
INSERT INTO final_results (cycle_id, user_id, okr_progress, okr_score, review_score, final_score, grade, published_at) VALUES
  (1, 1, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 2, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 12, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 13, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 3, 0.6667, 3.67, 4.07, 3.83, 'GOOD', NOW()),
  (1, 4, 0.9125, 4.65, 4.23, 4.48, 'GOOD', NOW()),
  (1, 5, 1.0000, 5.00, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 10, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 6, 0.9183, 4.67, 3.90, 4.36, 'GOOD', NOW()),
  (1, 7, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 11, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 8, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW()),
  (1, 9, NULL, NULL, NULL, NULL, 'INSUFFICIENT_DATA', NOW());

-- ============ Chu kỳ Q4/2026 ============
INSERT INTO okr_cycles (id, name, start_date, end_date, planning_deadline, status, max_objectives_per_user, okr_weight, created_by) OVERRIDING SYSTEM VALUE VALUES
  (2, 'Q4/2026', '2026-10-01', '2026-12-31', '2026-10-14', 'ACTIVE', 5, 0.6, 2);
INSERT INTO objectives (id, cycle_id, level, title, description, owner_user_id, department_id, parent_id, progress, created_by) OVERRIDING SYSTEM VALUE VALUES
  (1, 2, 'COMPANY', 'Nâng cao chất lượng sản phẩm', 'Khách hàng gặp ít lỗi hơn và hài lòng hơn với sản phẩm.', 1, 1, NULL, 0.3407, 1),
  (2, 2, 'COMPANY', 'Tăng trưởng khách hàng doanh nghiệp', 'Mở rộng tệp khách hàng doanh nghiệp vừa và nhỏ.', 1, 1, NULL, 0.2458, 1),
  (3, 2, 'DEPARTMENT', 'Cải thiện quy trình kiểm thử', 'Bắt lỗi sớm hơn ngay trong quá trình phát triển.', 12, 3, 1, 0.4334, 12),
  (4, 2, 'TEAM', 'Ổn định module thanh toán', 'Team Thanh toán giảm lỗi production bằng cách phủ test cho các luồng chính.', 3, 6, 3, 0.3086, 3),
  (5, 2, 'TEAM', 'Rút ngắn thời gian chạy CI', NULL, 13, 7, 3, 0.4000, 13),
  (6, 2, 'DEPARTMENT', 'Rút ngắn chu kỳ kiểm thử hồi quy', NULL, 6, 4, 1, 0.2628, 6),
  (7, 2, 'DEPARTMENT', 'Mở rộng tệp khách hàng miền Nam', NULL, 8, 5, 2, 0.2250, 8),
  (8, 2, 'INDIVIDUAL', 'Viết test cho module thanh toán', 'Module thanh toán là nơi khách báo lỗi nhiều nhất quý trước.', 4, 6, 4, 0.1800, 4),
  (9, 2, 'INDIVIDUAL', 'Tối ưu hiệu năng API thanh toán', NULL, 5, 6, 4, 0.3600, 5),
  (10, 2, 'INDIVIDUAL', 'Tự động hóa bộ test hồi quy', NULL, 7, 4, 6, 0.1923, 7),
  (11, 2, 'INDIVIDUAL', 'Nâng cao năng lực kiểm thử của đội Dev', NULL, 3, 6, 4, 0.2500, 3),
  (12, 2, 'INDIVIDUAL', 'Tìm khách hàng mới tại TP.HCM', NULL, 9, 5, 7, 0.2000, 9),
  (13, 2, 'INDIVIDUAL', 'Triển khai OKR cho toàn công ty', NULL, 2, 2, NULL, 0.8000, 2),
  (14, 2, 'INDIVIDUAL', 'Học và áp dụng kiểm thử tích hợp', NULL, 10, 6, NULL, 0.1500, 10);
INSERT INTO key_results (id, objective_id, title, kr_type, start_value, target_value, unit, assignee_user_id, sort_order) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Giảm lỗi khách hàng báo', 'NUMBER', 50, 20, 'lỗi/tháng', 1, 1),
  (2, 1, 'Tăng điểm hài lòng khách hàng', 'NUMBER', 7, 8.5, 'điểm', 1, 2),
  (3, 2, 'Ký hợp đồng với khách hàng doanh nghiệp mới', 'NUMBER', 10, 25, 'khách hàng', 1, 3),
  (4, 3, 'Tăng độ phủ test', 'PERCENT', 40, 70, '%', 3, 4),
  (5, 3, 'Pull request được review trước khi merge', 'PERCENT', 60, 100, '%', 3, 5),
  (6, 6, 'Rút ngắn thời gian kiểm thử hồi quy', 'NUMBER', 5, 2, 'ngày', 6, 6),
  (7, 7, 'Thu thập khách hàng tiềm năng', 'NUMBER', 0, 120, 'khách hàng', 8, 7),
  (8, 8, 'Viết test case cho module thanh toán', 'NUMBER', 0, 50, 'test case', 4, 8),
  (9, 8, 'Thiết lập CI chạy test tự động mỗi lần push', 'BOOLEAN', 0, 1, NULL, 4, 9),
  (10, 9, 'Giảm thời gian phản hồi p95 của API', 'NUMBER', 800, 300, 'ms', 5, 10),
  (11, 10, 'Tự động hóa test case hồi quy', 'NUMBER', 20, 150, 'test case', 7, 11),
  (12, 11, 'Tổ chức buổi chia sẻ kiến thức kiểm thử', 'NUMBER', 0, 4, 'buổi', 3, 12),
  (13, 12, 'Gặp trực tiếp khách hàng tiềm năng', 'NUMBER', 0, 30, 'buổi gặp', 9, 13),
  (14, 13, 'Nhân viên có OKR cá nhân đã liên kết', 'PERCENT', 0, 80, '%', 2, 14),
  (15, 4, 'Giảm lỗi production của module thanh toán', 'NUMBER', 12, 3, 'lỗi/tháng', 3, 15),
  (16, 5, 'Giảm thời gian chạy pipeline CI', 'NUMBER', 25, 10, 'phút', 13, 16),
  (17, 14, 'Viết test tích hợp cho API đơn hàng', 'NUMBER', 0, 20, 'test', 10, 17);
INSERT INTO checkins (id, key_result_id, value, confidence, note, blocker, created_by, created_at) OVERRIDING SYSTEM VALUE VALUES
  (9, 8, 4, 'ON_TRACK', 'Viết xong test cho luồng tạo đơn.', NULL, 4, '2026-10-05T09:12:00+07'),
  (10, 17, 3, 'AT_RISK', 'Đang học cách dựng dữ liệu test.', NULL, 10, '2026-10-12T09:00:00+07'),
  (11, 8, 8, 'ON_TRACK', 'Thêm test cho hoàn tiền.', NULL, 4, '2026-10-12T09:05:00+07'),
  (12, 4, 46, 'ON_TRACK', NULL, NULL, 3, '2026-10-13T08:30:00+07'),
  (13, 10, 700, 'ON_TRACK', 'Thêm cache cho danh sách phương thức thanh toán.', NULL, 5, '2026-10-13T10:00:00+07'),
  (14, 12, 1, 'ON_TRACK', 'Buổi đầu về viết unit test.', NULL, 3, '2026-10-16T16:00:00+07'),
  (15, 8, 11, 'AT_RISK', 'Chậm hơn dự kiến.', 'Chưa có môi trường test cho cổng thanh toán.', 4, '2026-10-19T09:20:00+07'),
  (16, 9, 0, 'AT_RISK', 'Đang chờ cấp quyền runner CI.', 'Chờ đội hạ tầng cấp quyền.', 4, '2026-10-19T09:24:00+07'),
  (17, 6, 4, 'AT_RISK', NULL, 'Thiếu người viết test tự động.', 6, '2026-10-20T14:00:00+07'),
  (18, 13, 6, 'AT_RISK', NULL, NULL, 9, '2026-10-21T15:00:00+07'),
  (19, 7, 30, 'OFF_TRACK', 'Hội thảo tháng 10 bị hoãn.', 'Thiếu ngân sách marketing.', 8, '2026-10-22T11:00:00+07'),
  (20, 8, 18, 'ON_TRACK', 'Đã có môi trường test, tốc độ viết test tăng lại.', NULL, 4, '2026-10-26T09:02:00+07'),
  (21, 4, 52, 'ON_TRACK', 'Module thanh toán tăng độ phủ nhanh.', NULL, 3, '2026-10-27T08:30:00+07'),
  (22, 5, 85, 'ON_TRACK', 'Đã bật quy tắc bắt buộc review trên GitLab.', NULL, 3, '2026-10-27T08:35:00+07'),
  (23, 15, 8, 'ON_TRACK', 'Tháng 10 còn 8 lỗi production, giảm từ 12.', NULL, 3, '2026-10-27T08:40:00+07'),
  (24, 10, 620, 'ON_TRACK', 'Tối ưu truy vấn lịch sử giao dịch.', NULL, 5, '2026-10-27T10:00:00+07'),
  (25, 16, 19, 'AT_RISK', 'Đã bật cache dependency; bước test tích hợp vẫn chậm.', NULL, 13, '2026-10-27T11:00:00+07'),
  (26, 9, 0, 'AT_RISK', 'Pipeline CI đã chạy được, còn thiếu bộ test smoke.', 'Chờ team QA chốt danh sách test smoke để đưa vào CI, đã trễ 1 tuần.', 4, '2026-10-28T09:30:00+07'),
  (27, 13, 6, 'AT_RISK', 'Hai khách hàng muốn xem demo trước khi hẹn gặp tiếp.', 'Cần phòng Dev demo tính năng thanh toán định kỳ cho khách hàng trước khi chốt.', 9, '2026-10-28T15:00:00+07'),
  (28, 11, 45, 'ON_TRACK', 'Tuần này chưa viết thêm được test nào, đang trễ khoảng 2 tuần so với kế hoạch.', NULL, 7, '2026-10-28T16:00:00+07'),
  (29, 1, 38, 'ON_TRACK', 'Số lỗi tháng 10 giảm còn 38.', NULL, 1, '2026-10-28T17:00:00+07'),
  (30, 2, 7.4, 'AT_RISK', 'Khảo sát tháng 10 tăng chậm.', NULL, 1, '2026-10-28T17:05:00+07'),
  (31, 3, 14, 'ON_TRACK', NULL, NULL, 1, '2026-10-28T17:10:00+07'),
  (32, 14, 64, 'ON_TRACK', NULL, NULL, 2, '2026-10-29T09:00:00+07');
INSERT INTO checkin_comments (checkin_id, author_user_id, body, created_at) VALUES
  (15, 3, 'Anh đã nhờ đội hạ tầng dựng môi trường test, dự kiến xong thứ Năm.', '2026-10-19T11:30:00+07'),
  (20, 3, 'Tốt lắm, giữ nhịp này nhé.', '2026-10-26T14:00:00+07');
-- Đợt Đánh giá 360 – Q4/2026: tạo ở DRAFT rồi đi tiến từng bước như vòng đời thật
INSERT INTO review_campaigns (id, cycle_id, template_id, name, nomination_deadline, submit_deadline, created_by) OVERRIDING SYSTEM VALUE VALUES
  (2, 2, 1, 'Đánh giá 360 – Q4/2026', '2026-10-24', '2026-11-06', 2);
INSERT INTO campaign_participants (campaign_id, reviewee_user_id, manager_user_id, department_id, snapshot_at) VALUES
  (2, 4, 3, 6, NOW()),
  (2, 5, 3, 6, NOW()),
  (2, 7, 6, 4, NOW()),
  (2, 3, 12, 6, NOW()),
  (2, 10, 3, 6, NOW()),
  (2, 9, 8, 5, NOW()),
  (2, 2, NULL, 2, NOW()),
  (2, 6, NULL, 4, NOW());
UPDATE review_campaigns SET status = 'NOMINATION' WHERE id = 2;
INSERT INTO nominations (id, campaign_id, reviewee_user_id) OVERRIDING SYSTEM VALUE VALUES (1, 2, 4);
INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by) VALUES (1, 5, 4), (1, 10, 4), (1, 7, 4);
UPDATE nominations SET status = 'APPROVED', submitted_at = NOW(), approved_by = 3, approved_at = NOW() WHERE id = 1;
INSERT INTO nominations (id, campaign_id, reviewee_user_id) OVERRIDING SYSTEM VALUE VALUES (2, 2, 5);
INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by) VALUES (2, 4, 5), (2, 10, 5), (2, 9, 5);
UPDATE nominations SET status = 'PENDING', submitted_at = NOW() WHERE id = 2;
INSERT INTO nominations (id, campaign_id, reviewee_user_id) OVERRIDING SYSTEM VALUE VALUES (3, 2, 10);
INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by) VALUES (3, 4, 10), (3, 5, 10), (3, 11, 10);
UPDATE nominations SET status = 'PENDING', submitted_at = NOW() WHERE id = 3;
INSERT INTO nominations (id, campaign_id, reviewee_user_id) OVERRIDING SYSTEM VALUE VALUES (4, 2, 7);
INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by) VALUES (4, 11, 7), (4, 4, 7), (4, 5, 7);
UPDATE nominations SET status = 'APPROVED', submitted_at = NOW(), approved_by = 6, approved_at = NOW() WHERE id = 4;
UPDATE review_campaigns SET status = 'COLLECTING' WHERE id = 2;
INSERT INTO review_assignments (id, campaign_id, reviewee_user_id, reviewer_user_id, reviewer_group, status, submitted_at) OVERRIDING SYSTEM VALUE VALUES
  (19, 2, 4, 4, 'SELF', 'DRAFT', NULL),
  (20, 2, 5, 4, 'PEER', 'NOT_STARTED', NULL),
  (21, 2, 7, 4, 'PEER', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (22, 2, 3, 4, 'DIRECT_REPORT', 'NOT_STARTED', NULL),
  (23, 2, 4, 3, 'MANAGER', 'NOT_STARTED', NULL),
  (24, 2, 5, 3, 'MANAGER', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (25, 2, 10, 3, 'MANAGER', 'NOT_STARTED', NULL),
  (26, 2, 3, 3, 'SELF', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (27, 2, 7, 6, 'MANAGER', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (28, 2, 9, 8, 'MANAGER', 'NOT_STARTED', NULL),
  (29, 2, 4, 5, 'PEER', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (30, 2, 4, 10, 'PEER', 'NOT_STARTED', NULL),
  (31, 2, 2, 2, 'SELF', 'NOT_STARTED', NULL),
  (32, 2, 6, 7, 'DIRECT_REPORT', 'SUBMITTED', '2026-11-06T08:00:00+07'),
  (33, 2, 6, 11, 'DIRECT_REPORT', 'NOT_STARTED', NULL);
INSERT INTO review_answers (campaign_id, reviewee_user_id, reviewer_group, assignment_id, response_key, criterion_id, question_id, score, answer_text) VALUES
  (2, 4, 'SELF', 19, '5b4e319c-7fa4-4f66-9ffd-952f6d885ce0', 1, NULL, 4, NULL),
  (2, 4, 'SELF', 19, '5b4e319c-7fa4-4f66-9ffd-952f6d885ce0', 2, NULL, 3, NULL),
  (2, 4, 'SELF', 19, '5b4e319c-7fa4-4f66-9ffd-952f6d885ce0', NULL, 1, NULL, 'Giữ nhịp viết test đều mỗi tuần.'),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', 1, NULL, 4, NULL),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', 2, NULL, 4, NULL),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', 3, NULL, 4, NULL),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', 4, NULL, 5, NULL),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', 5, NULL, 4, NULL),
  (2, 7, 'PEER', 21, '1c6f2c78-2c3a-4a9d-a3d7-3463bee02a71', NULL, 1, NULL, 'Báo lỗi rất chi tiết.'),
  (2, 5, 'MANAGER', 24, 'fa3767ce-4187-439f-9c9d-a469da82294a', 1, NULL, 4, NULL),
  (2, 5, 'MANAGER', 24, 'fa3767ce-4187-439f-9c9d-a469da82294a', 2, NULL, 4, NULL),
  (2, 5, 'MANAGER', 24, 'fa3767ce-4187-439f-9c9d-a469da82294a', 3, NULL, 4, NULL),
  (2, 5, 'MANAGER', 24, 'fa3767ce-4187-439f-9c9d-a469da82294a', 4, NULL, 4, NULL),
  (2, 5, 'MANAGER', 24, 'fa3767ce-4187-439f-9c9d-a469da82294a', 5, NULL, 4, NULL),
  (2, 3, 'SELF', 26, '1d58b2fc-68df-45e5-a748-e6005727544c', 1, NULL, 4, NULL),
  (2, 3, 'SELF', 26, '1d58b2fc-68df-45e5-a748-e6005727544c', 2, NULL, 4, NULL),
  (2, 3, 'SELF', 26, '1d58b2fc-68df-45e5-a748-e6005727544c', 3, NULL, 4, NULL),
  (2, 3, 'SELF', 26, '1d58b2fc-68df-45e5-a748-e6005727544c', 4, NULL, 4, NULL),
  (2, 3, 'SELF', 26, '1d58b2fc-68df-45e5-a748-e6005727544c', 5, NULL, 4, NULL),
  (2, 7, 'MANAGER', 27, 'ba0c9f18-d728-4ba0-93a0-af44f2d14522', 1, NULL, 4, NULL),
  (2, 7, 'MANAGER', 27, 'ba0c9f18-d728-4ba0-93a0-af44f2d14522', 2, NULL, 4, NULL),
  (2, 7, 'MANAGER', 27, 'ba0c9f18-d728-4ba0-93a0-af44f2d14522', 3, NULL, 4, NULL),
  (2, 7, 'MANAGER', 27, 'ba0c9f18-d728-4ba0-93a0-af44f2d14522', 4, NULL, 4, NULL),
  (2, 7, 'MANAGER', 27, 'ba0c9f18-d728-4ba0-93a0-af44f2d14522', 5, NULL, 4, NULL),
  (2, 4, 'PEER', 29, 'cba45bc4-d2d0-473a-850b-194c1f1ede9f', 1, NULL, 5, NULL),
  (2, 4, 'PEER', 29, 'cba45bc4-d2d0-473a-850b-194c1f1ede9f', 2, NULL, 4, NULL),
  (2, 4, 'PEER', 29, 'cba45bc4-d2d0-473a-850b-194c1f1ede9f', 3, NULL, 4, NULL),
  (2, 4, 'PEER', 29, 'cba45bc4-d2d0-473a-850b-194c1f1ede9f', 4, NULL, 5, NULL),
  (2, 4, 'PEER', 29, 'cba45bc4-d2d0-473a-850b-194c1f1ede9f', 5, NULL, 4, NULL),
  (2, 6, 'DIRECT_REPORT', 32, '3968c31f-6540-4432-be36-95b488a309b1', 1, NULL, 5, NULL),
  (2, 6, 'DIRECT_REPORT', 32, '3968c31f-6540-4432-be36-95b488a309b1', 2, NULL, 4, NULL),
  (2, 6, 'DIRECT_REPORT', 32, '3968c31f-6540-4432-be36-95b488a309b1', 3, NULL, 4, NULL),
  (2, 6, 'DIRECT_REPORT', 32, '3968c31f-6540-4432-be36-95b488a309b1', 4, NULL, 4, NULL),
  (2, 6, 'DIRECT_REPORT', 32, '3968c31f-6540-4432-be36-95b488a309b1', 5, NULL, 4, NULL);

-- Sự kiện: lấy thời điểm của đối tượng gốc, đánh dấu đã xử lý
UPDATE domain_events e SET created_at = c.created_at FROM checkins c WHERE e.event_type = 'CHECKIN_CREATED' AND e.entity_id = c.id;
UPDATE domain_events e SET created_at = o.created_at FROM objectives o WHERE e.event_type = 'OBJECTIVE_CREATED' AND e.entity_id = o.id;
UPDATE domain_events SET processed_at = created_at;
-- Lịch sử chạy (không có nội dung gửi cho AI)
INSERT INTO automation_runs (id, flow, event_id, run_key, status, attempt_count, started_at, finished_at, input_tokens, output_tokens, error_message, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 'ONE_ON_ONE_DRAFT', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CAMPAIGN_CLOSED' AND entity_id = 1), 'campaign:1:reviewee:4', 'SUCCEEDED', 1, '2026-09-30T18:10:00+07', ('2026-09-30T18:10:00+07'::timestamptz + INTERVAL '4210 milliseconds'), 980, 210, NULL, '2026-09-30T18:10:00+07'),
  (2, 'ONE_ON_ONE_DRAFT', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CAMPAIGN_CLOSED' AND entity_id = 1), 'campaign:1:reviewee:6', 'SUCCEEDED', 1, '2026-09-30T18:10:00+07', ('2026-09-30T18:10:00+07'::timestamptz + INTERVAL '3550 milliseconds'), 610, 150, NULL, '2026-09-30T18:10:00+07'),
  (3, 'ONE_ON_ONE_DRAFT', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CAMPAIGN_CLOSED' AND entity_id = 1), 'campaign:1:reviewee:3', 'SUCCEEDED', 2, '2026-09-30T18:11:00+07', ('2026-09-30T18:11:00+07'::timestamptz + INTERVAL '3920 milliseconds'), 540, 120, NULL, '2026-09-30T18:11:00+07'),
  (4, 'OKR_REVIEW', (SELECT MIN(id) FROM domain_events WHERE event_type = 'OBJECTIVE_CREATED' AND entity_id = 11), 'objective:11', 'SUCCEEDED', 1, '2026-10-05T10:02:00+07', ('2026-10-05T10:02:00+07'::timestamptz + INTERVAL '2100 milliseconds'), 450, 90, NULL, '2026-10-05T10:02:00+07'),
  (5, 'OKR_REVIEW', (SELECT MIN(id) FROM domain_events WHERE event_type = 'OBJECTIVE_CREATED' AND entity_id = 14), 'objective:14', 'SUCCEEDED', 1, '2026-10-06T14:20:00+07', ('2026-10-06T14:20:00+07'::timestamptz + INTERVAL '1980 milliseconds'), 430, 85, NULL, '2026-10-06T14:20:00+07'),
  (6, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 15), 'checkin:15', 'SUCCEEDED', 1, '2026-10-19T09:21:00+07', ('2026-10-19T09:21:00+07'::timestamptz + INTERVAL '1650 milliseconds'), 380, 70, NULL, '2026-10-19T09:21:00+07'),
  (7, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 16), 'checkin:16', 'SUCCEEDED', 1, '2026-10-19T09:25:00+07', ('2026-10-19T09:25:00+07'::timestamptz + INTERVAL '1710 milliseconds'), 375, 72, NULL, '2026-10-19T09:25:00+07'),
  (8, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 17), 'checkin:17', 'SUCCEEDED', 1, '2026-10-20T14:01:00+07', ('2026-10-20T14:01:00+07'::timestamptz + INTERVAL '1590 milliseconds'), 360, 66, NULL, '2026-10-20T14:01:00+07'),
  (9, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 19), 'checkin:19', 'SUCCEEDED', 1, '2026-10-22T11:01:00+07', ('2026-10-22T11:01:00+07'::timestamptz + INTERVAL '1880 milliseconds'), 395, 74, NULL, '2026-10-22T11:01:00+07'),
  (10, 'WEEKLY_DIGEST', NULL, 'user:3:week:2026-10-26', 'SUCCEEDED', 1, '2026-10-26T08:00:00+07', ('2026-10-26T08:00:00+07'::timestamptz + INTERVAL '5120 milliseconds'), 1240, 260, NULL, '2026-10-26T08:00:00+07'),
  (11, 'WEEKLY_DIGEST', NULL, 'user:6:week:2026-10-26', 'SUCCEEDED', 1, '2026-10-26T08:00:00+07', ('2026-10-26T08:00:00+07'::timestamptz + INTERVAL '140 milliseconds'), NULL, NULL, NULL, '2026-10-26T08:00:00+07'),
  (12, 'WEEKLY_DIGEST', NULL, 'user:8:week:2026-10-26', 'FAILED', 4, '2026-10-26T08:00:00+07', ('2026-10-26T08:00:00+07'::timestamptz + INTERVAL '30000 milliseconds'), NULL, NULL, 'Dịch vụ AI quá thời gian chờ (30 giây) sau 4 lần thử.', '2026-10-26T08:00:00+07'),
  (13, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 26), 'checkin:26', 'SUCCEEDED', 1, '2026-10-28T09:31:00+07', ('2026-10-28T09:31:00+07'::timestamptz + INTERVAL '1820 milliseconds'), 412, 96, NULL, '2026-10-28T09:31:00+07'),
  (14, 'CHECKIN_MISMATCH', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 26), 'checkin:26', 'SUCCEEDED', 1, '2026-10-28T09:31:00+07', ('2026-10-28T09:31:00+07'::timestamptz + INTERVAL '1430 milliseconds'), 300, 40, NULL, '2026-10-28T09:31:00+07'),
  (15, 'BLOCKER_ROUTING', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 27), 'checkin:27', 'SUCCEEDED', 1, '2026-10-28T15:01:00+07', ('2026-10-28T15:01:00+07'::timestamptz + INTERVAL '1760 milliseconds'), 405, 92, NULL, '2026-10-28T15:01:00+07'),
  (16, 'CHECKIN_MISMATCH', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 28), 'checkin:28', 'SUCCEEDED', 1, '2026-10-28T16:01:00+07', ('2026-10-28T16:01:00+07'::timestamptz + INTERVAL '1390 milliseconds'), 310, 44, NULL, '2026-10-28T16:01:00+07'),
  (17, 'CHECKIN_MISMATCH', (SELECT MIN(id) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND entity_id = 32), 'checkin:32', 'SKIPPED', 0, NULL, ('2026-10-29T09:00:00+07'::timestamptz + INTERVAL '0 milliseconds'), NULL, NULL, 'Bỏ qua: Check-in không có ghi chú', '2026-10-29T09:00:00+07');
INSERT INTO automation_daily_usage (flow, usage_date, call_count) VALUES
  ('REVIEW_COMMENT_GUARD', '2026-10-30', 7),
  ('CHECKIN_MISMATCH', '2026-10-30', 0);

-- Nhãn AI trên check-in; vướng mắc đã xử lý được cập nhật sau, đúng như luồng thật
INSERT INTO checkin_insights (checkin_id, blocker_run_id, blocker_category, severity, target_department_id, mismatch_run_id, is_mismatch, routing, created_at) VALUES
  (15, 6, 'TECHNICAL', 'MEDIUM', NULL, NULL, NULL, NULL, '2026-10-19T09:20:00+07'),
  (16, 7, 'DEPENDENCY', 'MEDIUM', NULL, NULL, NULL, NULL, '2026-10-19T09:24:00+07'),
  (17, 8, 'RESOURCE', 'MEDIUM', NULL, NULL, NULL, NULL, '2026-10-20T14:00:00+07'),
  (19, 9, 'RESOURCE', 'HIGH', NULL, NULL, NULL, NULL, '2026-10-22T11:00:00+07'),
  (26, 13, 'DEPENDENCY', 'HIGH', 4, 14, false, 'OPEN', '2026-10-28T09:30:00+07'),
  (27, 15, 'DEPENDENCY', 'HIGH', 6, NULL, NULL, 'OPEN', '2026-10-28T15:00:00+07'),
  (28, NULL, NULL, NULL, NULL, 16, true, NULL, '2026-10-28T16:00:00+07');
UPDATE checkin_insights SET routing = 'ACKNOWLEDGED', handled_by = 3, handled_at = '2026-10-29T10:15:00+07', handler_note = 'Tú sẽ demo cho khách vào thứ Ba tuần sau.' WHERE checkin_id = 27;

-- Ghi chú rà soát OKR
INSERT INTO objective_review_notes (id, objective_id, key_result_id, run_id, issue, message, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 11, 12, 4, 'OUTPUT_ONLY', 'KR đếm số buổi chia sẻ, chưa đo kết quả. Có thể thêm KR như "Số thành viên tự viết được unit test tăng từ 1 lên 3".', '2026-10-05T10:02:00+07'),
  (2, 14, NULL, 5, 'NOT_ALIGNED', 'Objective chưa liên kết lên mục tiêu cấp trên. Có thể gắn vào "Ổn định module thanh toán" của Team Thanh toán.', '2026-10-06T14:20:00+07');

-- Bản tin tuần
INSERT INTO weekly_digests (id, manager_user_id, week_start, run_id, stats, highlights, read_at, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 3, '2026-10-26', 10, '{"from":"2026-10-19","to":"2026-10-25","member_count":3,"checked_in_count":1,"not_checked_in_user_ids":[5,10],"at_risk_key_result_ids":[8,9],"off_track_key_result_ids":[]}'::jsonb, '[{"text":"Lan có 2 KR cùng chờ đội hạ tầng: môi trường test cổng thanh toán và quyền runner CI. Trao đổi một lần với đội hạ tầng có thể gỡ được cả hai.","key_result_id":8},{"text":"An chưa check-in từ 12/10; lần gần nhất ghi đang học cách dựng dữ liệu test, có thể cần người kèm.","key_result_id":17},{"text":"Tú không check-in tuần này, nhưng lần cập nhật trước KR giảm thời gian phản hồi API vẫn đúng hướng.","key_result_id":10}]'::jsonb, '2026-10-26T08:00:00+07', '2026-10-26T08:00:00+07'),
  (2, 6, '2026-10-26', 11, '{"from":"2026-10-19","to":"2026-10-25","member_count":2,"checked_in_count":0,"not_checked_in_user_ids":[7,11],"at_risk_key_result_ids":[],"off_track_key_result_ids":[]}'::jsonb, '[]'::jsonb, NULL, '2026-10-26T08:00:00+07');

-- Bản nháp 1-1: tạo ở trạng thái chờ duyệt, bản đã gửi được cập nhật sau (sau khi đợt đã công bố)
INSERT INTO one_on_one_drafts (id, campaign_id, reviewee_user_id, reviewer_user_id, run_id, ai_strengths, ai_improvements, created_at) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 4, 3, 1, '["Chất lượng code ổn định, ít phải làm lại","Sẵn lòng review code và hướng dẫn đồng nghiệp","Phản hồi lỗi nhanh khi QA báo"]'::jsonb, '["Chủ động chia sẻ nhiều hơn trong họp đội","Mô tả pull request và tài liệu kỹ hơn để QA kiểm thử nhanh hơn","Báo trước cho các bên liên quan khi thay đổi luồng nghiệp vụ"]'::jsonb, '2026-09-30T18:10:00+07'),
  (2, 1, 6, NULL, 2, '["Phối hợp release tốt với các phòng","Bảo vệ và hỗ trợ đội khi khối lượng việc lớn"]'::jsonb, '["Duy trì lịch họp 1-1 đều đặn với thành viên trong đội"]'::jsonb, '2026-09-30T18:10:00+07'),
  (3, 1, 3, NULL, 3, '["Gỡ vướng mắc cho đội nhanh"]'::jsonb, '["Giao việc kèm bối cảnh rõ hơn"]'::jsonb, '2026-09-30T18:11:00+07');
UPDATE one_on_one_drafts SET status = 'SENT', edited_text = 'Quý này em làm tốt nhất ở chất lượng code và việc hỗ trợ đồng đội; QA cũng ghi nhận em sửa lỗi rất nhanh. Quý tới anh muốn em tập trung hai việc: viết mô tả pull request đầy đủ hơn để QA đỡ phải hỏi lại, và báo sớm cho QA khi đổi luồng thanh toán. Mình sẽ nói kỹ trong buổi 1-1 thứ Năm.', sent_by = 3, sent_at = '2026-10-06T10:00:00+07' WHERE id = 1;

-- Thông báo
INSERT INTO notifications (user_id, type, body, link, dedupe_key, read_at, created_at) VALUES
  (4, 'REVIEW_REMINDER', 'Bạn có 3 phiếu đánh giá 360 cần điền trước 06/11.', '#/reviews/todo', 'demo:nt1', NULL, '2026-10-28T08:00:00+07'),
  (4, 'CHECKIN_COMMENT', 'Anh Trần Hoài Nam đã bình luận vào check-in của bạn.', '#/okr/o6', 'demo:nt2', NULL, '2026-10-26T14:00:00+07'),
  (4, 'RESULT_PUBLISHED', 'Kết quả đánh giá 360 Q3/2026 đã được công bố.', '#/reviews/results', 'demo:nt3', '2026-10-05T09:00:00+07', '2026-10-05T09:00:00+07'),
  (3, 'NOMINATION_PENDING', 'Bạn có 2 danh sách đề cử chờ duyệt.', '#/reviews/approvals', 'demo:nt4', NULL, '2026-10-24T09:00:00+07'),
  (3, 'CHECKIN_REMINDER', 'Đỗ Minh An chưa check-in 18 ngày.', '#/dashboard', 'demo:nt5', NULL, '2026-10-30T09:00:00+07'),
  (2, 'REVIEW_REMINDER', 'Đợt Đánh giá 360 – Q4/2026 đang có 41% phiếu đã nộp.', '#/admin/campaigns/cp-q4', 'demo:nt6', NULL, '2026-10-30T08:00:00+07'),
  (6, 'REVIEW_REMINDER', 'Bạn có 1 phiếu đánh giá 360 đã nộp, không còn phiếu nào cần điền.', '#/reviews/todo', 'demo:nt7', '2026-10-29T08:00:00+07', '2026-10-29T08:00:00+07'),
  (6, 'BLOCKER_ROUTED', 'Phòng Dev đang chờ Phòng QA: Nguyễn Thị Lan cần danh sách test smoke để đưa vào CI.', '#/ai/blockers', 'demo:nt8', NULL, '2026-10-28T09:32:00+07'),
  (3, 'WEEKLY_DIGEST', 'Bản tin tuần 19/10–25/10 của đội bạn đã sẵn sàng.', '#/ai/digest', 'demo:nt9', '2026-10-26T08:01:00+07', '2026-10-26T08:01:00+07'),
  (7, 'CHECKIN_MISMATCH', 'Check-in ngày 28/10 của bạn chọn "Đúng hướng" nhưng ghi chú cho biết đang trễ. Bạn xem lại nhé.', '#/okr/o8', 'demo:nt10', NULL, '2026-10-28T16:01:00+07'),
  (2, 'AI_DRAFT_READY', 'Có 2 bản nháp tóm tắt 1-1 đang chờ bạn duyệt.', '#/ai/drafts', 'demo:nt11', NULL, '2026-09-30T18:12:00+07'),
  (9, 'BLOCKER_UPDATED', 'Team Thanh toán đã nhận xử lý vướng mắc của bạn: "Tú sẽ demo cho khách vào thứ Ba tuần sau."', '#/okr/o10', 'demo:nt12', NULL, '2026-10-29T10:15:00+07'),
  (4, 'ONE_ON_ONE_SENT', 'Anh Trần Hoài Nam đã gửi tóm tắt nhận xét 360 Q3/2026 cho bạn.', '#/reviews/results', 'demo:nt13', '2026-10-06T10:00:00+07', '2026-10-06T10:00:00+07'),
  (1, 'AUTOMATION_ALERT', 'Luồng "Bản tin tuần" lỗi 1 lần ngày 26/10 (dịch vụ AI quá thời gian chờ).', '#/ai/automation', 'demo:nt14', NULL, '2026-10-26T08:46:00+07');

-- Nhật ký hoạt động
INSERT INTO audit_logs (actor_user_id, action, module, summary, created_at) VALUES
  (4, 'CHECKIN', 'OKR', 'Check-in: KR "Viết test case cho module thanh toán" → 18', '2026-10-26T09:02:00+07'),
  (3, 'CREATE', 'OKR', 'Bình luận check-in: Check-in của Nguyễn Thị Lan', '2026-10-26T14:00:00+07'),
  (2, 'STATUS_CHANGE', 'Đánh giá 360', 'Mở thu phiếu: Đánh giá 360 – Q4/2026', '2026-10-25T08:00:00+07'),
  (4, 'SUBMIT', 'Đánh giá 360', 'Nộp phiếu: Một phiếu trong đợt Đánh giá 360 – Q4/2026', '2026-10-27T15:20:00+07'),
  (1, 'UPDATE', 'Tổ chức', 'Cập nhật người dùng: Đỗ Minh An: gán quản lý trực tiếp', '2026-10-02T10:00:00+07'),
  (2, 'UPDATE', 'Tổ chức', 'Cập nhật phòng ban: Phòng Dev: tách Team Thanh toán và Team Nền tảng', '2026-10-01T09:00:00+07'),
  (2, 'STATUS_CHANGE', 'Chu kỳ', 'Kích hoạt chu kỳ: Q4/2026', '2026-10-01T08:00:00+07'),
  (2, 'STATUS_CHANGE', 'Chu kỳ', 'Đóng chu kỳ: Q3/2026', '2026-09-30T18:00:00+07'),
  (4, 'LOGIN', 'Xác thực', 'Đăng nhập', '2026-10-30T08:55:00+07'),
  (1, 'UPDATE', 'Tự động hóa', 'Cập nhật luồng tự động: Bản tin tuần: hạn mức 30 → 50 lần/ngày', '2026-10-20T09:00:00+07'),
  (3, 'PUBLISH', 'Tự động hóa', 'Gửi tóm tắt 1-1: Tóm tắt nhận xét 360 Q3/2026 cho Nguyễn Thị Lan', '2026-10-06T10:00:00+07'),
  (3, 'UPDATE', 'Tự động hóa', 'Nhận xử lý vướng mắc: Vướng mắc của Lý Hoàng Quân', '2026-10-29T10:15:00+07');

-- Đặt lại bộ đếm id
SELECT setval(pg_get_serial_sequence('departments', 'id'), (SELECT MAX(id) FROM departments));
SELECT setval(pg_get_serial_sequence('app_users', 'id'), (SELECT MAX(id) FROM app_users));
SELECT setval(pg_get_serial_sequence('okr_cycles', 'id'), (SELECT MAX(id) FROM okr_cycles));
SELECT setval(pg_get_serial_sequence('objectives', 'id'), (SELECT MAX(id) FROM objectives));
SELECT setval(pg_get_serial_sequence('key_results', 'id'), (SELECT MAX(id) FROM key_results));
SELECT setval(pg_get_serial_sequence('checkins', 'id'), (SELECT MAX(id) FROM checkins));
SELECT setval(pg_get_serial_sequence('review_templates', 'id'), (SELECT MAX(id) FROM review_templates));
SELECT setval(pg_get_serial_sequence('review_criteria', 'id'), (SELECT MAX(id) FROM review_criteria));
SELECT setval(pg_get_serial_sequence('review_questions', 'id'), (SELECT MAX(id) FROM review_questions));
SELECT setval(pg_get_serial_sequence('review_campaigns', 'id'), (SELECT MAX(id) FROM review_campaigns));
SELECT setval(pg_get_serial_sequence('nominations', 'id'), (SELECT MAX(id) FROM nominations));
SELECT setval(pg_get_serial_sequence('review_assignments', 'id'), (SELECT MAX(id) FROM review_assignments));
SELECT setval(pg_get_serial_sequence('automation_runs', 'id'), (SELECT MAX(id) FROM automation_runs));
SELECT setval(pg_get_serial_sequence('objective_review_notes', 'id'), (SELECT MAX(id) FROM objective_review_notes));
SELECT setval(pg_get_serial_sequence('weekly_digests', 'id'), (SELECT MAX(id) FROM weekly_digests));
SELECT setval(pg_get_serial_sequence('one_on_one_drafts', 'id'), (SELECT MAX(id) FROM one_on_one_drafts));

COMMIT;

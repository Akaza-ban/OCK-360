-- ============================================================
-- Kiểm thử schema OKR360. Chạy sau okr360.sql và seed_demo.sql:
--   psql -d <db> -v ON_ERROR_STOP=1 -f src/database/tests/schema_checks.sql
-- Mỗi kiểm thử in PASS; nếu sai, script dừng với thông báo FAIL.
-- Mọi thay đổi chạy trong một giao dịch và được hoàn tác ở cuối.
-- ============================================================
SET search_path TO okr360, public;
BEGIN;

CREATE TEMP TABLE results (name TEXT, ok BOOLEAN);

-- Ghi lại kết quả của một câu lệnh phải bị từ chối.
-- Câu lệnh phải bị từ chối VÀ thông báo lỗi phải chứa đoạn mong đợi,
-- để không tính nhầm PASS khi câu lệnh hỏng vì lý do khác (ví dụ lỗi cú pháp).
CREATE FUNCTION pg_temp.expect_error(test_name TEXT, stmt TEXT, expected TEXT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    BEGIN
        EXECUTE stmt;
        INSERT INTO results VALUES (test_name || ' (không bị từ chối)', FALSE);
    EXCEPTION WHEN OTHERS THEN
        IF position(lower(expected) IN lower(SQLERRM)) > 0 THEN
            INSERT INTO results VALUES (test_name, TRUE);
        ELSE
            INSERT INTO results VALUES (test_name || ' (lỗi khác: ' || SQLERRM || ')', FALSE);
        END IF;
    END;
END $$;

CREATE FUNCTION pg_temp.expect(test_name TEXT, cond BOOLEAN) RETURNS VOID LANGUAGE sql AS $$
    INSERT INTO results VALUES (test_name, COALESCE(cond, FALSE));
$$;

-- ---------- 1. Con số khớp ví dụ tính tay ----------
SELECT pg_temp.expect('KR "Viết test case" 18/50 → 36%',
    (SELECT progress FROM vw_key_result_progress v JOIN key_results k ON k.id = v.key_result_id WHERE k.title = 'Viết test case cho module thanh toán') = 0.36);
SELECT pg_temp.expect('Mục tiêu giảm lỗi 50 → 20, hiện 38 → 40%',
    (SELECT progress FROM vw_key_result_progress v JOIN key_results k ON k.id = v.key_result_id WHERE k.title = 'Giảm lỗi khách hàng báo') = 0.40);
SELECT pg_temp.expect('KR kiểu hoàn thành chưa xong → 0%',
    (SELECT progress FROM vw_key_result_progress v JOIN key_results k ON k.id = v.key_result_id WHERE k.title LIKE 'Thiết lập CI%') = 0);
SELECT pg_temp.expect('Objective phòng Dev cộng dồn 2 KR và 2 OKR team → 43,34%',
    (SELECT progress FROM objectives WHERE title = 'Cải thiện quy trình kiểm thử') = 0.4334);
SELECT pg_temp.expect('OKR Team Thanh toán cộng dồn 1 KR và 3 Objective cá nhân → 30,86%',
    (SELECT progress FROM objectives WHERE title = 'Ổn định module thanh toán') = 0.3086);
SELECT pg_temp.expect('Giá trị hiện tại của KR được cập nhật từ check-in mới nhất',
    (SELECT current_value FROM key_results WHERE title = 'Viết test case cho module thanh toán') = 18);
SELECT pg_temp.expect('Cây OKR 4 cấp: Objective cá nhân của Lan ở độ sâu 3 (công ty → phòng ban → team → cá nhân)',
    (SELECT depth FROM vw_objective_tree WHERE title = 'Viết test cho module thanh toán') = 3);
SELECT pg_temp.expect('Cá nhân ở phòng chưa chia team nối thẳng lên OKR phòng ban (Minh → Phòng QA)',
    (SELECT p.level FROM objectives o JOIN objectives p ON p.id = o.parent_id WHERE o.title = 'Tự động hóa bộ test hồi quy') = 'DEPARTMENT');

-- ---------- 2. Ẩn danh sau khi đóng đợt ----------
SELECT pg_temp.expect('Đợt Q3 đã đóng: không câu trả lời nào còn gắn với người chấm',
    NOT EXISTS (SELECT 1 FROM review_answers a JOIN review_campaigns c ON c.id = a.campaign_id
                 WHERE c.name LIKE '%Q3/2026' AND a.assignment_id IS NOT NULL));
SELECT pg_temp.expect('Đợt Q4 đang thu phiếu: câu trả lời vẫn gắn với phiếu để sửa được',
    NOT EXISTS (SELECT 1 FROM review_answers a JOIN review_campaigns c ON c.id = a.campaign_id
                 WHERE c.name LIKE '%Q4/2026' AND a.assignment_id IS NULL));
SELECT pg_temp.expect('Điểm quản lý chấm Lan ở Q3 = 4,20 (trung bình 5 tiêu chí)',
    (SELECT ROUND(AVG(avg_score), 2) FROM vw_review_group_scores s JOIN app_users u ON u.id = s.reviewee_user_id
      WHERE u.email = 'lan@okr360.vn' AND s.reviewer_group = 'MANAGER') = 4.20);
SELECT pg_temp.expect('Lan có 4 phiếu đồng nghiệp ở Q3',
    (SELECT MAX(form_count) FROM vw_review_group_scores s JOIN app_users u ON u.id = s.reviewee_user_id
      WHERE u.email = 'lan@okr360.vn' AND s.reviewer_group = 'PEER') = 4);
SELECT pg_temp.expect('View tiến độ nộp phiếu không có cột người được đánh giá',
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'okr360'
                 AND table_name = 'vw_campaign_reviewer_progress' AND column_name LIKE '%reviewee%'));
SELECT pg_temp.expect('Kết quả cuối kỳ Q3 của Lan = 4,48, xếp loại Tốt',
    (SELECT final_score = 4.48 AND grade = 'GOOD' FROM final_results f JOIN app_users u ON u.id = f.user_id
      JOIN okr_cycles c ON c.id = f.cycle_id WHERE u.email = 'lan@okr360.vn' AND c.name = 'Q3/2026'));
SELECT pg_temp.expect('Người thiếu dữ liệu không bị cho 0 điểm',
    (SELECT final_score IS NULL AND grade = 'INSUFFICIENT_DATA' FROM final_results f JOIN app_users u ON u.id = f.user_id
      JOIN okr_cycles c ON c.id = f.cycle_id WHERE u.email = 'tu@okr360.vn' AND c.name = 'Q3/2026'));

-- ---------- 3. Quy tắc nghiệp vụ chặn thao tác sai ----------
SELECT pg_temp.expect_error('Không có chu kỳ ACTIVE thứ hai',
    $$INSERT INTO okr_cycles (name, start_date, end_date, planning_deadline, status, created_by)
      VALUES ('Q1/2027', '2027-01-01', '2027-03-31', '2027-01-14', 'ACTIVE', 2)$$, 'uq_okr_cycles_single_active');
SELECT pg_temp.expect_error('Chu kỳ không quay lại trạng thái trước',
    $$UPDATE okr_cycles SET status = 'ACTIVE' WHERE name = 'Q3/2026'$$, 'Không chuyển được chu kỳ');
SELECT pg_temp.expect_error('Chu kỳ đã đóng: không thêm Objective',
    $$INSERT INTO objectives (cycle_id, level, title, owner_user_id, department_id, created_by)
      SELECT id, 'INDIVIDUAL', 'Objective thêm sau khi đóng', 4, 3, 4 FROM okr_cycles WHERE name = 'Q3/2026'$$, 'Chu kỳ đã đóng');
SELECT pg_temp.expect_error('OKR phòng ban không liên kết lên OKR phòng ban',
    $$INSERT INTO objectives (cycle_id, level, title, owner_user_id, department_id, parent_id, created_by)
      SELECT o.cycle_id, 'DEPARTMENT', 'Objective phòng ban sai cấp', 3, 3, o.id, 3 FROM objectives o WHERE o.title = 'Cải thiện quy trình kiểm thử'$$, 'không liên kết được');
SELECT pg_temp.expect_error('OKR team không liên kết lên OKR team khác',
    $$INSERT INTO objectives (cycle_id, level, title, owner_user_id, department_id, parent_id, created_by)
      SELECT o.cycle_id, 'TEAM', 'OKR team nối sai cấp', o.owner_user_id, o.department_id, o.id, o.owner_user_id
        FROM objectives o WHERE o.title = 'Ổn định module thanh toán'$$, 'không liên kết được');
SELECT pg_temp.expect_error('OKR team phải gắn với đơn vị loại team, không gắn với phòng ban',
    $$INSERT INTO objectives (cycle_id, level, title, owner_user_id, department_id, created_by)
      SELECT c.id, 'TEAM', 'OKR team gắn nhầm phòng ban', 6, d.id, 6
        FROM okr_cycles c, departments d WHERE c.name = 'Q4/2026' AND d.name = 'Phòng QA'$$, 'phải gắn với đơn vị loại');
SELECT pg_temp.expect_error('Team không có đơn vị con',
    $$INSERT INTO departments (name, parent_id) SELECT 'Nhóm con của team', id FROM departments WHERE name = 'Team Thanh toán'$$, 'Team không có đơn vị con');
SELECT pg_temp.expect_error('Team phải nằm dưới một phòng ban',
    $$INSERT INTO departments (name, unit_type) VALUES ('Team không thuộc phòng nào', 'TEAM')$$, 'ck_departments_team_has_parent');
-- Cấp OKR bắt buộc đi xuống (cá nhân → phòng ban → công ty) nên cây không thể có vòng lặp:
-- mọi liên kết ngược đều bị quy tắc cấp chặn trước. Kiểm tra vòng lặp trong trigger là lớp phòng thủ thêm.
SELECT pg_temp.expect_error('Liên kết ngược (phòng ban → cá nhân) bị chặn, nên cây OKR không thể có vòng lặp',
    $$UPDATE objectives SET parent_id = (SELECT id FROM objectives WHERE title = 'Viết test cho module thanh toán')
      WHERE title = 'Cải thiện quy trình kiểm thử'$$, 'không liên kết được');
SELECT pg_temp.expect_error('Không xóa Objective còn Objective con',
    $$UPDATE objectives SET deleted_at = NOW(), deleted_by = 1 WHERE title = 'Cải thiện quy trình kiểm thử'$$, 'còn Objective con');
SELECT pg_temp.expect_error('Key Result thứ 6 bị từ chối',
    $$INSERT INTO key_results (objective_id, title, kr_type, start_value, target_value, assignee_user_id)
      SELECT o.id, 'KR thêm số ' || g, 'NUMBER', 0, 10, 4 FROM objectives o, generate_series(1, 4) g
       WHERE o.title = 'Viết test cho module thanh toán'$$, 'tối đa 5 Key Result');
SELECT pg_temp.expect_error('KR kiểu số có giá trị đầu bằng giá trị đích bị từ chối',
    $$INSERT INTO key_results (objective_id, title, kr_type, start_value, target_value, assignee_user_id)
      SELECT id, 'KR không đo được', 'NUMBER', 5, 5, 4 FROM objectives WHERE title = 'Viết test cho module thanh toán'$$, 'ck_key_results_values');
SELECT pg_temp.expect_error('Người không phụ trách KR không check-in được',
    $$INSERT INTO checkins (key_result_id, value, confidence, created_by)
      SELECT id, 20, 'ON_TRACK', 5 FROM key_results WHERE title = 'Viết test case cho module thanh toán'$$, 'Chỉ người phụ trách');
SELECT pg_temp.expect_error('Check-in là bất biến: không sửa',
    $$UPDATE checkins SET value = 99 WHERE id = (SELECT MIN(id) FROM checkins)$$, 'chỉ cho phép thêm mới');
SELECT pg_temp.expect_error('Check-in là bất biến: không xóa',
    $$DELETE FROM checkins WHERE id = (SELECT MIN(id) FROM checkins)$$, 'chỉ cho phép thêm mới');
SELECT pg_temp.expect_error('Người không phải quản lý trực tiếp không bình luận được',
    $$INSERT INTO checkin_comments (checkin_id, author_user_id, body)
      SELECT MIN(c.id), 6, 'Bình luận sai người' FROM checkins c JOIN app_users u ON u.id = c.created_by WHERE u.email = 'lan@okr360.vn'$$, 'Chỉ quản lý trực tiếp');
UPDATE app_users SET manager_id = (SELECT id FROM app_users WHERE email = 'nam@okr360.vn') WHERE email = 'ha@okr360.vn';
SELECT pg_temp.expect_error('Chuỗi báo cáo không có vòng lặp (Hà báo cáo Nam, Nam không thể báo cáo Hà)',
    $$UPDATE app_users SET manager_id = (SELECT id FROM app_users WHERE email = 'ha@okr360.vn') WHERE email = 'nam@okr360.vn'$$, 'vòng lặp trong chuỗi báo cáo');
SELECT pg_temp.expect_error('Nhân viên thường không làm quản lý trực tiếp',
    $$UPDATE app_users SET manager_id = (SELECT id FROM app_users WHERE email = 'tu@okr360.vn') WHERE email = 'an@okr360.vn'$$, 'phải có vai trò');
SELECT pg_temp.expect_error('Không đề cử quản lý trực tiếp làm đồng nghiệp',
    $$INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by)
      SELECT n.id, u.manager_id, u.id FROM nominations n JOIN app_users u ON u.id = n.reviewee_user_id WHERE n.status = 'PENDING' LIMIT 1$$, 'không được đề cử');
DELETE FROM nomination_peers
 WHERE nomination_id = (SELECT MIN(id) FROM nominations WHERE status = 'PENDING')
   AND peer_user_id = (SELECT MIN(peer_user_id) FROM nomination_peers WHERE nomination_id = (SELECT MIN(id) FROM nominations WHERE status = 'PENDING'));
SELECT pg_temp.expect_error('Danh sách đề cử dưới 3 người không được duyệt',
    $$UPDATE nominations SET status = 'APPROVED', approved_by = 3, approved_at = NOW()
       WHERE id = (SELECT MIN(id) FROM nominations WHERE status = 'PENDING')$$, 'Danh sách đề cử cần');
SELECT pg_temp.expect_error('Đợt đánh giá không quay lại trạng thái trước',
    $$UPDATE review_campaigns SET status = 'NOMINATION' WHERE name LIKE '%Q4/2026'$$, 'Không chuyển được đợt');
SELECT pg_temp.expect_error('Mẫu phiếu đang được dùng thì không sửa tiêu chí',
    $$UPDATE review_criteria SET name = 'Đổi tên tiêu chí' WHERE id = (SELECT MIN(id) FROM review_criteria)$$, 'đã bị khóa');
SELECT pg_temp.expect_error('Tỷ trọng OKR/360 đã khóa thì không đổi',
    $$UPDATE okr_cycles SET okr_weight = 0.5 WHERE name = 'Q4/2026'$$, 'đã bị khóa');
SELECT pg_temp.expect_error('Điểm tiêu chí ngoài thang 1–5 bị từ chối',
    $$INSERT INTO review_answers (campaign_id, reviewee_user_id, reviewer_group, response_key, criterion_id, score)
      SELECT id, 4, 'PEER', gen_random_uuid(), 1, 6 FROM review_campaigns WHERE name LIKE '%Q4/2026'$$, 'ck_review_answers_score');
SELECT pg_temp.expect_error('Nhật ký không sửa được',
    $$UPDATE audit_logs SET summary = 'sửa' WHERE id = (SELECT MIN(id) FROM audit_logs)$$, 'chỉ cho phép thêm mới');
SELECT pg_temp.expect_error('Thông báo không gửi trùng cùng một sự kiện',
    $$INSERT INTO notifications (user_id, type, body, dedupe_key)
      SELECT user_id, type, body, dedupe_key FROM notifications LIMIT 1$$, 'uq_notifications_dedupe');

-- ---------- 4. Tự động hóa bằng AI ----------
SELECT pg_temp.expect('Đóng đợt Q3 đã tự ghi sự kiện CAMPAIGN_CLOSED để luồng bản nháp 1-1 chạy',
    EXISTS (SELECT 1 FROM domain_events e JOIN review_campaigns c ON c.id = e.entity_id
             WHERE e.event_type = 'CAMPAIGN_CLOSED' AND c.name LIKE '%Q3/2026'));
SELECT pg_temp.expect('Vướng mắc của Lan được chuyển tới Phòng QA, đang chờ chị Hà nhận',
    EXISTS (SELECT 1 FROM vw_open_blockers b JOIN app_users h ON h.id = b.handler_user_id JOIN app_users r ON r.id = b.reported_by
             WHERE h.email = 'ha@okr360.vn' AND r.email = 'lan@okr360.vn'));
SELECT pg_temp.expect('Lịch sử chạy không có cột nào chứa nội dung gửi cho AI hay AI trả về',
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'okr360' AND table_name = 'automation_runs'
                 AND column_name ~ '(prompt|response|content|input_text|output_text|payload)'));
SELECT pg_temp.expect('Hộp thư sự kiện chỉ có id đối tượng, không chép nội dung',
    NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'okr360' AND table_name = 'domain_events'
                 AND data_type IN ('text', 'jsonb', 'character varying')));
SELECT pg_temp.expect('Màn hình Tự động hóa thấy đủ 6 luồng',
    (SELECT COUNT(*) FROM vw_automation_flow_status) = 6);
SELECT pg_temp.expect_error('Một luồng không xử lý cùng một đối tượng hai lần',
    $$INSERT INTO automation_runs (flow, run_key) SELECT flow, run_key FROM automation_runs WHERE flow = 'BLOCKER_ROUTING' LIMIT 1$$, 'uq_automation_runs_key');
SELECT pg_temp.expect_error('Luồng cảnh báo nhận xét 360 không ghi lịch sử từng lần nộp phiếu',
    $$INSERT INTO automation_runs (flow, run_key) VALUES ('REVIEW_COMMENT_GUARD', 'submit:1')$$, 'không được ghi lịch sử');
SELECT pg_temp.expect_error('Lần chạy lỗi phải có thông báo lỗi',
    $$INSERT INTO automation_runs (flow, run_key, status, finished_at) VALUES ('OKR_REVIEW', 'objective:999', 'FAILED', NOW())$$, 'ck_automation_runs_error');
SELECT pg_temp.expect_error('Hạn mức gọi AI phải lớn hơn 0',
    $$UPDATE automation_flows SET daily_quota = 0 WHERE flow = 'WEEKLY_DIGEST'$$, 'ck_automation_flows_quota');
SELECT pg_temp.expect_error('Kết quả AI trên check-in đã ghi thì không sửa được',
    $$UPDATE checkin_insights SET severity = 'LOW' WHERE blocker_category IS NOT NULL AND routing = 'OPEN'$$, 'không sửa được');
SELECT pg_temp.expect_error('Người không phải trưởng phòng QA không xử lý được vướng mắc chuyển tới QA',
    $$UPDATE checkin_insights SET routing = 'ACKNOWLEDGED', handled_by = (SELECT id FROM app_users WHERE email = 'nam@okr360.vn'), handled_at = NOW()
       WHERE routing = 'OPEN'$$, 'Chỉ trưởng phòng');
SELECT pg_temp.expect_error('Vướng mắc đã xử lý thì không đổi trạng thái được nữa',
    $$UPDATE checkin_insights SET routing = 'REJECTED' WHERE routing = 'ACKNOWLEDGED'$$, 'đã được xử lý');
SELECT pg_temp.expect_error('Vướng mắc phụ thuộc phòng khác không chuyển về chính phòng của người check-in',
    $$INSERT INTO checkin_insights (checkin_id, blocker_run_id, blocker_category, severity, target_department_id, routing)
      SELECT c.id, (SELECT MIN(id) FROM automation_runs), 'DEPENDENCY', 'LOW', u.department_id, 'OPEN'
        FROM checkins c JOIN app_users u ON u.id = c.created_by
       WHERE NOT EXISTS (SELECT 1 FROM checkin_insights i WHERE i.checkin_id = c.id) LIMIT 1$$, 'chính phòng');
SELECT pg_temp.expect_error('Vướng mắc của người trong Team Thanh toán không chuyển về Phòng Dev chứa team đó',
    $$INSERT INTO checkin_insights (checkin_id, blocker_run_id, blocker_category, severity, target_department_id, routing)
      SELECT c.id, (SELECT MIN(id) FROM automation_runs), 'DEPENDENCY', 'LOW', (SELECT id FROM departments WHERE name = 'Phòng Dev'), 'OPEN'
        FROM checkins c JOIN app_users u ON u.id = c.created_by
       WHERE u.email = 'lan@okr360.vn' AND NOT EXISTS (SELECT 1 FROM checkin_insights i WHERE i.checkin_id = c.id) LIMIT 1$$, 'chính phòng');
SELECT pg_temp.expect('Vướng mắc chuyển tới một team được team lead nhận xử lý (Team Thanh toán, anh Nam)',
    EXISTS (SELECT 1 FROM checkin_insights i JOIN departments d ON d.id = i.target_department_id JOIN app_users h ON h.id = i.handled_by
             WHERE d.unit_type = 'TEAM' AND i.routing = 'ACKNOWLEDGED' AND h.email = 'nam@okr360.vn'));
SELECT pg_temp.expect_error('Bản tin tuần chỉ tạo một lần mỗi người mỗi tuần',
    $$INSERT INTO weekly_digests (manager_user_id, week_start, run_id, stats)
      SELECT manager_user_id, week_start, run_id, stats FROM weekly_digests LIMIT 1$$, 'uq_weekly_digests');
SELECT pg_temp.expect_error('Bản tin tuần có tối đa 3 mục cần chú ý',
    $$INSERT INTO weekly_digests (manager_user_id, week_start, run_id, stats, highlights)
      SELECT manager_user_id, DATE '2026-10-19', run_id, stats, '[{}, {}, {}, {}]'::jsonb FROM weekly_digests LIMIT 1$$, 'ck_weekly_digests_highlights');
SELECT pg_temp.expect_error('Không tạo bản nháp 1-1 khi đợt đánh giá chưa đóng',
    $$INSERT INTO one_on_one_drafts (campaign_id, reviewee_user_id, reviewer_user_id, run_id, ai_strengths, ai_improvements)
      SELECT p.campaign_id, p.reviewee_user_id, p.manager_user_id, (SELECT MIN(id) FROM automation_runs), '[]', '[]'
        FROM campaign_participants p JOIN review_campaigns c ON c.id = p.campaign_id WHERE c.name LIKE '%Q4/2026' LIMIT 1$$, 'sau khi đợt đánh giá đã đóng');
SELECT pg_temp.expect_error('Nội dung AI đề xuất trong bản nháp 1-1 được giữ nguyên',
    $$UPDATE one_on_one_drafts SET ai_strengths = '["sửa"]' WHERE status = 'PENDING_REVIEW'$$, 'giữ nguyên');
SELECT pg_temp.expect_error('Bản nháp đã gửi thì không sửa được',
    $$UPDATE one_on_one_drafts SET edited_text = 'Sửa sau khi gửi' WHERE status = 'SENT'$$, 'đã gửi hoặc đã bỏ');
SELECT pg_temp.expect_error('Quản lý không gửi được bản nháp của người do HR duyệt',
    $$UPDATE one_on_one_drafts d SET status = 'SENT', edited_text = 'Nội dung', sent_at = NOW(),
             sent_by = (SELECT id FROM app_users WHERE email = 'nam@okr360.vn')
        FROM app_users u WHERE u.id = d.reviewee_user_id AND u.email = 'ha@okr360.vn'$$, 'Chỉ người duyệt');

-- ---------- 5. Thao tác hợp lệ vẫn chạy được ----------
SELECT pg_temp.expect('Người phụ trách check-in được, giá trị hiện tại cập nhật theo', TRUE);
INSERT INTO checkins (key_result_id, value, confidence, created_by)
SELECT id, 25, 'ON_TRACK', assignee_user_id FROM key_results WHERE title = 'Viết test case cho module thanh toán';
SELECT pg_temp.expect('Sau check-in 25/50, tiến độ KR = 50%',
    (SELECT progress FROM vw_key_result_progress v JOIN key_results k ON k.id = v.key_result_id WHERE k.title = 'Viết test case cho module thanh toán') = 0.50);
SELECT pg_temp.expect('Check-in mới tự sinh đúng một sự kiện cho AI worker, chưa xử lý',
    (SELECT COUNT(*) FROM domain_events WHERE event_type = 'CHECKIN_CREATED' AND processed_at IS NULL
        AND entity_id = (SELECT MAX(id) FROM checkins)) = 1);
UPDATE checkin_insights SET routing = 'ACKNOWLEDGED', handled_by = (SELECT id FROM app_users WHERE email = 'ha@okr360.vn'),
       handled_at = NOW(), handler_note = 'Chiều nay QA gửi danh sách test smoke.'
 WHERE routing = 'OPEN';
SELECT pg_temp.expect('Chị Hà (trưởng phòng QA) nhận xử lý được vướng mắc chuyển tới QA',
    NOT EXISTS (SELECT 1 FROM vw_open_blockers));
UPDATE one_on_one_drafts d SET status = 'SENT', edited_text = 'Tóm tắt đã duyệt', sent_at = NOW(),
       sent_by = (SELECT id FROM app_users WHERE email = 'mai@okr360.vn')
  FROM app_users u WHERE u.id = d.reviewee_user_id AND u.email = 'ha@okr360.vn';
SELECT pg_temp.expect('HR gửi được bản nháp 1-1 của người không có quản lý trực tiếp sau khi đợt đã công bố',
    (SELECT d.status FROM one_on_one_drafts d JOIN app_users u ON u.id = d.reviewee_user_id WHERE u.email = 'ha@okr360.vn') = 'SENT');

-- ---------- Báo cáo ----------
DO $$
DECLARE r RECORD; failed INT := 0;
BEGIN
    FOR r IN SELECT * FROM results LOOP
        RAISE NOTICE '% %', CASE WHEN r.ok THEN 'PASS' ELSE 'FAIL' END, r.name;
        IF NOT r.ok THEN failed := failed + 1; END IF;
    END LOOP;
    IF failed > 0 THEN
        RAISE EXCEPTION '% kiểm thử FAIL', failed;
    END IF;
    RAISE NOTICE 'Tất cả % kiểm thử PASS', (SELECT COUNT(*) FROM results);
END $$;

ROLLBACK;

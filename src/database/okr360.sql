-- ============================================================
-- PostgreSQL schema — okr360 (OKR360)
-- Hệ thống quản lý mục tiêu OKR và đánh giá nhân viên 360 độ
-- PostgreSQL 15+
--
-- Bám theo tài liệu yêu cầu và bản giao diện mẫu:
-- Tổ chức: cây đơn vị gồm phòng ban và team (team nằm ngay dưới một phòng ban);
--           người dùng có một vai trò và tối đa một quản lý trực tiếp.
-- OKR: chu kỳ theo quý; Objective 4 cấp (công ty, phòng ban, team, cá nhân) nối thành cây;
--      mỗi Objective có 1–5 Key Result; check-in là bản ghi bất biến.
-- 360: mẫu phiếu, đợt đánh giá, đề cử, phân công người đánh giá, câu trả lời.
--      Khi đợt đóng, câu trả lời bị tách khỏi người chấm để ẩn danh thật sự.
-- Kết quả cuối kỳ: điểm OKR + điểm 360 theo tỷ trọng của chu kỳ.
--
-- Sơ đồ: docs/DATABASE.md · DBML: src/database/okr360.dbml · Giải thích: docs/05-data-model.md
-- LƯU Ý: file này dùng để khởi tạo database mới. Nếu database đã có schema cũ,
-- hãy xóa schema hoặc viết migration riêng thay vì chạy đè.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS okr360;
SET search_path TO okr360, public;

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE user_role          AS ENUM ('ADMIN', 'HR', 'MANAGER', 'EMPLOYEE');
CREATE TYPE cycle_status       AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE okr_level          AS ENUM ('COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL');
CREATE TYPE org_unit_type      AS ENUM ('DEPARTMENT', 'TEAM');
CREATE TYPE kr_type            AS ENUM ('NUMBER', 'PERCENT', 'BOOLEAN');
CREATE TYPE confidence_level   AS ENUM ('ON_TRACK', 'AT_RISK', 'OFF_TRACK');
CREATE TYPE campaign_status    AS ENUM ('DRAFT', 'NOMINATION', 'COLLECTING', 'CLOSED', 'PUBLISHED');
CREATE TYPE reviewer_group     AS ENUM ('SELF', 'MANAGER', 'PEER', 'DIRECT_REPORT');
CREATE TYPE assignment_status  AS ENUM ('NOT_STARTED', 'DRAFT', 'SUBMITTED', 'CANCELLED');
CREATE TYPE nomination_status  AS ENUM ('DRAFT', 'PENDING', 'APPROVED');
CREATE TYPE result_grade       AS ENUM ('EXCELLENT', 'GOOD', 'MEETS', 'NEEDS_IMPROVEMENT', 'INSUFFICIENT_DATA');
CREATE TYPE notification_type  AS ENUM (
    'CHECKIN_REMINDER',
    'CHECKIN_OFF_TRACK',
    'CHECKIN_COMMENT',
    'PLANNING_REMINDER',
    'NOMINATION_REMINDER',
    'NOMINATION_PENDING',
    'REVIEW_REMINDER',
    'RESULT_PUBLISHED',
    'BLOCKER_ROUTED',
    'BLOCKER_UPDATED',
    'WEEKLY_DIGEST',
    'CHECKIN_MISMATCH',
    'AI_DRAFT_READY',
    'ONE_ON_ONE_SENT',
    'AUTOMATION_ALERT'
);
CREATE TYPE audit_action       AS ENUM (
    'CREATE', 'UPDATE', 'SOFT_DELETE', 'RESTORE',
    'STATUS_CHANGE', 'CHECKIN', 'SUBMIT', 'PUBLISH',
    'LOGIN', 'LOGIN_FAILED', 'EXPORT'
);
-- Tự động hóa bằng AI (F13)
CREATE TYPE automation_flow    AS ENUM (
    'BLOCKER_ROUTING',      -- chuyển vướng mắc đến đúng người
    'WEEKLY_DIGEST',        -- bản tin tuần cho quản lý
    'ONE_ON_ONE_DRAFT',     -- bản nháp buổi 1-1 sau đợt 360
    'CHECKIN_MISMATCH',     -- phát hiện check-in không khớp
    'OKR_REVIEW',           -- rà soát OKR mới tạo
    'REVIEW_COMMENT_GUARD'  -- cảnh báo nhận xét 360 dễ lộ danh tính
);
CREATE TYPE trigger_kind       AS ENUM ('EVENT', 'SCHEDULE', 'ON_SUBMIT');
CREATE TYPE domain_event_type  AS ENUM ('CHECKIN_CREATED', 'OBJECTIVE_CREATED', 'CAMPAIGN_CLOSED');
CREATE TYPE run_status         AS ENUM ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED');
CREATE TYPE blocker_category   AS ENUM ('DEPENDENCY', 'RESOURCE', 'TECHNICAL', 'PRIORITY_CHANGE', 'OTHER');
CREATE TYPE severity_level     AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE routing_status     AS ENUM ('OPEN', 'ACKNOWLEDGED', 'REJECTED');
CREATE TYPE review_issue       AS ENUM ('NOT_MEASURABLE', 'OUTPUT_ONLY', 'DUPLICATE', 'NOT_ALIGNED');
CREATE TYPE draft_status       AS ENUM ('PENDING_REVIEW', 'SENT', 'DISCARDED');

-- ============================================================
-- 2. HÀM DÙNG CHUNG
-- ============================================================
CREATE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END $$;

-- ============================================================
-- 3. TỔ CHỨC: PHÒNG BAN, TEAM VÀ NGƯỜI DÙNG
-- departments là cây đơn vị tổ chức: gốc là công ty (Ban Giám đốc), dưới là phòng ban,
-- dưới phòng ban có thể có team. Team không có đơn vị con, nên cây tối đa 4 tầng
-- như 4 cấp OKR. head_user_id là trưởng phòng hoặc team lead.
-- departments.head_user_id và app_users.department_id tham chiếu lẫn nhau,
-- nên khóa ngoại head_user_id được thêm sau khi tạo app_users.
-- ============================================================
CREATE TABLE departments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    parent_id       BIGINT REFERENCES departments (id),
    unit_type       org_unit_type NOT NULL DEFAULT 'DEPARTMENT',
    head_user_id    BIGINT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_departments_not_own_parent CHECK (parent_id IS NULL OR parent_id <> id),
    CONSTRAINT ck_departments_team_has_parent CHECK (unit_type <> 'TEAM' OR parent_id IS NOT NULL)
);
CREATE UNIQUE INDEX uq_departments_name_active ON departments (LOWER(name)) WHERE is_active;

CREATE TABLE app_users (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email               VARCHAR(255) NOT NULL,
    password_hash       TEXT NOT NULL,
    full_name           VARCHAR(150) NOT NULL,
    job_title           VARCHAR(150),
    phone               VARCHAR(30),
    avatar_url          TEXT,
    role                user_role NOT NULL DEFAULT 'EMPLOYEE',
    department_id       BIGINT NOT NULL REFERENCES departments (id),
    manager_id          BIGINT REFERENCES app_users (id),
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_count  SMALLINT NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT ck_users_not_own_manager CHECK (manager_id IS NULL OR manager_id <> id),
    CONSTRAINT ck_users_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);
CREATE UNIQUE INDEX uq_app_users_email_active ON app_users (LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX ix_app_users_manager ON app_users (manager_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_app_users_department ON app_users (department_id) WHERE deleted_at IS NULL;

ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head FOREIGN KEY (head_user_id) REFERENCES app_users (id);

CREATE TRIGGER trg_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_app_users_updated_at BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Chống vòng lặp trong cây phòng ban và trong chuỗi báo cáo (BR-010, BR-013).
CREATE FUNCTION check_department_cycle() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    cur BIGINT := NEW.parent_id;
BEGIN
    WHILE cur IS NOT NULL LOOP
        IF cur = NEW.id THEN
            RAISE EXCEPTION 'Phòng ban % tạo vòng lặp trong cây phòng ban', NEW.id USING ERRCODE = 'check_violation';
        END IF;
        SELECT parent_id INTO cur FROM departments WHERE id = cur;
    END LOOP;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_departments_no_cycle BEFORE INSERT OR UPDATE OF parent_id ON departments
    FOR EACH ROW EXECUTE FUNCTION check_department_cycle();

-- Team chỉ nằm ngay dưới một phòng ban và không có đơn vị con.
CREATE FUNCTION check_org_unit_type() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    parent_type org_unit_type;
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SELECT unit_type INTO parent_type FROM departments WHERE id = NEW.parent_id;
        IF parent_type = 'TEAM' THEN
            RAISE EXCEPTION 'Team không có đơn vị con' USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    IF NEW.unit_type = 'TEAM' AND EXISTS (SELECT 1 FROM departments c WHERE c.parent_id = NEW.id) THEN
        RAISE EXCEPTION 'Đơn vị đang có đơn vị con, không đổi thành team được' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_departments_unit_type BEFORE INSERT OR UPDATE OF parent_id, unit_type ON departments
    FOR EACH ROW EXECUTE FUNCTION check_org_unit_type();

CREATE FUNCTION check_manager_chain() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    cur BIGINT := NEW.manager_id;
    mgr_role user_role;
BEGIN
    IF NEW.manager_id IS NOT NULL THEN
        SELECT role INTO mgr_role FROM app_users WHERE id = NEW.manager_id;
        IF mgr_role = 'EMPLOYEE' THEN
            RAISE EXCEPTION 'Quản lý trực tiếp phải có vai trò MANAGER, HR hoặc ADMIN' USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    WHILE cur IS NOT NULL LOOP
        IF cur = NEW.id THEN
            RAISE EXCEPTION 'Người dùng % tạo vòng lặp trong chuỗi báo cáo', NEW.id USING ERRCODE = 'check_violation';
        END IF;
        SELECT manager_id INTO cur FROM app_users WHERE id = cur;
    END LOOP;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_app_users_manager_chain BEFORE INSERT OR UPDATE OF manager_id ON app_users
    FOR EACH ROW EXECUTE FUNCTION check_manager_chain();

-- ============================================================
-- 4. CHU KỲ OKR
-- ============================================================
CREATE TABLE okr_cycles (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                    VARCHAR(50) NOT NULL,
    start_date              DATE NOT NULL,
    end_date                DATE NOT NULL,
    planning_deadline       DATE NOT NULL,
    status                  cycle_status NOT NULL DEFAULT 'DRAFT',
    max_objectives_per_user SMALLINT NOT NULL DEFAULT 5,
    okr_weight              NUMERIC(3, 2) NOT NULL DEFAULT 0.60,
    weight_locked_at        TIMESTAMPTZ,
    activated_at            TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    created_by              BIGINT NOT NULL REFERENCES app_users (id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_okr_cycles_name UNIQUE (name),
    CONSTRAINT ck_okr_cycles_dates CHECK (end_date > start_date AND planning_deadline BETWEEN start_date AND end_date),
    CONSTRAINT ck_okr_cycles_max_objectives CHECK (max_objectives_per_user BETWEEN 1 AND 10),
    CONSTRAINT ck_okr_cycles_weight CHECK (okr_weight BETWEEN 0 AND 1)
);
-- Tại một thời điểm chỉ có một chu kỳ đang chạy (BR-021).
CREATE UNIQUE INDEX uq_okr_cycles_single_active ON okr_cycles ((status)) WHERE status = 'ACTIVE';
CREATE TRIGGER trg_okr_cycles_updated_at BEFORE UPDATE ON okr_cycles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Trạng thái chỉ đi tiến DRAFT → ACTIVE → CLOSED; tỷ trọng bị khóa thì không đổi.
CREATE FUNCTION check_cycle_transition() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.status <> OLD.status AND NOT (
        (OLD.status = 'DRAFT' AND NEW.status = 'ACTIVE') OR (OLD.status = 'ACTIVE' AND NEW.status = 'CLOSED')
    ) THEN
        RAISE EXCEPTION 'Không chuyển được chu kỳ từ % sang %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.weight_locked_at IS NOT NULL AND NEW.okr_weight <> OLD.okr_weight THEN
        RAISE EXCEPTION 'Tỷ trọng OKR/360 đã bị khóa' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status = 'ACTIVE' AND OLD.status = 'DRAFT' THEN NEW.activated_at := NOW(); END IF;
    IF NEW.status = 'CLOSED' AND OLD.status = 'ACTIVE' THEN NEW.closed_at := NOW(); END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_okr_cycles_transition BEFORE UPDATE ON okr_cycles FOR EACH ROW EXECUTE FUNCTION check_cycle_transition();

-- ============================================================
-- 5. OBJECTIVE VÀ KEY RESULT
-- Cây OKR lưu bằng parent_id (danh sách kề); truy vấn cả nhánh bằng recursive CTE.
-- progress là giá trị lưu đệm, được tầng nghiệp vụ tính lại dọc chuỗi tổ tiên
-- trong cùng giao dịch mỗi khi có check-in, sửa KR, liên kết hoặc xóa (BR-043).
-- final_progress được chốt khi đóng chu kỳ.
-- ============================================================
CREATE TABLE objectives (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cycle_id            BIGINT NOT NULL REFERENCES okr_cycles (id),
    level               okr_level NOT NULL,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    owner_user_id       BIGINT NOT NULL REFERENCES app_users (id),
    department_id       BIGINT REFERENCES departments (id),
    parent_id           BIGINT REFERENCES objectives (id),
    progress            NUMERIC(5, 4) NOT NULL DEFAULT 0,
    final_progress      NUMERIC(5, 4),
    created_by          BIGINT NOT NULL REFERENCES app_users (id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    deleted_by          BIGINT REFERENCES app_users (id),
    CONSTRAINT ck_objectives_title_length CHECK (char_length(title) BETWEEN 5 AND 200),
    CONSTRAINT ck_objectives_company_root CHECK (level <> 'COMPANY' OR parent_id IS NULL),
    CONSTRAINT ck_objectives_unit_required CHECK (level NOT IN ('DEPARTMENT', 'TEAM') OR department_id IS NOT NULL),
    CONSTRAINT ck_objectives_progress CHECK (progress BETWEEN 0 AND 1 AND (final_progress IS NULL OR final_progress BETWEEN 0 AND 1)),
    CONSTRAINT ck_objectives_deleted CHECK ((deleted_at IS NULL) = (deleted_by IS NULL))
);
CREATE INDEX ix_objectives_cycle_level ON objectives (cycle_id, level) WHERE deleted_at IS NULL;
CREATE INDEX ix_objectives_parent ON objectives (parent_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_objectives_owner ON objectives (owner_user_id, cycle_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_objectives_department ON objectives (department_id, cycle_id) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_objectives_updated_at BEFORE UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Quy tắc liên kết (BR-035, BR-036): cha cùng chu kỳ, chưa xóa, đúng cấp, không vòng lặp.
-- Cấp cha hợp lệ: phòng ban → công ty; team → phòng ban hoặc công ty;
-- cá nhân → team, phòng ban hoặc công ty (được nối vượt cấp khi phòng ban chưa chia team).
-- OKR phòng ban phải gắn với đơn vị loại phòng ban; OKR team gắn với đơn vị loại team.
-- Không xóa mềm Objective còn con đang liên kết (BR-037). Chu kỳ đã đóng thì chỉ đọc.
CREATE FUNCTION check_objective_rules() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    p RECORD;
    cur BIGINT;
    st cycle_status;
    ut org_unit_type;
BEGIN
    SELECT status INTO st FROM okr_cycles WHERE id = NEW.cycle_id;
    IF st = 'CLOSED' AND (TG_OP = 'INSERT' OR NEW.final_progress IS NOT DISTINCT FROM OLD.final_progress) THEN
        RAISE EXCEPTION 'Chu kỳ đã đóng, OKR chỉ đọc' USING ERRCODE = 'check_violation';
    END IF;

    IF NEW.level IN ('DEPARTMENT', 'TEAM') THEN
        SELECT unit_type INTO ut FROM departments WHERE id = NEW.department_id;
        IF ut::text <> NEW.level::text THEN
            RAISE EXCEPTION 'OKR cấp % phải gắn với đơn vị loại %, không phải %', NEW.level, NEW.level, ut USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    IF NEW.parent_id IS NOT NULL THEN
        SELECT cycle_id, level, deleted_at INTO p FROM objectives WHERE id = NEW.parent_id;
        IF p.cycle_id <> NEW.cycle_id OR p.deleted_at IS NOT NULL THEN
            RAISE EXCEPTION 'Objective cha phải cùng chu kỳ và chưa bị xóa' USING ERRCODE = 'check_violation';
        END IF;
        IF NOT (
            (NEW.level = 'DEPARTMENT' AND p.level = 'COMPANY') OR
            (NEW.level = 'TEAM' AND p.level IN ('DEPARTMENT', 'COMPANY')) OR
            (NEW.level = 'INDIVIDUAL' AND p.level IN ('TEAM', 'DEPARTMENT', 'COMPANY'))
        ) THEN
            RAISE EXCEPTION 'Objective cấp % không liên kết được lên cấp %', NEW.level, p.level USING ERRCODE = 'check_violation';
        END IF;
        cur := NEW.parent_id;
        WHILE cur IS NOT NULL LOOP
            IF cur = NEW.id THEN
                RAISE EXCEPTION 'Liên kết tạo vòng lặp trong cây OKR' USING ERRCODE = 'check_violation';
            END IF;
            SELECT parent_id INTO cur FROM objectives WHERE id = cur;
        END LOOP;
    END IF;

    IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
       AND EXISTS (SELECT 1 FROM objectives c WHERE c.parent_id = NEW.id AND c.deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Objective còn Objective con đang liên kết, hãy gỡ liên kết trước' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_objectives_rules BEFORE INSERT OR UPDATE ON objectives FOR EACH ROW EXECUTE FUNCTION check_objective_rules();

CREATE TABLE key_results (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    objective_id        BIGINT NOT NULL REFERENCES objectives (id),
    title               VARCHAR(200) NOT NULL,
    kr_type             kr_type NOT NULL,
    start_value         NUMERIC(14, 4) NOT NULL DEFAULT 0,
    target_value        NUMERIC(14, 4) NOT NULL,
    unit                VARCHAR(30),
    assignee_user_id    BIGINT NOT NULL REFERENCES app_users (id),
    sort_order          SMALLINT NOT NULL DEFAULT 0,
    current_value       NUMERIC(14, 4),
    current_confidence  confidence_level,
    last_checkin_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    CONSTRAINT ck_key_results_title_length CHECK (char_length(title) BETWEEN 5 AND 200),
    CONSTRAINT ck_key_results_values CHECK (
        (kr_type = 'BOOLEAN' AND start_value = 0 AND target_value = 1) OR
        (kr_type <> 'BOOLEAN' AND start_value <> target_value)
    )
);
CREATE INDEX ix_key_results_objective ON key_results (objective_id) WHERE deleted_at IS NULL;
CREATE INDEX ix_key_results_assignee ON key_results (assignee_user_id) WHERE deleted_at IS NULL;
CREATE TRIGGER trg_key_results_updated_at BEFORE UPDATE ON key_results FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Mỗi Objective có tối đa 5 Key Result đang dùng (BR-033); chu kỳ đã đóng thì chỉ đọc.
CREATE FUNCTION check_key_result_rules() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    st cycle_status;
BEGIN
    SELECT c.status INTO st FROM objectives o JOIN okr_cycles c ON c.id = o.cycle_id WHERE o.id = NEW.objective_id;
    IF st = 'CLOSED' THEN
        RAISE EXCEPTION 'Chu kỳ đã đóng, Key Result chỉ đọc' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.deleted_at IS NULL AND (
        SELECT COUNT(*) FROM key_results k
        WHERE k.objective_id = NEW.objective_id AND k.deleted_at IS NULL AND k.id <> NEW.id
    ) >= 5 THEN
        RAISE EXCEPTION 'Mỗi Objective có tối đa 5 Key Result' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
-- Bỏ qua khi chỉ có cột đệm (current_value...) thay đổi do check-in.
CREATE TRIGGER trg_key_results_rules BEFORE INSERT OR UPDATE OF objective_id, title, kr_type, start_value, target_value, unit, assignee_user_id, deleted_at
    ON key_results FOR EACH ROW EXECUTE FUNCTION check_key_result_rules();

-- ============================================================
-- 6. CHECK-IN
-- Mỗi check-in là một bản ghi bất biến (BR-041): không sửa, không xóa.
-- Trigger cập nhật giá trị hiện tại lưu đệm trên key_results.
-- ============================================================
CREATE TABLE checkins (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key_result_id   BIGINT NOT NULL REFERENCES key_results (id),
    value           NUMERIC(14, 4) NOT NULL,
    confidence      confidence_level NOT NULL,
    note            TEXT,
    blocker         TEXT,
    created_by      BIGINT NOT NULL REFERENCES app_users (id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_checkins_key_result_time ON checkins (key_result_id, created_at DESC);
CREATE INDEX ix_checkins_created_by_time ON checkins (created_by, created_at DESC);

CREATE FUNCTION check_checkin_insert() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    kr RECORD;
BEGIN
    SELECT k.assignee_user_id, k.kr_type, k.deleted_at, c.status
      INTO kr
      FROM key_results k JOIN objectives o ON o.id = k.objective_id JOIN okr_cycles c ON c.id = o.cycle_id
     WHERE k.id = NEW.key_result_id;
    IF kr.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Chỉ check-in được khi chu kỳ đang chạy' USING ERRCODE = 'check_violation';
    END IF;
    IF kr.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Key Result đã bị xóa' USING ERRCODE = 'check_violation';
    END IF;
    IF kr.assignee_user_id <> NEW.created_by THEN
        RAISE EXCEPTION 'Chỉ người phụ trách Key Result được check-in' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF kr.kr_type = 'BOOLEAN' AND NEW.value NOT IN (0, 1) THEN
        RAISE EXCEPTION 'Key Result kiểu hoàn thành chỉ nhận giá trị 0 hoặc 1' USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_checkins_before_insert BEFORE INSERT ON checkins FOR EACH ROW EXECUTE FUNCTION check_checkin_insert();

CREATE FUNCTION apply_checkin_to_key_result() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE key_results
       SET current_value = NEW.value, current_confidence = NEW.confidence, last_checkin_at = NEW.created_at
     WHERE id = NEW.key_result_id AND (last_checkin_at IS NULL OR last_checkin_at <= NEW.created_at);
    RETURN NEW;
END $$;
CREATE TRIGGER trg_checkins_after_insert AFTER INSERT ON checkins FOR EACH ROW EXECUTE FUNCTION apply_checkin_to_key_result();

CREATE FUNCTION forbid_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Bảng % chỉ cho phép thêm mới, không sửa hoặc xóa', TG_TABLE_NAME USING ERRCODE = 'check_violation';
END $$;
CREATE TRIGGER trg_checkins_immutable BEFORE UPDATE OR DELETE ON checkins FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE checkin_comments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    checkin_id      BIGINT NOT NULL REFERENCES checkins (id),
    author_user_id  BIGINT NOT NULL REFERENCES app_users (id),
    body            TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_checkin_comments_body CHECK (char_length(btrim(body)) > 0)
);
CREATE INDEX ix_checkin_comments_checkin ON checkin_comments (checkin_id, created_at);

-- Chỉ quản lý trực tiếp của người check-in được bình luận (UC14).
CREATE FUNCTION check_comment_author() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM checkins c JOIN app_users u ON u.id = c.created_by
         WHERE c.id = NEW.checkin_id AND u.manager_id = NEW.author_user_id
    ) THEN
        RAISE EXCEPTION 'Chỉ quản lý trực tiếp được bình luận check-in' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_checkin_comments_author BEFORE INSERT ON checkin_comments FOR EACH ROW EXECUTE FUNCTION check_comment_author();

-- ============================================================
-- 7. ĐÁNH GIÁ 360: MẪU PHIẾU
-- ============================================================
CREATE TABLE review_templates (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    created_by  BIGINT NOT NULL REFERENCES app_users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);
CREATE TRIGGER trg_review_templates_updated_at BEFORE UPDATE ON review_templates FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE review_criteria (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    template_id     BIGINT NOT NULL REFERENCES review_templates (id),
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    is_required     BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX ix_review_criteria_template ON review_criteria (template_id, sort_order);

CREATE TABLE review_questions (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    template_id     BIGINT NOT NULL REFERENCES review_templates (id),
    question_text   VARCHAR(300) NOT NULL,
    sort_order      SMALLINT NOT NULL DEFAULT 0
);
CREATE INDEX ix_review_questions_template ON review_questions (template_id, sort_order);

-- ============================================================
-- 8. ĐÁNH GIÁ 360: ĐỢT, NGƯỜI THAM GIA, ĐỀ CỬ, PHÂN CÔNG
-- ============================================================
CREATE TABLE review_campaigns (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cycle_id                BIGINT NOT NULL REFERENCES okr_cycles (id),
    template_id             BIGINT NOT NULL REFERENCES review_templates (id),
    name                    VARCHAR(150) NOT NULL,
    nomination_deadline     DATE NOT NULL,
    submit_deadline         DATE NOT NULL,
    min_peers               SMALLINT NOT NULL DEFAULT 3,
    max_peers               SMALLINT NOT NULL DEFAULT 5,
    anonymity_threshold     SMALLINT NOT NULL DEFAULT 3,
    status                  campaign_status NOT NULL DEFAULT 'DRAFT',
    nomination_opened_at    TIMESTAMPTZ,
    collection_opened_at    TIMESTAMPTZ,
    closed_at               TIMESTAMPTZ,
    published_at            TIMESTAMPTZ,
    created_by              BIGINT NOT NULL REFERENCES app_users (id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_campaigns_cycle UNIQUE (cycle_id),
    CONSTRAINT ck_review_campaigns_deadlines CHECK (nomination_deadline < submit_deadline),
    CONSTRAINT ck_review_campaigns_peers CHECK (min_peers >= 1 AND max_peers >= min_peers),
    CONSTRAINT ck_review_campaigns_threshold CHECK (anonymity_threshold >= 3)
);
CREATE TRIGGER trg_review_campaigns_updated_at BEFORE UPDATE ON review_campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Người được đánh giá trong đợt, kèm bản chụp quan hệ báo cáo khi mở thu phiếu (BR-055).
CREATE TABLE campaign_participants (
    campaign_id             BIGINT NOT NULL REFERENCES review_campaigns (id),
    reviewee_user_id        BIGINT NOT NULL REFERENCES app_users (id),
    manager_user_id         BIGINT REFERENCES app_users (id),
    department_id           BIGINT REFERENCES departments (id),
    snapshot_at             TIMESTAMPTZ,
    PRIMARY KEY (campaign_id, reviewee_user_id)
);
CREATE INDEX ix_campaign_participants_manager ON campaign_participants (campaign_id, manager_user_id);

CREATE TABLE nominations (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id         BIGINT NOT NULL,
    reviewee_user_id    BIGINT NOT NULL,
    status              nomination_status NOT NULL DEFAULT 'DRAFT',
    submitted_at        TIMESTAMPTZ,
    approved_by         BIGINT REFERENCES app_users (id),
    approved_at         TIMESTAMPTZ,
    CONSTRAINT uq_nominations_reviewee UNIQUE (campaign_id, reviewee_user_id),
    CONSTRAINT fk_nominations_participant FOREIGN KEY (campaign_id, reviewee_user_id)
        REFERENCES campaign_participants (campaign_id, reviewee_user_id),
    CONSTRAINT ck_nominations_approved CHECK ((status = 'APPROVED') = (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE nomination_peers (
    nomination_id   BIGINT NOT NULL REFERENCES nominations (id) ON DELETE CASCADE,
    peer_user_id    BIGINT NOT NULL REFERENCES app_users (id),
    added_by        BIGINT NOT NULL REFERENCES app_users (id),
    PRIMARY KEY (nomination_id, peer_user_id)
);

-- Đồng nghiệp được đề cử không được là chính mình, quản lý trực tiếp, cấp dưới trực tiếp hay người bị khóa (BR-053).
CREATE FUNCTION check_nomination_peer() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    rv RECORD;
    peer RECORD;
BEGIN
    SELECT n.reviewee_user_id AS id, u.manager_id INTO rv
      FROM nominations n JOIN app_users u ON u.id = n.reviewee_user_id WHERE n.id = NEW.nomination_id;
    SELECT id, manager_id, is_active, deleted_at INTO peer FROM app_users WHERE id = NEW.peer_user_id;
    IF peer.id = rv.id OR peer.id = rv.manager_id OR peer.manager_id = rv.id OR NOT peer.is_active OR peer.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Người dùng % không được đề cử làm đồng nghiệp đánh giá', NEW.peer_user_id USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_nomination_peers_rules BEFORE INSERT ON nomination_peers FOR EACH ROW EXECUTE FUNCTION check_nomination_peer();

-- Duyệt danh sách: số đồng nghiệp phải nằm trong khoảng min_peers–max_peers của đợt.
CREATE FUNCTION check_nomination_size() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    cnt INT;
    lo SMALLINT;
    hi SMALLINT;
BEGIN
    IF NEW.status IN ('PENDING', 'APPROVED') THEN
        SELECT COUNT(*) INTO cnt FROM nomination_peers WHERE nomination_id = NEW.id;
        SELECT min_peers, max_peers INTO lo, hi FROM review_campaigns WHERE id = NEW.campaign_id;
        IF cnt < lo OR cnt > hi THEN
            RAISE EXCEPTION 'Danh sách đề cử cần từ % đến % đồng nghiệp (hiện có %)', lo, hi, cnt USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_nominations_size BEFORE UPDATE OF status ON nominations FOR EACH ROW EXECUTE FUNCTION check_nomination_size();

-- Một phiếu = một cặp người đánh giá – người được đánh giá trong một đợt.
-- Bảng này chỉ cho biết ai phải chấm ai và đã nộp chưa; KHÔNG chứa điểm.
CREATE TABLE review_assignments (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id         BIGINT NOT NULL,
    reviewee_user_id    BIGINT NOT NULL,
    reviewer_user_id    BIGINT NOT NULL REFERENCES app_users (id),
    reviewer_group      reviewer_group NOT NULL,
    status              assignment_status NOT NULL DEFAULT 'NOT_STARTED',
    submitted_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_assignments_pair UNIQUE (campaign_id, reviewee_user_id, reviewer_user_id),
    CONSTRAINT fk_review_assignments_participant FOREIGN KEY (campaign_id, reviewee_user_id)
        REFERENCES campaign_participants (campaign_id, reviewee_user_id),
    CONSTRAINT ck_review_assignments_self CHECK ((reviewer_group = 'SELF') = (reviewer_user_id = reviewee_user_id)),
    CONSTRAINT ck_review_assignments_submitted CHECK ((status = 'SUBMITTED') = (submitted_at IS NOT NULL))
);
CREATE INDEX ix_review_assignments_reviewer ON review_assignments (reviewer_user_id, campaign_id);
CREATE TRIGGER trg_review_assignments_updated_at BEFORE UPDATE ON review_assignments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 9. ĐÁNH GIÁ 360: CÂU TRẢ LỜI (ẨN DANH)
-- Trong lúc thu phiếu, assignment_id cho biết câu trả lời thuộc phiếu nào để người chấm
-- lưu nháp và sửa được. Khi đợt chuyển sang CLOSED, hàm close_review_campaign() xóa
-- câu trả lời của phiếu chưa nộp và đặt assignment_id = NULL cho mọi câu trả lời còn lại.
-- Từ đó database không còn biết ai đã chấm điểm nào (BR-058), chỉ còn biết điểm đó
-- thuộc người được đánh giá nào và nhóm người đánh giá nào.
-- ============================================================
CREATE TABLE review_answers (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id         BIGINT NOT NULL REFERENCES review_campaigns (id),
    reviewee_user_id    BIGINT NOT NULL REFERENCES app_users (id),
    reviewer_group      reviewer_group NOT NULL,
    assignment_id       BIGINT REFERENCES review_assignments (id) ON DELETE CASCADE,
    response_key        UUID NOT NULL,
    criterion_id        BIGINT REFERENCES review_criteria (id),
    question_id         BIGINT REFERENCES review_questions (id),
    score               SMALLINT,
    answer_text         TEXT,
    CONSTRAINT ck_review_answers_target CHECK ((criterion_id IS NULL) <> (question_id IS NULL)),
    CONSTRAINT ck_review_answers_score CHECK (
        (criterion_id IS NOT NULL AND answer_text IS NULL AND (score IS NULL OR score BETWEEN 1 AND 5)) OR
        (question_id IS NOT NULL AND score IS NULL)
    )
);
-- score NULL trên tiêu chí = "Không đủ thông tin", không tính vào trung bình (BR-056).
-- response_key là mã ngẫu nhiên gom các câu trả lời của cùng một phiếu sau khi đã tách khỏi người chấm.
CREATE UNIQUE INDEX uq_review_answers_criterion ON review_answers (assignment_id, criterion_id) WHERE assignment_id IS NOT NULL AND criterion_id IS NOT NULL;
CREATE UNIQUE INDEX uq_review_answers_question ON review_answers (assignment_id, question_id) WHERE assignment_id IS NOT NULL AND question_id IS NOT NULL;
CREATE INDEX ix_review_answers_reviewee ON review_answers (campaign_id, reviewee_user_id, reviewer_group);

-- Vòng đời đợt đánh giá chỉ đi tiến (BR-050), và khóa tỷ trọng của chu kỳ khi bắt đầu thu phiếu.
CREATE FUNCTION check_campaign_transition() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    old_i INT := array_position(enum_range(NULL::campaign_status), OLD.status);
    new_i INT := array_position(enum_range(NULL::campaign_status), NEW.status);
BEGIN
    IF NEW.status <> OLD.status THEN
        IF new_i <> old_i + 1 THEN
            RAISE EXCEPTION 'Không chuyển được đợt đánh giá từ % sang %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
        END IF;
        CASE NEW.status
            WHEN 'NOMINATION' THEN NEW.nomination_opened_at := NOW();
            WHEN 'COLLECTING' THEN
                NEW.collection_opened_at := NOW();
                UPDATE okr_cycles SET weight_locked_at = NOW() WHERE id = NEW.cycle_id AND weight_locked_at IS NULL;
            WHEN 'CLOSED' THEN NEW.closed_at := NOW();
            WHEN 'PUBLISHED' THEN NEW.published_at := NOW();
            ELSE NULL;
        END CASE;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_review_campaigns_transition BEFORE UPDATE OF status ON review_campaigns
    FOR EACH ROW EXECUTE FUNCTION check_campaign_transition();

-- Mẫu phiếu đã được đợt khác DRAFT sử dụng thì khóa (BR-052): chỉ nhân bản được.
CREATE FUNCTION check_template_locked() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    tpl BIGINT := COALESCE(NEW.template_id, OLD.template_id);
BEGIN
    IF EXISTS (SELECT 1 FROM review_campaigns WHERE template_id = tpl AND status <> 'DRAFT') THEN
        RAISE EXCEPTION 'Mẫu phiếu % đang được sử dụng nên đã bị khóa', tpl USING ERRCODE = 'check_violation';
    END IF;
    RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER trg_review_criteria_locked BEFORE INSERT OR UPDATE OR DELETE ON review_criteria FOR EACH ROW EXECUTE FUNCTION check_template_locked();
CREATE TRIGGER trg_review_questions_locked BEFORE INSERT OR UPDATE OR DELETE ON review_questions FOR EACH ROW EXECUTE FUNCTION check_template_locked();

-- Đóng đợt: hủy phiếu chưa nộp, xóa câu trả lời nháp, tách câu trả lời khỏi người chấm.
CREATE FUNCTION close_review_campaign(p_campaign_id BIGINT) RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
    UPDATE review_campaigns SET status = 'CLOSED' WHERE id = p_campaign_id AND status = 'COLLECTING';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Đợt % không ở trạng thái đang thu phiếu', p_campaign_id USING ERRCODE = 'check_violation';
    END IF;
    DELETE FROM review_answers a USING review_assignments r
     WHERE a.assignment_id = r.id AND r.campaign_id = p_campaign_id AND r.status <> 'SUBMITTED';
    UPDATE review_assignments SET status = 'CANCELLED'
     WHERE campaign_id = p_campaign_id AND status IN ('NOT_STARTED', 'DRAFT');
    UPDATE review_answers SET assignment_id = NULL WHERE campaign_id = p_campaign_id;
END $$;

-- ============================================================
-- 10. KẾT QUẢ CUỐI KỲ
-- ============================================================
CREATE TABLE final_results (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cycle_id        BIGINT NOT NULL REFERENCES okr_cycles (id),
    user_id         BIGINT NOT NULL REFERENCES app_users (id),
    okr_progress    NUMERIC(5, 4),
    okr_score       NUMERIC(4, 2),
    review_score    NUMERIC(4, 2),
    final_score     NUMERIC(4, 2),
    grade           result_grade NOT NULL,
    computed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,
    CONSTRAINT uq_final_results UNIQUE (cycle_id, user_id),
    CONSTRAINT ck_final_results_scores CHECK (
        (okr_score IS NULL OR okr_score BETWEEN 1 AND 5) AND
        (review_score IS NULL OR review_score BETWEEN 1 AND 5) AND
        (final_score IS NULL OR final_score BETWEEN 1 AND 5)
    ),
    CONSTRAINT ck_final_results_missing CHECK ((final_score IS NULL) = (grade = 'INSUFFICIENT_DATA'))
);

-- ============================================================
-- 11. THÔNG BÁO VÀ NHẬT KÝ
-- dedupe_key = loại sự kiện + đối tượng + ngày, để mỗi người nhận tối đa một lần nhắc
-- cho mỗi sự kiện mỗi ngày kể cả khi job chạy lại (BR-081, NFR-REL-003).
-- ============================================================
CREATE TABLE notifications (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES app_users (id),
    type            notification_type NOT NULL,
    body            VARCHAR(500) NOT NULL,
    link            VARCHAR(300),
    dedupe_key      VARCHAR(200) NOT NULL,
    email_sent_at   TIMESTAMPTZ,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_notifications_dedupe UNIQUE (user_id, dedupe_key)
);
CREATE INDEX ix_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE read_at IS NULL;

-- Nhật ký không bao giờ chứa mật khẩu, hash, token, nội dung phiếu đánh giá,
-- hay người được đánh giá của phiếu thuộc nhóm ẩn danh (BR-083).
CREATE TABLE audit_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    actor_user_id   BIGINT REFERENCES app_users (id),
    action          audit_action NOT NULL,
    module          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50),
    entity_id       BIGINT,
    summary         VARCHAR(500),
    metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_audit_logs_time ON audit_logs (created_at DESC);
CREATE INDEX ix_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX ix_audit_logs_module ON audit_logs (module, created_at DESC);
CREATE TRIGGER trg_audit_logs_immutable BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- ============================================================
-- 12. TỰ ĐỘNG HÓA BẰNG AI (F13)
-- Nguyên tắc:
-- * Thao tác của người dùng chỉ ghi một sự kiện (domain_events) trong cùng transaction.
--   AI worker đọc sự kiện sau, nên AI chậm hay lỗi không làm hỏng thao tác gốc.
-- * AI chỉ ghi vào các bảng của phần này (nhãn, ghi chú rà soát, bản tin, bản nháp,
--   lịch sử chạy). Không bảng OKR hay 360 nào bị AI sửa.
-- * Lịch sử chạy không lưu nội dung gửi cho AI hay nội dung AI trả về.
-- ============================================================

-- Cấu hình từng luồng dựng sẵn. Admin chỉ bật/tắt, sửa lịch chạy và hạn mức.
CREATE TABLE automation_flows (
    flow            automation_flow PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     VARCHAR(300) NOT NULL,
    trigger_kind    trigger_kind NOT NULL,
    schedule_cron   VARCHAR(50),
    is_enabled      BOOLEAN NOT NULL DEFAULT TRUE,
    daily_quota     INT NOT NULL DEFAULT 500,
    updated_by      BIGINT REFERENCES app_users (id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_automation_flows_quota CHECK (daily_quota > 0),
    CONSTRAINT ck_automation_flows_schedule CHECK ((trigger_kind = 'SCHEDULE') = (schedule_cron IS NOT NULL))
);
CREATE TRIGGER trg_automation_flows_updated_at BEFORE UPDATE ON automation_flows FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Hộp thư sự kiện (outbox). Chỉ có loại sự kiện và id đối tượng, không chép nội dung.
CREATE TABLE domain_events (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type      domain_event_type NOT NULL,
    entity_id       BIGINT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);
CREATE INDEX ix_domain_events_pending ON domain_events (created_at) WHERE processed_at IS NULL;

CREATE FUNCTION emit_domain_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO domain_events (event_type, entity_id) VALUES (TG_ARGV[0]::domain_event_type, NEW.id);
    RETURN NULL;
END $$;
CREATE TRIGGER trg_checkins_event AFTER INSERT ON checkins
    FOR EACH ROW EXECUTE FUNCTION emit_domain_event('CHECKIN_CREATED');
CREATE TRIGGER trg_objectives_event AFTER INSERT ON objectives
    FOR EACH ROW EXECUTE FUNCTION emit_domain_event('OBJECTIVE_CREATED');
CREATE TRIGGER trg_review_campaigns_closed_event AFTER UPDATE OF status ON review_campaigns
    FOR EACH ROW WHEN (NEW.status = 'CLOSED' AND OLD.status IS DISTINCT FROM 'CLOSED')
    EXECUTE FUNCTION emit_domain_event('CAMPAIGN_CLOSED');

-- Lịch sử chạy. run_key chống chạy trùng: mỗi luồng xử lý một đối tượng đúng một lần,
-- ví dụ 'checkin:21', 'user:3:week:2026-10-26', 'campaign:1:reviewee:4'.
CREATE TABLE automation_runs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flow            automation_flow NOT NULL REFERENCES automation_flows (flow),
    event_id        BIGINT REFERENCES domain_events (id),
    run_key         VARCHAR(150) NOT NULL,
    status          run_status NOT NULL DEFAULT 'PENDING',
    attempt_count   SMALLINT NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    input_tokens    INT,
    output_tokens   INT,
    error_message   VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_automation_runs_key UNIQUE (flow, run_key),
    CONSTRAINT ck_automation_runs_attempts CHECK (attempt_count BETWEEN 0 AND 4),
    CONSTRAINT ck_automation_runs_finished CHECK ((status IN ('SUCCEEDED', 'FAILED', 'SKIPPED')) = (finished_at IS NOT NULL)),
    CONSTRAINT ck_automation_runs_error CHECK (status <> 'FAILED' OR error_message IS NOT NULL)
);
CREATE INDEX ix_automation_runs_flow_time ON automation_runs (flow, created_at DESC);
CREATE INDEX ix_automation_runs_retry ON automation_runs (next_attempt_at) WHERE status = 'PENDING';

-- Luồng cảnh báo nhận xét 360 chạy ngay khi người chấm bấm nộp. Ghi một lần chạy cho từng lượt
-- nộp sẽ để lại dấu thời gian trùng với lúc một phiếu được nộp, nên luồng này chỉ được đếm số lần
-- gọi AI theo ngày (automation_daily_usage), không bao giờ có dòng trong automation_runs.
CREATE FUNCTION check_automation_run() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.flow = 'REVIEW_COMMENT_GUARD' THEN
        RAISE EXCEPTION 'Luồng cảnh báo nhận xét 360 không được ghi lịch sử chạy từng lần'
            USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_automation_runs_rules BEFORE INSERT OR UPDATE OF flow ON automation_runs
    FOR EACH ROW EXECUTE FUNCTION check_automation_run();

-- Số lần gọi AI mỗi luồng mỗi ngày, để áp hạn mức.
CREATE TABLE automation_daily_usage (
    flow            automation_flow NOT NULL REFERENCES automation_flows (flow),
    usage_date      DATE NOT NULL,
    call_count      INT NOT NULL DEFAULT 0 CHECK (call_count >= 0),
    PRIMARY KEY (flow, usage_date)
);

-- Kết quả AI trên một check-in: phân loại vướng mắc (BLOCKER_ROUTING) và
-- kiểm tra mức tự tin có khớp ghi chú không (CHECKIN_MISMATCH).
-- Mỗi luồng chỉ được điền phần của mình một lần; sau đó chỉ trưởng phòng nhận việc được cập nhật trạng thái xử lý.
CREATE TABLE checkin_insights (
    checkin_id              BIGINT PRIMARY KEY REFERENCES checkins (id),
    blocker_run_id          BIGINT REFERENCES automation_runs (id),
    blocker_category        blocker_category,
    severity                severity_level,
    target_department_id    BIGINT REFERENCES departments (id),
    mismatch_run_id         BIGINT REFERENCES automation_runs (id),
    is_mismatch             BOOLEAN,
    routing                 routing_status,
    handled_by              BIGINT REFERENCES app_users (id),
    handled_at              TIMESTAMPTZ,
    handler_note            VARCHAR(300),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_checkin_insights_blocker CHECK ((blocker_category IS NULL) = (severity IS NULL) AND (blocker_category IS NULL) = (blocker_run_id IS NULL)),
    CONSTRAINT ck_checkin_insights_mismatch CHECK ((is_mismatch IS NULL) = (mismatch_run_id IS NULL)),
    CONSTRAINT ck_checkin_insights_target CHECK (target_department_id IS NULL OR blocker_category = 'DEPENDENCY'),
    CONSTRAINT ck_checkin_insights_routing CHECK ((routing IS NOT NULL) = (target_department_id IS NOT NULL)),
    CONSTRAINT ck_checkin_insights_handled CHECK ((COALESCE(routing, 'OPEN') <> 'OPEN') = (handled_by IS NOT NULL AND handled_at IS NOT NULL))
);
CREATE INDEX ix_checkin_insights_open ON checkin_insights (target_department_id) WHERE routing = 'OPEN';

CREATE FUNCTION check_checkin_insight() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    author_dept BIGINT;
    head BIGINT;
BEGIN
    IF NEW.target_department_id IS NOT NULL THEN
        SELECT u.department_id INTO author_dept FROM checkins c JOIN app_users u ON u.id = c.created_by WHERE c.id = NEW.checkin_id;
        -- Không chuyển về đơn vị của người check-in hay phòng ban chứa team của họ.
        IF NEW.target_department_id = author_dept
           OR NEW.target_department_id = (SELECT parent_id FROM departments WHERE id = author_dept AND unit_type = 'TEAM') THEN
            RAISE EXCEPTION 'Vướng mắc phụ thuộc phòng khác không chuyển về chính phòng của người check-in'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    IF TG_OP = 'UPDATE' THEN
        -- Kết quả AI đã ghi thì giữ nguyên; luồng còn lại chỉ được điền phần đang trống.
        IF (OLD.blocker_category IS NOT NULL AND (NEW.blocker_category, NEW.severity, NEW.target_department_id, NEW.blocker_run_id)
                IS DISTINCT FROM (OLD.blocker_category, OLD.severity, OLD.target_department_id, OLD.blocker_run_id))
           OR (OLD.is_mismatch IS NOT NULL AND (NEW.is_mismatch, NEW.mismatch_run_id) IS DISTINCT FROM (OLD.is_mismatch, OLD.mismatch_run_id)) THEN
            RAISE EXCEPTION 'Kết quả AI trên check-in đã ghi thì không sửa được' USING ERRCODE = 'check_violation';
        END IF;
        IF OLD.routing IS DISTINCT FROM 'OPEN' AND NEW.routing IS DISTINCT FROM OLD.routing AND OLD.routing IS NOT NULL THEN
            RAISE EXCEPTION 'Vướng mắc đã được xử lý, không đổi trạng thái được nữa' USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    IF NEW.handled_by IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.handled_by IS DISTINCT FROM OLD.handled_by) THEN
        SELECT head_user_id INTO head FROM departments WHERE id = NEW.target_department_id;
        IF head IS DISTINCT FROM NEW.handled_by THEN
            RAISE EXCEPTION 'Chỉ trưởng phòng được chuyển đến mới xử lý được vướng mắc này'
                USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_checkin_insights_rules BEFORE INSERT OR UPDATE ON checkin_insights
    FOR EACH ROW EXECUTE FUNCTION check_checkin_insight();

-- Ghi chú rà soát OKR mới tạo. Người tạo tự quyết định sửa hay bỏ qua.
CREATE TABLE objective_review_notes (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    objective_id    BIGINT NOT NULL REFERENCES objectives (id),
    key_result_id   BIGINT REFERENCES key_results (id),
    run_id          BIGINT NOT NULL REFERENCES automation_runs (id),
    issue           review_issue NOT NULL,
    message         VARCHAR(300) NOT NULL,
    dismissed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_objective_review_notes_objective ON objective_review_notes (objective_id) WHERE dismissed_at IS NULL;

-- Bản tin tuần: stats lấy từ database, highlights do AI viết (tối đa 3 mục).
CREATE TABLE weekly_digests (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    manager_user_id BIGINT NOT NULL REFERENCES app_users (id),
    week_start      DATE NOT NULL,
    run_id          BIGINT NOT NULL REFERENCES automation_runs (id),
    stats           JSONB NOT NULL,
    highlights      JSONB NOT NULL DEFAULT '[]'::jsonb,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_weekly_digests UNIQUE (manager_user_id, week_start),
    CONSTRAINT ck_weekly_digests_monday CHECK (EXTRACT(ISODOW FROM week_start) = 1),
    CONSTRAINT ck_weekly_digests_highlights CHECK (jsonb_typeof(highlights) = 'array' AND jsonb_array_length(highlights) <= 3)
);

-- Bản nháp 1-1: AI đề xuất (ai_strengths, ai_improvements, không bao giờ đổi), người duyệt sửa
-- thành edited_text rồi gửi. reviewer_user_id là quản lý theo bản chụp lúc mở thu phiếu;
-- NULL nghĩa là người không có quản lý trực tiếp, do HR duyệt.
CREATE TABLE one_on_one_drafts (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    campaign_id         BIGINT NOT NULL,
    reviewee_user_id    BIGINT NOT NULL,
    reviewer_user_id    BIGINT REFERENCES app_users (id),
    run_id              BIGINT NOT NULL REFERENCES automation_runs (id),
    ai_strengths        JSONB NOT NULL,
    ai_improvements     JSONB NOT NULL,
    edited_text         TEXT,
    status              draft_status NOT NULL DEFAULT 'PENDING_REVIEW',
    sent_by             BIGINT REFERENCES app_users (id),
    sent_at             TIMESTAMPTZ,
    discarded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_one_on_one_participant FOREIGN KEY (campaign_id, reviewee_user_id)
        REFERENCES campaign_participants (campaign_id, reviewee_user_id),
    CONSTRAINT uq_one_on_one_drafts UNIQUE (campaign_id, reviewee_user_id),
    CONSTRAINT ck_one_on_one_sent CHECK ((status = 'SENT') = (sent_by IS NOT NULL AND sent_at IS NOT NULL AND edited_text IS NOT NULL)),
    CONSTRAINT ck_one_on_one_discarded CHECK ((status = 'DISCARDED') = (discarded_at IS NOT NULL))
);
CREATE INDEX ix_one_on_one_drafts_reviewer ON one_on_one_drafts (reviewer_user_id, status);
CREATE TRIGGER trg_one_on_one_drafts_updated_at BEFORE UPDATE ON one_on_one_drafts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE FUNCTION check_one_on_one_draft() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    c_status campaign_status;
    snapshot_manager BIGINT;
    sender_role user_role;
BEGIN
    SELECT c.status, p.manager_user_id INTO c_status, snapshot_manager
      FROM review_campaigns c JOIN campaign_participants p ON p.campaign_id = c.id
     WHERE c.id = NEW.campaign_id AND p.reviewee_user_id = NEW.reviewee_user_id;
    IF TG_OP = 'INSERT' THEN
        IF c_status NOT IN ('CLOSED', 'PUBLISHED') THEN
            RAISE EXCEPTION 'Chỉ tạo bản nháp 1-1 sau khi đợt đánh giá đã đóng' USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.reviewer_user_id IS DISTINCT FROM snapshot_manager THEN
            RAISE EXCEPTION 'Người duyệt bản nháp phải là quản lý trực tiếp lúc mở thu phiếu' USING ERRCODE = 'check_violation';
        END IF;
        RETURN NEW;
    END IF;
    IF (NEW.campaign_id, NEW.reviewee_user_id, NEW.reviewer_user_id, NEW.run_id, NEW.ai_strengths, NEW.ai_improvements)
       IS DISTINCT FROM (OLD.campaign_id, OLD.reviewee_user_id, OLD.reviewer_user_id, OLD.run_id, OLD.ai_strengths, OLD.ai_improvements) THEN
        RAISE EXCEPTION 'Nội dung AI đề xuất được giữ nguyên; chỉ sửa ở phần nội dung đã duyệt' USING ERRCODE = 'check_violation';
    END IF;
    IF OLD.status <> 'PENDING_REVIEW' AND (NEW.status, NEW.edited_text) IS DISTINCT FROM (OLD.status, OLD.edited_text) THEN
        RAISE EXCEPTION 'Bản nháp đã gửi hoặc đã bỏ thì không sửa được' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.status = 'SENT' AND OLD.status <> 'SENT' THEN
        IF c_status <> 'PUBLISHED' THEN
            RAISE EXCEPTION 'Chỉ gửi tóm tắt 1-1 sau khi kết quả đợt đánh giá đã công bố' USING ERRCODE = 'check_violation';
        END IF;
        SELECT role INTO sender_role FROM app_users WHERE id = NEW.sent_by;
        -- So sánh bằng IS NOT DISTINCT FROM: reviewer_user_id có thể NULL, dùng "=" sẽ ra NULL và lọt qua kiểm tra.
        IF NOT ((NEW.reviewer_user_id IS NOT NULL AND NEW.sent_by IS NOT DISTINCT FROM NEW.reviewer_user_id)
                OR (NEW.reviewer_user_id IS NULL AND sender_role IS NOT DISTINCT FROM 'HR')) THEN
            RAISE EXCEPTION 'Chỉ người duyệt của bản nháp mới gửi được' USING ERRCODE = 'insufficient_privilege';
        END IF;
    END IF;
    RETURN NEW;
END $$;
CREATE TRIGGER trg_one_on_one_drafts_rules BEFORE INSERT OR UPDATE ON one_on_one_drafts
    FOR EACH ROW EXECUTE FUNCTION check_one_on_one_draft();

-- ============================================================
-- 13. VIEWS
-- ============================================================

-- Tiến độ từng Key Result theo BR-042: (hiện tại − ban đầu) / (đích − ban đầu), giới hạn 0–1.
CREATE VIEW vw_key_result_progress AS
SELECT
    k.id                AS key_result_id,
    k.objective_id,
    k.kr_type,
    k.start_value,
    k.target_value,
    COALESCE(k.current_value, k.start_value) AS current_value,
    k.current_confidence,
    k.last_checkin_at,
    CASE
        WHEN k.kr_type = 'BOOLEAN' THEN CASE WHEN COALESCE(k.current_value, 0) >= 1 THEN 1 ELSE 0 END
        ELSE GREATEST(0, LEAST(1, (COALESCE(k.current_value, k.start_value) - k.start_value) / (k.target_value - k.start_value)))
    END::NUMERIC(5, 4) AS progress
FROM key_results k
WHERE k.deleted_at IS NULL;

-- Cây OKR: mỗi Objective kèm gốc, độ sâu và đường dẫn từ gốc (dùng cho trang Cây OKR, breadcrumb).
CREATE VIEW vw_objective_tree AS
WITH RECURSIVE tree AS (
    SELECT o.id, o.cycle_id, o.parent_id, o.level, o.title, o.id AS root_id, 0 AS depth, ARRAY[o.id] AS path
      FROM objectives o
     WHERE o.parent_id IS NULL AND o.deleted_at IS NULL
    UNION ALL
    SELECT c.id, c.cycle_id, c.parent_id, c.level, c.title, t.root_id, t.depth + 1, t.path || c.id
      FROM objectives c JOIN tree t ON c.parent_id = t.id
     WHERE c.deleted_at IS NULL
)
SELECT * FROM tree;

-- Tiến độ nộp phiếu theo người đánh giá: chỉ có số lượng, không có người được đánh giá (UC20).
CREATE VIEW vw_campaign_reviewer_progress AS
SELECT
    campaign_id,
    reviewer_user_id,
    COUNT(*) FILTER (WHERE status <> 'CANCELLED')                        AS total_forms,
    COUNT(*) FILTER (WHERE status IN ('NOT_STARTED', 'DRAFT'))           AS remaining_forms
FROM review_assignments
GROUP BY campaign_id, reviewer_user_id;

-- Điểm 360 theo nhóm người đánh giá và tiêu chí, chưa áp ngưỡng ẩn danh.
-- Chỉ dùng nội bộ ở tầng nghiệp vụ; API không bao giờ trả trực tiếp view này.
CREATE VIEW vw_review_group_scores AS
SELECT
    a.campaign_id,
    a.reviewee_user_id,
    a.reviewer_group,
    a.criterion_id,
    COUNT(DISTINCT a.response_key)          AS form_count,
    AVG(a.score)::NUMERIC(4, 2)             AS avg_score
FROM review_answers a
JOIN review_campaigns c ON c.id = a.campaign_id
WHERE a.criterion_id IS NOT NULL
  AND c.status IN ('CLOSED', 'PUBLISHED')
GROUP BY a.campaign_id, a.reviewee_user_id, a.reviewer_group, a.criterion_id;

-- Tình trạng từng luồng tự động cho màn hình Tự động hóa (UC27, UC28).
CREATE VIEW vw_automation_flow_status AS
SELECT
    f.flow,
    f.name,
    f.trigger_kind,
    f.schedule_cron,
    f.is_enabled,
    f.daily_quota,
    COALESCE(u.call_count, 0)                                                           AS calls_today,
    (SELECT MAX(r.created_at) FROM automation_runs r WHERE r.flow = f.flow)              AS last_run_at,
    (SELECT COUNT(*) FROM automation_runs r WHERE r.flow = f.flow AND r.status = 'FAILED'
        AND r.created_at > NOW() - INTERVAL '7 days')                                     AS failed_7d,
    (SELECT COUNT(*) FROM automation_runs r WHERE r.flow = f.flow AND r.status = 'PENDING') AS pending
FROM automation_flows f
LEFT JOIN automation_daily_usage u ON u.flow = f.flow AND u.usage_date = CURRENT_DATE;

-- Vướng mắc AI đã chuyển tới một phòng ban và đang chờ trưởng phòng nhận (UC29).
CREATE VIEW vw_open_blockers AS
SELECT
    i.checkin_id,
    i.target_department_id,
    d.head_user_id          AS handler_user_id,
    i.blocker_category,
    i.severity,
    c.key_result_id,
    c.created_by            AS reported_by,
    c.blocker,
    c.created_at            AS reported_at
FROM checkin_insights i
JOIN checkins c ON c.id = i.checkin_id
JOIN departments d ON d.id = i.target_department_id
WHERE i.routing = 'OPEN';

COMMIT;

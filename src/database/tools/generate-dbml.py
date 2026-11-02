"""Sinh src/database/okr360.dbml từ một database đã chạy okr360.sql, để DBML luôn khớp SQL.

Chạy: python3 src/database/tools/generate-dbml.py "<psql connection args>" > src/database/okr360.dbml
Ví dụ: python3 src/database/tools/generate-dbml.py "-h localhost -U postgres -d okr360" > src/database/okr360.dbml
Dán nội dung file DBML vào https://dbdiagram.io để xem sơ đồ.
"""
import subprocess
import sys

CONN = sys.argv[1] if len(sys.argv) > 1 else ""
SCHEMA = "okr360"

NOTES = {
    "departments": "Cây đơn vị tổ chức: phòng ban và team (unit_type). Team nằm ngay dưới một phòng ban, không có đơn vị con. head_user_id là trưởng phòng hoặc team lead.",
    "app_users": "Người dùng. Mỗi người một vai trò và tối đa một quản lý trực tiếp; trigger chặn vòng lặp báo cáo.",
    "okr_cycles": "Chu kỳ OKR theo quý. Chỉ một chu kỳ ACTIVE; trạng thái chỉ đi tiến; tỷ trọng OKR/360 khóa khi đợt 360 thu phiếu.",
    "objectives": "Objective 4 cấp (công ty, phòng ban, team, cá nhân), nối thành cây bằng parent_id. progress là giá trị lưu đệm do tầng nghiệp vụ cộng dồn; final_progress chốt khi đóng chu kỳ.",
    "key_results": "1–5 KR mỗi Objective. current_value / current_confidence lưu đệm từ check-in mới nhất.",
    "checkins": "Bản ghi bất biến: không sửa, không xóa. Chỉ người phụ trách KR, chỉ khi chu kỳ ACTIVE.",
    "checkin_comments": "Bình luận của quản lý trực tiếp trên một lần check-in.",
    "review_templates": "Mẫu phiếu 360. Khóa khi đã có đợt khác DRAFT sử dụng.",
    "review_criteria": "Tiêu chí chấm điểm 1–5 của mẫu phiếu.",
    "review_questions": "Câu hỏi mở của mẫu phiếu.",
    "review_campaigns": "Đợt đánh giá 360, tối đa một đợt mỗi chu kỳ. DRAFT → NOMINATION → COLLECTING → CLOSED → PUBLISHED.",
    "campaign_participants": "Người được đánh giá, kèm bản chụp quản lý trực tiếp và phòng ban khi mở thu phiếu.",
    "nominations": "Danh sách đồng nghiệp một người đề cử, chờ quản lý duyệt.",
    "nomination_peers": "Từng đồng nghiệp trong danh sách đề cử.",
    "review_assignments": "Ai phải chấm ai và đã nộp chưa. KHÔNG chứa điểm.",
    "review_answers": "Điểm và nhận xét. assignment_id bị đặt NULL khi đóng đợt nên database không còn biết ai chấm điểm nào.",
    "final_results": "Kết quả cuối kỳ: điểm OKR, điểm 360, điểm cuối kỳ theo tỷ trọng của chu kỳ.",
    "notifications": "Thông báo trong ứng dụng và email. dedupe_key chống gửi trùng.",
    "audit_logs": "Nhật ký chỉ thêm mới. Không chứa mật khẩu, token, nội dung phiếu hay cặp người chấm ẩn danh.",
    "automation_flows": "Cấu hình 6 luồng AI dựng sẵn: bật/tắt, lịch chạy, hạn mức gọi AI mỗi ngày.",
    "domain_events": "Hộp thư sự kiện (outbox) do trigger ghi cùng transaction với thao tác gốc. Chỉ có id đối tượng, không chép nội dung.",
    "automation_runs": "Lịch sử chạy. UNIQUE (flow, run_key) chống chạy trùng. Không lưu nội dung gửi cho AI hay AI trả về.",
    "automation_daily_usage": "Số lần gọi AI mỗi luồng mỗi ngày để áp hạn mức. Luồng cảnh báo nhận xét 360 chỉ được ghi ở đây.",
    "checkin_insights": "Nhãn AI trên check-in: phân loại vướng mắc, phòng ban liên quan, check-in không khớp; trạng thái xử lý của trưởng phòng nhận việc.",
    "objective_review_notes": "Ghi chú rà soát OKR mới tạo. Người tạo tự quyết định sửa hay bỏ qua.",
    "weekly_digests": "Bản tin tuần: stats tính từ database, highlights (tối đa 3) do AI viết.",
    "one_on_one_drafts": "Bản nháp 1-1: đề xuất gốc của AI không đổi; người duyệt sửa edited_text rồi gửi, chỉ sau khi đợt đã công bố.",
}


def q(sql):
    out = subprocess.run(f'psql {CONN} -tA -F "|" -c "{sql}"', shell=True, capture_output=True, text=True, check=True).stdout
    return [line.split("|") for line in out.strip().splitlines() if line]


enums = q(f"""SELECT t.typname, string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) FROM pg_type t
 JOIN pg_enum e ON e.enumtypid = t.oid JOIN pg_namespace n ON n.oid = t.typnamespace
 WHERE n.nspname = '{SCHEMA}' GROUP BY t.typname ORDER BY MIN(t.oid)""")
tables = [r[0] for r in q(f"""SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = '{SCHEMA}' AND c.relkind = 'r' ORDER BY c.oid""")]
cols = q(f"""SELECT table_name, column_name, CASE WHEN data_type = 'USER-DEFINED' THEN udt_name
 WHEN data_type = 'character varying' THEN 'varchar(' || character_maximum_length || ')'
 WHEN data_type = 'numeric' THEN 'numeric(' || numeric_precision || ',' || numeric_scale || ')'
 WHEN data_type = 'timestamp with time zone' THEN 'timestamptz' ELSE data_type END,
 is_nullable, COALESCE(column_default, ''), is_identity FROM information_schema.columns
 WHERE table_schema = '{SCHEMA}' ORDER BY table_name, ordinal_position""")
pks = q(f"""SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position)
 FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu
 ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
 WHERE tc.table_schema = '{SCHEMA}' AND tc.constraint_type = 'PRIMARY KEY' GROUP BY tc.table_name""")
fks = q(f"""SELECT cl.relname, att.attname, fcl.relname, fatt.attname
 FROM pg_constraint co JOIN pg_class cl ON cl.oid = co.conrelid JOIN pg_class fcl ON fcl.oid = co.confrelid
 JOIN pg_namespace n ON n.oid = co.connamespace
 CROSS JOIN LATERAL unnest(co.conkey, co.confkey) AS k(a, b)
 JOIN pg_attribute att ON att.attrelid = co.conrelid AND att.attnum = k.a
 JOIN pg_attribute fatt ON fatt.attrelid = co.confrelid AND fatt.attnum = k.b
 WHERE co.contype = 'f' AND n.nspname = '{SCHEMA}' ORDER BY cl.oid, co.oid""")
uniques = q(f"""SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position)
 FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu
 ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
 WHERE tc.table_schema = '{SCHEMA}' AND tc.constraint_type = 'UNIQUE' GROUP BY tc.table_name, tc.constraint_name""")

pk_map = {t: c.split(",") for t, c in pks}
out = []
w = out.append
w("// SINH TỰ ĐỘNG từ database đã chạy okr360.sql — không sửa tay.")
w("// Script: src/database/tools/generate-dbml.py · Xem sơ đồ: dán vào https://dbdiagram.io")
w("Project okr360 {")
w("  database_type: 'PostgreSQL'")
w("  Note: 'OKR360 — quản lý OKR và đánh giá 360 độ. Schema okr360. Trigger, view và hàm nằm trong okr360.sql.'")
w("}")
w("")
for name, labels in enums:
    w(f"Enum {name} {{")
    for lb in labels.split(","):
        w(f"  {lb}")
    w("}")
    w("")
for t in tables:
    w(f"Table {t} {{")
    for tn, cn, typ, nullable, default, ident in cols:
        if tn != t:
            continue
        attrs = []
        if cn in pk_map.get(t, []) and len(pk_map[t]) == 1:
            attrs.append("pk")
        if ident == "YES":
            attrs.append("increment")
        if nullable == "NO" and cn not in pk_map.get(t, []):
            attrs.append("not null")
        if default and "nextval" not in default:
            d = default.split("::")[0]
            attrs.append(f"default: `{d}`" if not d.startswith("'") else f"default: {d}")
        w(f"  {cn} {typ}" + (f" [{', '.join(attrs)}]" if attrs else ""))
    idx = [c for tn, c in uniques if tn == t]
    if len(pk_map.get(t, [])) > 1 or idx:
        w("")
        w("  Indexes {")
        if len(pk_map.get(t, [])) > 1:
            w(f"    ({', '.join(pk_map[t])}) [pk]")
        for c in idx:
            cs = c.split(",")
            w(f"    ({', '.join(cs)}) [unique]" if len(cs) > 1 else f"    {cs[0]} [unique]")
        w("  }")
    if t in NOTES:
        w("")
        w(f"  Note: '{NOTES[t]}'")
    w("}")
    w("")
seen = set()
for t, c, ft, fc in fks:
    key = (t, c, ft, fc)
    if key in seen:
        continue
    seen.add(key)
    w(f"Ref: {t}.{c} > {ft}.{fc}")
print("\n".join(out))

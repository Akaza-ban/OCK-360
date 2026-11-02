// Sinh src/database/seed_demo.sql từ dữ liệu giả của giao diện (src/frontend/src/lib/data.js),
// để database và bản giao diện mẫu luôn dùng cùng một bộ dữ liệu.
// Dùng chính các hàm tính tiến độ và điểm 360 của giao diện cho giá trị lưu đệm và kết quả cuối kỳ.
//
// Chạy: node src/database/tools/generate-seed.mjs > src/database/seed_demo.sql
import { randomUUID } from 'node:crypto';
import * as D from '../../frontend/src/lib/data.js';
import { progressMap, okrScore, finalScore, grade } from '../../frontend/src/lib/okr.js';
import { aggregate360 } from '../../frontend/src/lib/review.js';

const out = [];
const w = (s = '') => out.push(s);

// ---- ánh xạ id dạng chữ của mock sang id số của database ----
const idMap = (list, start = 1) => new Map(list.map((x, i) => [x.id, i + start]));
const U = new Map(D.users.map((u) => [u.id, Number(u.id.slice(1))]));
const DEP = idMap(D.departments);
const CY = idMap(D.cycles);
const OB = idMap(D.objectives);
const KR = idMap(D.keyResults);
const CK = idMap([...D.checkins].sort((a, b) => a.at.localeCompare(b.at)));
const TPL = idMap(D.templates);
const CR = idMap(D.templates.flatMap((t) => t.criteria));
const QS = idMap(D.templates.flatMap((t) => t.questions));
const CP = idMap(D.campaigns);
const NM = idMap(D.nominations);
const RF = idMap(D.reviewForms);
const RUN = idMap(D.automationRuns);
const NOTE = idMap(D.objectiveReviewNotes);
const WD = idMap(D.weeklyDigests);
const OO = idMap(D.oneOnOneDrafts);

const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const ts = (at) => q(`${at.length === 10 ? `${at}T08:00` : at}:00+07`);
const row = (vals) => `(${vals.join(', ')})`;

// Giá trị tiến độ lưu đệm, tính bằng đúng hàm của giao diện.
const pm = progressMap({ ...D });

const ROLE_GRADE = { 'Xuất sắc': 'EXCELLENT', Tốt: 'GOOD', Đạt: 'MEETS', 'Cần cải thiện': 'NEEDS_IMPROVEMENT', 'Thiếu dữ liệu': 'INSUFFICIENT_DATA' };
const AUDIT_ACTION = {
  'Check-in': 'CHECKIN', 'Bình luận check-in': 'CREATE', 'Mở thu phiếu': 'STATUS_CHANGE', 'Nộp phiếu': 'SUBMIT',
  'Cập nhật người dùng': 'UPDATE', 'Kích hoạt chu kỳ': 'STATUS_CHANGE', 'Đóng chu kỳ': 'STATUS_CHANGE', 'Đăng nhập': 'LOGIN',
  'Cập nhật luồng tự động': 'UPDATE', 'Cập nhật phòng ban': 'UPDATE', 'Gửi tóm tắt 1-1': 'PUBLISH', 'Nhận xử lý vướng mắc': 'UPDATE',
};

w('-- ============================================================');
w('-- Dữ liệu mẫu OKR360 — SINH TỰ ĐỘNG, không sửa tay.');
w('-- Nguồn: src/frontend/src/lib/data.js · Script: src/database/tools/generate-seed.mjs');
w('-- Chạy sau okr360.sql. Mật khẩu của mọi tài khoản demo: 123456');
w('-- ============================================================');
w('BEGIN;');
w('SET search_path TO okr360, public;');
w('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
w();

// ---- tổ chức ----
w('-- Phòng ban và team (người phụ trách gán sau khi có người dùng)');
w('INSERT INTO departments (id, name, parent_id, unit_type) OVERRIDING SYSTEM VALUE VALUES');
w(D.departments.map((d) => '  ' + row([DEP.get(d.id), q(d.name), d.parentId ? DEP.get(d.parentId) : 'NULL', q(d.type || 'DEPARTMENT')])).join(',\n') + ';');
w();
w('-- Người dùng (quản lý được thêm trước nhân viên của họ)');
w('INSERT INTO app_users (id, email, password_hash, full_name, job_title, role, department_id, manager_id, is_active) OVERRIDING SYSTEM VALUE VALUES');
w(D.users.map((u) => '  ' + row([U.get(u.id), q(u.email), "crypt('123456', gen_salt('bf', 10))", q(u.name), q(u.title), q(u.role), DEP.get(u.deptId), u.managerId ? U.get(u.managerId) : 'NULL', u.active])).join(',\n') + ';');
w();
D.departments.forEach((d) => w(`UPDATE departments SET head_user_id = ${U.get(d.headId)} WHERE id = ${DEP.get(d.id)};`));
w();

// ---- cấu hình luồng tự động AI ----
w('-- Luồng tự động AI dựng sẵn');
w('INSERT INTO automation_flows (flow, name, description, trigger_kind, schedule_cron, is_enabled, daily_quota, updated_by) VALUES');
w(D.automationFlows.map((f) => '  ' + row([q(f.id), q(f.name), q(f.description), q(f.trigger), q(f.schedule), f.enabled, f.quota, U.get('u1')])).join(',\n') + ';');
w();

// ---- mẫu phiếu ----
w('-- Mẫu phiếu đánh giá');
D.templates.forEach((t) => {
  w(`INSERT INTO review_templates (id, name, created_by) OVERRIDING SYSTEM VALUE VALUES (${TPL.get(t.id)}, ${q(t.name)}, ${U.get('u2')});`);
  w('INSERT INTO review_criteria (id, template_id, name, description, is_required, sort_order) OVERRIDING SYSTEM VALUE VALUES');
  w(t.criteria.map((c, i) => '  ' + row([CR.get(c.id), TPL.get(t.id), q(c.name), q(c.description), c.required, i + 1])).join(',\n') + ';');
  w('INSERT INTO review_questions (id, template_id, question_text, sort_order) OVERRIDING SYSTEM VALUE VALUES');
  w(t.questions.map((x, i) => '  ' + row([QS.get(x.id), TPL.get(t.id), q(x.text), i + 1])).join(',\n') + ';');
});
w();

// ---- từng chu kỳ: chu kỳ đã đóng được tạo ở trạng thái ACTIVE, nạp dữ liệu, rồi mới đóng ----
const order = [...D.cycles].sort((a, b) => a.start.localeCompare(b.start));
for (const c of order) {
  const cid = CY.get(c.id);
  w(`-- ============ Chu kỳ ${c.name} ============`);
  w('INSERT INTO okr_cycles (id, name, start_date, end_date, planning_deadline, status, max_objectives_per_user, okr_weight, created_by) OVERRIDING SYSTEM VALUE VALUES');
  w('  ' + row([cid, q(c.name), q(c.start), q(c.end), q(c.planningDeadline), "'ACTIVE'", c.maxObjectives, c.okrWeight, U.get('u2')]) + ';');

  const objs = D.objectives.filter((o) => o.cycleId === c.id);
  w('INSERT INTO objectives (id, cycle_id, level, title, description, owner_user_id, department_id, parent_id, progress, created_by) OVERRIDING SYSTEM VALUE VALUES');
  w(objs.map((o) => '  ' + row([OB.get(o.id), cid, q(o.level), q(o.title), q(o.description || null), U.get(o.ownerId), DEP.get(o.deptId), o.parentId ? OB.get(o.parentId) : 'NULL', pm.get(o.id).toFixed(4), U.get(o.ownerId)])).join(',\n') + ';');

  const krs = D.keyResults.filter((k) => objs.some((o) => o.id === k.objectiveId));
  w('INSERT INTO key_results (id, objective_id, title, kr_type, start_value, target_value, unit, assignee_user_id, sort_order) OVERRIDING SYSTEM VALUE VALUES');
  w(krs.map((k, i) => '  ' + row([KR.get(k.id), OB.get(k.objectiveId), q(k.title), q(k.type), k.start, k.target, q(k.unit || null), U.get(k.assigneeId), i + 1])).join(',\n') + ';');

  const cks = [...D.checkins].filter((x) => krs.some((k) => k.id === x.krId)).sort((a, b) => a.at.localeCompare(b.at));
  w('INSERT INTO checkins (id, key_result_id, value, confidence, note, blocker, created_by, created_at) OVERRIDING SYSTEM VALUE VALUES');
  w(cks.map((x) => '  ' + row([CK.get(x.id), KR.get(x.krId), x.value, q(x.confidence), q(x.note || null), q(x.blocker || null), U.get(x.userId), ts(x.at)])).join(',\n') + ';');

  const cms = D.checkinComments.filter((m) => cks.some((x) => x.id === m.checkinId));
  if (cms.length) {
    w('INSERT INTO checkin_comments (checkin_id, author_user_id, body, created_at) VALUES');
    w(cms.map((m) => '  ' + row([CK.get(m.checkinId), U.get(m.userId), q(m.text), ts(m.at)])).join(',\n') + ';');
  }

  // ---- đợt đánh giá của chu kỳ ----
  const cp = D.campaigns.find((x) => x.cycleId === c.id);
  if (cp) {
    const pid = CP.get(cp.id);
    const forms = D.reviewForms.filter((f) => f.campaignId === cp.id);
    const reviewees = [...new Set(forms.map((f) => f.revieweeId))];
    w(`-- Đợt ${cp.name}: tạo ở DRAFT rồi đi tiến từng bước như vòng đời thật`);
    w('INSERT INTO review_campaigns (id, cycle_id, template_id, name, nomination_deadline, submit_deadline, created_by) OVERRIDING SYSTEM VALUE VALUES');
    w('  ' + row([pid, cid, TPL.get(cp.templateId), q(cp.name), q(cp.nominationDeadline), q(cp.submitDeadline), U.get('u2')]) + ';');
    w('INSERT INTO campaign_participants (campaign_id, reviewee_user_id, manager_user_id, department_id, snapshot_at) VALUES');
    // Bản chụp quan hệ báo cáo: lấy theo managerSnapshot của đợt nếu có (tổ chức đã đổi sau đợt đó).
    const snapManager = (u) => (cp.managerSnapshot && u.id in cp.managerSnapshot ? cp.managerSnapshot[u.id] : u.managerId);
    w(reviewees.map((r) => { const u = D.users.find((x) => x.id === r); const m = snapManager(u); return '  ' + row([pid, U.get(r), m ? U.get(m) : 'NULL', DEP.get(u.deptId), 'NOW()']); }).join(',\n') + ';');
    w(`UPDATE review_campaigns SET status = 'NOMINATION' WHERE id = ${pid};`);

    const noms = D.nominations.filter((n) => n.campaignId === cp.id);
    noms.forEach((n) => {
      w(`INSERT INTO nominations (id, campaign_id, reviewee_user_id) OVERRIDING SYSTEM VALUE VALUES (${NM.get(n.id)}, ${pid}, ${U.get(n.revieweeId)});`);
      w('INSERT INTO nomination_peers (nomination_id, peer_user_id, added_by) VALUES ' + n.peerIds.map((p) => row([NM.get(n.id), U.get(p), U.get(n.revieweeId)])).join(', ') + ';');
      const mgr = D.users.find((x) => x.id === n.revieweeId).managerId;
      w(n.status === 'APPROVED'
        ? `UPDATE nominations SET status = 'APPROVED', submitted_at = NOW(), approved_by = ${U.get(mgr)}, approved_at = NOW() WHERE id = ${NM.get(n.id)};`
        : `UPDATE nominations SET status = 'PENDING', submitted_at = NOW() WHERE id = ${NM.get(n.id)};`);
    });
    w(`UPDATE review_campaigns SET status = 'COLLECTING' WHERE id = ${pid};`);

    const STATUS = { NOT_STARTED: 'NOT_STARTED', DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED' };
    w('INSERT INTO review_assignments (id, campaign_id, reviewee_user_id, reviewer_user_id, reviewer_group, status, submitted_at) OVERRIDING SYSTEM VALUE VALUES');
    w(forms.map((f) => '  ' + row([RF.get(f.id), pid, U.get(f.revieweeId), U.get(f.reviewerId), q(f.group), q(STATUS[f.status]), f.status === 'SUBMITTED' ? ts(cp.submitDeadline) : 'NULL'])).join(',\n') + ';');

    const tpl = D.templates.find((t) => t.id === cp.templateId);
    const answers = [];
    forms.filter((f) => f.status !== 'NOT_STARTED').forEach((f) => {
      const key = q(randomUUID());
      tpl.criteria.forEach((cr) => {
        if (cr.id in (f.scores || {})) answers.push(row([pid, U.get(f.revieweeId), q(f.group), RF.get(f.id), key, CR.get(cr.id), 'NULL', f.scores[cr.id] ?? 'NULL', 'NULL']));
      });
      tpl.questions.forEach((qq) => {
        if (f.answers?.[qq.id]) answers.push(row([pid, U.get(f.revieweeId), q(f.group), RF.get(f.id), key, 'NULL', QS.get(qq.id), 'NULL', q(f.answers[qq.id])]));
      });
    });
    w('INSERT INTO review_answers (campaign_id, reviewee_user_id, reviewer_group, assignment_id, response_key, criterion_id, question_id, score, answer_text) VALUES');
    w(answers.map((a) => '  ' + a).join(',\n') + ';');

    if (['CLOSED', 'PUBLISHED'].includes(cp.status)) w(`SELECT close_review_campaign(${pid});`);
    if (cp.status === 'PUBLISHED') w(`UPDATE review_campaigns SET status = 'PUBLISHED' WHERE id = ${pid};`);
  }

  // ---- đóng chu kỳ: chốt tiến độ cuối kỳ và tính kết quả ----
  if (c.status === 'CLOSED') {
    w(`UPDATE okr_cycles SET status = 'CLOSED' WHERE id = ${cid};`);
    w(`UPDATE objectives SET final_progress = progress WHERE cycle_id = ${cid};`);
    const state = { ...D, cycle: c, objectives: objs, keyResults: krs };
    const cmp = D.campaigns.find((x) => x.cycleId === c.id);
    const tpl = cmp && D.templates.find((t) => t.id === cmp.templateId);
    const pmc = progressMap(state);
    const results = D.users.map((u) => {
      const mine = objs.filter((o) => o.ownerId === u.id && o.level === 'INDIVIDUAL');
      const prog = mine.length ? mine.reduce((s, o) => s + pmc.get(o.id), 0) / mine.length : null;
      const okr = prog == null ? null : okrScore(prog);
      const s360 = cmp ? aggregate360(D.reviewForms, cmp.id, u.id, tpl).score : null;
      const fin = finalScore(okr, s360, c.okrWeight);
      const f2 = (x, n) => (x == null ? 'NULL' : x.toFixed(n));
      return row([cid, U.get(u.id), f2(prog, 4), f2(okr, 2), f2(s360, 2), f2(fin, 2), q(ROLE_GRADE[grade(fin)]), cmp?.status === 'PUBLISHED' ? 'NOW()' : 'NULL']);
    });
    w('INSERT INTO final_results (cycle_id, user_id, okr_progress, okr_score, review_score, final_score, grade, published_at) VALUES');
    w(results.map((r) => '  ' + r).join(',\n') + ';');
  }
  w();
}

// ---- tự động hóa bằng AI ----
// Sự kiện được trigger tự ghi khi chèn check-in, Objective và khi đóng đợt; đặt lại thời điểm cho khớp dữ liệu mẫu.
w('-- Sự kiện: lấy thời điểm của đối tượng gốc, đánh dấu đã xử lý');
w("UPDATE domain_events e SET created_at = c.created_at FROM checkins c WHERE e.event_type = 'CHECKIN_CREATED' AND e.entity_id = c.id;");
w("UPDATE domain_events e SET created_at = o.created_at FROM objectives o WHERE e.event_type = 'OBJECTIVE_CREATED' AND e.entity_id = o.id;");
w('UPDATE domain_events SET processed_at = created_at;');
const runKey = (r) => {
  const x = r.ref;
  if (x.checkinId) return `checkin:${CK.get(x.checkinId)}`;
  if (x.objectiveId) return `objective:${OB.get(x.objectiveId)}`;
  if (x.managerId) return `user:${U.get(x.managerId)}:week:${x.weekStart}`;
  return `campaign:${CP.get(x.campaignId)}:reviewee:${U.get(x.revieweeId)}`;
};
const eventRef = (r) => {
  const x = r.ref;
  if (!r.event) return 'NULL';
  const ent = x.checkinId ? CK.get(x.checkinId) : x.objectiveId ? OB.get(x.objectiveId) : CP.get(x.campaignId);
  return `(SELECT MIN(id) FROM domain_events WHERE event_type = '${r.event}' AND entity_id = ${ent})`;
};
const plusMs = (at, ms) => `(${ts(at)}::timestamptz + INTERVAL '${ms} milliseconds')`;
w('-- Lịch sử chạy (không có nội dung gửi cho AI)');
w('INSERT INTO automation_runs (id, flow, event_id, run_key, status, attempt_count, started_at, finished_at, input_tokens, output_tokens, error_message, created_at) OVERRIDING SYSTEM VALUE VALUES');
w(D.automationRuns.map((r) => '  ' + row([RUN.get(r.id), q(r.flow), eventRef(r), q(runKey(r)), q(r.status), r.attempts,
  r.status === 'SKIPPED' ? 'NULL' : ts(r.at), plusMs(r.at, r.durationMs), r.inTokens ?? 'NULL', r.outTokens ?? 'NULL',
  q(r.error ?? (r.skipReason ? `Bỏ qua: ${r.skipReason}` : null)), ts(r.at)])).join(',\n') + ';');
w('INSERT INTO automation_daily_usage (flow, usage_date, call_count) VALUES');
w(D.automationUsage.map((u) => '  ' + row([q(u.flow), q(u.date), u.calls])).join(',\n') + ';');
w();
w('-- Nhãn AI trên check-in; vướng mắc đã xử lý được cập nhật sau, đúng như luồng thật');
w('INSERT INTO checkin_insights (checkin_id, blocker_run_id, blocker_category, severity, target_department_id, mismatch_run_id, is_mismatch, routing, created_at) VALUES');
w(D.checkinInsights.map((i) => '  ' + row([CK.get(i.checkinId), i.blockerRunId ? RUN.get(i.blockerRunId) : 'NULL', q(i.category), q(i.severity),
  i.targetDeptId ? DEP.get(i.targetDeptId) : 'NULL', i.mismatchRunId ? RUN.get(i.mismatchRunId) : 'NULL', i.mismatch ?? 'NULL',
  i.targetDeptId ? "'OPEN'" : 'NULL', ts(D.checkins.find((c) => c.id === i.checkinId).at)])).join(',\n') + ';');
D.checkinInsights.filter((i) => i.routing && i.routing !== 'OPEN').forEach((i) =>
  w(`UPDATE checkin_insights SET routing = ${q(i.routing)}, handled_by = ${U.get(i.handledBy)}, handled_at = ${ts(i.handledAt)}, handler_note = ${q(i.handlerNote)} WHERE checkin_id = ${CK.get(i.checkinId)};`));
w();
w('-- Ghi chú rà soát OKR');
w('INSERT INTO objective_review_notes (id, objective_id, key_result_id, run_id, issue, message, created_at) OVERRIDING SYSTEM VALUE VALUES');
w(D.objectiveReviewNotes.map((n) => '  ' + row([NOTE.get(n.id), OB.get(n.objectiveId), n.krId ? KR.get(n.krId) : 'NULL', RUN.get(n.runId), q(n.issue), q(n.message),
  ts(D.automationRuns.find((r) => r.id === n.runId).at)])).join(',\n') + ';');
w();
w('-- Bản tin tuần');
const js = (o) => q(JSON.stringify(o)) + '::jsonb';
w('INSERT INTO weekly_digests (id, manager_user_id, week_start, run_id, stats, highlights, read_at, created_at) OVERRIDING SYSTEM VALUE VALUES');
w(D.weeklyDigests.map((d) => '  ' + row([WD.get(d.id), U.get(d.managerId), q(d.weekStart), RUN.get(d.runId),
  js({ from: d.from, to: d.to, member_count: d.stats.memberCount, checked_in_count: d.stats.checkedInCount,
    not_checked_in_user_ids: d.stats.notCheckedIn.map((u) => U.get(u)), at_risk_key_result_ids: d.stats.atRiskKrIds.map((k) => KR.get(k)),
    off_track_key_result_ids: d.stats.offTrackKrIds.map((k) => KR.get(k)) }),
  js(d.highlights.map((h) => ({ text: h.text, key_result_id: KR.get(h.krId) }))),
  d.read ? ts(d.weekStart) : 'NULL', ts(d.weekStart)])).join(',\n') + ';');
w();
w('-- Bản nháp 1-1: tạo ở trạng thái chờ duyệt, bản đã gửi được cập nhật sau (sau khi đợt đã công bố)');
w('INSERT INTO one_on_one_drafts (id, campaign_id, reviewee_user_id, reviewer_user_id, run_id, ai_strengths, ai_improvements, created_at) OVERRIDING SYSTEM VALUE VALUES');
w(D.oneOnOneDrafts.map((o) => '  ' + row([OO.get(o.id), CP.get(o.campaignId), U.get(o.revieweeId), o.reviewerId ? U.get(o.reviewerId) : 'NULL', RUN.get(o.runId),
  js(o.strengths), js(o.improvements), ts(D.automationRuns.find((r) => r.id === o.runId).at)])).join(',\n') + ';');
D.oneOnOneDrafts.filter((o) => o.status === 'SENT').forEach((o) =>
  w(`UPDATE one_on_one_drafts SET status = 'SENT', edited_text = ${q(o.editedText)}, sent_by = ${U.get(o.sentBy)}, sent_at = ${ts(o.sentAt)} WHERE id = ${OO.get(o.id)};`));
w();

// ---- thông báo và nhật ký ----
w('-- Thông báo');
w('INSERT INTO notifications (user_id, type, body, link, dedupe_key, read_at, created_at) VALUES');
w(D.notifications.map((n) => '  ' + row([U.get(n.userId), q(n.type), q(n.text), q(n.link), q(`demo:${n.id}`), n.read ? ts(n.at) : 'NULL', ts(n.at)])).join(',\n') + ';');
w();
w('-- Nhật ký hoạt động');
w('INSERT INTO audit_logs (actor_user_id, action, module, summary, created_at) VALUES');
w(D.auditLogs.map((a) => '  ' + row([U.get(a.userId), q(AUDIT_ACTION[a.action]), q(a.module), q(a.target ? `${a.action}: ${a.target}` : a.action), ts(a.at)])).join(',\n') + ';');
w();

// ---- đặt lại bộ đếm id sau khi chèn id cố định ----
w('-- Đặt lại bộ đếm id');
['departments', 'app_users', 'okr_cycles', 'objectives', 'key_results', 'checkins', 'review_templates', 'review_criteria', 'review_questions', 'review_campaigns', 'nominations', 'review_assignments', 'automation_runs', 'objective_review_notes', 'weekly_digests', 'one_on_one_drafts'].forEach((t) =>
  w(`SELECT setval(pg_get_serial_sequence('${t}', 'id'), (SELECT MAX(id) FROM ${t}));`),
);
w();
w('COMMIT;');

process.stdout.write(out.join('\n') + '\n');

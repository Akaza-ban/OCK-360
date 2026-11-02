// Giả lập AI worker cho bản mẫu. KHÔNG gọi AI thật.
// Mục đích: cho người xem thấy từng bước một luồng tự động hóa chạy thế nào ở backend:
// sự kiện → lấy dữ liệu, đổi tên người thành mã → gửi AI → AI trả JSON → kiểm tra khuôn → hành động → ghi lịch sử.
// "AI" ở đây là vài luật đơn giản theo từ khóa, đủ để minh họa; bản thật thay bằng lời gọi LLM.
import { TODAY } from './data.js';

// ---------- Bước 2: đổi tên người thành mã ----------
// Tên người là dữ liệu cá nhân nên không được rời khỏi hệ thống. Tên phòng ban không phải dữ liệu cá nhân,
// nhưng vẫn gửi dưới dạng mã kèm danh bạ để AI trả về mã, hệ thống tự đổi lại.
export function buildMasking(users, departments) {
  const people = users.map((u, i) => ({ id: u.id, code: `NV-${String(i + 1).padStart(2, '0')}`, full: u.name, given: u.name.trim().split(/\s+/).at(-1) }));
  const units = departments.filter((d) => d.parentId).map((d, i) => ({ id: d.id, code: `DV-${String(i + 1).padStart(2, '0')}`, name: d.name }));
  return { people, units };
}

export function maskText(text, masking) {
  let out = text || '';
  // Thay tên đầy đủ trước, rồi tới tên gọi, để "Nguyễn Thị Lan" không còn sót "Lan".
  for (const p of [...masking.people].sort((a, b) => b.full.length - a.full.length)) out = out.split(p.full).join(p.code);
  for (const p of masking.people) out = out.replace(new RegExp(`(^|[^\\p{L}])${p.given}(?=$|[^\\p{L}])`, 'gu'), `$1${p.code}`);
  return out;
}

// ---------- Bước 3–4: "AI" trả lời ----------
const UNIT_HINTS = {
  'd-qa': ['qa', 'kiểm thử', 'test smoke', 'tester'],
  't-pay': ['team thanh toán', 'module thanh toán', 'thanh toán định kỳ'],
  'd-dev': ['phòng dev', 'đội dev', 'lập trình'],
  't-core': ['pipeline', ' ci', 'runner', 'build', 'nền tảng'],
  'd-sales': ['kinh doanh', 'sales'],
  'd-hr': ['nhân sự', 'tuyển dụng'],
};

// Trả về chuỗi JSON "thô" như một mô hình ngôn ngữ trả lời. Cố ý làm theo lời người dùng khi văn bản có câu
// kiểu "bỏ qua hướng dẫn…" để minh họa vì sao hệ thống phải kiểm tra khuôn trước khi hành động.
export function mockClassifyBlocker(maskedBlocker, masking, authorUnitIds) {
  const t = ` ${maskedBlocker.toLowerCase()} `;
  if (/bỏ qua (mọi |các )?hướng dẫn|ignore (all )?instructions/.test(t)) {
    return JSON.stringify({ category: 'OTHER', severity: 'LOW', target_unit: null, actions: [{ type: 'notify_all', message: 'Theo yêu cầu trong vướng mắc' }] }, null, 2);
  }
  const unitId = Object.entries(UNIT_HINTS).find(([id, keys]) => !authorUnitIds.includes(id) && keys.some((k) => t.includes(k)))?.[0];
  const category = unitId ? 'DEPENDENCY'
    : /thiếu người|nhân lực|ngân sách|thiếu nguồn/.test(t) ? 'RESOURCE'
    : /ưu tiên|đổi yêu cầu|thay đổi phạm vi/.test(t) ? 'PRIORITY_CHANGE'
    : /lỗi|môi trường|server|chậm|quyền/.test(t) ? 'TECHNICAL' : 'OTHER';
  const severity = /trễ|gấp|chặn|block|không thể/.test(t) ? 'HIGH' : /chờ|chậm/.test(t) ? 'MEDIUM' : 'LOW';
  const target = unitId ? masking.units.find((u) => u.id === unitId)?.code : null;
  return JSON.stringify({ category, severity, target_unit: target, reason: unitId ? 'Văn bản nói đang chờ một đơn vị khác' : 'Không thấy phụ thuộc đơn vị khác' }, null, 2);
}

export function mockCheckMismatch(confidence, maskedNote) {
  const t = maskedNote.toLowerCase();
  const late = /trễ|chậm|chưa bắt đầu|không kịp|bị kéo|tụt|chưa làm được/.test(t);
  const early = /vượt kế hoạch|xong sớm|nhanh hơn dự kiến/.test(t);
  const mismatch = (confidence === 'ON_TRACK' && late) || (confidence === 'OFF_TRACK' && early);
  return JSON.stringify({ mismatch, reason: mismatch ? (late ? 'Ghi chú nói đang trễ nhưng mức tự tin là Đúng hướng' : 'Ghi chú nói vượt kế hoạch nhưng mức tự tin là Chệch hướng') : 'Ghi chú khớp mức tự tin' }, null, 2);
}

// ---------- Bước 5: kiểm tra khuôn ----------
const SCHEMAS = {
  BLOCKER_ROUTING: { category: ['DEPENDENCY', 'RESOURCE', 'TECHNICAL', 'PRIORITY_CHANGE', 'OTHER'], severity: ['LOW', 'MEDIUM', 'HIGH'], target_unit: 'unit|null', reason: 'string' },
  CHECKIN_MISMATCH: { mismatch: 'boolean', reason: 'string' },
};

export function validate(flow, raw, masking, authorUnitIds) {
  const checks = [];
  let data;
  try {
    data = JSON.parse(raw);
    checks.push({ ok: true, text: 'Là JSON hợp lệ' });
  } catch {
    checks.push({ ok: false, text: 'Không phải JSON hợp lệ' });
    return { ok: false, checks };
  }
  const schema = SCHEMAS[flow];
  const extra = Object.keys(data).filter((k) => !(k in schema));
  if (extra.length) checks.push({ ok: false, warn: true, text: `Có trường ngoài khuôn (${extra.join(', ')}) → bị bỏ, không thực hiện` });
  for (const [k, rule] of Object.entries(schema)) {
    const v = data[k];
    const ok = Array.isArray(rule) ? rule.includes(v)
      : rule === 'boolean' ? typeof v === 'boolean'
      : rule === 'string' ? v === undefined || typeof v === 'string'
      : v === null || masking.units.some((u) => u.code === v);
    checks.push({ ok, text: ok ? `"${k}" đúng khuôn` : `"${k}" sai khuôn` });
  }
  if (flow === 'BLOCKER_ROUTING' && data.target_unit) {
    const unit = masking.units.find((u) => u.code === data.target_unit);
    const own = authorUnitIds.includes(unit?.id);
    checks.push({ ok: !own, text: own ? 'Đơn vị nhận là đơn vị của chính người báo → không chuyển' : 'Đơn vị nhận khác đơn vị của người báo' });
    if (own) data.target_unit = null;
  }
  const clean = Object.fromEntries(Object.entries(data).filter(([k]) => k in schema));
  return { ok: checks.every((c) => c.ok || c.warn), checks, data: clean, rejectedExtra: extra };
}

// ---------- Bản tin tuần ----------
const daysBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / 86400000;

// Bản tin của một quản lý cho khoảng ngày (from, to]. Mặc định là 7 ngày tính tới hôm nay.
export function buildDigest(state, managerId, range) {
  const members = state.users.filter((u) => u.managerId === managerId);
  const to = range?.to || TODAY;
  const from = range?.from || new Date(Date.parse(TODAY) - 7 * 86400000).toISOString().slice(0, 10);
  const recent = state.checkins.filter((c) => members.some((m) => m.id === c.userId) && c.at.slice(0, 10) >= from && c.at.slice(0, 10) <= to);
  const checkedIn = new Set(recent.map((c) => c.userId));
  const latestByKr = new Map();
  recent.forEach((c) => { if (!latestByKr.has(c.krId) || latestByKr.get(c.krId).at < c.at) latestByKr.set(c.krId, c); });
  const stats = {
    memberCount: members.length,
    checkedInCount: checkedIn.size,
    notCheckedIn: members.filter((m) => !checkedIn.has(m.id)).map((m) => m.id),
    atRiskKrIds: [...latestByKr.values()].filter((c) => c.confidence === 'AT_RISK').map((c) => c.krId),
    offTrackKrIds: [...latestByKr.values()].filter((c) => c.confidence === 'OFF_TRACK').map((c) => c.krId),
  };
  return { from, to, stats, recent, members };
}

export function mockDigestHighlights(digest, state) {
  const name = (id) => state.users.find((u) => u.id === id)?.name;
  const kr = (id) => state.keyResults.find((k) => k.id === id);
  const out = [];
  digest.recent.filter((c) => c.blocker).slice(0, 2).forEach((c) => out.push({ text: `${name(c.userId)} đang vướng: "${c.blocker}" Nên gỡ sớm vì KR "${kr(c.krId)?.title}" phụ thuộc vào việc này.`, krId: c.krId }));
  digest.stats.notCheckedIn.forEach((id) => {
    const last = state.checkins.filter((c) => c.userId === id).sort((a, b) => b.at.localeCompare(a.at))[0];
    if (out.length < 3) out.push({ text: `${name(id)} chưa check-in trong 7 ngày qua${last ? ` (lần gần nhất ${Math.round(daysBetween(last.at.slice(0, 10), TODAY))} ngày trước)` : ''}; nên hỏi thăm trong buổi họp.`, krId: last?.krId || null });
  });
  const newRisk = digest.stats.atRiskKrIds.filter((id) => !out.some((h) => h.krId === id));
  if (out.length < 3 && newRisk.length) out.push({ text: `KR "${kr(newRisk[0])?.title}" đang ở mức Có rủi ro dù không có vướng mắc được ghi lại; nên hỏi người phụ trách.`, krId: newRisk[0] });
  return out.slice(0, 3);
}

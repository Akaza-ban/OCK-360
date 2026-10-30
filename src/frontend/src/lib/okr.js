// Quy tắc tính tiến độ OKR.
import { TODAY } from './data.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

export function latestCheckin(checkins, krId) {
  let last = null;
  for (const c of checkins) {
    if (c.krId === krId && (!last || c.at > last.at)) last = c;
  }
  return last;
}

export function currentValue(kr, checkins) {
  const last = latestCheckin(checkins, kr.id);
  return last ? last.value : kr.start;
}

// Tiến độ KR = (hiện tại − ban đầu) / (đích − ban đầu), giới hạn 0–1.
// Công thức tự đúng với mục tiêu giảm vì tử số và mẫu số cùng âm.
export function krProgress(kr, checkins) {
  const cur = currentValue(kr, checkins);
  if (kr.type === 'BOOLEAN') return cur >= 1 ? 1 : 0;
  if (kr.target === kr.start) return 0;
  return clamp01((cur - kr.start) / (kr.target - kr.start));
}

// Thành phần của một Objective = các KR của nó + các Objective con đã liên kết. Trọng số chia đều.
export function objectiveProgress(objId, state, memo = new Map()) {
  if (memo.has(objId)) return memo.get(objId);
  const krs = state.keyResults.filter((k) => k.objectiveId === objId && !k.deletedAt);
  const children = state.objectives.filter((o) => o.parentId === objId && !o.deletedAt);
  const parts = [
    ...krs.map((k) => krProgress(k, state.checkins)),
    ...children.map((c) => objectiveProgress(c.id, state, memo)),
  ];
  const value = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : 0;
  memo.set(objId, value);
  return value;
}

export function progressMap(state) {
  const memo = new Map();
  state.objectives.forEach((o) => objectiveProgress(o.id, state, memo));
  return memo;
}

// Mức tự tin của Objective = mức xấu nhất trong các KR đã có check-in.
const RANK = { ON_TRACK: 0, AT_RISK: 1, OFF_TRACK: 2 };
export function objectiveConfidence(objId, state) {
  let worst = null;
  state.keyResults
    .filter((k) => k.objectiveId === objId && !k.deletedAt)
    .forEach((k) => {
      const last = latestCheckin(state.checkins, k.id);
      if (last && (worst === null || RANK[last.confidence] > RANK[worst])) worst = last.confidence;
    });
  return worst;
}

// Tiến độ kỳ vọng: phần thời gian đã trôi qua của chu kỳ (đường tuyến tính).
export function expectedProgress(cycle, today = TODAY) {
  if (cycle.status === 'CLOSED') return 1;
  const s = Date.parse(cycle.start);
  const e = Date.parse(cycle.end);
  const t = Date.parse(today);
  return clamp01((t - s) / (e - s));
}

export function daysSince(dateStr, today = TODAY) {
  return Math.floor((Date.parse(today) - Date.parse(dateStr.slice(0, 10))) / 864e5);
}

// Chuỗi Objective từ gốc tới Objective đang xem (dùng cho đường dẫn liên kết).
export function ancestry(objId, objectives) {
  const chain = [];
  let cur = objectives.find((o) => o.id === objId);
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? objectives.find((o) => o.id === cur.parentId) : null;
  }
  return chain;
}

export function wouldCreateCycle(objId, newParentId, objectives) {
  let cur = newParentId;
  while (cur) {
    if (cur === objId) return true;
    cur = objectives.find((o) => o.id === cur)?.parentId;
  }
  return false;
}

// Cấp cha hợp lệ: phòng ban → công ty; cá nhân → phòng ban hoặc công ty.
export const ALLOWED_PARENT = {
  COMPANY: [],
  DEPARTMENT: ['COMPANY'],
  INDIVIDUAL: ['DEPARTMENT', 'COMPANY'],
};

// Điểm OKR (thang 1–5) và điểm cuối kỳ.
export const okrScore = (progress) => 1 + 4 * progress;
export function finalScore(okr, s360, okrWeight) {
  if (okr == null || s360 == null) return null;
  return okrWeight * okr + (1 - okrWeight) * s360;
}
export function grade(score) {
  if (score == null) return 'Thiếu dữ liệu';
  if (score >= 4.5) return 'Xuất sắc';
  if (score >= 3.5) return 'Tốt';
  if (score >= 2.5) return 'Đạt';
  return 'Cần cải thiện';
}

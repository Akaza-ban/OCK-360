// Tổng hợp kết quả đánh giá 360 với ngưỡng ẩn danh.
export const ANON_THRESHOLD = 3;

export const GROUP_LABEL = {
  SELF: 'Tự đánh giá',
  MANAGER: 'Quản lý trực tiếp',
  PEER: 'Đồng nghiệp',
  DIRECT_REPORT: 'Cấp dưới',
  PEER_AND_REPORT: 'Đồng nghiệp và cấp dưới',
};

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function criterionAvg(forms, crId) {
  return avg(forms.map((f) => f.scores?.[crId]).filter((v) => typeof v === 'number'));
}

/**
 * Quy tắc hiển thị:
 * 1. Nhóm Đồng nghiệp hoặc Cấp dưới có ≥ 3 phiếu → hiển thị riêng.
 * 2. Nếu một trong hai nhóm dưới 3 → gộp hai nhóm; gộp ≥ 3 thì hiển thị nhóm gộp.
 * 3. Gộp vẫn dưới 3 → ẩn và không tính vào điểm 360.
 * Điểm 360 = trung bình các nhóm được hiển thị, không gồm Tự đánh giá.
 */
export function aggregate360(allForms, campaignId, revieweeId, template) {
  const forms = allForms.filter(
    (f) => f.campaignId === campaignId && f.revieweeId === revieweeId && f.status === 'SUBMITTED',
  );
  const by = (g) => forms.filter((f) => f.group === g);
  const peer = by('PEER');
  const rep = by('DIRECT_REPORT');

  const groups = [];
  const hidden = [];
  const mgr = by('MANAGER');
  if (mgr.length) groups.push({ key: 'MANAGER', forms: mgr });

  if (peer.length >= ANON_THRESHOLD && (rep.length >= ANON_THRESHOLD || rep.length === 0)) {
    groups.push({ key: 'PEER', forms: peer });
    if (rep.length) groups.push({ key: 'DIRECT_REPORT', forms: rep });
  } else if (rep.length >= ANON_THRESHOLD && peer.length === 0) {
    groups.push({ key: 'DIRECT_REPORT', forms: rep });
  } else {
    const merged = [...peer, ...rep];
    if (merged.length >= ANON_THRESHOLD) groups.push({ key: 'PEER_AND_REPORT', forms: merged, merged: true });
    else if (merged.length) hidden.push({ key: 'PEER_AND_REPORT', count: merged.length });
  }

  const self = by('SELF');
  const criteria = template.criteria.map((cr) => {
    const row = { id: cr.id, name: cr.name, byGroup: {} };
    groups.forEach((g) => (row.byGroup[g.key] = criterionAvg(g.forms, cr.id)));
    row.self = self.length ? criterionAvg(self, cr.id) : null;
    const others = groups.map((g) => row.byGroup[g.key]).filter((v) => v != null);
    row.others = avg(others);
    row.gap = row.self != null && row.others != null ? row.self - row.others : null;
    return row;
  });

  const groupScores = groups.map((g) => ({
    key: g.key,
    count: g.forms.length,
    merged: !!g.merged,
    score: avg(template.criteria.map((cr) => criterionAvg(g.forms, cr.id)).filter((v) => v != null)),
  }));
  const score = avg(groupScores.map((g) => g.score).filter((v) => v != null));

  // Nhận xét: chỉ lấy từ các nhóm được hiển thị, bỏ tên, sắp xếp theo nội dung để không lộ thứ tự nộp.
  const visibleForms = groups.flatMap((g) => g.forms);
  const comments = template.questions.map((q) => ({
    id: q.id,
    text: q.text,
    answers: visibleForms
      .map((f) => f.answers?.[q.id])
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'vi')),
  }));

  return { groups: groupScores, hidden, criteria, score, comments, selfCount: self.length };
}

// Nhãn hiển thị và quy tắc giao diện cho phần tự động hóa bằng AI.
// Trong bản thật, mọi phân loại và tóm tắt do AI worker ở backend tạo; giao diện chỉ hiển thị.

export const CATEGORY = {
  DEPENDENCY: 'Phụ thuộc phòng khác',
  RESOURCE: 'Thiếu nguồn lực',
  TECHNICAL: 'Kỹ thuật',
  PRIORITY_CHANGE: 'Ưu tiên thay đổi',
  OTHER: 'Khác',
};

export const SEVERITY = { LOW: ['Thấp', 'none'], MEDIUM: ['Trung bình', 'warn'], HIGH: ['Cao', 'bad'] };

export const ROUTING = { OPEN: ['Chờ nhận', 'warn'], ACKNOWLEDGED: ['Đã nhận xử lý', 'ok'], REJECTED: ['Không liên quan', 'none'] };

export const RUN_STATUS = {
  PENDING: ['Đang chờ', 'warn'],
  RUNNING: ['Đang chạy', 'warn'],
  SUCCEEDED: ['Thành công', 'ok'],
  FAILED: ['Lỗi', 'bad'],
  SKIPPED: ['Bỏ qua', 'none'],
};

export const TRIGGER = { EVENT: 'Theo sự kiện', SCHEDULE: 'Theo lịch', ON_SUBMIT: 'Khi bấm nộp' };

export const ISSUE = {
  NOT_MEASURABLE: 'KR khó đo',
  OUTPUT_ONLY: 'Chỉ đếm việc làm',
  DUPLICATE: 'Trùng KR khác',
  NOT_ALIGNED: 'Chưa liên kết cấp trên',
};

export const DRAFT_STATUS = { PENDING_REVIEW: ['Chờ duyệt', 'warn'], SENT: ['Đã gửi', 'ok'], DISCARDED: ['Đã bỏ', 'none'] };

// Bản mẫu giả lập luồng "Cảnh báo nhận xét 360 dễ lộ danh tính" bằng vài mẫu câu.
// Bản thật gửi nhận xét (đã đổi tên người thành mã) cho dịch vụ AI và chờ tối đa 5 giây.
const IDENTIFYING = [
  /\b(tôi|mình|em|anh|chị)\b[^.]{0,40}\b(ngồi cạnh|cùng dự án|cùng team|hôm|lần đó|buổi họp)/i,
  /\b(hôm|ngày)\s+\d{1,2}\/\d{1,2}/i,
  /\bdự án\s+[A-ZĐ][\wÀ-ỹ]+/,
];
const HARSH = /\b(kém cỏi|vô dụng|ngu|tệ hại|lười biếng)\b/i;

export function checkComment(text) {
  const flags = [];
  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (!sentence.trim()) continue;
    if (IDENTIFYING.some((r) => r.test(sentence))) flags.push({ sentence, reason: 'Có thể làm lộ người viết (nhắc tới chi tiết chỉ bạn và người được đánh giá biết).' });
    else if (HARSH.test(sentence)) flags.push({ sentence, reason: 'Lời lẽ có thể gây tổn thương; hãy mô tả hành vi cụ thể thay vì nhận xét con người.' });
  }
  return flags;
}

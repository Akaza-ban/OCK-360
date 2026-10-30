// Dữ liệu giả (mock) cho bản giao diện mẫu. Chưa gọi API thật.
// Ngày "hôm nay" của bản demo được cố định để biểu đồ và nhắc nhở luôn hiển thị giống nhau.
export const TODAY = '2026-10-30';

export const ROLE_LABEL = {
  ADMIN: 'Quản trị viên',
  HR: 'Nhân sự',
  MANAGER: 'Quản lý',
  EMPLOYEE: 'Nhân viên',
};

export const departments = [
  { id: 'd-bgd', name: 'Ban Giám đốc', parentId: null, headId: 'u1' },
  { id: 'd-hr', name: 'Phòng Nhân sự', parentId: 'd-bgd', headId: 'u2' },
  { id: 'd-dev', name: 'Phòng Dev', parentId: 'd-bgd', headId: 'u3' },
  { id: 'd-qa', name: 'Phòng QA', parentId: 'd-bgd', headId: 'u6' },
  { id: 'd-sales', name: 'Phòng Kinh doanh', parentId: 'd-bgd', headId: 'u8' },
];

export const users = [
  { id: 'u1', name: 'Lê Văn Hùng', email: 'hung@okr360.vn', role: 'ADMIN', deptId: 'd-bgd', managerId: null, title: 'Quản trị hệ thống', active: true },
  { id: 'u2', name: 'Phạm Thu Mai', email: 'mai@okr360.vn', role: 'HR', deptId: 'd-hr', managerId: null, title: 'Trưởng phòng Nhân sự', active: true },
  { id: 'u3', name: 'Trần Hoài Nam', email: 'nam@okr360.vn', role: 'MANAGER', deptId: 'd-dev', managerId: null, title: 'Trưởng phòng Dev', active: true },
  { id: 'u4', name: 'Nguyễn Thị Lan', email: 'lan@okr360.vn', role: 'EMPLOYEE', deptId: 'd-dev', managerId: 'u3', title: 'Lập trình viên', active: true },
  { id: 'u5', name: 'Võ Anh Tú', email: 'tu@okr360.vn', role: 'EMPLOYEE', deptId: 'd-dev', managerId: 'u3', title: 'Lập trình viên', active: true },
  { id: 'u10', name: 'Đỗ Minh An', email: 'an@okr360.vn', role: 'EMPLOYEE', deptId: 'd-dev', managerId: 'u3', title: 'Lập trình viên', active: true },
  { id: 'u6', name: 'Hoàng Thu Hà', email: 'ha@okr360.vn', role: 'MANAGER', deptId: 'd-qa', managerId: null, title: 'Trưởng phòng QA', active: true },
  { id: 'u7', name: 'Bùi Đức Minh', email: 'minh@okr360.vn', role: 'EMPLOYEE', deptId: 'd-qa', managerId: 'u6', title: 'Kỹ sư kiểm thử', active: true },
  { id: 'u11', name: 'Ngô Thanh Bình', email: 'binh@okr360.vn', role: 'EMPLOYEE', deptId: 'd-qa', managerId: 'u6', title: 'Kỹ sư kiểm thử', active: true },
  { id: 'u8', name: 'Đặng Mỹ Linh', email: 'linh@okr360.vn', role: 'MANAGER', deptId: 'd-sales', managerId: null, title: 'Trưởng phòng Kinh doanh', active: true },
  { id: 'u9', name: 'Lý Hoàng Quân', email: 'quan@okr360.vn', role: 'EMPLOYEE', deptId: 'd-sales', managerId: 'u8', title: 'Nhân viên kinh doanh', active: true },
];

// Tài khoản hiển thị ở trang đăng nhập để chuyển vai trò nhanh.
export const demoAccounts = ['u4', 'u3', 'u6', 'u2', 'u1'];

export const cycles = [
  { id: 'q3-2026', name: 'Q3/2026', start: '2026-07-01', end: '2026-09-30', planningDeadline: '2026-07-14', status: 'CLOSED', maxObjectives: 5, okrWeight: 0.6 },
  { id: 'q4-2026', name: 'Q4/2026', start: '2026-10-01', end: '2026-12-31', planningDeadline: '2026-10-14', status: 'ACTIVE', maxObjectives: 5, okrWeight: 0.6 },
];

// level: COMPANY | DEPARTMENT | INDIVIDUAL
export const objectives = [
  // ---------- Q4/2026 ----------
  { id: 'o1', cycleId: 'q4-2026', level: 'COMPANY', ownerId: 'u1', deptId: 'd-bgd', parentId: null, title: 'Nâng cao chất lượng sản phẩm', description: 'Khách hàng gặp ít lỗi hơn và hài lòng hơn với sản phẩm.' },
  { id: 'o2', cycleId: 'q4-2026', level: 'COMPANY', ownerId: 'u1', deptId: 'd-bgd', parentId: null, title: 'Tăng trưởng khách hàng doanh nghiệp', description: 'Mở rộng tệp khách hàng doanh nghiệp vừa và nhỏ.' },
  { id: 'o3', cycleId: 'q4-2026', level: 'DEPARTMENT', ownerId: 'u3', deptId: 'd-dev', parentId: 'o1', title: 'Cải thiện quy trình kiểm thử', description: 'Bắt lỗi sớm hơn ngay trong quá trình phát triển.' },
  { id: 'o4', cycleId: 'q4-2026', level: 'DEPARTMENT', ownerId: 'u6', deptId: 'd-qa', parentId: 'o1', title: 'Rút ngắn chu kỳ kiểm thử hồi quy', description: '' },
  { id: 'o5', cycleId: 'q4-2026', level: 'DEPARTMENT', ownerId: 'u8', deptId: 'd-sales', parentId: 'o2', title: 'Mở rộng tệp khách hàng miền Nam', description: '' },
  { id: 'o6', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u4', deptId: 'd-dev', parentId: 'o3', title: 'Viết test cho module thanh toán', description: 'Module thanh toán là nơi khách báo lỗi nhiều nhất quý trước.' },
  { id: 'o7', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u5', deptId: 'd-dev', parentId: 'o3', title: 'Tối ưu hiệu năng API thanh toán', description: '' },
  { id: 'o8', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u7', deptId: 'd-qa', parentId: 'o4', title: 'Tự động hóa bộ test hồi quy', description: '' },
  { id: 'o9', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u3', deptId: 'd-dev', parentId: 'o3', title: 'Nâng cao năng lực kiểm thử của đội Dev', description: '' },
  { id: 'o10', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u9', deptId: 'd-sales', parentId: 'o5', title: 'Tìm khách hàng mới tại TP.HCM', description: '' },
  { id: 'o11', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u2', deptId: 'd-hr', parentId: null, title: 'Triển khai OKR cho toàn công ty', description: '' },
  { id: 'o12', cycleId: 'q4-2026', level: 'INDIVIDUAL', ownerId: 'u10', deptId: 'd-dev', parentId: null, title: 'Học và áp dụng kiểm thử tích hợp', description: '' },
  // ---------- Q3/2026 (đã đóng) ----------
  { id: 'p1', cycleId: 'q3-2026', level: 'COMPANY', ownerId: 'u1', deptId: 'd-bgd', parentId: null, title: 'Ra mắt cổng thanh toán mới', description: '' },
  { id: 'p2', cycleId: 'q3-2026', level: 'DEPARTMENT', ownerId: 'u3', deptId: 'd-dev', parentId: 'p1', title: 'Hoàn thành tích hợp cổng thanh toán', description: '' },
  { id: 'p3', cycleId: 'q3-2026', level: 'INDIVIDUAL', ownerId: 'u4', deptId: 'd-dev', parentId: 'p2', title: 'Tích hợp ví điện tử vào luồng thanh toán', description: '' },
  { id: 'p4', cycleId: 'q3-2026', level: 'INDIVIDUAL', ownerId: 'u5', deptId: 'd-dev', parentId: 'p2', title: 'Xây dựng trang đối soát giao dịch', description: '' },
  { id: 'p5', cycleId: 'q3-2026', level: 'INDIVIDUAL', ownerId: 'u3', deptId: 'd-dev', parentId: 'p2', title: 'Điều phối tích hợp với đối tác thanh toán', description: '' },
  { id: 'p6', cycleId: 'q3-2026', level: 'INDIVIDUAL', ownerId: 'u6', deptId: 'd-qa', parentId: 'p1', title: 'Kiểm thử toàn diện cổng thanh toán trước ra mắt', description: '' },
];

// type: NUMBER | PERCENT | BOOLEAN
export const keyResults = [
  { id: 'k1', objectiveId: 'o1', title: 'Giảm lỗi khách hàng báo', type: 'NUMBER', start: 50, target: 20, unit: 'lỗi/tháng', assigneeId: 'u1' },
  { id: 'k2', objectiveId: 'o1', title: 'Tăng điểm hài lòng khách hàng', type: 'NUMBER', start: 7.0, target: 8.5, unit: 'điểm', assigneeId: 'u1' },
  { id: 'k3', objectiveId: 'o2', title: 'Ký hợp đồng với khách hàng doanh nghiệp mới', type: 'NUMBER', start: 10, target: 25, unit: 'khách hàng', assigneeId: 'u1' },
  { id: 'k4', objectiveId: 'o3', title: 'Tăng độ phủ test', type: 'PERCENT', start: 40, target: 70, unit: '%', assigneeId: 'u3' },
  { id: 'k5', objectiveId: 'o3', title: 'Pull request được review trước khi merge', type: 'PERCENT', start: 60, target: 100, unit: '%', assigneeId: 'u3' },
  { id: 'k6', objectiveId: 'o4', title: 'Rút ngắn thời gian kiểm thử hồi quy', type: 'NUMBER', start: 5, target: 2, unit: 'ngày', assigneeId: 'u6' },
  { id: 'k7', objectiveId: 'o5', title: 'Thu thập khách hàng tiềm năng', type: 'NUMBER', start: 0, target: 120, unit: 'khách hàng', assigneeId: 'u8' },
  { id: 'k8', objectiveId: 'o6', title: 'Viết test case cho module thanh toán', type: 'NUMBER', start: 0, target: 50, unit: 'test case', assigneeId: 'u4' },
  { id: 'k9', objectiveId: 'o6', title: 'Thiết lập CI chạy test tự động mỗi lần push', type: 'BOOLEAN', start: 0, target: 1, unit: '', assigneeId: 'u4' },
  { id: 'k10', objectiveId: 'o7', title: 'Giảm thời gian phản hồi p95 của API', type: 'NUMBER', start: 800, target: 300, unit: 'ms', assigneeId: 'u5' },
  { id: 'k11', objectiveId: 'o8', title: 'Tự động hóa test case hồi quy', type: 'NUMBER', start: 20, target: 150, unit: 'test case', assigneeId: 'u7' },
  { id: 'k12', objectiveId: 'o9', title: 'Tổ chức buổi chia sẻ kiến thức kiểm thử', type: 'NUMBER', start: 0, target: 4, unit: 'buổi', assigneeId: 'u3' },
  { id: 'k13', objectiveId: 'o10', title: 'Gặp trực tiếp khách hàng tiềm năng', type: 'NUMBER', start: 0, target: 30, unit: 'buổi gặp', assigneeId: 'u9' },
  { id: 'k14', objectiveId: 'o11', title: 'Nhân viên có OKR cá nhân đã liên kết', type: 'PERCENT', start: 0, target: 80, unit: '%', assigneeId: 'u2' },
  { id: 'k15', objectiveId: 'o12', title: 'Viết test tích hợp cho API đơn hàng', type: 'NUMBER', start: 0, target: 20, unit: 'test', assigneeId: 'u10' },
  // Q3
  { id: 'q1', objectiveId: 'p1', title: 'Số giao dịch qua cổng mới', type: 'NUMBER', start: 0, target: 10000, unit: 'giao dịch', assigneeId: 'u1' },
  { id: 'q2', objectiveId: 'p2', title: 'Hoàn thành hạng mục tích hợp', type: 'NUMBER', start: 0, target: 12, unit: 'hạng mục', assigneeId: 'u3' },
  { id: 'q3', objectiveId: 'p3', title: 'Hỗ trợ ví điện tử', type: 'NUMBER', start: 0, target: 3, unit: 'ví', assigneeId: 'u4' },
  { id: 'q4', objectiveId: 'p3', title: 'Tỷ lệ thanh toán thành công qua ví', type: 'PERCENT', start: 90, target: 98, unit: '%', assigneeId: 'u4' },
  { id: 'q5', objectiveId: 'p4', title: 'Ra mắt trang đối soát', type: 'BOOLEAN', start: 0, target: 1, unit: '', assigneeId: 'u5' },
  { id: 'q6', objectiveId: 'p5', title: 'Ký biên bản nghiệm thu với đối tác', type: 'NUMBER', start: 0, target: 3, unit: 'đối tác', assigneeId: 'u3' },
  { id: 'q7', objectiveId: 'p6', title: 'Chạy kịch bản kiểm thử đầu cuối', type: 'NUMBER', start: 0, target: 200, unit: 'kịch bản', assigneeId: 'u6' },
  { id: 'q8', objectiveId: 'p6', title: 'Lỗi nghiêm trọng còn mở khi ra mắt', type: 'NUMBER', start: 12, target: 0, unit: 'lỗi', assigneeId: 'u6' },
];

// confidence: ON_TRACK | AT_RISK | OFF_TRACK
export const checkins = [
  { id: 'c1', krId: 'k8', value: 4, confidence: 'ON_TRACK', note: 'Viết xong test cho luồng tạo đơn.', blocker: '', userId: 'u4', at: '2026-10-05T09:12' },
  { id: 'c2', krId: 'k8', value: 8, confidence: 'ON_TRACK', note: 'Thêm test cho hoàn tiền.', blocker: '', userId: 'u4', at: '2026-10-12T09:05' },
  { id: 'c3', krId: 'k8', value: 11, confidence: 'AT_RISK', note: 'Chậm hơn dự kiến.', blocker: 'Chưa có môi trường test cho cổng thanh toán.', userId: 'u4', at: '2026-10-19T09:20' },
  { id: 'c4', krId: 'k8', value: 18, confidence: 'ON_TRACK', note: 'Đã có môi trường test, tốc độ viết test tăng lại.', blocker: '', userId: 'u4', at: '2026-10-26T09:02' },
  { id: 'c5', krId: 'k9', value: 0, confidence: 'AT_RISK', note: 'Đang chờ cấp quyền runner CI.', blocker: 'Chờ đội hạ tầng cấp quyền.', userId: 'u4', at: '2026-10-19T09:24' },
  { id: 'c6', krId: 'k10', value: 700, confidence: 'ON_TRACK', note: 'Thêm cache cho danh sách phương thức thanh toán.', blocker: '', userId: 'u5', at: '2026-10-13T10:00' },
  { id: 'c7', krId: 'k10', value: 620, confidence: 'ON_TRACK', note: 'Tối ưu truy vấn lịch sử giao dịch.', blocker: '', userId: 'u5', at: '2026-10-27T10:00' },
  { id: 'c8', krId: 'k4', value: 46, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u3', at: '2026-10-13T08:30' },
  { id: 'c9', krId: 'k4', value: 52, confidence: 'ON_TRACK', note: 'Module thanh toán tăng độ phủ nhanh.', blocker: '', userId: 'u3', at: '2026-10-27T08:30' },
  { id: 'c10', krId: 'k5', value: 85, confidence: 'ON_TRACK', note: 'Đã bật quy tắc bắt buộc review trên GitLab.', blocker: '', userId: 'u3', at: '2026-10-27T08:35' },
  { id: 'c11', krId: 'k6', value: 4, confidence: 'AT_RISK', note: '', blocker: 'Thiếu người viết test tự động.', userId: 'u6', at: '2026-10-20T14:00' },
  { id: 'c12', krId: 'k11', value: 45, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u7', at: '2026-10-28T16:00' },
  { id: 'c13', krId: 'k1', value: 38, confidence: 'ON_TRACK', note: 'Số lỗi tháng 10 giảm còn 38.', blocker: '', userId: 'u1', at: '2026-10-28T17:00' },
  { id: 'c14', krId: 'k2', value: 7.4, confidence: 'AT_RISK', note: 'Khảo sát tháng 10 tăng chậm.', blocker: '', userId: 'u1', at: '2026-10-28T17:05' },
  { id: 'c15', krId: 'k3', value: 14, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u1', at: '2026-10-28T17:10' },
  { id: 'c16', krId: 'k7', value: 30, confidence: 'OFF_TRACK', note: 'Hội thảo tháng 10 bị hoãn.', blocker: 'Thiếu ngân sách marketing.', userId: 'u8', at: '2026-10-22T11:00' },
  { id: 'c17', krId: 'k13', value: 6, confidence: 'AT_RISK', note: '', blocker: '', userId: 'u9', at: '2026-10-21T15:00' },
  { id: 'c18', krId: 'k12', value: 1, confidence: 'ON_TRACK', note: 'Buổi đầu về viết unit test.', blocker: '', userId: 'u3', at: '2026-10-16T16:00' },
  { id: 'c19', krId: 'k14', value: 64, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u2', at: '2026-10-29T09:00' },
  { id: 'c20', krId: 'k15', value: 3, confidence: 'AT_RISK', note: 'Đang học cách dựng dữ liệu test.', blocker: '', userId: 'u10', at: '2026-10-12T09:00' },
  // Q3 (giá trị cuối kỳ)
  { id: 'c30', krId: 'q1', value: 8200, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u1', at: '2026-09-29T17:00' },
  { id: 'c31', krId: 'q2', value: 11, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u3', at: '2026-09-29T17:00' },
  { id: 'c32', krId: 'q3', value: 3, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u4', at: '2026-09-28T17:00' },
  { id: 'c33', krId: 'q4', value: 96.6, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u4', at: '2026-09-28T17:00' },
  { id: 'c34', krId: 'q5', value: 1, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u5', at: '2026-09-25T17:00' },
  { id: 'c35', krId: 'q6', value: 2, confidence: 'AT_RISK', note: 'Một đối tác lùi nghiệm thu sang quý sau.', blocker: '', userId: 'u3', at: '2026-09-29T17:00' },
  { id: 'c36', krId: 'q7', value: 184, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u6', at: '2026-09-27T17:00' },
  { id: 'c37', krId: 'q8', value: 1, confidence: 'ON_TRACK', note: '', blocker: '', userId: 'u6', at: '2026-09-27T17:05' },
];

export const checkinComments = [
  { id: 'cm1', checkinId: 'c3', userId: 'u3', text: 'Anh đã nhờ đội hạ tầng dựng môi trường test, dự kiến xong thứ Năm.', at: '2026-10-19T11:30' },
  { id: 'cm2', checkinId: 'c4', userId: 'u3', text: 'Tốt lắm, giữ nhịp này nhé.', at: '2026-10-26T14:00' },
];

export const templates = [
  {
    id: 't1', name: 'Mẫu đánh giá 360 chuẩn', locked: true,
    criteria: [
      { id: 'cr1', name: 'Tinh thần làm việc nhóm', description: 'Phối hợp, chia sẻ trách nhiệm với đồng đội.', required: true },
      { id: 'cr2', name: 'Giao tiếp', description: 'Trao đổi rõ ràng, lắng nghe và phản hồi kịp thời.', required: true },
      { id: 'cr3', name: 'Chủ động giải quyết vấn đề', description: 'Tự tìm cách gỡ vướng mắc trước khi cần nhắc.', required: true },
      { id: 'cr4', name: 'Chất lượng công việc', description: 'Kết quả đúng yêu cầu, ít phải làm lại.', required: true },
      { id: 'cr5', name: 'Hỗ trợ và chia sẻ kiến thức', description: 'Giúp người khác cùng tiến bộ.', required: false },
    ],
    questions: [
      { id: 'qs1', text: 'Người này nên tiếp tục làm gì?' },
      { id: 'qs2', text: 'Người này nên cải thiện điều gì?' },
    ],
  },
];

// status: DRAFT | NOMINATION | COLLECTING | CLOSED | PUBLISHED
export const campaigns = [
  { id: 'cp-q3', name: 'Đánh giá 360 – Q3/2026', cycleId: 'q3-2026', templateId: 't1', nominationDeadline: '2026-09-10', submitDeadline: '2026-09-28', status: 'PUBLISHED' },
  { id: 'cp-q4', name: 'Đánh giá 360 – Q4/2026', cycleId: 'q4-2026', templateId: 't1', nominationDeadline: '2026-10-24', submitDeadline: '2026-11-06', status: 'COLLECTING' },
];

const S = (a, b, c, d, e) => ({ cr1: a, cr2: b, cr3: c, cr4: d, cr5: e });

// group: SELF | MANAGER | PEER | DIRECT_REPORT
export const reviewForms = [
  // ----- Q3 (đã công bố) — người được đánh giá: Lan -----
  { id: 'f1', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u4', group: 'SELF', status: 'SUBMITTED', scores: S(4, 3, 4, 4, 4), answers: { qs1: 'Giữ nhịp viết test đều đặn.', qs2: 'Chủ động hỏi sớm khi bị chặn.' } },
  { id: 'f2', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u3', group: 'MANAGER', status: 'SUBMITTED', scores: S(4, 4, 4, 5, 4), answers: { qs1: 'Chất lượng code rất ổn định.', qs2: 'Nên chia sẻ nhiều hơn trong buổi họp đội.' } },
  { id: 'f3', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u5', group: 'PEER', status: 'SUBMITTED', scores: S(5, 4, 4, 5, 4), answers: { qs1: 'Luôn sẵn lòng review code cho mọi người.', qs2: 'Có thể viết tài liệu kỹ hơn.' } },
  { id: 'f4', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u10', group: 'PEER', status: 'SUBMITTED', scores: S(5, 4, 4, 4, 5), answers: { qs1: 'Hướng dẫn mình rất kiên nhẫn.', qs2: '' } },
  { id: 'f5', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u7', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 5, 4, 4), answers: { qs1: 'Phản hồi bug rất nhanh.', qs2: 'Nên báo trước khi đổi luồng thanh toán.' } },
  { id: 'f6', campaignId: 'cp-q3', revieweeId: 'u4', reviewerId: 'u11', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 4, 4, null), answers: { qs1: '', qs2: 'Mô tả pull request rõ hơn sẽ giúp QA kiểm thử nhanh hơn.' } },
  // Q3 — người được đánh giá: Hà (2 cấp dưới → gộp với đồng nghiệp)
  { id: 'f10', campaignId: 'cp-q3', revieweeId: 'u6', reviewerId: 'u6', group: 'SELF', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'f11', campaignId: 'cp-q3', revieweeId: 'u6', reviewerId: 'u3', group: 'PEER', status: 'SUBMITTED', scores: S(4, 3, 4, 4, 4), answers: { qs1: 'Phối hợp release rất tốt.', qs2: '' } },
  { id: 'f12', campaignId: 'cp-q3', revieweeId: 'u6', reviewerId: 'u8', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 3, 4, 3), answers: {} },
  { id: 'f13', campaignId: 'cp-q3', revieweeId: 'u6', reviewerId: 'u7', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(5, 4, 4, 4, 5), answers: { qs1: 'Luôn bảo vệ đội khi bị dồn việc.', qs2: '' } },
  { id: 'f14', campaignId: 'cp-q3', revieweeId: 'u6', reviewerId: 'u11', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(4, 3, 4, 4, 4), answers: { qs1: '', qs2: 'Họp 1-1 đều đặn hơn.' } },
  // Q3 — người được đánh giá: Nam (3 cấp dưới)
  { id: 'f20', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u3', group: 'SELF', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'f21', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u6', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'f22', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u8', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 3, 4, 4), answers: {} },
  { id: 'f23', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u2', group: 'PEER', status: 'SUBMITTED', scores: S(4, 3, 4, 5, 4), answers: {} },
  { id: 'f24', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u4', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(5, 4, 4, 4, 5), answers: { qs1: 'Gỡ vướng mắc cho đội rất nhanh.', qs2: '' } },
  { id: 'f25', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u5', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(4, 4, 5, 4, 4), answers: {} },
  { id: 'f26', campaignId: 'cp-q3', revieweeId: 'u3', reviewerId: 'u10', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(4, 3, 4, 4, 5), answers: { qs1: '', qs2: 'Giao việc kèm bối cảnh rõ hơn.' } },

  // ----- Q4 (đang thu phiếu) -----
  { id: 'g1', campaignId: 'cp-q4', revieweeId: 'u4', reviewerId: 'u4', group: 'SELF', status: 'DRAFT', scores: { cr1: 4, cr2: 3 }, answers: { qs1: 'Giữ nhịp viết test đều mỗi tuần.' } },
  { id: 'g2', campaignId: 'cp-q4', revieweeId: 'u5', reviewerId: 'u4', group: 'PEER', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g3', campaignId: 'cp-q4', revieweeId: 'u7', reviewerId: 'u4', group: 'PEER', status: 'SUBMITTED', scores: S(4, 4, 4, 5, 4), answers: { qs1: 'Báo lỗi rất chi tiết.', qs2: '' } },
  { id: 'g4', campaignId: 'cp-q4', revieweeId: 'u3', reviewerId: 'u4', group: 'DIRECT_REPORT', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g5', campaignId: 'cp-q4', revieweeId: 'u4', reviewerId: 'u3', group: 'MANAGER', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g6', campaignId: 'cp-q4', revieweeId: 'u5', reviewerId: 'u3', group: 'MANAGER', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'g7', campaignId: 'cp-q4', revieweeId: 'u10', reviewerId: 'u3', group: 'MANAGER', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g8', campaignId: 'cp-q4', revieweeId: 'u3', reviewerId: 'u3', group: 'SELF', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'g9', campaignId: 'cp-q4', revieweeId: 'u7', reviewerId: 'u6', group: 'MANAGER', status: 'SUBMITTED', scores: S(4, 4, 4, 4, 4), answers: {} },
  { id: 'g10', campaignId: 'cp-q4', revieweeId: 'u9', reviewerId: 'u8', group: 'MANAGER', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g11', campaignId: 'cp-q4', revieweeId: 'u4', reviewerId: 'u5', group: 'PEER', status: 'SUBMITTED', scores: S(5, 4, 4, 5, 4), answers: {} },
  { id: 'g12', campaignId: 'cp-q4', revieweeId: 'u4', reviewerId: 'u10', group: 'PEER', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g13', campaignId: 'cp-q4', revieweeId: 'u2', reviewerId: 'u2', group: 'SELF', status: 'NOT_STARTED', scores: {}, answers: {} },
  { id: 'g14', campaignId: 'cp-q4', revieweeId: 'u6', reviewerId: 'u7', group: 'DIRECT_REPORT', status: 'SUBMITTED', scores: S(5, 4, 4, 4, 4), answers: {} },
  { id: 'g15', campaignId: 'cp-q4', revieweeId: 'u6', reviewerId: 'u11', group: 'DIRECT_REPORT', status: 'NOT_STARTED', scores: {}, answers: {} },
];

// Đề cử đồng nghiệp cho đợt Q4 (đã xong giai đoạn đề cử, dùng để demo màn hình duyệt).
export const nominations = [
  { id: 'n1', campaignId: 'cp-q4', revieweeId: 'u4', peerIds: ['u5', 'u10', 'u7'], status: 'APPROVED' },
  { id: 'n2', campaignId: 'cp-q4', revieweeId: 'u5', peerIds: ['u4', 'u10', 'u9'], status: 'PENDING' },
  { id: 'n3', campaignId: 'cp-q4', revieweeId: 'u10', peerIds: ['u4', 'u5', 'u11'], status: 'PENDING' },
  { id: 'n4', campaignId: 'cp-q4', revieweeId: 'u7', peerIds: ['u11', 'u4', 'u5'], status: 'APPROVED' },
];

export const notifications = [
  { id: 'nt1', userId: 'u4', text: 'Bạn có 3 phiếu đánh giá 360 cần điền trước 06/11.', link: '#/reviews/todo', at: '2026-10-28T08:00', read: false },
  { id: 'nt2', userId: 'u4', text: 'Anh Trần Hoài Nam đã bình luận vào check-in của bạn.', link: '#/okr/o6', at: '2026-10-26T14:00', read: false },
  { id: 'nt3', userId: 'u4', text: 'Kết quả đánh giá 360 Q3/2026 đã được công bố.', link: '#/reviews/results', at: '2026-10-05T09:00', read: true },
  { id: 'nt4', userId: 'u3', text: 'Bạn có 2 danh sách đề cử chờ duyệt.', link: '#/reviews/approvals', at: '2026-10-24T09:00', read: false },
  { id: 'nt5', userId: 'u3', text: 'Đỗ Minh An chưa check-in 18 ngày.', link: '#/dashboard', at: '2026-10-30T09:00', read: false },
  { id: 'nt6', userId: 'u2', text: 'Đợt Đánh giá 360 – Q4/2026 đang có 41% phiếu đã nộp.', link: '#/admin/campaigns/cp-q4', at: '2026-10-30T08:00', read: false },
  { id: 'nt7', userId: 'u6', text: 'Bạn có 1 phiếu đánh giá 360 đã nộp, không còn phiếu nào cần điền.', link: '#/reviews/todo', at: '2026-10-29T08:00', read: true },
];

export const auditLogs = [
  { id: 'a1', userId: 'u4', action: 'Check-in', module: 'OKR', target: 'KR "Viết test case cho module thanh toán" → 18', at: '2026-10-26T09:02' },
  { id: 'a2', userId: 'u3', action: 'Bình luận check-in', module: 'OKR', target: 'Check-in của Nguyễn Thị Lan', at: '2026-10-26T14:00' },
  { id: 'a3', userId: 'u2', action: 'Mở thu phiếu', module: 'Đánh giá 360', target: 'Đánh giá 360 – Q4/2026', at: '2026-10-25T08:00' },
  { id: 'a4', userId: 'u4', action: 'Nộp phiếu', module: 'Đánh giá 360', target: 'Một phiếu trong đợt Đánh giá 360 – Q4/2026', at: '2026-10-27T15:20' },
  { id: 'a5', userId: 'u1', action: 'Cập nhật người dùng', module: 'Tổ chức', target: 'Đỗ Minh An: gán quản lý trực tiếp', at: '2026-10-02T10:00' },
  { id: 'a6', userId: 'u2', action: 'Kích hoạt chu kỳ', module: 'Chu kỳ', target: 'Q4/2026', at: '2026-10-01T08:00' },
  { id: 'a7', userId: 'u2', action: 'Đóng chu kỳ', module: 'Chu kỳ', target: 'Q3/2026', at: '2026-09-30T18:00' },
  { id: 'a8', userId: 'u4', action: 'Đăng nhập', module: 'Xác thực', target: '', at: '2026-10-30T08:55' },
];

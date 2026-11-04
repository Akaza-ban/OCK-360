// Phiên đăng nhập giả và các quy tắc phân quyền phía giao diện.
// Lưu ý: bản thật bắt buộc kiểm tra lại toàn bộ quyền ở backend.
import { departments as DEPTS } from './data.js';

const KEY = 'okr360.session';

export function loadSession() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch {
    return null;
  }
}
export function saveSession(userId) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ userId }));
  } catch {
    /* trình duyệt chặn lưu trữ: phiên chỉ còn trong bộ nhớ */
  }
}
export function clearSession() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
}

export const isAdmin = (u) => u.role === 'ADMIN';
export const isHR = (u) => u.role === 'HR';
export const isManager = (u) => u.role === 'MANAGER';

export const directReports = (u, users) => users.filter((x) => x.managerId === u.id);
// Đơn vị (phòng ban hoặc team) mà người dùng phụ trách.
export const headOfDept = (u, departments) => departments.find((d) => d.headId === u.id);

// Phạm vi đơn vị của người phụ trách: đơn vị mình phụ trách và các team bên dưới.
// Trưởng phòng Dev có phạm vi Phòng Dev + Team Thanh toán + Team Nền tảng; team lead chỉ có team của mình.
export function unitsInScope(u, departments) {
  const own = headOfDept(u, departments);
  if (!own) return [];
  return [own, ...departments.filter((d) => d.parentId === own.id && d.type === 'TEAM')];
}

// Đơn vị và mọi đơn vị con của nó (dùng cho bộ lọc, báo cáo).
export function unitWithChildren(unitId, departments) {
  const out = [unitId];
  for (let i = 0; i < out.length; i++) departments.filter((d) => d.parentId === out[i]).forEach((d) => out.push(d.id));
  return out;
}

// Trưởng phòng nhận vướng mắc được AI chuyển đến. Bản mẫu đọc danh sách phòng ban từ dữ liệu giả.
export const isDeptHead = (u) => DEPTS.some((d) => d.headId === u.id);

// Ai duyệt bản nháp 1-1 của một người: quản lý trực tiếp, hoặc HR nếu người đó không có quản lý.
export function canReviewDraft(u, draft) {
  return draft.reviewerId ? draft.reviewerId === u.id : isHR(u);
}

// Quyền vào trang theo route.
export function canAccess(route, u) {
  const r = route.split('/')[1];
  if (['admin'].includes(r)) {
    const sub = route.split('/')[2];
    if (['campaigns', 'templates'].includes(sub)) return isHR(u);
    // Luồng tự động: Admin cấu hình, HR chỉ xem lịch sử chạy.
    return isAdmin(u) || isHR(u);
  }
  if (r === 'audit') return isAdmin(u) || isHR(u);
  if (r === 'final-results') return isHR(u);
  if (r === 'reports') return isAdmin(u) || isHR(u) || isManager(u);
  if (route.startsWith('/reviews/approvals')) return isManager(u) || isHR(u);
  // Màn hình kết quả AI nằm trong nhóm nghiệp vụ của nó, không có nhóm AI riêng.
  if (route.startsWith('/okr/blockers')) return isDeptHead(u);
  if (route.startsWith('/okr/digest')) return isManager(u);
  if (route.startsWith('/reviews/drafts')) return isManager(u) || isHR(u);
  return true;
}

// Ai được sửa một Objective.
export function canEditObjective(u, obj, state) {
  if (isAdmin(u)) return true;
  if (obj.level === 'COMPANY') return false;
  if (obj.level === 'DEPARTMENT') return headOfDept(u, state.departments)?.id === obj.deptId;
  // OKR team: team lead của team đó, hoặc trưởng phòng của phòng chứa team.
  if (obj.level === 'TEAM') return unitsInScope(u, state.departments).some((d) => d.id === obj.deptId);
  if (obj.ownerId === u.id) return true;
  const owner = state.users.find((x) => x.id === obj.ownerId);
  return owner?.managerId === u.id;
}

export function canDeleteObjective(u, obj, state) {
  if (isAdmin(u)) return true;
  if (obj.ownerId === u.id && obj.level === 'INDIVIDUAL') return true;
  return isManager(u) && obj.level !== 'COMPANY' && obj.level !== 'INDIVIDUAL' && unitsInScope(u, state.departments).some((d) => d.id === obj.deptId);
}

// Các cấp OKR người dùng được tạo.
export function creatableLevels(u, state) {
  if (isAdmin(u)) return ['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL'];
  const own = isManager(u) && headOfDept(u, state.departments);
  if (!own) return ['INDIVIDUAL'];
  if (own.type === 'TEAM') return ['TEAM', 'INDIVIDUAL'];
  const hasTeams = state.departments.some((d) => d.parentId === own.id && d.type === 'TEAM');
  return hasTeams ? ['DEPARTMENT', 'TEAM', 'INDIVIDUAL'] : ['DEPARTMENT', 'INDIVIDUAL'];
}

// Đơn vị được chọn khi tạo OKR phòng ban hoặc OKR team.
export function unitsForLevel(u, level, state) {
  const type = level === 'TEAM' ? 'TEAM' : 'DEPARTMENT';
  const pool = isAdmin(u) ? state.departments : unitsInScope(u, state.departments);
  return pool.filter((d) => (d.type || 'DEPARTMENT') === type && d.parentId !== null);
}

// Ai được xem kết quả 360 của ai.
export function canViewResult(u, revieweeId, campaign, users) {
  if (isHR(u)) return campaign.status === 'CLOSED' || campaign.status === 'PUBLISHED';
  if (u.id === revieweeId) return campaign.status === 'PUBLISHED';
  const reviewee = users.find((x) => x.id === revieweeId);
  return reviewee?.managerId === u.id && (campaign.status === 'CLOSED' || campaign.status === 'PUBLISHED');
}

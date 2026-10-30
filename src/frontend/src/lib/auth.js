// Phiên đăng nhập giả và các quy tắc phân quyền phía giao diện.
// Lưu ý: bản thật bắt buộc kiểm tra lại toàn bộ quyền ở backend.
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
export const headOfDept = (u, departments) => departments.find((d) => d.headId === u.id);

// Quyền vào trang theo route.
export function canAccess(route, u) {
  const r = route.split('/')[1];
  if (['admin'].includes(r)) {
    const sub = route.split('/')[2];
    if (['campaigns', 'templates'].includes(sub)) return isHR(u);
    return isAdmin(u) || isHR(u);
  }
  if (r === 'audit') return isAdmin(u) || isHR(u);
  if (r === 'final-results') return isHR(u);
  if (r === 'reports') return isAdmin(u) || isHR(u) || isManager(u);
  if (route.startsWith('/reviews/approvals')) return isManager(u) || isHR(u);
  return true;
}

// Ai được sửa một Objective.
export function canEditObjective(u, obj, state) {
  if (isAdmin(u)) return true;
  if (obj.level === 'COMPANY') return false;
  if (obj.level === 'DEPARTMENT') return headOfDept(u, state.departments)?.id === obj.deptId;
  if (obj.ownerId === u.id) return true;
  const owner = state.users.find((x) => x.id === obj.ownerId);
  return owner?.managerId === u.id;
}

export function canDeleteObjective(u, obj, state) {
  if (isAdmin(u)) return true;
  if (obj.ownerId === u.id && obj.level === 'INDIVIDUAL') return true;
  return isManager(u) && headOfDept(u, state.departments)?.id === obj.deptId && obj.level !== 'COMPANY';
}

// Các cấp OKR người dùng được tạo.
export function creatableLevels(u, state) {
  if (isAdmin(u)) return ['COMPANY', 'DEPARTMENT', 'INDIVIDUAL'];
  if (isManager(u) && headOfDept(u, state.departments)) return ['DEPARTMENT', 'INDIVIDUAL'];
  return ['INDIVIDUAL'];
}

// Ai được xem kết quả 360 của ai.
export function canViewResult(u, revieweeId, campaign, users) {
  if (isHR(u)) return campaign.status === 'CLOSED' || campaign.status === 'PUBLISHED';
  if (u.id === revieweeId) return campaign.status === 'PUBLISHED';
  const reviewee = users.find((x) => x.id === revieweeId);
  return reviewee?.managerId === u.id && (campaign.status === 'CLOSED' || campaign.status === 'PUBLISHED');
}

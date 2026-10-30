// Kho dữ liệu trong bộ nhớ cho bản mẫu. Bản thật sẽ thay bằng lời gọi API.
import { createContext, useContext, useMemo, useReducer } from 'react';
import * as seed from './data.js';
import { TODAY } from './data.js';

const StoreContext = createContext(null);

const initial = {
  users: seed.users,
  departments: seed.departments,
  cycles: seed.cycles,
  objectives: seed.objectives,
  keyResults: seed.keyResults,
  checkins: seed.checkins,
  checkinComments: seed.checkinComments,
  templates: seed.templates,
  campaigns: seed.campaigns,
  reviewForms: seed.reviewForms,
  nominations: seed.nominations,
  notifications: seed.notifications,
  auditLogs: seed.auditLogs,
  cycleId: 'q4-2026',
  toast: null,
};

let seq = 1000;
const nextId = (p) => `${p}${++seq}`;
const now = () => `${TODAY}T${new Date().toTimeString().slice(0, 5)}`;

function reducer(state, a) {
  switch (a.type) {
    case 'setCycle':
      return { ...state, cycleId: a.cycleId };
    case 'toast':
      return { ...state, toast: a.text };
    case 'checkin': {
      const c = { id: nextId('c'), at: now(), ...a.checkin };
      return { ...state, checkins: [...state.checkins, c], toast: 'Đã lưu check-in. Tiến độ các cấp đã được cập nhật.' };
    }
    case 'comment':
      return {
        ...state,
        checkinComments: [...state.checkinComments, { id: nextId('cm'), at: now(), ...a.comment }],
        toast: 'Đã gửi bình luận.',
      };
    case 'saveObjective': {
      const { objective, keyResults } = a;
      const isNew = !objective.id;
      const id = objective.id || nextId('o');
      const objs = isNew
        ? [...state.objectives, { ...objective, id }]
        : state.objectives.map((o) => (o.id === id ? { ...o, ...objective } : o));
      const others = state.keyResults.filter((k) => k.objectiveId !== id);
      const krs = keyResults.map((k) => ({ ...k, id: k.id || nextId('k'), objectiveId: id }));
      return { ...state, objectives: objs, keyResults: [...others, ...krs], toast: isNew ? 'Đã tạo Objective.' : 'Đã lưu Objective.' };
    }
    case 'deleteObjective':
      return {
        ...state,
        objectives: state.objectives.map((o) => (o.id === a.id ? { ...o, deletedAt: now(), deletedBy: a.userId } : o)),
        toast: 'Đã xóa Objective. Lịch sử vẫn được giữ lại.',
      };
    case 'saveForm':
      return {
        ...state,
        reviewForms: state.reviewForms.map((f) => (f.id === a.form.id ? { ...f, ...a.form } : f)),
        toast: a.form.status === 'SUBMITTED' ? 'Đã nộp phiếu đánh giá.' : 'Đã lưu nháp.',
      };
    case 'saveNomination': {
      const exists = state.nominations.some((n) => n.id === a.nomination.id);
      return {
        ...state,
        nominations: exists
          ? state.nominations.map((n) => (n.id === a.nomination.id ? a.nomination : n))
          : [...state.nominations, { ...a.nomination, id: nextId('n') }],
        toast: a.toastText,
      };
    }
    case 'readNotification':
      return { ...state, notifications: state.notifications.map((n) => (n.id === a.id ? { ...n, read: true } : n)) };
    case 'readAll':
      return { ...state, notifications: state.notifications.map((n) => (n.userId === a.userId ? { ...n, read: true } : n)) };
    case 'publishCampaign':
      return {
        ...state,
        campaigns: state.campaigns.map((c) => (c.id === a.id ? { ...c, status: 'PUBLISHED' } : c)),
        toast: 'Đã công bố kết quả. Mỗi nhân viên đã nhận thông báo.',
      };
    default:
      return state;
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext);
}

// Dữ liệu đang dùng (bỏ bản ghi đã xóa mềm) theo chu kỳ đang chọn.
export function useCycleData() {
  const { state } = useStore();
  return useMemo(() => {
    const cycle = state.cycles.find((c) => c.id === state.cycleId);
    const objectives = state.objectives.filter((o) => o.cycleId === cycle.id && !o.deletedAt);
    const ids = new Set(objectives.map((o) => o.id));
    const keyResults = state.keyResults.filter((k) => ids.has(k.objectiveId) && !k.deletedAt);
    return { ...state, cycle, objectives, keyResults };
  }, [state]);
}

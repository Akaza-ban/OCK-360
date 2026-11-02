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
  automationFlows: seed.automationFlows,
  automationRuns: seed.automationRuns,
  automationUsage: seed.automationUsage,
  checkinInsights: seed.checkinInsights,
  objectiveReviewNotes: seed.objectiveReviewNotes,
  weeklyDigests: seed.weeklyDigests,
  oneOnOneDrafts: seed.oneOnOneDrafts,
  // Giả lập AI worker (chỉ có trong bản mẫu): hàng đợi việc, các lần chạy đang hiển thị, công tắc giả lập lỗi.
  aiQueue: [],
  aiTraces: [],
  aiFail: false,
  aiExplain: null,
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
      // Cùng lúc lưu check-in, hệ thống ghi sự kiện cho AI worker. AI chạy sau, không làm chậm việc lưu.
      const jobs = [];
      if (c.blocker?.trim()) jobs.push({ id: nextId('job'), flow: 'BLOCKER_ROUTING', checkinId: c.id });
      if (c.note?.trim()) jobs.push({ id: nextId('job'), flow: 'CHECKIN_MISMATCH', checkinId: c.id });
      return { ...state, checkins: [...state.checkins, c], aiQueue: [...state.aiQueue, ...jobs], toast: c.blocker?.trim() ? 'Đã lưu check-in. AI đang đọc vướng mắc để chuyển đến đúng người.' : 'Đã lưu check-in. Tiến độ các cấp đã được cập nhật.' };
    }
    case 'aiEnqueue':
      return { ...state, aiQueue: [...state.aiQueue, { id: nextId('job'), ...a.job }] };
    case 'aiDequeue':
      return { ...state, aiQueue: state.aiQueue.filter((j) => j.id !== a.id) };
    case 'aiTrace': {
      const others = state.aiTraces.filter((t) => t.id !== a.trace.id);
      return { ...state, aiTraces: [a.trace, ...others].slice(0, 50) };
    }
    case 'setAiFail':
      return { ...state, aiFail: a.value, toast: a.value ? 'Đã bật giả lập dịch vụ AI lỗi. Check-in tiếp theo sẽ thấy AI thử lại rồi ghi Lỗi.' : 'Đã tắt giả lập lỗi.' };
    case 'aiExplain':
      return { ...state, aiExplain: a.target };
    case 'aiApply': {
      const ins = a.insight;
      const insights = ins
        ? state.checkinInsights.some((i) => i.checkinId === ins.checkinId)
          ? state.checkinInsights.map((i) => (i.checkinId === ins.checkinId ? { ...i, ...ins } : i))
          : [...state.checkinInsights, ins]
        : state.checkinInsights;
      return {
        ...state,
        automationRuns: [...state.automationRuns, { id: nextId('r'), at: now(), ...a.run }],
        checkinInsights: insights,
        notifications: [...(a.notifications || []).map((n) => ({ id: nextId('nt'), at: now(), read: false, ...n })), ...state.notifications],
        weeklyDigests: a.digest ? [{ id: nextId('wd'), ...a.digest }, ...state.weeklyDigests] : state.weeklyDigests,
      };
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
    // ---------- Tự động hóa bằng AI ----------
    case 'updateFlow':
      return {
        ...state,
        automationFlows: state.automationFlows.map((f) => (f.id === a.id ? { ...f, ...a.changes } : f)),
        toast: a.toastText || 'Đã lưu cấu hình luồng.',
      };
    case 'retryRun':
      return {
        ...state,
        automationRuns: state.automationRuns.map((r) => (r.id === a.id ? { ...r, status: 'PENDING', error: null } : r)),
        toast: 'Đã đưa lần chạy vào hàng đợi để chạy lại.',
      };
    case 'handleBlocker': {
      // Báo lại cho người báo vướng mắc (nhận xử lý) hoặc cho quản lý trực tiếp của họ (AI chuyển nhầm).
      const ins = state.checkinInsights.find((i) => i.checkinId === a.checkinId);
      const c = state.checkins.find((x) => x.id === a.checkinId);
      const reporter = state.users.find((u) => u.id === c.userId);
      const unit = state.departments.find((d) => d.id === ins.targetDeptId);
      const kr = state.keyResults.find((k) => k.id === c.krId);
      const note = a.note?.trim() ? `: "${a.note.trim()}"` : '.';
      const n = a.routing === 'ACKNOWLEDGED'
        ? { type: 'BLOCKER_UPDATED', userId: reporter.id, text: `${unit.name} đã nhận xử lý vướng mắc của bạn ở KR "${kr.title}"${note}`, link: `#/okr/${kr.objectiveId}` }
        : reporter.managerId && { type: 'BLOCKER_ROUTED', userId: reporter.managerId, text: `${unit.name} cho biết vướng mắc của ${reporter.name} không liên quan tới họ; vướng mắc được chuyển về bạn.`, link: `#/okr/${kr.objectiveId}` };
      return {
        ...state,
        notifications: n ? [{ id: nextId('nt'), at: now(), read: false, ...n }, ...state.notifications] : state.notifications,
        checkinInsights: state.checkinInsights.map((i) =>
          i.checkinId === a.checkinId ? { ...i, routing: a.routing, handledBy: a.userId, handledAt: now(), handlerNote: a.note } : i,
        ),
        toast: a.routing === 'ACKNOWLEDGED' ? 'Đã nhận xử lý. Người báo vướng mắc đã nhận thông báo.' : 'Đã chuyển vướng mắc về quản lý trực tiếp của người báo.',
      };
    }
    case 'readDigest':
      return { ...state, weeklyDigests: state.weeklyDigests.map((d) => (d.id === a.id ? { ...d, read: true } : d)) };
    case 'dismissNote':
      return {
        ...state,
        objectiveReviewNotes: state.objectiveReviewNotes.map((n) => (n.id === a.id ? { ...n, dismissed: true } : n)),
        toast: 'Đã ẩn gợi ý này.',
      };
    case 'saveDraft':
      return {
        ...state,
        oneOnOneDrafts: state.oneOnOneDrafts.map((d) => (d.id === a.id ? { ...d, ...a.changes } : d)),
        toast: a.toastText,
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

// Ngăn "AI đã làm gì?": mở khi bấm nhãn "Do AI tạo" ở bất kỳ màn hình nào.
// Cho thấy đúng lần chạy đã tạo ra nhãn/bản tin/bản nháp đó, từng bước một.
import { useEffect } from 'react';
import { useStore } from '../lib/store.jsx';
import { AiBadge } from './ui.jsx';
import { FLOW_TITLE, planCheckinRun, planDigestRun, explainDraft, explainReviewNote } from '../lib/aiPipeline.js';

// Nhãn "Do AI tạo" bấm được. target: { kind: 'insight' | 'digest' | 'draft' | 'note', ... }
export function AiExplainBadge({ target, text }) {
  const { dispatch } = useStore();
  return <AiBadge text={text} onClick={() => dispatch({ type: 'aiExplain', target })} />;
}

// Dựng lời giải thích: ưu tiên lần chạy vừa xảy ra trong phiên (có tiến trình thật),
// nếu không có thì dựng lại từ dữ liệu gốc. Hệ thống không lưu nội dung gửi cho AI.
function resolve(target, st) {
  const traceOf = (runId) => runId && st.aiTraces.find((t) => t.runId === runId);
  if (target.kind === 'insight') {
    const i = st.checkinInsights.find((x) => x.checkinId === target.checkinId);
    const runId = target.flow === 'BLOCKER_ROUTING' ? i?.blockerRunId : i?.mismatchRunId;
    const failed = st.automationRuns.find((r) => r.id === target.runId);
    const t = traceOf(target.runId || runId);
    if (t) return t;
    const c = st.checkins.find((x) => x.id === target.checkinId);
    if (failed?.status === 'FAILED') return planCheckinRun(target.flow, c, st, { fail: true });
    return planCheckinRun(target.flow, c, st, { override: target.flow === 'BLOCKER_ROUTING' ? i : { mismatch: i?.mismatch, aiNote: i?.aiNote } });
  }
  if (target.kind === 'digest') {
    const d = st.weeklyDigests.find((x) => x.id === target.id);
    return traceOf(d.runId) || planDigestRun(d.managerId, st, { stored: d });
  }
  if (target.kind === 'draft') return explainDraft(st.oneOnOneDrafts.find((x) => x.id === target.id), st);
  if (target.kind === 'note') return explainReviewNote(st.objectiveReviewNotes.find((x) => x.id === target.id), st);
  return null;
}

const STATUS_ICON = { pending: '○', running: '◐', done: '●', error: '✕', skipped: '–' };
const STATUS_LABEL = { running: ['Đang chạy', 'warn'], done: ['Xong', 'ok'], error: ['Lỗi', 'bad'], skipped: ['Bỏ qua', 'none'] };

export default function AiExplainDrawer() {
  const { state, dispatch } = useStore();
  const target = state.aiExplain;
  const close = () => dispatch({ type: 'aiExplain', target: null });
  useEffect(() => {
    if (!target) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  if (!target) return null;
  const x = resolve(target, state);
  if (!x) return null;
  const [label, cls] = STATUS_LABEL[x.status] || STATUS_LABEL.done;

  return (
    <div className="backdrop drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="AI đã làm gì">
        <header>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><AiBadge /><h2 style={{ margin: 0 }}>AI đã làm gì?</h2></div>
            <div className="small" style={{ marginTop: 6 }}><b>{FLOW_TITLE[x.flow]}</b> <span className={`conf pill ${cls}`} style={{ marginLeft: 6 }}>{label}</span></div>
            <div className="small muted" style={{ marginTop: 2 }}>{x.subject}</div>
          </div>
          <button className="icon-btn" onClick={close} aria-label="Đóng">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="drawer-body">
          {x.summary && <div className={`notice ${x.status === 'done' ? 'info' : ''}`} style={{ marginBottom: 14 }}>{x.summary}</div>}
          <ol className="pipeline">
            {x.steps.map((s, i) => (
              <li key={s.key} className={s.status}>
                <span className="pip" aria-hidden="true">{STATUS_ICON[s.status]}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b className="small">{i + 1}. {s.label}</b>
                  {s.detail && s.status !== 'pending' && s.status !== 'running' && <StepDetail d={s.detail} />}
                </div>
              </li>
            ))}
          </ol>
          <p className="small muted" style={{ marginTop: 14 }}>
            AI chỉ gắn nhãn, tóm tắt, cảnh báo và tạo bản nháp; AI không thay đổi tiến độ hay điểm số. Lời giải thích này được dựng lại từ dữ liệu bạn đang có quyền xem; hệ thống không lưu nội dung gửi cho AI, và lịch sử chạy của Admin không có nội dung này.
          </p>
          <p className="small muted">Bản mẫu: "AI" là vài luật theo từ khóa để minh họa; bản thật gọi mô hình ngôn ngữ ở backend.</p>
        </div>
      </aside>
    </div>
  );
}

function StepDetail({ d }) {
  return (
    <div className="step-detail">
      {d.title && <div className="muted small">{d.title}</div>}
      {d.kind === 'json' || d.kind === 'text' ? <pre className="code">{d.text}</pre> : null}
      {d.kind === 'mask' && (
        <>
          <div className="mask-row"><span className="muted small">Trước</span><pre className="code">{d.before}</pre></div>
          <div className="mask-row"><span className="muted small">Gửi đi</span><pre className="code">{d.after}</pre></div>
          {d.mapping.length > 0 && <div className="small muted">Bảng mã: {d.mapping.map(([c, n]) => `${c} = ${n}`).join(' · ')}</div>}
        </>
      )}
      {d.kind === 'checks' && <ul className="checks">{d.checks.map((c, i) => <li key={i} className={c.ok ? 'ok' : c.warn ? 'warn' : 'bad'}>{c.ok ? '✓' : c.warn ? '!' : '✕'} {c.text}</li>)}</ul>}
      {d.kind === 'list' && <ul className="checks">{d.items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
      {d.note && <div className="small muted" style={{ marginTop: 2 }}>{d.note}</div>}
    </div>
  );
}

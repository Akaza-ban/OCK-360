import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Modal, Pill, AiBadge } from '../../../components/ui.jsx';
import { RUN_STATUS, TRIGGER } from '../../../lib/ai.js';
import { isAdmin } from '../../../lib/auth.js';
import { dateTime, date } from '../../../lib/format.js';
import { TODAY } from '../../../lib/data.js';

const SCHEDULES = { '0 8 * * 1': '8h sáng thứ Hai', '0 17 * * 5': '17h chiều thứ Sáu', '0 8 * * *': '8h sáng mỗi ngày' };

// SCR-83 Luồng tự động (UC27, UC28). Admin cấu hình; HR chỉ xem lịch sử chạy.
export default function Automation({ user }) {
  const { state, dispatch } = useStore();
  const admin = isAdmin(user);
  const [tab, setTab] = useState(admin ? 'flows' : 'runs');
  const [editing, setEditing] = useState(null);
  const [flowFilter, setFlowFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const flowName = (id) => state.automationFlows.find((f) => f.id === id)?.name;
  const callsToday = (id) =>
    (state.automationUsage.find((u) => u.flow === id && u.date === TODAY)?.calls || 0) +
    state.automationRuns.filter((r) => r.flow === id && r.at.startsWith(TODAY) && r.inTokens != null).length;
  const describe = (r) => {
    const x = r.ref;
    const name = (uid) => state.users.find((u) => u.id === uid)?.name;
    if (x.checkinId) {
      const c = state.checkins.find((y) => y.id === x.checkinId);
      return `Check-in của ${name(c.userId)}`;
    }
    if (x.objectiveId) return `Objective "${state.objectives.find((o) => o.id === x.objectiveId)?.title}"`;
    if (x.managerId) return `Bản tin của ${name(x.managerId)}, tuần ${date(x.weekStart)}`;
    return `${state.campaigns.find((c) => c.id === x.campaignId)?.name} · ${name(x.revieweeId)}`;
  };
  const runs = state.automationRuns
    .filter((r) => (!flowFilter || r.flow === flowFilter) && (!statusFilter || r.status === statusFilter))
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader title="Luồng tự động" sub="AI chỉ đọc, phân loại, tóm tắt, cảnh báo và tạo bản nháp. AI không chấm điểm, không xếp loại và không sửa số liệu OKR hay 360." />
      {admin && (
        <div className="segmented" role="group" aria-label="Chọn tab" style={{ marginBottom: 14 }}>
          <button aria-pressed={tab === 'flows'} onClick={() => setTab('flows')}>Luồng</button>
          <button aria-pressed={tab === 'runs'} onClick={() => setTab('runs')}>Lịch sử chạy</button>
        </div>
      )}

      {tab === 'flows' && (
        <div className="notice" style={{ marginBottom: 14, alignItems: 'center' }}>
          <span style={{ flex: 1 }}>
            <b>Chỉ có trong bản mẫu:</b> giả lập dịch vụ AI bị lỗi. Bật lên rồi check-in ở bất kỳ đâu để thấy hệ thống thử lại, ghi Lỗi, mà check-in vẫn được lưu.
          </span>
          <button className="switch" role="switch" aria-checked={state.aiFail} aria-label="Giả lập dịch vụ AI lỗi" onClick={() => dispatch({ type: 'setAiFail', value: !state.aiFail })} />
        </div>
      )}
      {tab === 'flows' && (
        <section className="panel">
          <header><h2>6 luồng dựng sẵn</h2><span className="muted small">Hôm nay {date(TODAY)}</span></header>
          <div className="panel-body">
            {state.automationFlows.map((f) => {
              const used = callsToday(f.id);
              const last = state.automationRuns.filter((r) => r.flow === f.id).sort((a, b) => b.at.localeCompare(a.at))[0];
              return (
                <div key={f.id} className="flow-row">
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <b>{f.name}</b>
                      <span className="tag plain">{f.priority}</span>
                    </div>
                    <div className="muted small" style={{ marginTop: 2 }}>{f.description}</div>
                    <div className="small" style={{ marginTop: 4 }}>
                      {last ? <>Lần chạy gần nhất {dateTime(last.at)} · <Pill value={RUN_STATUS[last.status]} /></> : <span className="muted">Không ghi lịch sử từng lần (chỉ đếm số lần gọi AI)</span>}
                    </div>
                  </div>
                  <div className="small"><div className="muted">{TRIGGER[f.trigger]}</div>{f.when}</div>
                  <div className="usage">
                    <span>{used} / {f.quota} lần gọi AI hôm nay</span>
                    <span className="bar"><span style={{ width: `${Math.min(100, (used / f.quota) * 100)}%` }} /></span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <button className="switch" role="switch" aria-checked={f.enabled} aria-label={`Bật luồng ${f.name}`}
                      onClick={() => dispatch({ type: 'updateFlow', id: f.id, changes: { enabled: !f.enabled }, toastText: f.enabled ? `Đã tắt "${f.name}". Sự kiện mới của luồng này sẽ được bỏ qua.` : `Đã bật "${f.name}".` })} />
                    {f.id === 'WEEKLY_DIGEST' && (
                      <button className="btn small" disabled={!f.enabled} title="Không chờ tới 8h sáng thứ Hai" onClick={() => {
                        const managers = state.users.filter((m) => state.users.some((u) => u.managerId === m.id));
                        managers.forEach((m) => dispatch({ type: 'aiEnqueue', job: { flow: 'WEEKLY_DIGEST', managerId: m.id } }));
                        dispatch({ type: 'toast', text: `Đã đưa ${managers.length} bản tin vào hàng đợi. Mỗi quản lý sẽ nhận thông báo khi bản tin của mình xong.` });
                      }}>Chạy thử ngay</button>
                    )}
                    <button className="btn small" onClick={() => setEditing(f)}>Cấu hình</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === 'runs' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
            <select className="btn" aria-label="Lọc theo luồng" value={flowFilter} onChange={(e) => setFlowFilter(e.target.value)}>
              <option value="">Mọi luồng</option>
              {state.automationFlows.filter((f) => f.id !== 'REVIEW_COMMENT_GUARD').map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select className="btn" aria-label="Lọc theo trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Mọi trạng thái</option>
              {Object.entries(RUN_STATUS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <section className="panel">
            <div className="panel-body table-wrap">
              <table className="table">
                <thead><tr><th>Thời điểm</th><th>Luồng</th><th>Đối tượng</th><th>Trạng thái</th><th className="num">Số lần thử</th><th className="num">Thời gian</th><th className="num">Token</th><th>Ghi chú</th><th /></tr></thead>
                <tbody>
                  {runs.map((r) => (
                    <tr key={r.id}>
                      <td className="muted">{dateTime(r.at)}</td>
                      <td>{flowName(r.flow)}</td>
                      <td>{describe(r)}</td>
                      <td><Pill value={RUN_STATUS[r.status]} /></td>
                      <td className="num">{r.attempts}</td>
                      <td className="num">{r.durationMs ? `${(r.durationMs / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giây` : '—'}</td>
                      <td className="num">{r.inTokens != null ? (r.inTokens + r.outTokens).toLocaleString('vi-VN') : '—'}</td>
                      <td className="small" style={{ color: r.status === 'FAILED' ? 'var(--bad)' : 'var(--muted)' }}>{r.error || r.skipReason || (r.inTokens == null && r.status === 'SUCCEEDED' ? 'Không cần gọi AI' : '')}</td>
                      <td className="num">{admin && r.status === 'FAILED' && <button className="btn small" onClick={() => dispatch({ type: 'retryRun', id: r.id })}>Chạy lại</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="muted small" style={{ marginTop: 10 }}>
            Lịch sử chỉ có số liệu kỹ thuật, không có nội dung gửi cho AI hay AI trả về. Luồng "Cảnh báo nhận xét 360" không ghi lịch sử từng lần, để thời điểm nộp phiếu không bị suy ra từ đây.
          </p>
        </>
      )}

      {editing && (
        <Modal
          title={`Cấu hình: ${editing.name}`}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="btn" onClick={() => setEditing(null)}>Hủy</button>
              <button className="btn primary" onClick={() => {
                const quota = Number(document.getElementById('fl-q').value);
                if (!(quota > 0)) return dispatch({ type: 'toast', text: 'Hạn mức phải lớn hơn 0.' });
                const schedule = editing.trigger === 'SCHEDULE' ? document.getElementById('fl-s').value : null;
                dispatch({ type: 'updateFlow', id: editing.id, changes: { quota, ...(schedule ? { schedule, when: SCHEDULES[schedule] } : {}) } });
                setEditing(null);
              }}>Lưu</button>
            </>
          }
        >
          <div className="form-grid">
            {editing.trigger === 'SCHEDULE' && (
              <div className="field full">
                <label htmlFor="fl-s">Lịch chạy</label>
                <select id="fl-s" defaultValue={editing.schedule}>{Object.entries(SCHEDULES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
              </div>
            )}
            <div className="field full">
              <label htmlFor="fl-q">Hạn mức gọi AI mỗi ngày</label>
              <input id="fl-q" type="number" min="1" defaultValue={editing.quota} />
              <span className="hint">Vượt hạn mức thì luồng tạm dừng tới hôm sau và Admin nhận cảnh báo. Các tính năng không dùng AI vẫn chạy bình thường.</span>
            </div>
          </div>
          <p className="small" style={{ marginTop: 12 }}><AiBadge text="Giới hạn của AI" /> Luồng chỉ được tạo nhãn, thông báo, ghi chú và bản nháp; không luồng nào sửa được điểm, tiến độ hay phiếu đánh giá.</p>
        </Modal>
      )}
    </>
  );
}

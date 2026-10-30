import { useMemo, useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { progressMap, expectedProgress, objectiveConfidence, ancestry, krProgress } from '../../../lib/okr.js';
import { Progress, Confidence, PageHeader, LEVEL_LABEL, Modal, Avatar, Empty } from '../../../components/ui.jsx';
import { canEditObjective, canDeleteObjective } from '../../../lib/auth.js';
import KrRow from '../components/KrRow.jsx';
import CheckinModal from '../components/CheckinModal.jsx';
import ObjectiveForm from '../components/ObjectiveForm.jsx';
import { num, date, dateTime, pct } from '../../../lib/format.js';
import { TODAY } from '../../../lib/data.js';

export default function ObjectiveDetail({ user, id }) {
  const { state, dispatch } = useStore();
  const obj = state.objectives.find((o) => o.id === id && !o.deletedAt);
  const cycle = obj && state.cycles.find((c) => c.id === obj.cycleId);
  const scoped = useMemo(() => ({ ...state, objectives: state.objectives.filter((o) => !o.deletedAt), keyResults: state.keyResults }), [state]);
  const pm = useMemo(() => progressMap(scoped), [scoped]);
  const [checkinKr, setCheckinKr] = useState(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const krs = state.keyResults.filter((k) => k.objectiveId === id);
  const [historyKr, setHistoryKr] = useState(krs.find((k) => k.type !== 'BOOLEAN')?.id || krs[0]?.id);

  if (!obj) return <Empty title="Không tìm thấy Objective." action={<a className="btn" href="#/okr/tree">Về cây OKR</a>}>Objective có thể đã bị xóa.</Empty>;

  const expected = expectedProgress(cycle);
  const closed = cycle.status === 'CLOSED';
  const chain = ancestry(obj.id, state.objectives).slice(0, -1);
  const children = state.objectives.filter((o) => o.parentId === obj.id && !o.deletedAt);
  const owner = state.users.find((u) => u.id === obj.ownerId);
  const deptName = state.departments.find((d) => d.id === obj.deptId)?.name;
  const canEdit = !closed && canEditObjective(user, obj, state);
  const canDelete = !closed && canDeleteObjective(user, obj, state);
  const hk = krs.find((k) => k.id === historyKr);

  return (
    <>
      <div className="breadcrumb" style={{ marginBottom: 10 }}>
        <a href="#/okr/tree">Cây OKR</a>
        {chain.map((p) => <span key={p.id}>› <a href={`#/okr/${p.id}`}>{p.title}</a></span>)}
      </div>
      <PageHeader
        title={obj.title}
        sub={
          <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`tag ${obj.level === 'COMPANY' ? 'company' : obj.level === 'DEPARTMENT' ? 'dept' : 'person'}`}>{LEVEL_LABEL[obj.level]}</span>
            {obj.level === 'DEPARTMENT' ? deptName : owner?.name} · {cycle.name}
            {!chain.length && obj.level !== 'COMPANY' && <span className="conf warn">Chưa liên kết cấp trên</span>}
          </span>
        }
        actions={
          <>
            {canEdit && <button className="btn" onClick={() => setEditing(true)}>Sửa</button>}
            {canDelete && <button className="btn danger" onClick={() => setConfirmDelete(true)}>Xóa</button>}
          </>
        }
      />
      {obj.description && <p style={{ marginTop: -10, marginBottom: 18, maxWidth: '72ch' }}>{obj.description}</p>}

      <div className="grid three" style={{ marginBottom: 18 }}>
        <section className="panel panel-body">
          <div className="stat"><b>{pct(pm.get(obj.id))}</b><span>Tiến độ hiện tại, cộng dồn từ {krs.length} Key Result{children.length ? ` và ${children.length} Objective con` : ''}</span></div>
        </section>
        <section className="panel panel-body">
          <div className="stat"><b>{closed ? '—' : pct(expected)}</b><span>{closed ? 'Chu kỳ đã đóng, tiến độ đã chốt' : `Kỳ vọng hôm nay (${date(TODAY)})`}</span></div>
        </section>
        <section className="panel panel-body">
          <div className="stat" style={{ gap: 8 }}><span>Mức tự tin hiện tại</span><Confidence value={objectiveConfidence(obj.id, state)} /></div>
        </section>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <header><h2>Key Result</h2></header>
        <div className="panel-body">
          {krs.map((k) => <KrRow key={k.id} kr={k} data={state} expected={expected} canCheckin={!closed && k.assigneeId === user.id} onCheckin={setCheckinKr} />)}
        </div>
      </section>

      {children.length > 0 && (
        <section className="panel" style={{ marginBottom: 18 }}>
          <header><h2>Objective con đã liên kết</h2></header>
          <div className="panel-body">
            {children.map((c) => (
              <div key={c.id} className="kr-row" style={{ gridTemplateColumns: '1fr 230px 130px' }}>
                <div>
                  <a href={`#/okr/${c.id}`} className="kr-title">{c.title}</a>
                  <div className="kr-meta">{c.level === 'DEPARTMENT' ? state.departments.find((d) => d.id === c.deptId)?.name : state.users.find((u) => u.id === c.ownerId)?.name}</div>
                </div>
                <Progress value={pm.get(c.id)} expected={expected} />
                <Confidence value={objectiveConfidence(c.id, state)} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="panel">
        <header>
          <h2>Lịch sử check-in</h2>
          {krs.length > 1 && (
            <select aria-label="Chọn Key Result" value={historyKr} onChange={(e) => setHistoryKr(e.target.value)} className="btn small">
              {krs.map((k) => <option key={k.id} value={k.id}>{k.title}</option>)}
            </select>
          )}
        </header>
        <div className="panel-body">{hk && <History kr={hk} cycle={cycle} user={user} closed={closed} />}</div>
      </section>

      {checkinKr && <CheckinModal kr={checkinKr} user={user} onClose={() => setCheckinKr(null)} />}
      {editing && <ObjectiveForm user={user} objective={obj} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <Modal
          title="Xóa Objective?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirmDelete(false)}>Giữ lại</button>
              <button className="btn primary" disabled={children.length > 0} onClick={() => { dispatch({ type: 'deleteObjective', id: obj.id, userId: user.id }); window.location.hash = '#/okr/my'; }}>Xóa Objective</button>
            </>
          }
        >
          {children.length > 0 ? (
            <div className="notice">Objective này còn {children.length} Objective con đang liên kết. Hãy gỡ liên kết của chúng trước khi xóa.</div>
          ) : (
            <p>"{obj.title}" sẽ biến mất khỏi cây OKR, dashboard và báo cáo. Lịch sử check-in vẫn được giữ lại để truy vết.</p>
          )}
        </Modal>
      )}
    </>
  );
}

function History({ kr, cycle, user, closed }) {
  const { state, dispatch } = useStore();
  const [draft, setDraft] = useState({});
  const list = state.checkins.filter((c) => c.krId === kr.id).sort((a, b) => b.at.localeCompare(a.at));
  const owner = state.users.find((u) => u.id === kr.assigneeId);
  const isManager = owner?.managerId === user.id;

  if (!list.length) return <p className="muted">Key Result này chưa có lần check-in nào.</p>;

  return (
    <div className="grid two" style={{ alignItems: 'start' }}>
      <ProgressChart kr={kr} cycle={cycle} checkins={[...list].reverse()} />
      <ul className="timeline">
        {list.map((c) => {
          const comments = state.checkinComments.filter((m) => m.checkinId === c.id);
          return (
            <li key={c.id}>
              <div className="small muted">{dateTime(c.at)}</div>
              <div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <b>{kr.type === 'BOOLEAN' ? (c.value ? 'Đã hoàn thành' : 'Chưa hoàn thành') : num(c.value, kr.unit)}</b>
                  <span className="muted small">{pct(krProgress(kr, [c]))}</span>
                  <Confidence value={c.confidence} />
                </div>
                {c.note && <p style={{ marginTop: 4 }}>{c.note}</p>}
                {c.blocker && <p className="small" style={{ marginTop: 4, color: 'var(--warn)' }}>Vướng mắc: {c.blocker}</p>}
                {comments.map((m) => {
                  const a = state.users.find((u) => u.id === m.userId);
                  return (
                    <div key={m.id} className="comment">
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}><Avatar name={a.name} size={20} /><b className="small">{a.name}</b></span>
                      {m.text}
                    </div>
                  );
                })}
                {isManager && !closed && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <input aria-label="Viết bình luận" className="btn small" style={{ flex: 1, textAlign: 'left', cursor: 'text' }} placeholder="Bình luận cho nhân viên…" value={draft[c.id] || ''} onChange={(e) => setDraft((d) => ({ ...d, [c.id]: e.target.value }))} />
                    <button className="btn small" disabled={!draft[c.id]?.trim()} onClick={() => { dispatch({ type: 'comment', comment: { checkinId: c.id, userId: user.id, text: draft[c.id].trim() } }); setDraft((d) => ({ ...d, [c.id]: '' })); }}>Gửi</button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Biểu đồ tiến độ thực tế (bậc thang theo từng check-in) so với đường kỳ vọng tuyến tính.
function ProgressChart({ kr, cycle, checkins }) {
  const W = 460, H = 220, L = 40, R = 16, T = 16, B = 30;
  const s = Date.parse(cycle.start), e = Date.parse(cycle.end);
  const X = (d) => L + ((Date.parse(d) - s) / (e - s)) * (W - L - R);
  const Y = (p) => T + (1 - p) * (H - T - B);
  const end = cycle.status === 'CLOSED' ? cycle.end : TODAY;
  const pts = [{ at: cycle.start, p: 0 }, ...checkins.map((c) => ({ at: c.at.slice(0, 10), p: krProgress(kr, [c]) }))];
  let d = `M${X(pts[0].at)} ${Y(0)}`;
  pts.slice(1).forEach((pt, i) => { d += ` H${X(pt.at)} V${Y(pt.p)}`; if (i === pts.length - 2) d += ` H${X(end)}`; });
  const months = [];
  for (let t = new Date(cycle.start); t <= new Date(cycle.end); t.setMonth(t.getMonth() + 1)) months.push(t.toISOString().slice(0, 10));
  return (
    <figure style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Biểu đồ tiến độ của ${kr.title}`}>
        {[0, 0.5, 1].map((p) => (
          <g key={p}>
            <line x1={L} x2={W - R} y1={Y(p)} y2={Y(p)} style={{ stroke: 'var(--line)' }} />
            <text x={L - 8} y={Y(p) + 3} fontSize="9.5" textAnchor="end" style={{ fill: 'var(--faint)' }}>{p * 100}%</text>
          </g>
        ))}
        {months.map((m) => <text key={m} x={X(m)} y={H - 10} fontSize="9.5" style={{ fill: 'var(--faint)' }} textAnchor="start">Th{Number(m.slice(5, 7))}</text>)}
        <line x1={X(cycle.start)} y1={Y(0)} x2={X(cycle.end)} y2={Y(1)} style={{ stroke: 'var(--muted)' }} strokeDasharray="4 4" strokeWidth="1.2" />
        <path d={d} fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2.2" />
        {pts.slice(1).map((pt, i) => <circle key={i} cx={X(pt.at)} cy={Y(pt.p)} r="3.2" style={{ fill: 'var(--accent)' }} />)}
        {cycle.status !== 'CLOSED' && <line x1={X(TODAY)} x2={X(TODAY)} y1={T} y2={H - B} style={{ stroke: 'var(--warn)' }} strokeWidth="1" />}
      </svg>
      <figcaption className="legend">
        <span><svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" style={{ stroke: 'var(--accent)' }} strokeWidth="2.2" /></svg> Thực tế</span>
        <span><svg width="22" height="8" aria-hidden="true"><line x1="0" y1="4" x2="22" y2="4" style={{ stroke: 'var(--muted)' }} strokeDasharray="4 3" /></svg> Kỳ vọng</span>
        {cycle.status !== 'CLOSED' && <span><svg width="10" height="12" aria-hidden="true"><line x1="5" y1="0" x2="5" y2="12" style={{ stroke: 'var(--warn)' }} /></svg> Hôm nay</span>}
      </figcaption>
    </figure>
  );
}


import { useEffect, useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Empty, Avatar } from '../../../components/ui.jsx';
import { date } from '../../../lib/format.js';
import { AiExplainBadge } from '../../../components/AiExplain.jsx';

// SCR-81 Bản tin tuần (UC30): con số lấy từ dữ liệu, phần "cần chú ý" do AI viết.
export default function Digest({ user }) {
  const { state, dispatch } = useStore();
  const mine = state.weeklyDigests.filter((d) => d.managerId === user.id).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const [id, setId] = useState(mine[0]?.id);
  const d = mine.find((x) => x.id === id);

  useEffect(() => {
    if (d && !d.read) dispatch({ type: 'readDigest', id: d.id });
  }, [d, dispatch]);

  if (!d) return <><PageHeader title="Bản tin tuần" /><section className="panel"><Empty title="Chưa có bản tin nào.">Bản tin được gửi lúc 8h sáng thứ Hai cho quản lý có nhân viên dưới quyền trực tiếp.</Empty></section></>;

  const name = (uid) => state.users.find((u) => u.id === uid)?.name;
  const kr = (kid) => state.keyResults.find((k) => k.id === kid);
  const s = d.stats;

  return (
    <>
      <PageHeader
        title="Bản tin tuần"
        sub={`Check-in của đội từ ${date(d.from)} đến ${date(d.to)} · gửi lúc 8h sáng ${date(d.weekStart)}`}
        actions={mine.length > 1 && (
          <select className="btn" aria-label="Chọn tuần" value={id} onChange={(e) => setId(e.target.value)}>
            {mine.map((x) => <option key={x.id} value={x.id}>Tuần {date(x.from)}–{date(x.to)}</option>)}
          </select>
        )}
      />

      <div className="grid three" style={{ marginBottom: 18 }}>
        <section className="panel panel-body"><div className="stat"><b>{s.checkedInCount}/{s.memberCount}</b><span>Thành viên đã check-in trong tuần</span></div></section>
        <section className="panel panel-body"><div className="stat"><b>{s.atRiskKrIds.length}</b><span>KR ở mức Có rủi ro</span></div></section>
        <section className="panel panel-body"><div className="stat"><b>{s.offTrackKrIds.length}</b><span>KR ở mức Chệch hướng</span></div></section>
      </div>

      <section className="panel" style={{ marginBottom: 18 }}>
        <header><h2>Việc cần chú ý</h2><AiExplainBadge target={{ kind: 'digest', id: d.id }} /></header>
        <div className="panel-body">
          {d.highlights.length ? (
            <ol className="stack" style={{ gap: 12, paddingLeft: 18, margin: '8px 0' }}>
              {d.highlights.map((h, i) => (
                <li key={i}>
                  <p style={{ margin: 0 }}>{h.text}</p>
                  {kr(h.krId) && <a className="small" href={`#/okr/${kr(h.krId).objectiveId}`}>Mở KR "{kr(h.krId).title}"</a>}
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Tuần này đội không có check-in nào, nên bản tin không gọi AI. Chỉ có danh sách người chưa check-in bên dưới.</p>
          )}
        </div>
      </section>

      <section className="panel">
        <header><h2>Chưa check-in trong tuần</h2><span className="muted small">Tính từ dữ liệu, không qua AI</span></header>
        <div className="panel-body stack" style={{ gap: 8 }}>
          {s.notCheckedIn.length ? s.notCheckedIn.map((uid) => <span key={uid} className="person"><Avatar name={name(uid)} size={24} />{name(uid)}</span>) : <p className="muted">Cả đội đã check-in.</p>}
        </div>
      </section>
    </>
  );
}

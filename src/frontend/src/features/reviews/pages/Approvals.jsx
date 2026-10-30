import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty } from '../../../components/ui.jsx';
import { isHR } from '../../../lib/auth.js';

export default function Approvals({ user }) {
  const { state, dispatch } = useStore();
  const campaign = state.campaigns.find((c) => ['NOMINATION', 'COLLECTING'].includes(c.status));
  const mine = (n) => {
    const r = state.users.find((u) => u.id === n.revieweeId);
    return r.managerId === user.id || (isHR(user) && !r.managerId);
  };
  const noms = campaign ? state.nominations.filter((n) => n.campaignId === campaign.id && mine(n)) : [];
  const [edit, setEdit] = useState({});

  return (
    <>
      <PageHeader title="Duyệt người đánh giá" sub={campaign ? `${campaign.name} · ${noms.filter((n) => n.status === 'PENDING').length} danh sách chờ duyệt` : ''} />
      <div className="notice info" style={{ marginBottom: 16 }}>Bạn có thể giữ, thêm hoặc bớt đồng nghiệp. Mỗi danh sách sau khi duyệt vẫn cần 3–5 người, và nên có người ngoài nhóm làm việc thân thiết.</div>
      {!noms.length && <section className="panel"><Empty title="Không có danh sách nào chờ bạn duyệt." /></section>}
      <div className="stack">
        {noms.map((n) => {
          const r = state.users.find((u) => u.id === n.revieweeId);
          const peers = edit[n.id] || n.peerIds;
          const candidates = state.users.filter((u) => u.id !== r.id && u.id !== r.managerId && u.managerId !== r.id && !peers.includes(u.id));
          const valid = peers.length >= 3 && peers.length <= 5;
          const approved = n.status === 'APPROVED';
          return (
            <section key={n.id} className="panel">
              <header>
                <span className="person"><Avatar name={r.name} size={32} /><span><b>{r.name}</b><span className="muted small" style={{ display: 'block' }}>{r.title}</span></span></span>
                <span className={`conf ${approved ? 'ok' : 'warn'}`}>{approved ? 'Đã duyệt' : 'Chờ duyệt'}</span>
              </header>
              <div className="panel-body">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {peers.map((id) => {
                    const u = state.users.find((x) => x.id === id);
                    const sameDept = u.deptId === r.deptId;
                    return (
                      <span key={id} className="tag" style={{ padding: '5px 10px', fontSize: 13.5, display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                        {u.name} <span className="muted">· {sameDept ? 'cùng phòng' : state.departments.find((d) => d.id === u.deptId)?.name}</span>
                        {!approved && <button className="icon-btn" style={{ padding: '0 4px', fontSize: 13 }} aria-label={`Bỏ ${u.name}`} onClick={() => setEdit((e) => ({ ...e, [n.id]: peers.filter((x) => x !== id) }))}>✕</button>}
                      </span>
                    );
                  })}
                </div>
                {!approved && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select className="btn small" aria-label={`Thêm người đánh giá cho ${r.name}`} value="" onChange={(e) => e.target.value && setEdit((x) => ({ ...x, [n.id]: [...peers, e.target.value] }))} disabled={peers.length >= 5}>
                      <option value="">Thêm người đánh giá…</option>
                      {candidates.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    {!valid && <span className="small" style={{ color: 'var(--warn)' }}>Cần 3–5 người.</span>}
                    <span style={{ flex: 1 }} />
                    <button className="btn primary small" disabled={!valid} onClick={() => dispatch({ type: 'saveNomination', nomination: { ...n, peerIds: peers, status: 'APPROVED' }, toastText: `Đã duyệt danh sách của ${r.name}.` })}>Duyệt danh sách</button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

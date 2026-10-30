import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty } from '../../../components/ui.jsx';
import { date } from '../../../lib/format.js';

export default function Nominate({ user }) {
  const { state, dispatch } = useStore();
  const campaign = state.campaigns.find((c) => ['NOMINATION', 'COLLECTING'].includes(c.status));
  const existing = campaign && state.nominations.find((n) => n.campaignId === campaign.id && n.revieweeId === user.id);
  const [picked, setPicked] = useState(existing?.peerIds || []);
  const [q, setQ] = useState('');
  const locked = !campaign || campaign.status !== 'NOMINATION' || existing?.status === 'APPROVED';

  if (!campaign) return <Empty title="Hiện không có đợt đánh giá nào." />;

  // Không được chọn: chính mình, quản lý trực tiếp, cấp dưới trực tiếp, người bị khóa.
  const eligible = state.users.filter((u) => u.id !== user.id && u.id !== user.managerId && u.managerId !== user.id && u.active);
  const list = eligible.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 5 ? [...p, id] : p));
  const valid = picked.length >= 3 && picked.length <= 5;

  return (
    <>
      <PageHeader title="Đề cử đồng nghiệp" sub={`${campaign.name} · hạn đề cử ${date(campaign.nominationDeadline)}`} />
      {existing?.status === 'APPROVED' && <div className="notice info" style={{ marginBottom: 16 }}>Quản lý đã duyệt danh sách của bạn. Danh sách không còn sửa được.</div>}
      {campaign.status !== 'NOMINATION' && existing?.status !== 'APPROVED' && <div className="notice" style={{ marginBottom: 16 }}>Giai đoạn đề cử đã kết thúc. Quản lý trực tiếp đã chọn người đánh giá thay bạn.</div>}
      <div className="grid two">
        <section className="panel">
          <header><h2>Chọn 3–5 đồng nghiệp hiểu công việc của bạn</h2></header>
          <div className="panel-body">
            <input className="btn" style={{ width: '100%', textAlign: 'left', cursor: 'text', marginBottom: 10 }} aria-label="Tìm đồng nghiệp" placeholder="Tìm theo tên" value={q} onChange={(e) => setQ(e.target.value)} disabled={locked} />
            {list.map((u) => (
              <label key={u.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 4px', borderTop: '1px solid var(--line-2)', cursor: locked ? 'default' : 'pointer' }}>
                <input type="checkbox" checked={picked.includes(u.id)} disabled={locked || (!picked.includes(u.id) && picked.length >= 5)} onChange={() => toggle(u.id)} />
                <Avatar name={u.name} size={28} />
                <span><b style={{ fontWeight: 600 }}>{u.name}</b><span className="muted small" style={{ display: 'block' }}>{u.title} · {state.departments.find((d) => d.id === u.deptId)?.name}</span></span>
              </label>
            ))}
            <p className="muted small" style={{ marginTop: 10 }}>Quản lý trực tiếp và cấp dưới trực tiếp của bạn đã tự động là người đánh giá, nên không có trong danh sách này.</p>
          </div>
        </section>
        <section className="panel">
          <header><h2>Đã chọn {picked.length}/5</h2></header>
          <div className="panel-body stack" style={{ gap: 10 }}>
            {picked.map((id) => {
              const u = state.users.find((x) => x.id === id);
              return <div key={id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Avatar name={u.name} size={26} />{u.name}</div>;
            })}
            {!picked.length && <p className="muted">Chưa chọn ai.</p>}
            {!valid && picked.length > 0 && <p className="small" style={{ color: 'var(--warn)' }}>Cần chọn thêm {3 - picked.length} người.</p>}
            {!locked && (
              <button className="btn primary" disabled={!valid} onClick={() => dispatch({ type: 'saveNomination', nomination: { ...(existing || { campaignId: campaign.id, revieweeId: user.id }), peerIds: picked, status: 'PENDING' }, toastText: 'Đã gửi danh sách đề cử cho quản lý duyệt.' })}>Gửi cho quản lý duyệt</button>
            )}
            {existing && <span className={`conf ${existing.status === 'APPROVED' ? 'ok' : 'warn'}`}>{existing.status === 'APPROVED' ? 'Đã được duyệt' : 'Đang chờ quản lý duyệt'}</span>}
          </div>
        </section>
      </div>
    </>
  );
}

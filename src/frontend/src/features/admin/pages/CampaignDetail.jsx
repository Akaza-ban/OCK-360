import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Progress, Avatar, Empty } from '../../../components/ui.jsx';
import { CAMPAIGN_STATUS } from './Campaigns.jsx';
import { date } from '../../../lib/format.js';

const STEPS = ['DRAFT', 'NOMINATION', 'COLLECTING', 'CLOSED', 'PUBLISHED'];

export default function CampaignDetail({ id }) {
  const { state, dispatch } = useStore();
  const c = state.campaigns.find((x) => x.id === id);
  if (!c) return <Empty title="Không tìm thấy đợt đánh giá." />;
  const forms = state.reviewForms.filter((f) => f.campaignId === c.id);
  const depts = state.departments;
  // Chỉ đếm số phiếu còn thiếu theo người đánh giá, không hiển thị họ còn thiếu phiếu cho ai.
  const reviewers = state.users
    .map((u) => ({ user: u, total: forms.filter((f) => f.reviewerId === u.id).length, left: forms.filter((f) => f.reviewerId === u.id && f.status !== 'SUBMITTED').length }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.left - a.left);
  const idx = STEPS.indexOf(c.status);
  const next = { DRAFT: 'Mở đề cử', NOMINATION: 'Mở thu phiếu', COLLECTING: 'Đóng đợt', CLOSED: 'Công bố kết quả' }[c.status];

  return (
    <>
      <div className="breadcrumb" style={{ marginBottom: 10 }}><a href="#/admin/campaigns">Đợt đánh giá 360</a> › {c.name}</div>
      <PageHeader
        title={c.name}
        sub={`Hạn đề cử ${date(c.nominationDeadline)} · hạn nộp phiếu ${date(c.submitDeadline)}`}
        actions={
          <>
            {c.status === 'COLLECTING' && <button className="btn" onClick={() => dispatch({ type: 'toast', text: `Đã gửi nhắc cho ${reviewers.filter((r) => r.left).length} người chưa nộp đủ phiếu.` })}>Gửi nhắc người chưa nộp</button>}
            {next && <button className="btn primary" onClick={() => dispatch({ type: 'toast', text: `Bản mẫu: ${next.toLowerCase()}.` })}>{next}</button>}
          </>
        }
      />
      <ol className="panel panel-body" style={{ display: 'flex', gap: 0, listStyle: 'none', margin: '0 0 18px', padding: 16 }}>
        {STEPS.map((s, i) => (
          <li key={s} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }} aria-current={i === idx ? 'step' : undefined}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600, background: i <= idx ? 'var(--accent)' : 'var(--active)', color: i <= idx ? '#fff' : 'var(--muted)' }}>{i + 1}</span>
            <span style={{ fontWeight: i === idx ? 700 : 500, color: i <= idx ? 'var(--ink)' : 'var(--muted)' }}>{CAMPAIGN_STATUS[s][0]}</span>
            {i < STEPS.length - 1 && <span style={{ flex: 1, height: 2, background: i < idx ? 'var(--accent)' : 'var(--line)', margin: '0 10px' }} />}
          </li>
        ))}
      </ol>
      <div className="grid two">
        <section className="panel">
          <header><h2>Tỷ lệ nộp phiếu theo phòng ban</h2></header>
          <div className="panel-body">
            {depts.map((d) => {
              const fs = forms.filter((f) => state.users.find((u) => u.id === f.reviewerId)?.deptId === d.id);
              if (!fs.length) return null;
              const done = fs.filter((f) => f.status === 'SUBMITTED').length;
              return (
                <div key={d.id} className="kr-row" style={{ gridTemplateColumns: '1fr 240px 70px' }}>
                  <span>{d.name}</span>
                  <Progress value={done / fs.length} />
                  <span className="muted small num">{done}/{fs.length}</span>
                </div>
              );
            })}
          </div>
        </section>
        <section className="panel">
          <header><h2>Người đánh giá còn thiếu phiếu</h2></header>
          <div className="panel-body">
            <p className="muted small" style={{ marginBottom: 8 }}>Chỉ hiện số phiếu còn thiếu. Để giữ ẩn danh, hệ thống không cho biết họ còn thiếu phiếu cho ai.</p>
            <table className="table">
              <thead><tr><th>Người đánh giá</th><th className="num">Còn thiếu</th></tr></thead>
              <tbody>
                {reviewers.map((r) => (
                  <tr key={r.user.id}>
                    <td><span className="person"><Avatar name={r.user.name} size={24} />{r.user.name}</span></td>
                    <td className="num">{r.left ? <span className="conf warn">{r.left}/{r.total} phiếu</span> : <span className="conf ok">Đã nộp đủ</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

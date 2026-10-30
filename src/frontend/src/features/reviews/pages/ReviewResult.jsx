import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty, Score } from '../../../components/ui.jsx';
import { aggregate360, GROUP_LABEL, ANON_THRESHOLD } from '../../../lib/review.js';
import { canViewResult, isHR } from '../../../lib/auth.js';
import { score } from '../../../lib/format.js';

export default function ReviewResult({ user, revieweeId }) {
  const { state } = useStore();
  const visibleCampaigns = state.campaigns.filter((c) => ['CLOSED', 'PUBLISHED'].includes(c.status));
  const [campaignId, setCampaignId] = useState(visibleCampaigns.at(-1)?.id);
  const campaign = state.campaigns.find((c) => c.id === campaignId);
  const people = state.users.filter((u) => campaign && canViewResult(user, u.id, campaign, state.users));
  const targetId = revieweeId || (people.some((p) => p.id === user.id) ? user.id : people[0]?.id);
  const target = state.users.find((u) => u.id === targetId);

  if (!campaign) return <Empty title="Chưa có kết quả đánh giá nào." />;

  const header = (
    <PageHeader
      title="Kết quả 360"
      sub={campaign.name}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {people.length > 1 && (
            <select className="btn" aria-label="Chọn nhân viên" value={targetId || ''} onChange={(e) => (window.location.hash = `#/reviews/results/${e.target.value}`)}>
              {people.map((p) => <option key={p.id} value={p.id}>{p.id === user.id ? `${p.name} (bạn)` : p.name}</option>)}
            </select>
          )}
          <select className="btn" aria-label="Chọn đợt" value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
            {visibleCampaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      }
    />
  );

  if (!target || !canViewResult(user, target.id, campaign, state.users)) {
    return <>{header}<section className="panel"><Empty title="Bạn không có quyền xem kết quả này.">Nhân viên xem kết quả của mình sau khi HR công bố. Quản lý xem kết quả của nhân viên dưới quyền trực tiếp.</Empty></section></>;
  }

  const template = state.templates.find((t) => t.id === campaign.templateId);
  const r = aggregate360(state.reviewForms, campaign.id, target.id, template);
  const groupKeys = r.groups.map((g) => g.key);

  return (
    <>
      {header}
      {campaign.status === 'CLOSED' && <div className="notice" style={{ marginBottom: 16 }}>Kết quả chưa công bố. {isHR(user) ? 'Nhân viên chưa thấy kết quả này.' : 'Chỉ bạn và HR thấy kết quả này.'}</div>}
      <div className="grid three" style={{ marginBottom: 18 }}>
        <section className="panel panel-body" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Avatar name={target.name} size={48} />
          <div><b style={{ fontSize: 17 }}>{target.name}</b><div className="muted small">{target.title}</div></div>
        </section>
        <section className="panel panel-body"><div className="stat"><b>{score(r.score)}<span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 500 }}> / 5</span></b><span>Điểm 360, trung bình các nhóm được hiển thị, không gồm tự đánh giá</span></div></section>
        <section className="panel panel-body">
          <div className="stack" style={{ gap: 6 }}>
            {r.groups.map((g) => <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span>{GROUP_LABEL[g.key]} <span className="muted small">({g.count} phiếu)</span></span><Score value={g.score} /></div>)}
          </div>
        </section>
      </div>

      {r.groups.some((g) => g.merged) && <div className="notice info" style={{ marginBottom: 16 }}>Nhóm Đồng nghiệp hoặc Cấp dưới có dưới {ANON_THRESHOLD} phiếu, nên hai nhóm được gộp lại để bảo vệ ẩn danh.</div>}
      {r.hidden.length > 0 && <div className="notice" style={{ marginBottom: 16 }}>Một nhóm người đánh giá chưa đủ {ANON_THRESHOLD} phiếu nên không hiển thị và không tính vào điểm 360, để bảo vệ ẩn danh.</div>}

      <section className="panel" style={{ marginBottom: 18 }}>
        <header><h2>Điểm theo tiêu chí</h2></header>
        <div className="panel-body table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tiêu chí</th>
                {groupKeys.map((k) => <th key={k}>{GROUP_LABEL[k]}</th>)}
                <th>Tự đánh giá</th>
                <th>Chênh lệch</th>
              </tr>
            </thead>
            <tbody>
              {r.criteria.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  {groupKeys.map((k) => <td key={k}><Score value={c.byGroup[k]} /></td>)}
                  <td>{c.self == null ? <span className="muted">—</span> : score(c.self)}</td>
                  <td>{c.gap == null ? <span className="muted">—</span> : Math.abs(c.gap) < 0.25 ? <span className="muted">Khớp</span> : c.gap > 0 ? <span className="gap-pos">Tự chấm cao hơn {score(c.gap)}</span> : <span className="gap-neg">Tự chấm thấp hơn {score(-c.gap)}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small" style={{ marginTop: 10 }}>Chênh lệch = điểm tự đánh giá trừ trung bình điểm người khác chấm. Tự chấm cao hơn nhiều là điểm bạn có thể chưa nhận ra cần cải thiện.</p>
        </div>
      </section>

      <section className="panel">
        <header><h2>Nhận xét</h2><span className="muted small">Không kèm tên, không theo thứ tự nộp phiếu</span></header>
        <div className="panel-body grid two">
          {r.comments.map((q) => (
            <div key={q.id} className="stack" style={{ gap: 8 }}>
              <h3>{q.text}</h3>
              {q.answers.length ? q.answers.map((a, i) => <p key={i} className="quote">{a}</p>) : <p className="muted">Chưa có nhận xét.</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty, Pill, Score } from '../../../components/ui.jsx';
import { DRAFT_STATUS } from '../../../lib/ai.js';
import { AiExplainBadge } from '../../../components/AiExplain.jsx';
import { aggregate360, GROUP_LABEL } from '../../../lib/review.js';
import { canReviewDraft } from '../../../lib/auth.js';
import { dateTime, score } from '../../../lib/format.js';

const compose = (d) =>
  `Điểm mạnh:\n${d.strengths.map((x) => `- ${x}`).join('\n')}\n\nĐiều nên cải thiện:\n${d.improvements.map((x) => `- ${x}`).join('\n')}`;

// SCR-82 Bản nháp 1-1 (UC31): AI đề xuất, người duyệt sửa rồi mới gửi.
export default function Drafts({ user }) {
  const { state, dispatch } = useStore();
  const mine = state.oneOnOneDrafts.filter((d) => canReviewDraft(user, d));
  const [id, setId] = useState(mine.find((d) => d.status === 'PENDING_REVIEW')?.id || mine[0]?.id);
  const d = mine.find((x) => x.id === id);
  const [text, setText] = useState({});

  if (!d) return <><PageHeader title="Bản nháp 1-1" /><section className="panel"><Empty title="Chưa có bản nháp nào.">Khi HR đóng đợt đánh giá 360, AI tóm tắt nhận xét của từng nhân viên bạn phụ trách thành bản nháp ở đây.</Empty></section></>;

  const campaign = state.campaigns.find((c) => c.id === d.campaignId);
  const template = state.templates.find((t) => t.id === campaign.templateId);
  const reviewee = state.users.find((u) => u.id === d.revieweeId);
  const r = aggregate360(state.reviewForms, campaign.id, reviewee.id, template);
  const value = text[d.id] ?? d.editedText ?? compose(d);
  const published = campaign.status === 'PUBLISHED';
  const pending = d.status === 'PENDING_REVIEW';

  return (
    <>
      <PageHeader title="Bản nháp 1-1" sub="AI tóm tắt nhận xét 360 thành bản nháp. Nhân viên chỉ thấy nội dung bạn đã sửa và bấm gửi." />
      <div className="split">
        <section className="panel">
          <header><h2>Bản nháp</h2><span className="muted small">{mine.filter((x) => x.status === 'PENDING_REVIEW').length} chờ duyệt</span></header>
          <div className="panel-body pick">
            {mine.map((x) => {
              const u = state.users.find((y) => y.id === x.revieweeId);
              return (
                <button key={x.id} aria-current={x.id === id} onClick={() => setId(x.id)}>
                  <Avatar name={u.name} size={26} />
                  <span style={{ flex: 1 }}><b className="small" style={{ display: 'block' }}>{u.name}</b><span className="muted small">{state.campaigns.find((c) => c.id === x.campaignId).name}</span></span>
                  <Pill value={DRAFT_STATUS[x.status]} />
                </button>
              );
            })}
          </div>
        </section>

        <div className="stack">
          <section className="panel panel-body" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="person"><Avatar name={reviewee.name} size={40} /><span><b style={{ display: 'block' }}>{reviewee.name}</b><span className="muted small">{reviewee.title} · {campaign.name}</span></span></span>
            <div className="stat" style={{ marginLeft: 'auto' }}><b>{score(r.score)}</b><span>Điểm 360</span></div>
            <div className="stack" style={{ gap: 4, minWidth: 220 }}>
              {r.groups.map((g) => <div key={g.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }} className="small"><span>{GROUP_LABEL[g.key]} ({g.count})</span><Score value={g.score} /></div>)}
            </div>
          </section>

          <section className="panel">
            <header><h2>Đề xuất của AI</h2><AiExplainBadge target={{ kind: 'draft', id: d.id }} /></header>
            <div className="panel-body grid two" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div><h3>Điểm mạnh</h3><ul>{d.strengths.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><h3>Điều nên cải thiện</h3><ul>{d.improvements.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
            <p className="muted small" style={{ padding: '0 14px 12px', margin: 0 }}>Chỉ tóm tắt nhận xét của các nhóm đủ 3 phiếu, không trích nguyên văn, không có điểm từng phiếu. Đề xuất gốc của AI được giữ nguyên để đối chiếu.</p>
          </section>

          <section className="panel">
            <header><h2>Nội dung gửi cho {reviewee.name}</h2>{!pending && <Pill value={DRAFT_STATUS[d.status]} />}</header>
            <div className="panel-body stack" style={{ gap: 10 }}>
              <div className="field"><textarea aria-label="Nội dung gửi cho nhân viên" rows={9} disabled={!pending} value={value} onChange={(e) => setText((t) => ({ ...t, [d.id]: e.target.value }))} /></div>
              {d.status === 'SENT' && <p className="muted small">Đã gửi lúc {dateTime(d.sentAt)} bởi {state.users.find((u) => u.id === d.sentBy)?.name}. Nội dung đã gửi không sửa được nữa.</p>}
              {pending && !published && <div className="notice">Kết quả đợt này chưa công bố. Bạn lưu được bản sửa, nhưng chỉ gửi được sau khi HR công bố kết quả.</div>}
              {pending && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn danger" onClick={() => dispatch({ type: 'saveDraft', id: d.id, changes: { status: 'DISCARDED' }, toastText: 'Đã bỏ bản nháp. Nhân viên không nhận được gì.' })}>Bỏ bản nháp</button>
                  <button className="btn" onClick={() => dispatch({ type: 'saveDraft', id: d.id, changes: { editedText: value }, toastText: 'Đã lưu bản sửa.' })}>Lưu bản sửa</button>
                  <button className="btn primary" disabled={!published || !value.trim()} onClick={() => dispatch({ type: 'saveDraft', id: d.id, changes: { editedText: value, status: 'SENT', sentBy: user.id, sentAt: new Date().toISOString().slice(0, 16) }, toastText: `Đã gửi tóm tắt cho ${reviewee.name}.` })}>Gửi cho nhân viên</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty } from '../../../components/ui.jsx';
import { GROUP_LABEL } from '../../../lib/review.js';
import { date } from '../../../lib/format.js';

export default function ReviewForm({ user, id }) {
  const { state, dispatch } = useStore();
  const form = state.reviewForms.find((f) => f.id === id);
  const [scores, setScores] = useState(form?.scores || {});
  const [answers, setAnswers] = useState(form?.answers || {});
  const [missing, setMissing] = useState([]);

  if (!form || form.reviewerId !== user.id) return <Empty title="Không tìm thấy phiếu." action={<a className="btn" href="#/reviews/todo">Về danh sách phiếu</a>}>Phiếu này không được giao cho bạn.</Empty>;

  const campaign = state.campaigns.find((c) => c.id === form.campaignId);
  const template = state.templates.find((t) => t.id === campaign.templateId);
  const reviewee = state.users.find((u) => u.id === form.revieweeId);
  const readOnly = campaign.status !== 'COLLECTING';
  const anonymous = ['PEER', 'DIRECT_REPORT'].includes(form.group);
  const done = template.criteria.filter((c) => scores[c.id] !== undefined).length;

  const save = (status) => {
    if (status === 'SUBMITTED') {
      const miss = template.criteria.filter((c) => c.required && scores[c.id] === undefined).map((c) => c.id);
      setMissing(miss);
      if (miss.length) {
        document.getElementById(`cr-${miss[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    dispatch({ type: 'saveForm', form: { id: form.id, scores, answers, status } });
    if (status === 'SUBMITTED') window.location.hash = '#/reviews/todo';
  };

  return (
    <>
      <div className="breadcrumb" style={{ marginBottom: 10 }}><a href="#/reviews/todo">Phiếu cần điền</a> › Điền phiếu</div>
      <PageHeader
        title={form.group === 'SELF' ? 'Tự đánh giá' : `Đánh giá ${reviewee.name}`}
        sub={`${campaign.name} · ${GROUP_LABEL[form.group]} · hạn nộp ${date(campaign.submitDeadline)}`}
        actions={<span className="person"><Avatar name={reviewee.name} size={40} /><span className="small"><b style={{ display: 'block' }}>{reviewee.name}</b><span className="muted">{reviewee.title}</span></span></span>}
      />
      {anonymous && <div className="notice info" style={{ marginBottom: 16 }}>Phiếu này ẩn danh. {reviewee.name} chỉ thấy điểm trung bình đã gộp và nhận xét không kèm tên.</div>}
      {readOnly && <div className="notice" style={{ marginBottom: 16 }}>Đợt đánh giá đã đóng. Phiếu chỉ xem được.</div>}

      <section className="panel" style={{ marginBottom: 18 }}>
        <header><h2>Tiêu chí</h2><span className="muted small">Đã chấm {done}/{template.criteria.length}</span></header>
        <div className="panel-body">
          <p className="muted small" style={{ marginBottom: 6 }}>1 = Rất cần cải thiện · 3 = Đạt kỳ vọng · 5 = Vượt xa kỳ vọng. Chọn "Không đủ thông tin" nếu bạn chưa làm việc đủ với người này ở tiêu chí đó.</p>
          {template.criteria.map((c) => (
            <div key={c.id} id={`cr-${c.id}`} className={`criterion ${missing.includes(c.id) ? 'missing' : ''}`}>
              <div>
                <b style={{ fontWeight: 600 }}>{c.name}</b>{!c.required && <span className="muted small"> (không bắt buộc)</span>}
                <div className="muted small">{c.description}</div>
                {missing.includes(c.id) && <div className="error small" style={{ color: 'var(--bad)' }}>Hãy chấm tiêu chí này trước khi nộp.</div>}
              </div>
              <div className="rating" role="group" aria-label={c.name}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} disabled={readOnly} aria-pressed={scores[c.id] === n} onClick={() => { setScores((s) => ({ ...s, [c.id]: n })); setMissing((m) => m.filter((x) => x !== c.id)); }}>{n}</button>
                ))}
                <button className="na" disabled={readOnly} aria-pressed={scores[c.id] === null} onClick={() => { setScores((s) => ({ ...s, [c.id]: null })); setMissing((m) => m.filter((x) => x !== c.id)); }}>Không đủ thông tin</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 18 }}>
        <header><h2>Nhận xét</h2></header>
        <div className="panel-body stack" style={{ gap: 14 }}>
          {template.questions.map((q) => (
            <div key={q.id} className="field">
              <label htmlFor={q.id}>{q.text}</label>
              <textarea id={q.id} disabled={readOnly} value={answers[q.id] || ''} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} placeholder="Viết cụ thể bằng ví dụ thực tế sẽ giúp người nhận dễ cải thiện hơn." />
            </div>
          ))}
        </div>
      </section>

      {!readOnly && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn" onClick={() => save(form.status === 'SUBMITTED' ? 'SUBMITTED' : 'DRAFT')}>Lưu nháp</button>
          <button className="btn primary" onClick={() => save('SUBMITTED')}>{form.status === 'SUBMITTED' ? 'Cập nhật phiếu' : 'Nộp phiếu'}</button>
        </div>
      )}
    </>
  );
}

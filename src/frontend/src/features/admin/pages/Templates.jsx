import { useStore } from '../../../lib/store.jsx';
import { PageHeader } from '../../../components/ui.jsx';

export default function Templates() {
  const { state, dispatch } = useStore();
  return (
    <>
      <PageHeader title="Bộ tiêu chí đánh giá" sub="Mẫu phiếu đã được đợt đánh giá sử dụng thì bị khóa, chỉ nhân bản được." actions={<button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Bản mẫu: mở biểu mẫu tạo mẫu phiếu.' })}>Tạo mẫu phiếu</button>} />
      {state.templates.map((t) => (
        <section key={t.id} className="panel" style={{ marginBottom: 18 }}>
          <header>
            <h2>{t.name}</h2>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {t.locked && <span className="conf none">Đang được sử dụng, đã khóa</span>}
              <button className="btn small" onClick={() => dispatch({ type: 'toast', text: `Đã nhân bản "${t.name}" (bản mẫu).` })}>Nhân bản</button>
            </span>
          </header>
          <div className="panel-body">
            <table className="table">
              <thead><tr><th>Tiêu chí</th><th>Mô tả</th><th>Thang điểm</th><th>Bắt buộc</th></tr></thead>
              <tbody>{t.criteria.map((c) => <tr key={c.id}><td><b style={{ fontWeight: 600 }}>{c.name}</b></td><td className="muted">{c.description}</td><td>1–5</td><td>{c.required ? 'Có' : 'Không'}</td></tr>)}</tbody>
            </table>
            <h3 style={{ margin: '16px 0 6px' }}>Câu hỏi mở</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{t.questions.map((q) => <li key={q.id}>{q.text}</li>)}</ul>
          </div>
        </section>
      ))}
    </>
  );
}

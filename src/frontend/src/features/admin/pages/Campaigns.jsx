import { useStore } from '../../../lib/store.jsx';
import { PageHeader } from '../../../components/ui.jsx';
import { date, pct } from '../../../lib/format.js';

export const CAMPAIGN_STATUS = {
  DRAFT: ['Nháp', 'none'],
  NOMINATION: ['Đang đề cử', 'warn'],
  COLLECTING: ['Đang thu phiếu', 'warn'],
  CLOSED: ['Đã đóng', 'none'],
  PUBLISHED: ['Đã công bố', 'ok'],
};

export default function Campaigns() {
  const { state, dispatch } = useStore();
  return (
    <>
      <PageHeader title="Đợt đánh giá 360" sub="Mỗi chu kỳ có tối đa một đợt đánh giá." actions={<button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Bản mẫu: mở biểu mẫu tạo đợt đánh giá.' })}>Tạo đợt đánh giá</button>} />
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Đợt</th><th>Chu kỳ</th><th>Mẫu phiếu</th><th>Hạn đề cử</th><th>Hạn nộp</th><th className="num">Đã nộp</th><th>Trạng thái</th></tr></thead>
            <tbody>
              {[...state.campaigns].reverse().map((c) => {
                const forms = state.reviewForms.filter((f) => f.campaignId === c.id);
                const done = forms.filter((f) => f.status === 'SUBMITTED').length;
                return (
                  <tr key={c.id}>
                    <td><a href={`#/admin/campaigns/${c.id}`}><b>{c.name}</b></a></td>
                    <td>{state.cycles.find((x) => x.id === c.cycleId)?.name}</td>
                    <td>{state.templates.find((t) => t.id === c.templateId)?.name}</td>
                    <td>{date(c.nominationDeadline)}</td>
                    <td>{date(c.submitDeadline)}</td>
                    <td className="num">{forms.length ? `${done}/${forms.length} (${pct(done / forms.length)})` : '—'}</td>
                    <td><span className={`conf ${CAMPAIGN_STATUS[c.status][1]}`}>{CAMPAIGN_STATUS[c.status][0]}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

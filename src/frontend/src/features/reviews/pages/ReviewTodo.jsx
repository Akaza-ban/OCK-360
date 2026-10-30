import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty } from '../../../components/ui.jsx';
import { GROUP_LABEL } from '../../../lib/review.js';
import { date } from '../../../lib/format.js';

const STATUS = {
  NOT_STARTED: { label: 'Chưa bắt đầu', cls: 'none' },
  DRAFT: { label: 'Đang làm dở', cls: 'warn' },
  SUBMITTED: { label: 'Đã nộp', cls: 'ok' },
};
const ROLE_IN_FORM = { SELF: 'Bạn tự đánh giá', MANAGER: 'Bạn là quản lý trực tiếp', PEER: 'Bạn là đồng nghiệp', DIRECT_REPORT: 'Bạn là cấp dưới' };

export default function ReviewTodo({ user }) {
  const { state } = useStore();
  const campaign = state.campaigns.find((c) => c.status === 'COLLECTING');
  const forms = campaign ? state.reviewForms.filter((f) => f.campaignId === campaign.id && f.reviewerId === user.id) : [];
  const order = { NOT_STARTED: 0, DRAFT: 1, SUBMITTED: 2 };
  forms.sort((a, b) => order[a.status] - order[b.status] || (a.group === 'SELF' ? -1 : 1));
  const left = forms.filter((f) => f.status !== 'SUBMITTED').length;

  return (
    <>
      <PageHeader
        title="Phiếu cần điền"
        sub={campaign ? `${campaign.name} · hạn nộp ${date(campaign.submitDeadline)} · còn ${left}/${forms.length} phiếu` : 'Hiện không có đợt đánh giá nào đang thu phiếu.'}
      />
      {campaign && (
        <div className="notice info" style={{ marginBottom: 16 }}>
          Phiếu bạn chấm cho đồng nghiệp và quản lý được giữ ẩn danh. Người được đánh giá chỉ thấy điểm đã gộp từ ít nhất 3 phiếu.
        </div>
      )}
      <section className="panel">
        {!forms.length && <Empty title="Không có phiếu nào được giao cho bạn." />}
        {forms.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Người được đánh giá</th><th>Vai trò của bạn trong phiếu</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {forms.map((f) => {
                  const r = state.users.find((u) => u.id === f.revieweeId);
                  const st = STATUS[f.status];
                  return (
                    <tr key={f.id}>
                      <td><span className="person"><Avatar name={r.name} size={30} /><span><b style={{ fontWeight: 600 }}>{f.group === 'SELF' ? 'Bản thân bạn' : r.name}</b><span className="muted small" style={{ display: 'block' }}>{r.title}</span></span></span></td>
                      <td>{ROLE_IN_FORM[f.group]} <span className="muted small">({GROUP_LABEL[f.group]})</span></td>
                      <td><span className={`conf ${st.cls}`}>{st.label}</span></td>
                      <td className="num"><a className={`btn small ${f.status === 'SUBMITTED' ? '' : 'primary'}`} href={`#/reviews/forms/${f.id}`}>{f.status === 'SUBMITTED' ? 'Xem lại' : f.status === 'DRAFT' ? 'Điền tiếp' : 'Bắt đầu'}</a></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

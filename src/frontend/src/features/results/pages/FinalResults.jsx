import { useMemo } from 'react';
import { useStore, useCycleData } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Score } from '../../../components/ui.jsx';
import { progressMap, okrScore, finalScore, grade } from '../../../lib/okr.js';
import { aggregate360 } from '../../../lib/review.js';
import { pct } from '../../../lib/format.js';

export function computeFinal(data, campaign) {
  const pm = progressMap(data);
  const template = campaign && data.templates.find((t) => t.id === campaign.templateId);
  return data.users.map((u) => {
    const objs = data.objectives.filter((o) => o.ownerId === u.id && o.level === 'INDIVIDUAL');
    const progress = objs.length ? objs.reduce((s, o) => s + pm.get(o.id), 0) / objs.length : null;
    const okr = progress == null ? null : okrScore(progress);
    const s360 = campaign ? aggregate360(data.reviewForms, campaign.id, u.id, template).score : null;
    const fin = finalScore(okr, s360, data.cycle.okrWeight);
    return { user: u, progress, okr, s360, final: fin, grade: grade(fin) };
  });
}

export default function FinalResults() {
  const { dispatch } = useStore();
  const data = useCycleData();
  const campaign = data.campaigns.find((c) => c.cycleId === data.cycle.id);
  const rows = useMemo(() => computeFinal(data, campaign), [data, campaign]);
  const ready = data.cycle.status === 'CLOSED' && campaign && ['CLOSED', 'PUBLISHED'].includes(campaign.status);
  const w = data.cycle.okrWeight;

  return (
    <>
      <PageHeader
        title="Kết quả cuối kỳ"
        sub={`${data.cycle.name} · Điểm cuối kỳ = ${pct(w)} điểm OKR + ${pct(1 - w)} điểm 360`}
        actions={
          ready && (
            <>
              <button className="btn" onClick={() => dispatch({ type: 'toast', text: 'Đã xuất file Excel (bản mẫu).' })}>Xuất Excel</button>
              {campaign.status === 'PUBLISHED' ? <span className="conf ok" style={{ alignSelf: 'center' }}>Đã công bố</span> : <button className="btn primary" onClick={() => dispatch({ type: 'publishCampaign', id: campaign.id })}>Công bố kết quả</button>}
            </>
          )
        }
      />
      {!ready && (
        <div className="notice" style={{ marginBottom: 16 }}>
          Chỉ tổng hợp được khi chu kỳ và đợt đánh giá 360 của chu kỳ đều đã đóng. {data.cycle.name} đang {data.cycle.status === 'CLOSED' ? 'chờ đóng đợt đánh giá' : 'chạy'}; bảng dưới chỉ là số liệu tạm tính. Chọn chu kỳ Q3/2026 trên thanh trên cùng để xem kết quả đã chốt.
        </div>
      )}
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Nhân viên</th><th>Phòng ban</th><th className="num">Tiến độ OKR</th><th>Điểm OKR</th><th>Điểm 360</th><th>Điểm cuối kỳ</th><th>Xếp loại</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user.id}>
                  <td><span className="person"><Avatar name={r.user.name} size={28} />{r.user.name}</span></td>
                  <td className="muted">{data.departments.find((d) => d.id === r.user.deptId)?.name}</td>
                  <td className="num">{r.progress == null ? '—' : pct(r.progress)}</td>
                  <td><Score value={r.okr} /></td>
                  <td><Score value={r.s360} /></td>
                  <td><b>{r.final == null ? '—' : r.final.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                  <td>{r.final == null ? <span className="conf none">Thiếu dữ liệu</span> : <span className={`conf ${r.final >= 3.5 ? 'ok' : r.final >= 2.5 ? 'warn' : 'bad'}`}>{r.grade}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small" style={{ marginTop: 10 }}>Điểm OKR = 1 + 4 × tiến độ OKR. Người thiếu OKR cá nhân hoặc không đủ phiếu 360 được ghi "Thiếu dữ liệu", không bị tính 0 điểm.</p>
        </div>
      </section>
    </>
  );
}

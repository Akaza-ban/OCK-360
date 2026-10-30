import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Modal } from '../../../components/ui.jsx';
import { date, pct } from '../../../lib/format.js';

const STATUS = { DRAFT: ['Nháp', 'none'], ACTIVE: ['Đang chạy', 'ok'], CLOSED: ['Đã đóng', 'warn'] };

export default function Cycles() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState(false);
  return (
    <>
      <PageHeader title="Chu kỳ OKR" sub="Tại một thời điểm chỉ có một chu kỳ đang chạy." actions={<button className="btn primary" onClick={() => setOpen(true)}>Tạo chu kỳ</button>} />
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Chu kỳ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Hạn lập mục tiêu</th><th className="num">Tối đa Objective/người</th><th className="num">Tỷ trọng OKR / 360</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {[...state.cycles].reverse().map((c) => (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td>{date(c.start)}</td>
                  <td>{date(c.end)}</td>
                  <td>{date(c.planningDeadline)}</td>
                  <td className="num">{c.maxObjectives}</td>
                  <td className="num">{pct(c.okrWeight)} / {pct(1 - c.okrWeight)}</td>
                  <td><span className={`conf ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span></td>
                  <td className="num">{c.status === 'ACTIVE' && <button className="btn small" onClick={() => dispatch({ type: 'toast', text: 'Bản mẫu: chu kỳ sẽ được đóng và chốt tiến độ.' })}>Đóng chu kỳ</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {open && (
        <Modal title="Tạo chu kỳ" onClose={() => setOpen(false)} footer={<><button className="btn" onClick={() => setOpen(false)}>Hủy</button><button className="btn primary" onClick={() => { setOpen(false); dispatch({ type: 'toast', text: 'Đã tạo chu kỳ Q1/2027 ở trạng thái Nháp (bản mẫu).' }); }}>Tạo chu kỳ</button></>}>
          <div className="form-grid">
            <div className="field full"><label htmlFor="cy-name">Tên chu kỳ</label><input id="cy-name" defaultValue="Q1/2027" /></div>
            <div className="field"><label htmlFor="cy-s">Ngày bắt đầu</label><input id="cy-s" type="date" defaultValue="2027-01-01" /></div>
            <div className="field"><label htmlFor="cy-e">Ngày kết thúc</label><input id="cy-e" type="date" defaultValue="2027-03-31" /></div>
            <div className="field"><label htmlFor="cy-p">Hạn lập mục tiêu</label><input id="cy-p" type="date" defaultValue="2027-01-14" /></div>
            <div className="field"><label htmlFor="cy-m">Tối đa Objective mỗi người</label><input id="cy-m" type="number" min="1" max="10" defaultValue="5" /></div>
            <div className="field full"><label htmlFor="cy-w">Tỷ trọng OKR trong điểm cuối kỳ</label><select id="cy-w" defaultValue="0.6"><option value="0.5">50% OKR / 50% 360</option><option value="0.6">60% OKR / 40% 360</option><option value="0.7">70% OKR / 30% 360</option></select><span className="hint">Tỷ trọng bị khóa khi đợt đánh giá 360 của chu kỳ bắt đầu thu phiếu.</span></div>
          </div>
        </Modal>
      )}
    </>
  );
}

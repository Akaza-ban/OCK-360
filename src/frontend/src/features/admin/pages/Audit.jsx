import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader } from '../../../components/ui.jsx';
import { dateTime } from '../../../lib/format.js';

export default function Audit() {
  const { state } = useStore();
  const modules = [...new Set(state.auditLogs.map((a) => a.module))];
  const [mod, setMod] = useState('');
  const list = state.auditLogs.filter((a) => !mod || a.module === mod).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader title="Nhật ký hoạt động" sub="Nhật ký không chứa nội dung phiếu đánh giá và không ghi ai đánh giá ai." />
      <div className="field" style={{ width: 240, marginBottom: 14 }}>
        <label htmlFor="au-m">Phân hệ</label>
        <select id="au-m" value={mod} onChange={(e) => setMod(e.target.value)}><option value="">Tất cả</option>{modules.map((m) => <option key={m}>{m}</option>)}</select>
      </div>
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Phân hệ</th><th>Đối tượng</th></tr></thead>
            <tbody>{list.map((a) => <tr key={a.id}><td className="muted">{dateTime(a.at)}</td><td>{state.users.find((u) => u.id === a.userId)?.name}</td><td>{a.action}</td><td>{a.module}</td><td>{a.target || <span className="muted">—</span>}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

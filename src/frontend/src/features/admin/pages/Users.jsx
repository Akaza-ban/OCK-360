import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Modal } from '../../../components/ui.jsx';
import { ROLE_LABEL } from '../../../lib/data.js';
import { isHR } from '../../../lib/auth.js';

export default function Users({ user }) {
  const { state, dispatch } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const list = state.users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.includes(q.toLowerCase()));
  const roles = Object.entries(ROLE_LABEL).filter(([k]) => !(isHR(user) && k === 'ADMIN'));

  return (
    <>
      <PageHeader title="Người dùng" sub={`${state.users.length} người dùng · ${state.users.filter((u) => u.active).length} đang hoạt động`} actions={<button className="btn primary" onClick={() => setEditing({})}>Thêm người dùng</button>} />
      <input className="btn" style={{ width: 320, textAlign: 'left', cursor: 'text', marginBottom: 14 }} aria-label="Tìm người dùng" placeholder="Tìm theo tên hoặc email" value={q} onChange={(e) => setQ(e.target.value)} />
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Phòng ban</th><th>Quản lý trực tiếp</th><th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td><span className="person"><Avatar name={u.name} size={28} />{u.name}</span></td>
                  <td className="muted">{u.email}</td>
                  <td>{ROLE_LABEL[u.role]}</td>
                  <td>{state.departments.find((d) => d.id === u.deptId)?.name}</td>
                  <td>{state.users.find((m) => m.id === u.managerId)?.name || <span className="muted">—</span>}</td>
                  <td><span className={`conf ${u.active ? 'ok' : 'none'}`}>{u.active ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
                  <td className="num"><button className="btn small" onClick={() => setEditing(u)}>Sửa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <Modal title={editing.id ? `Sửa ${editing.name}` : 'Thêm người dùng'} onClose={() => setEditing(null)} footer={<><button className="btn" onClick={() => setEditing(null)}>Hủy</button><button className="btn primary" onClick={() => { setEditing(null); dispatch({ type: 'toast', text: 'Đã lưu người dùng (bản mẫu).' }); }}>Lưu</button></>}>
          <div className="form-grid">
            <div className="field full"><label htmlFor="us-n">Họ tên</label><input id="us-n" defaultValue={editing.name} /></div>
            <div className="field full"><label htmlFor="us-e">Email</label><input id="us-e" type="email" defaultValue={editing.email} /></div>
            <div className="field"><label htmlFor="us-r">Vai trò</label><select id="us-r" defaultValue={editing.role || 'EMPLOYEE'}>{roles.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
            <div className="field"><label htmlFor="us-d">Phòng ban</label><select id="us-d" defaultValue={editing.deptId}>{state.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="field full">
              <label htmlFor="us-m">Quản lý trực tiếp</label>
              <select id="us-m" defaultValue={editing.managerId || ''}>
                <option value="">Không có</option>
                {state.users.filter((m) => m.id !== editing.id && ['MANAGER', 'HR', 'ADMIN'].includes(m.role)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <span className="hint">Hệ thống từ chối nếu lựa chọn tạo vòng lặp báo cáo.</span>
            </div>
          </div>
          {isHR(user) && <p className="muted small">Nhân sự không gán được vai trò Quản trị viên.</p>}
        </Modal>
      )}
    </>
  );
}

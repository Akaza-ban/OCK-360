import { useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { PageHeader, Avatar } from '../components/ui.jsx';
import { ROLE_LABEL } from '../lib/data.js';

const MATRIX = [
  ['Xem cây OKR, dashboard cá nhân', 'Có', 'Có', 'Có', 'Có'],
  ['OKR cá nhân và check-in', 'Chỉ của bản thân', 'Chỉ của bản thân', 'Của bản thân và nhân viên dưới quyền trực tiếp', 'Chỉ của bản thân'],
  ['OKR phòng ban', 'Có', 'Không', 'Chỉ phòng ban mình phụ trách', 'Không'],
  ['OKR công ty', 'Có', 'Không', 'Không', 'Không'],
  ['Xem kết quả 360', 'Chỉ của bản thân', 'Của mọi người', 'Của bản thân và nhân viên dưới quyền trực tiếp', 'Chỉ của bản thân'],
  ['Vận hành đợt 360, công bố kết quả', 'Không', 'Có', 'Không', 'Không'],
  ['Quản lý phòng ban, người dùng, chu kỳ', 'Có', 'Có', 'Không', 'Không'],
];
const ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

export default function Profile({ user }) {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState('account');
  const dept = state.departments.find((d) => d.id === user.deptId);
  const mgr = state.users.find((u) => u.id === user.managerId);
  return (
    <>
      <PageHeader title="Hồ sơ cá nhân" />
      <div className="segmented" role="tablist" style={{ marginBottom: 16 }}>
        {[['account', 'Tài khoản'], ['security', 'Bảo mật'], ['roles', 'Quyền của tôi']].map(([k, l]) => <button key={k} role="tab" aria-pressed={tab === k} aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'account' && (
        <section className="panel panel-body" style={{ maxWidth: 720 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}><Avatar name={user.name} size={56} /><div><b style={{ fontSize: 18 }}>{user.name}</b><div className="muted">{user.title}</div></div></div>
          <div className="form-grid">
            <div className="field"><label htmlFor="pf-n">Họ tên</label><input id="pf-n" defaultValue={user.name} /></div>
            <div className="field"><label htmlFor="pf-p">Số điện thoại</label><input id="pf-p" defaultValue="0912 345 678" /></div>
            <div className="field"><label htmlFor="pf-e">Email</label><input id="pf-e" value={user.email} readOnly /></div>
            <div className="field"><label htmlFor="pf-r">Vai trò</label><input id="pf-r" value={ROLE_LABEL[user.role]} readOnly /></div>
            <div className="field"><label htmlFor="pf-d">Phòng ban</label><input id="pf-d" value={dept?.name || ''} readOnly /></div>
            <div className="field"><label htmlFor="pf-m">Quản lý trực tiếp</label><input id="pf-m" value={mgr?.name || 'Không có'} readOnly /></div>
          </div>
          <p className="muted small" style={{ margin: '12px 0' }}>Email, vai trò, phòng ban và quản lý trực tiếp do Nhân sự cập nhật.</p>
          <button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Đã lưu thông tin tài khoản.' })}>Lưu thay đổi</button>
        </section>
      )}
      {tab === 'security' && (
        <section className="panel panel-body stack" style={{ maxWidth: 480, gap: 14 }}>
          <div className="field"><label htmlFor="pw-o">Mật khẩu hiện tại</label><input id="pw-o" type="password" /></div>
          <div className="field"><label htmlFor="pw-n">Mật khẩu mới</label><input id="pw-n" type="password" /><span className="hint">Tối thiểu 8 ký tự.</span></div>
          <div><button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Đã đổi mật khẩu (bản mẫu).' })}>Đổi mật khẩu</button></div>
        </section>
      )}
      {tab === 'roles' && (
        <section className="panel">
          <div className="panel-body table-wrap">
            <p style={{ marginBottom: 10 }}>Vai trò của bạn: <b>{ROLE_LABEL[user.role]}</b>. Cột của bạn được tô đậm.</p>
            <table className="table">
              <thead><tr><th>Năng lực</th>{ROLES.map((r) => <th key={r} style={r === user.role ? { color: 'var(--ink)' } : undefined}>{ROLE_LABEL[r]}</th>)}</tr></thead>
              <tbody>{MATRIX.map((row) => <tr key={row[0]}><td>{row[0]}</td>{row.slice(1).map((c, i) => <td key={i} style={ROLES[i] === user.role ? { fontWeight: 500, background: 'var(--accent-soft)' } : { color: 'var(--muted)' }}>{c}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

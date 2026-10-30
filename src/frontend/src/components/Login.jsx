import { useEffect, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { demoAccounts, ROLE_LABEL } from '../lib/data.js';
import { Avatar } from './ui.jsx';

export default function Login({ onLogin }) {
  const { state } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = localStorage.getItem('okr360.theme') || 'dark';
    } catch {
      document.documentElement.dataset.theme = 'dark';
    }
  }, []);

  const submit = (e) => {
    e.preventDefault();
    const u = state.users.find((x) => x.email === email.trim().toLowerCase());
    // Bản mẫu: mật khẩu demo là 123456. Lỗi chung, không tiết lộ email có tồn tại hay không.
    if (!u || password !== '123456' || !u.active) {
      setError('Email hoặc mật khẩu không đúng.');
      return;
    }
    onLogin(u.id);
  };

  return (
    <div className="login">
      <div className="login-card">
        <span className="logo" aria-hidden="true" />
        <h1>Đăng nhập vào OKR360</h1>
        <p className="lead">Mục tiêu của bạn nối với mục tiêu của công ty.</p>
        <form onSubmit={submit} className="stack" style={{ gap: 10 }} noValidate>
          <div className="field">
            <label htmlFor="email">Email công ty</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ten@okr360.vn" autoComplete="username" />
          </div>
          <div className="field">
            <label htmlFor="pw">Mật khẩu</label>
            <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            {error && <span className="error" role="alert">{error}</span>}
          </div>
          <button className="btn primary" type="submit">Đăng nhập</button>
        </form>
        <div className="divider">hoặc vào bằng tài khoản demo</div>
        <div className="demo-list">
          {demoAccounts.map((id) => {
            const u = state.users.find((x) => x.id === id);
            return (
              <button key={id} onClick={() => onLogin(id)}>
                <Avatar name={u.name} size={26} />
                <span>
                  <b style={{ display: 'block', fontWeight: 500 }}>{u.name}</b>
                  <span className="muted small">{u.title}</span>
                </span>
                <span className="tag plain r">{ROLE_LABEL[u.role]}</span>
              </button>
            );
          })}
        </div>
        <p className="muted small" style={{ textAlign: 'center' }}>Bản giao diện mẫu, dùng dữ liệu giả.</p>
      </div>
    </div>
  );
}

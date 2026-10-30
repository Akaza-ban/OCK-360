import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../lib/store.jsx';
import { ROLE_LABEL } from '../lib/data.js';
import { canAccess } from '../lib/auth.js';
import { Avatar } from './ui.jsx';
import * as I from './icons.jsx';

const NAV = [
  {
    group: null,
    items: [
      { to: '/notifications', label: 'Hộp thư', icon: I.IconInbox, count: 'unread' },
      { to: '/dashboard', label: 'Dashboard', icon: I.IconHome },
      { to: '/okr/my', label: 'OKR của tôi', icon: I.IconTarget },
    ],
  },
  { group: 'OKR', items: [{ to: '/okr/tree', label: 'Cây OKR công ty', icon: I.IconTree }] },
  {
    group: 'Đánh giá 360',
    items: [
      { to: '/reviews/todo', label: 'Phiếu cần điền', icon: I.IconForm, count: 'todo' },
      { to: '/reviews/nominate', label: 'Đề cử đồng nghiệp', icon: I.IconUserPlus },
      { to: '/reviews/approvals', label: 'Duyệt người đánh giá', icon: I.IconCheckList, count: 'approvals' },
      { to: '/reviews/results', label: 'Kết quả 360', icon: I.IconRadar },
    ],
  },
  {
    group: 'Kết quả',
    items: [
      { to: '/final-results', label: 'Kết quả cuối kỳ', icon: I.IconTrophy },
      { to: '/reports', label: 'Báo cáo', icon: I.IconChart },
    ],
  },
  {
    group: 'Quản trị',
    items: [
      { to: '/admin/cycles', label: 'Chu kỳ OKR', icon: I.IconCalendar },
      { to: '/admin/departments', label: 'Phòng ban', icon: I.IconBuilding },
      { to: '/admin/users', label: 'Người dùng', icon: I.IconUsers },
      { to: '/admin/campaigns', label: 'Đợt đánh giá 360', icon: I.IconSpark },
      { to: '/admin/templates', label: 'Bộ tiêu chí', icon: I.IconList },
      { to: '/audit', label: 'Nhật ký hoạt động', icon: I.IconHistory },
    ],
  },
];

const EXTRA_CRUMBS = { '/profile': 'Hồ sơ cá nhân', '/okr/': 'Chi tiết Objective', '/reviews/forms': 'Điền phiếu', '/403': 'Không có quyền' };

function readTheme() {
  try {
    return localStorage.getItem('okr360.theme') || 'dark';
  } catch {
    return 'dark';
  }
}

export default function Shell({ user, route, onLogout, children }) {
  const { state, dispatch } = useStore();
  const [theme, setTheme] = useState(readTheme);
  const [palette, setPalette] = useState(false);
  const cycle = state.cycles.find((c) => c.id === state.cycleId);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('okr360.theme', theme);
    } catch {
      /* trình duyệt chặn lưu trữ: giữ trong bộ nhớ */
    }
  }, [theme]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts = {
    unread: state.notifications.filter((n) => n.userId === user.id && !n.read).length,
    todo: state.reviewForms.filter((f) => f.reviewerId === user.id && f.status !== 'SUBMITTED' && state.campaigns.find((c) => c.id === f.campaignId)?.status === 'COLLECTING').length,
    approvals: state.nominations.filter((n) => n.status === 'PENDING' && state.users.find((u) => u.id === n.revieweeId)?.managerId === user.id).length,
  };

  const groups = NAV.map((g) => ({ ...g, items: g.items.filter((i) => canAccess(i.to, user)) })).filter((g) => g.items.length);
  const current = groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group }))).find((i) => route.startsWith(i.to));
  const extra = Object.entries(EXTRA_CRUMBS).find(([k]) => route.startsWith(k))?.[1];

  return (
    <div className="app">
      <aside className="sidebar">
        <a className="workspace" href="#/dashboard">
          <span className="logo" aria-hidden="true" />
          OKR360
        </a>
        <button className="search-btn" onClick={() => setPalette(true)}>
          <I.IconSearch size={14} />
          Tìm kiếm
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="nav" aria-label="Điều hướng chính">
          {groups.map((g) => (
            <div className="nav-group" key={g.group || 'home'}>
              {g.group && <div className="nav-title">{g.group}</div>}
              {g.items.map((i) => {
                const active = route.startsWith(i.to);
                const n = i.count && counts[i.count];
                return (
                  <a key={i.to} href={`#${i.to}`} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                    <i.icon />
                    {i.label}
                    {n > 0 && <span className={`count ${i.count === 'unread' ? 'hot' : ''}`}>{n}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <div className="cycle-picker">
            <I.IconCalendar size={14} />
            <select aria-label="Chu kỳ" value={state.cycleId} onChange={(e) => dispatch({ type: 'setCycle', cycleId: e.target.value })}>
              {state.cycles.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className={`cycle-state ${cycle.status === 'CLOSED' ? 'closed' : ''}`}>{cycle.status === 'CLOSED' ? 'Đã đóng' : 'Đang chạy'}</span>
          </div>
          <div className="me">
            <Avatar name={user.name} size={24} />
            <a className="who" href="#/profile" style={{ textDecoration: 'none' }}>
              <b>{user.name}</b>
              <span>{ROLE_LABEL[user.role]}</span>
            </a>
            <button className="icon-btn" onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))} aria-label={theme === 'dark' ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'} title="Đổi nền sáng / tối">
              {theme === 'dark' ? <I.IconSun /> : <I.IconMoon />}
            </button>
            <button className="icon-btn" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất">
              <I.IconLogout />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            {current?.group && <span>{current.group}</span>}
            {current?.group && <span aria-hidden="true">›</span>}
            <b>{current?.label || extra || 'OKR360'}</b>
          </div>
          <div className="spacer" />
          {cycle.status === 'CLOSED' && <span className="conf warn pill">Chu kỳ {cycle.name} đã đóng — chỉ xem</span>}
        </header>
        <main className="content">{children}</main>
      </div>

      {palette && <CommandPalette groups={groups} state={state} onClose={() => setPalette(false)} />}
      {state.toast && <Toast text={state.toast} onDone={() => dispatch({ type: 'toast', text: null })} />}
    </div>
  );
}

function CommandPalette({ groups, state, onClose }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => inputRef.current?.focus(), []);

  const items = useMemo(() => {
    const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
    const k = norm(q);
    const pages = groups.flatMap((g) => g.items.map((i) => ({ kind: 'Trang', label: i.label, hint: g.group || '', to: i.to, icon: i.icon })));
    const objs = state.objectives
      .filter((o) => o.cycleId === state.cycleId && !o.deletedAt)
      .map((o) => ({ kind: 'Objective', label: o.title, hint: state.users.find((u) => u.id === o.ownerId)?.name, to: `/okr/${o.id}`, icon: I.IconTarget }));
    return [...pages, ...objs].filter((i) => !k || norm(i.label).includes(k)).slice(0, 12);
  }, [q, groups, state]);

  const go = (i) => {
    if (!i) return;
    window.location.hash = `#${i.to}`;
    onClose();
  };

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Tìm kiếm nhanh">
        <input
          ref={inputRef}
          placeholder="Tìm trang hoặc Objective…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setSel(0); }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
            if (e.key === 'Enter') go(items[sel]);
          }}
          aria-label="Tìm kiếm"
        />
        <ul role="listbox">
          {items.map((i, n) => (
            <li key={i.to} role="option" aria-selected={n === sel} onMouseEnter={() => setSel(n)} onClick={() => go(i)}>
              <i.icon />
              <span>{i.label}</span>
              <span className="hint">{i.kind === 'Trang' ? i.hint : `Objective · ${i.hint}`}</span>
            </li>
          ))}
          {!items.length && <li aria-selected="false">Không tìm thấy kết quả cho "{q}".</li>}
        </ul>
      </div>
    </div>
  );
}

function Toast({ text, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return <div className="toast" role="status">{text}</div>;
}

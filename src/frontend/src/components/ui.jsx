import { useEffect, useRef } from 'react';
import { pct, initials } from '../lib/format.js';
import { HealthIcon } from './icons.jsx';

export const CONFIDENCE = {
  ON_TRACK: { label: 'Đúng hướng', cls: 'ok' },
  AT_RISK: { label: 'Có rủi ro', cls: 'warn' },
  OFF_TRACK: { label: 'Chệch hướng', cls: 'bad' },
};

export const LEVEL_LABEL = { COMPANY: 'Công ty', DEPARTMENT: 'Phòng ban', INDIVIDUAL: 'Cá nhân' };

export function Confidence({ value }) {
  if (!value)
    return (
      <span className="conf none">
        <HealthIcon />
        Chưa check-in
      </span>
    );
  const c = CONFIDENCE[value];
  return (
    <span className={`conf ${c.cls}`}>
      <HealthIcon value={value} />
      <span className="label">{c.label}</span>
    </span>
  );
}

// Thanh tiến độ có vạch "đáng lẽ phải đạt" theo thời gian của chu kỳ.
export function Progress({ value, expected, size = 'md' }) {
  const behind = expected != null && value + 0.1 < expected;
  return (
    <div className={`progress ${size}`}>
      <div className="track" role="progressbar" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`fill ${behind ? 'behind' : ''}`} style={{ width: pct(value) }} />
        {expected != null && expected < 1 && (
          <div className="pace" style={{ left: pct(expected) }} title={`Kỳ vọng hôm nay: ${pct(expected)}`} />
        )}
      </div>
      <span className="pv">{pct(value)}</span>
    </div>
  );
}

const AVATAR_COLORS = ['#5e6ad2', '#26a167', '#d9822b', '#c2416b', '#2f86c9', '#8e5cd9', '#3c9d9b', '#b8892a'];
export function Avatar({ name, size = 22 }) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4), background: AVATAR_COLORS[h % AVATAR_COLORS.length] }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('input, select, textarea, button')?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <header>
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Đóng">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="m3.5 3.5 7 7M10.5 3.5l-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, sub, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function Score({ value, max = 5 }) {
  if (value == null) return <span className="muted">—</span>;
  return (
    <span className="score">
      <span className="score-bar" aria-hidden="true">
        <span style={{ width: `${(value / max) * 100}%` }} />
      </span>
      {value.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

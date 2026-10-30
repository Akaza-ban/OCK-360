export const pct = (x) => `${Math.round(x * 100)}%`;

export function num(v, unit = '') {
  const s = Number.isInteger(v) ? v.toLocaleString('vi-VN') : v.toLocaleString('vi-VN', { maximumFractionDigits: 1 });
  return unit && unit !== '%' ? `${s} ${unit}` : unit === '%' ? `${s}%` : s;
}

export function date(d) {
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
}

export function dateTime(d) {
  return `${date(d)} ${d.slice(11, 16)}`;
}

export const score = (s) => (s == null ? '—' : s.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

export function initials(name) {
  const parts = name.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts.at(-1)[0] : parts[0][0]).toUpperCase();
}

export const shortName = (name) => name.trim().split(/\s+/).slice(-2).join(' ');

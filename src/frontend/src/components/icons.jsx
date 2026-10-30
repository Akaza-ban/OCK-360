// Bộ biểu tượng nét mảnh 16px, vẽ bằng SVG để không cần thư viện ngoài.
const S = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconInbox = (p) => <S {...p}><path d="M2 9.5 3.6 3.4A1 1 0 0 1 4.6 2.7h6.8a1 1 0 0 1 1 .7L14 9.5V13a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 2 13Z" /><path d="M2 9.5h3.3l.9 1.6h3.6l.9-1.6H14" /></S>;
export const IconHome = (p) => <S {...p}><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></S>;
export const IconTarget = (p) => <S {...p}><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="0.6" fill="currentColor" /></S>;
export const IconTree = (p) => <S {...p}><rect x="5.5" y="1.8" width="5" height="3.4" rx="0.8" /><rect x="1.5" y="10.8" width="5" height="3.4" rx="0.8" /><rect x="9.5" y="10.8" width="5" height="3.4" rx="0.8" /><path d="M8 5.2v2.7M4 10.8V8h8v2.8" /></S>;
export const IconForm = (p) => <S {...p}><rect x="3" y="2" width="10" height="12" rx="1.5" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" /></S>;
export const IconUserPlus = (p) => <S {...p}><circle cx="6.5" cy="5.5" r="2.6" /><path d="M1.8 13.5c.6-2.3 2.4-3.6 4.7-3.6s4.1 1.3 4.7 3.6M12.5 4.5v4M10.5 6.5h4" /></S>;
export const IconCheckList = (p) => <S {...p}><path d="m2.5 4.5 1.2 1.2 2.1-2.2M2.5 10.5l1.2 1.2 2.1-2.2M8 4.5h5.5M8 10.5h5.5" /></S>;
export const IconRadar = (p) => <S {...p}><path d="M8 1.8 14 6.1 11.7 13H4.3L2 6.1Z" /><path d="M8 5 10.8 7.1 9.7 10.4H6.3L5.2 7.1Z" /></S>;
export const IconTrophy = (p) => <S {...p}><path d="M5 2.5h6v3.2a3 3 0 0 1-6 0Z" /><path d="M5 3.5H2.8v1a2.2 2.2 0 0 0 2.4 2.2M11 3.5h2.2v1a2.2 2.2 0 0 1-2.4 2.2M8 8.7v2.6M5.5 13.5h5" /></S>;
export const IconChart = (p) => <S {...p}><path d="M2.5 13.5h11M4.5 11V8M8 11V4.5M11.5 11V6.5" /></S>;
export const IconCalendar = (p) => <S {...p}><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6.5h12M5.5 1.8v2.4M10.5 1.8v2.4" /></S>;
export const IconBuilding = (p) => <S {...p}><rect x="3" y="2" width="10" height="12" rx="1" /><path d="M6 5h1M9 5h1M6 7.8h1M9 7.8h1M7 14v-2.5h2V14" /></S>;
export const IconUsers = (p) => <S {...p}><circle cx="6" cy="5.5" r="2.4" /><path d="M1.8 13.2c.5-2.1 2.2-3.3 4.2-3.3s3.7 1.2 4.2 3.3M10.6 3.3a2.3 2.3 0 0 1 0 4.4M12 9.9c1.2.4 2 1.6 2.3 3.3" /></S>;
export const IconSpark = (p) => <S {...p}><path d="M8 1.8v3M8 11.2v3M1.8 8h3M11.2 8h3M3.6 3.6l2 2M10.4 10.4l2 2M3.6 12.4l2-2M10.4 5.6l2-2" /></S>;
export const IconList = (p) => <S {...p}><path d="M5.5 4h8M5.5 8h8M5.5 12h8" /><circle cx="2.6" cy="4" r="0.7" fill="currentColor" /><circle cx="2.6" cy="8" r="0.7" fill="currentColor" /><circle cx="2.6" cy="12" r="0.7" fill="currentColor" /></S>;
export const IconHistory = (p) => <S {...p}><path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.3 2.5v2.2h2.2" /><path d="M8 5v3.2l2 1.3" /></S>;
export const IconSearch = (p) => <S {...p}><circle cx="7" cy="7" r="4.3" /><path d="m10.3 10.3 3.2 3.2" /></S>;
export const IconSun = (p) => <S {...p}><circle cx="8" cy="8" r="2.8" /><path d="M8 1.5v1.3M8 13.2v1.3M1.5 8h1.3M13.2 8h1.3M3.4 3.4l.9.9M11.7 11.7l.9.9M3.4 12.6l.9-.9M11.7 4.3l.9-.9" /></S>;
export const IconMoon = (p) => <S {...p}><path d="M13.2 9.6A5.5 5.5 0 0 1 6.4 2.8a5.5 5.5 0 1 0 6.8 6.8Z" /></S>;
export const IconLogout = (p) => <S {...p}><path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10 11l3-3-3-3M13 8H6" /></S>;
export const IconUser = (p) => <S {...p}><circle cx="8" cy="5.5" r="2.7" /><path d="M2.8 13.6c.6-2.4 2.6-3.8 5.2-3.8s4.6 1.4 5.2 3.8" /></S>;
export const IconPlus = (p) => <S {...p}><path d="M8 3v10M3 8h10" /></S>;

// Biểu tượng trạng thái kiểu "project health": vòng tròn có phần lõi khác nhau.
export function HealthIcon({ value, size = 14 }) {
  if (value === 'ON_TRACK')
    return <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m4.4 7.1 1.8 1.8 3.5-3.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (value === 'AT_RISK')
    return <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="M7 3.8v3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /><circle cx="7" cy="9.8" r="0.9" fill="currentColor" /></svg>;
  if (value === 'OFF_TRACK')
    return <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="currentColor" /><path d="m4.9 4.9 4.2 4.2M9.1 4.9 4.9 9.1" stroke="var(--surface)" strokeWidth="1.6" strokeLinecap="round" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2.2" /></svg>;
}

// Vòng tiến độ nhỏ, giống biểu tượng tiến độ dự án.
export function ProgressRing({ value, size = 14, color = 'var(--accent)' }) {
  const r = size / 2 - 1.5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" style={{ transform: 'rotate(-90deg)', flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: 'var(--track)' }} strokeWidth="2" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" style={{ stroke: color }} strokeWidth="2" strokeDasharray={`${c * value} ${c}`} strokeLinecap="round" />
    </svg>
  );
}

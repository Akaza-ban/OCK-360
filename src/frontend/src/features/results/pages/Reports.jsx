import { useMemo, useState } from 'react';
import { useStore, useCycleData } from '../../../lib/store.jsx';
import { PageHeader, Progress, Score } from '../../../components/ui.jsx';
import { progressMap, expectedProgress, latestCheckin, daysSince } from '../../../lib/okr.js';
import { isManager, isAdmin, headOfDept } from '../../../lib/auth.js';
import { computeFinal } from './FinalResults.jsx';
import { pct } from '../../../lib/format.js';

export default function Reports({ user }) {
  const { dispatch } = useStore();
  const data = useCycleData();
  const types = [
    { key: 'okr', label: 'Tiến độ OKR' },
    { key: 'checkin', label: 'Tỷ lệ check-in' },
  ];
  if (!isAdmin(user)) types.push({ key: 'final', label: 'Kết quả cuối kỳ' });
  const [type, setType] = useState('okr');
  const myDept = isManager(user) ? headOfDept(user, data.departments) : null;
  const depts = data.departments.filter((d) => (myDept ? d.id === myDept.id : d.parentId));
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const campaign = data.campaigns.find((c) => c.cycleId === data.cycle.id);

  return (
    <>
      <PageHeader
        title="Báo cáo"
        sub={`${data.cycle.name}${myDept ? ` · chỉ ${myDept.name}` : ' · toàn công ty'}`}
        actions={<><button className="btn" onClick={() => dispatch({ type: 'toast', text: 'Đã xuất Excel theo bộ lọc đang chọn (bản mẫu).' })}>Xuất Excel</button><button className="btn" onClick={() => dispatch({ type: 'toast', text: 'Đã xuất PDF theo bộ lọc đang chọn (bản mẫu).' })}>Xuất PDF</button></>}
      />
      <div className="segmented" role="group" aria-label="Loại báo cáo" style={{ marginBottom: 16 }}>
        {types.map((t) => <button key={t.key} aria-pressed={type === t.key} onClick={() => setType(t.key)}>{t.label}</button>)}
      </div>
      <section className="panel">
        <div className="panel-body table-wrap">
          {type === 'okr' && (
            <table className="table">
              <thead><tr><th>Objective</th><th>Phòng ban</th><th>Cấp</th><th>Tiến độ</th></tr></thead>
              <tbody>
                {data.objectives.filter((o) => depts.some((d) => d.id === o.deptId)).map((o) => (
                  <tr key={o.id}><td><a href={`#/okr/${o.id}`}>{o.title}</a></td><td className="muted">{data.departments.find((d) => d.id === o.deptId)?.name}</td><td className="muted">{{ COMPANY: 'Công ty', DEPARTMENT: 'Phòng ban', INDIVIDUAL: 'Cá nhân' }[o.level]}</td><td style={{ minWidth: 220 }}><Progress value={pm.get(o.id)} expected={expected} /></td></tr>
                ))}
              </tbody>
            </table>
          )}
          {type === 'checkin' && (
            <table className="table">
              <thead><tr><th>Nhân viên</th><th>Phòng ban</th><th className="num">Số KR phụ trách</th><th className="num">Check-in trong 7 ngày</th><th className="num">Tỷ lệ</th></tr></thead>
              <tbody>
                {data.users.filter((u) => depts.some((d) => d.id === u.deptId)).map((u) => {
                  const krs = data.keyResults.filter((k) => k.assigneeId === u.id);
                  const ok = krs.filter((k) => { const l = latestCheckin(data.checkins, k.id); return l && daysSince(l.at) < 7; }).length;
                  return <tr key={u.id}><td>{u.name}</td><td className="muted">{data.departments.find((d) => d.id === u.deptId)?.name}</td><td className="num">{krs.length}</td><td className="num">{ok}</td><td className="num">{krs.length ? pct(ok / krs.length) : '—'}</td></tr>;
                })}
              </tbody>
            </table>
          )}
          {type === 'final' && (
            <table className="table">
              <thead><tr><th>Nhân viên</th><th>Điểm OKR</th><th>Điểm 360</th><th>Điểm cuối kỳ</th><th>Xếp loại</th></tr></thead>
              <tbody>
                {computeFinal(data, campaign).filter((r) => depts.some((d) => d.id === r.user.deptId) && (!myDept || r.user.managerId === user.id)).map((r) => (
                  <tr key={r.user.id}><td>{r.user.name}</td><td><Score value={r.okr} /></td><td><Score value={r.s360} /></td><td>{r.final == null ? '—' : r.final.toFixed(2).replace('.', ',')}</td><td>{r.grade}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

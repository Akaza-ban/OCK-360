import { useMemo, useState } from 'react';
import { useCycleData } from '../../../lib/store.jsx';
import { progressMap, expectedProgress, objectiveConfidence, latestCheckin, currentValue, daysSince } from '../../../lib/okr.js';
import { Progress, Confidence, PageHeader, Avatar, Empty } from '../../../components/ui.jsx';
import CheckinModal from '../../okr/components/CheckinModal.jsx';
import { pct, num, date, shortName } from '../../../lib/format.js';
import { isAdmin, isHR, isManager, directReports, headOfDept } from '../../../lib/auth.js';

export default function Dashboard({ user }) {
  const data = useCycleData();
  const tabs = [{ key: 'me', label: 'Cá nhân' }];
  if (isManager(user)) tabs.push({ key: 'team', label: 'Đội nhóm' });
  if (isAdmin(user) || isHR(user)) tabs.push({ key: 'company', label: 'Công ty' });
  const [tab, setTab] = useState(tabs.length > 1 ? tabs[1].key : 'me');

  return (
    <>
      <PageHeader
        title={`Chào ${user.name.split(' ').at(-1)}`}
        sub={`${data.cycle.name} · ${date(data.cycle.start)} – ${date(data.cycle.end)}`}
        actions={
          tabs.length > 1 && (
            <div className="segmented" role="group" aria-label="Chọn dashboard">
              {tabs.map((t) => (
                <button key={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)}>{t.label}</button>
              ))}
            </div>
          )
        }
      />
      {tab === 'me' && <Personal user={user} data={data} />}
      {tab === 'team' && <Team user={user} data={data} />}
      {tab === 'company' && <Company data={data} />}
    </>
  );
}

function Personal({ user, data }) {
  const [checkinKr, setCheckinKr] = useState(null);
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const mine = data.objectives.filter((o) => o.ownerId === user.id && o.level === 'INDIVIDUAL');
  const myKrs = data.keyResults.filter((k) => k.assigneeId === user.id);
  const due = myKrs.filter((k) => {
    const last = latestCheckin(data.checkins, k.id);
    return !last || daysSince(last.at) >= 7;
  });
  const forms = data.reviewForms.filter(
    (f) => f.reviewerId === user.id && f.status !== 'SUBMITTED' && data.campaigns.find((c) => c.id === f.campaignId)?.status === 'COLLECTING',
  );
  const campaign = data.campaigns.find((c) => c.status === 'COLLECTING');
  const avg = mine.length ? mine.reduce((s, o) => s + pm.get(o.id), 0) / mine.length : null;
  const closed = data.cycle.status === 'CLOSED';

  return (
    <div className="grid two">
      <div className="stack">
        <section className="panel">
          <header>
            <h2>Tiến độ OKR của tôi</h2>
            <a className="small" href="#/okr/my">Xem tất cả</a>
          </header>
          <div className="panel-body">
            {avg == null ? (
              <Empty title="Bạn chưa có OKR nào trong chu kỳ này." action={!closed && <a className="btn primary" href="#/okr/my">Thêm Objective đầu tiên</a>} />
            ) : (
              <>
                <Progress value={avg} expected={expected} size="lg" />
                <div className="legend" style={{ margin: '10px 0 6px' }}>
                  <span><span className="pace-key" />Kỳ vọng hôm nay: {pct(expected)}</span>
                  <span>{mine.length} Objective · {myKrs.length} Key Result</span>
                </div>
                {mine.map((o) => (
                  <div key={o.id} className="kr-row" style={{ gridTemplateColumns: '1fr 220px 120px' }}>
                    <a href={`#/okr/${o.id}`} className="kr-title" style={{ textDecoration: 'none' }}>{o.title}</a>
                    <Progress value={pm.get(o.id)} expected={expected} />
                    <Confidence value={objectiveConfidence(o.id, data)} />
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
        <Activity data={data} user={user} />
      </div>

      <div className="stack">
        <section className="panel">
          <header>
            <h2>Cần check-in tuần này</h2>
            <span className="muted small">{due.length} KR</span>
          </header>
          <div className="panel-body">
            {closed ? (
              <p className="muted">Chu kỳ đã đóng, không cần check-in.</p>
            ) : due.length === 0 ? (
              <p className="muted">Bạn đã check-in đủ mọi Key Result trong 7 ngày qua.</p>
            ) : (
              due.map((k) => {
                const last = latestCheckin(data.checkins, k.id);
                return (
                  <div key={k.id} className="kr-row" style={{ gridTemplateColumns: '1fr auto' }}>
                    <div>
                      <div className="kr-title">{k.title}</div>
                      <div className="kr-meta">
                        {k.type === 'BOOLEAN' ? (currentValue(k, data.checkins) ? 'Đã hoàn thành' : 'Chưa hoàn thành') : `${num(currentValue(k, data.checkins), k.unit)} / ${num(k.target, k.unit)}`} ·{' '}
                        {last ? `lần cuối ${daysSince(last.at)} ngày trước` : 'chưa check-in lần nào'}
                      </div>
                    </div>
                    <button className="btn primary small" onClick={() => setCheckinKr(k)}>Check-in</button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="panel">
          <header>
            <h2>Phiếu đánh giá cần điền</h2>
            <a className="small" href="#/reviews/todo">Mở danh sách</a>
          </header>
          <div className="panel-body">
            {forms.length ? (
              <>
                <div className="stat">
                  <b>{forms.length} phiếu</b>
                  <span>{campaign?.name} · hạn nộp {campaign && date(campaign.submitDeadline)}</span>
                </div>
              </>
            ) : (
              <p className="muted">Không có phiếu nào đang chờ bạn.</p>
            )}
          </div>
        </section>
      </div>
      {checkinKr && <CheckinModal kr={checkinKr} user={user} onClose={() => setCheckinKr(null)} />}
    </div>
  );
}

function Activity({ data, user }) {
  const items = [...data.checkins]
    .filter((c) => data.keyResults.some((k) => k.id === c.krId))
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);
  return (
    <section className="panel">
      <header>
        <h2>Hoạt động gần đây</h2>
        <a href="#/okr/tree">Cây OKR</a>
      </header>
      <div className="panel-body">
        {items.map((c) => {
          const k = data.keyResults.find((x) => x.id === c.krId);
          const u = data.users.find((x) => x.id === c.userId);
          const d = daysSince(c.at);
          return (
            <div key={c.id} className="kr-row" style={{ gridTemplateColumns: 'auto 1fr auto', gap: 10 }}>
              <Avatar name={u.name} size={22} />
              <div style={{ minWidth: 0 }}>
                <span><b style={{ fontWeight: 500 }}>{u.id === user.id ? 'Bạn' : shortName(u.name)}</b> <span className="muted">check-in</span> <a href={`#/okr/${k.objectiveId}`} className="kr-title">{k.title}</a></span>
                <div className="kr-meta">{k.type === 'BOOLEAN' ? (c.value ? 'Đã hoàn thành' : 'Chưa hoàn thành') : `${num(c.value, k.unit)} / ${num(k.target, k.unit)}`}{c.note ? ` · ${c.note}` : ''}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Confidence value={c.confidence} />
                <span className="muted small" style={{ minWidth: 70, textAlign: 'right' }}>{d === 0 ? 'hôm nay' : `${d} ngày trước`}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Team({ user, data }) {
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const dept = headOfDept(user, data.departments);
  const deptObjs = data.objectives.filter((o) => o.level === 'DEPARTMENT' && o.deptId === dept?.id);
  const reports = directReports(user, data.users);
  const rows = reports.map((r) => {
    const objs = data.objectives.filter((o) => o.ownerId === r.id && o.level === 'INDIVIDUAL');
    const krs = data.keyResults.filter((k) => k.assigneeId === r.id);
    const lastAt = krs.map((k) => latestCheckin(data.checkins, k.id)?.at).filter(Boolean).sort().at(-1);
    return {
      user: r,
      progress: objs.length ? objs.reduce((s, o) => s + pm.get(o.id), 0) / objs.length : null,
      conf: objs.map((o) => objectiveConfidence(o.id, data)).find((c) => c === 'OFF_TRACK') || objs.map((o) => objectiveConfidence(o.id, data)).find((c) => c === 'AT_RISK') || (objs.length ? 'ON_TRACK' : null),
      days: lastAt ? daysSince(lastAt) : null,
    };
  });
  const risky = data.objectives.filter((o) => (o.deptId === dept?.id) && ['AT_RISK', 'OFF_TRACK'].includes(objectiveConfidence(o.id, data)));

  return (
    <div className="stack">
      <section className="panel">
        <header>
          <h2>OKR {dept?.name}</h2>
          <span className="legend"><span><span className="pace-key" />Kỳ vọng hôm nay: {pct(expected)}</span></span>
        </header>
        <div className="panel-body">
          {deptObjs.map((o) => (
            <div key={o.id} className="kr-row" style={{ gridTemplateColumns: '1fr 260px 120px' }}>
              <a href={`#/okr/${o.id}`} className="kr-title" style={{ textDecoration: 'none' }}>{o.title}</a>
              <Progress value={pm.get(o.id)} expected={expected} />
              <Confidence value={objectiveConfidence(o.id, data)} />
            </div>
          ))}
        </div>
      </section>
      <div className="grid two">
        <section className="panel">
          <header><h2>Nhân viên dưới quyền</h2></header>
          <div className="panel-body table-wrap">
            <table className="table">
              <thead><tr><th>Nhân viên</th><th>Tiến độ OKR</th><th>Mức tự tin</th><th>Check-in gần nhất</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user.id}>
                    <td><span className="person"><Avatar name={r.user.name} size={28} />{r.user.name}</span></td>
                    <td style={{ minWidth: 180 }}>{r.progress == null ? <span className="muted">Chưa có OKR</span> : <Progress value={r.progress} expected={expected} />}</td>
                    <td><Confidence value={r.conf} /></td>
                    <td>{r.days == null ? <span className="conf bad">Chưa check-in</span> : r.days >= 7 ? <span className="conf warn">{r.days} ngày trước</span> : <span className="muted">{r.days} ngày trước</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <header><h2>OKR đang có rủi ro</h2><span className="muted small">{risky.length}</span></header>
          <div className="panel-body">
            {risky.length === 0 && <p className="muted">Không có OKR nào đang có rủi ro.</p>}
            {risky.map((o) => {
              const k = data.keyResults.filter((x) => x.objectiveId === o.id).map((x) => latestCheckin(data.checkins, x.id)).filter((c) => c && c.blocker).at(-1);
              return (
                <div key={o.id} className="kr-row" style={{ gridTemplateColumns: '1fr auto' }}>
                  <div>
                    <a href={`#/okr/${o.id}`} className="kr-title" style={{ textDecoration: 'none' }}>{o.title}</a>
                    <div className="kr-meta">{shortName(data.users.find((u) => u.id === o.ownerId).name)}{k ? ` · Vướng: ${k.blocker}` : ''}</div>
                  </div>
                  <Confidence value={objectiveConfidence(o.id, data)} />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Company({ data }) {
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const company = data.objectives.filter((o) => o.level === 'COMPANY');
  const depts = data.departments.filter((d) => d.parentId);
  const activeKrs = data.keyResults;
  const checkedThisWeek = activeKrs.filter((k) => {
    const l = latestCheckin(data.checkins, k.id);
    return l && daysSince(l.at) < 7;
  }).length;
  const cp = data.campaigns.find((c) => c.cycleId === data.cycle.id);
  const forms = cp ? data.reviewForms.filter((f) => f.campaignId === cp.id) : [];
  const submitted = forms.filter((f) => f.status === 'SUBMITTED').length;

  return (
    <div className="stack">
      <div className="grid three">
        <section className="panel panel-body"><div className="stat"><b>{company.length ? pct(company.reduce((s, o) => s + pm.get(o.id), 0) / company.length) : '—'}</b><span>Tiến độ trung bình OKR công ty, kỳ vọng {pct(expected)}</span></div></section>
        <section className="panel panel-body"><div className="stat"><b>{activeKrs.length ? pct(checkedThisWeek / activeKrs.length) : '—'}</b><span>Key Result được check-in trong 7 ngày qua ({checkedThisWeek}/{activeKrs.length})</span></div></section>
        <section className="panel panel-body"><div className="stat"><b>{forms.length ? pct(submitted / forms.length) : '—'}</b><span>{cp ? `Phiếu đã nộp · ${cp.name}` : 'Chưa có đợt đánh giá trong chu kỳ'}</span></div></section>
      </div>
      <section className="panel">
        <header><h2>OKR công ty</h2></header>
        <div className="panel-body">
          {company.map((o) => (
            <div key={o.id} className="kr-row" style={{ gridTemplateColumns: '1fr 280px 120px' }}>
              <a href={`#/okr/${o.id}`} className="kr-title" style={{ textDecoration: 'none' }}>{o.title}</a>
              <Progress value={pm.get(o.id)} expected={expected} />
              <Confidence value={objectiveConfidence(o.id, data)} />
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <header><h2>Theo phòng ban</h2></header>
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Phòng ban</th><th>Tiến độ OKR phòng ban</th><th className="num">Số Objective</th><th className="num">Check-in 7 ngày qua</th></tr></thead>
            <tbody>
              {depts.map((d) => {
                const objs = data.objectives.filter((o) => o.deptId === d.id && o.level === 'DEPARTMENT');
                const krs = data.keyResults.filter((k) => data.objectives.find((o) => o.id === k.objectiveId)?.deptId === d.id);
                const ok = krs.filter((k) => { const l = latestCheckin(data.checkins, k.id); return l && daysSince(l.at) < 7; }).length;
                return (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td style={{ minWidth: 220 }}>{objs.length ? <Progress value={objs.reduce((s, o) => s + pm.get(o.id), 0) / objs.length} expected={expected} /> : <span className="muted">Chưa có OKR phòng ban</span>}</td>
                    <td className="num">{data.objectives.filter((o) => o.deptId === d.id).length}</td>
                    <td className="num">{krs.length ? pct(ok / krs.length) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

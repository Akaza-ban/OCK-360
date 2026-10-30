import { useMemo, useState } from 'react';
import { useCycleData } from '../../../lib/store.jsx';
import { progressMap, expectedProgress, objectiveConfidence, ancestry } from '../../../lib/okr.js';
import { Progress, Confidence, PageHeader, Empty, LEVEL_LABEL } from '../../../components/ui.jsx';
import KrRow from '../components/KrRow.jsx';
import CheckinModal from '../components/CheckinModal.jsx';
import ObjectiveForm from '../components/ObjectiveForm.jsx';
import { pct } from '../../../lib/format.js';

export default function MyOkr({ user }) {
  const data = useCycleData();
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const [checkinKr, setCheckinKr] = useState(null);
  const [creating, setCreating] = useState(false);
  const closed = data.cycle.status === 'CLOSED';
  const mine = data.objectives.filter((o) => o.ownerId === user.id);

  return (
    <>
      <PageHeader
        title="OKR của tôi"
        sub={`${mine.length} Objective trong ${data.cycle.name} · tối đa ${data.cycle.maxObjectives} Objective cá nhân`}
        actions={!closed && <button className="btn primary" onClick={() => setCreating(true)}>Thêm Objective</button>}
      />
      {closed && <div className="notice" style={{ marginBottom: 16 }}>Chu kỳ {data.cycle.name} đã đóng. Bạn chỉ xem được, không sửa hay check-in.</div>}
      <div className="legend" style={{ marginBottom: 12 }}>
        <span><span className="pace-key" />Vạch đen là mức kỳ vọng hôm nay ({pct(expected)}). Thanh màu cam là đang chậm hơn kỳ vọng.</span>
      </div>
      <section className="panel">
        {mine.length === 0 && <Empty title="Bạn chưa có Objective nào trong chu kỳ này." action={!closed && <button className="btn primary" onClick={() => setCreating(true)}>Thêm Objective đầu tiên</button>}>Một Objective tốt nối với mục tiêu phòng ban và có 2–4 Key Result đo được.</Empty>}
        {mine.map((o) => {
          const chain = ancestry(o.id, data.objectives).slice(0, -1);
          return (
            <div key={o.id} className="obj-card">
              <div className="obj-head">
                <div>
                  <div className="breadcrumb" style={{ marginBottom: 4 }}>
                    <span className={`tag ${o.level === 'COMPANY' ? 'company' : o.level === 'DEPARTMENT' ? 'dept' : 'person'}`}>{LEVEL_LABEL[o.level]}</span>
                    {chain.length ? chain.map((p) => <span key={p.id}>› <a href={`#/okr/${p.id}`}>{p.title}</a></span>) : o.level !== 'COMPANY' && <span className="conf warn">Chưa liên kết cấp trên</span>}
                  </div>
                  <a href={`#/okr/${o.id}`}><h3 style={{ fontSize: 17 }}>{o.title}</h3></a>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 230 }}><Progress value={pm.get(o.id)} expected={expected} /></div>
                  <Confidence value={objectiveConfidence(o.id, data)} />
                </div>
              </div>
              {data.keyResults.filter((k) => k.objectiveId === o.id).map((k) => (
                <KrRow key={k.id} kr={k} data={data} expected={expected} canCheckin={!closed && k.assigneeId === user.id} onCheckin={setCheckinKr} />
              ))}
            </div>
          );
        })}
      </section>
      {checkinKr && <CheckinModal kr={checkinKr} user={user} onClose={() => setCheckinKr(null)} />}
      {creating && <ObjectiveForm user={user} onClose={() => setCreating(false)} />}
    </>
  );
}

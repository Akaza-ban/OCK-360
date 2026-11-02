import { useMemo, useState } from 'react';
import { useCycleData } from '../../../lib/store.jsx';
import { progressMap, expectedProgress, objectiveConfidence } from '../../../lib/okr.js';
import { Progress, Confidence, PageHeader, LEVEL_LABEL, LevelTag, Empty } from '../../../components/ui.jsx';
import ObjectiveForm from '../components/ObjectiveForm.jsx';
import { unitWithChildren } from '../../../lib/auth.js';
import { pct } from '../../../lib/format.js';

export default function OkrTree({ user }) {
  const data = useCycleData();
  const pm = useMemo(() => progressMap(data), [data]);
  const expected = expectedProgress(data.cycle);
  const [collapsed, setCollapsed] = useState({});
  const [dept, setDept] = useState('');
  const [conf, setConf] = useState('');
  const [creating, setCreating] = useState(false);

  // Một Objective được giữ lại nếu nó hoặc một Objective con cháu khớp bộ lọc.
  const scope = dept ? unitWithChildren(dept, data.departments) : null;
  const matches = (o) => (!scope || scope.includes(o.deptId)) && (!conf || objectiveConfidence(o.id, data) === conf);
  const keep = useMemo(() => {
    const memo = new Map();
    const visit = (o) => {
      if (memo.has(o.id)) return memo.get(o.id);
      const kids = data.objectives.filter((c) => c.parentId === o.id);
      const v = matches(o) || kids.some(visit);
      memo.set(o.id, v);
      return v;
    };
    data.objectives.forEach(visit);
    return memo;
  }, [data, dept, conf]);

  const roots = data.objectives.filter((o) => !o.parentId && keep.get(o.id));
  const unaligned = roots.filter((o) => o.level !== 'COMPANY');
  const companyRoots = roots.filter((o) => o.level === 'COMPANY');

  const Node = ({ o }) => {
    const kids = data.objectives.filter((c) => c.parentId === o.id && keep.get(c.id));
    const owner = data.users.find((u) => u.id === o.ownerId);
    const deptName = data.departments.find((d) => d.id === o.deptId)?.name;
    const isOpen = !collapsed[o.id];
    return (
      <li>
        <div className="tree-node">
          {kids.length ? (
            <button className="toggle" aria-expanded={isOpen} aria-label={isOpen ? 'Thu gọn' : 'Mở rộng'} onClick={() => setCollapsed((c) => ({ ...c, [o.id]: isOpen }))}>{isOpen ? '▾' : '▸'}</button>
          ) : <span />}
          <div>
            <LevelTag level={o.level} style={{ marginRight: 8 }} />
            <a href={`#/okr/${o.id}`}>{o.title}</a>
            <div className="owner">{['DEPARTMENT', 'TEAM'].includes(o.level) ? deptName : owner?.name}{kids.length ? ` · ${kids.length} Objective con` : ''}</div>
          </div>
          <Progress value={pm.get(o.id)} expected={expected} />
          <Confidence value={objectiveConfidence(o.id, data)} />
        </div>
        {kids.length > 0 && isOpen && <ul>{kids.map((c) => <Node key={c.id} o={c} />)}</ul>}
      </li>
    );
  };

  return (
    <>
      <PageHeader
        title="Cây OKR công ty"
        sub={`${data.objectives.length} Objective · tiến độ cấp dưới tự cộng dồn lên cấp trên`}
        actions={data.cycle.status !== 'CLOSED' && <button className="btn primary" onClick={() => setCreating(true)}>Thêm Objective</button>}
      />
      <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 14, flexWrap: 'wrap' }}>
        <div className="field">
          <label htmlFor="f-dept">Phòng ban / Team</label>
          <select id="f-dept" value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">Tất cả</option>
            {data.departments.filter((d) => d.type !== 'TEAM').flatMap((d) => [
              <option key={d.id} value={d.id}>{d.name}</option>,
              ...data.departments.filter((t) => t.parentId === d.id && t.type === 'TEAM').map((t) => <option key={t.id} value={t.id}>{'\u00a0\u00a0\u00a0'}{t.name}</option>),
            ])}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-conf">Mức tự tin</label>
          <select id="f-conf" value={conf} onChange={(e) => setConf(e.target.value)}>
            <option value="">Tất cả</option>
            <option value="ON_TRACK">Đúng hướng</option>
            <option value="AT_RISK">Có rủi ro</option>
            <option value="OFF_TRACK">Chệch hướng</option>
          </select>
        </div>
        <div className="legend" style={{ marginLeft: 'auto' }}><span><span className="pace-key" />Kỳ vọng hôm nay: {pct(expected)}</span></div>
      </div>
      <section className="panel panel-body">
        {roots.length === 0 && <Empty title="Không có Objective nào khớp bộ lọc." action={<button className="btn" onClick={() => { setDept(''); setConf(''); }}>Bỏ bộ lọc</button>} />}
        <ul className="tree">{companyRoots.map((o) => <Node key={o.id} o={o} />)}</ul>
        {unaligned.length > 0 && (
          <>
            <h3 style={{ margin: '18px 0 6px' }}>Chưa liên kết cấp trên</h3>
            <ul className="tree">{unaligned.map((o) => <Node key={o.id} o={o} />)}</ul>
          </>
        )}
      </section>
      {creating && <ObjectiveForm user={user} onClose={() => setCreating(false)} />}
    </>
  );
}

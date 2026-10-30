import { Progress, Confidence } from '../../../components/ui.jsx';
import { krProgress, currentValue, latestCheckin } from '../../../lib/okr.js';
import { num } from '../../../lib/format.js';

export default function KrRow({ kr, data, expected, canCheckin, onCheckin }) {
  const last = latestCheckin(data.checkins, kr.id);
  const cur = currentValue(kr, data.checkins);
  const owner = data.users.find((u) => u.id === kr.assigneeId);
  return (
    <div className="kr-row">
      <div>
        <div className="kr-title">{kr.title}</div>
        <div className="kr-meta">
          {kr.type === 'BOOLEAN'
            ? cur ? 'Đã hoàn thành' : 'Chưa hoàn thành'
            : `${num(cur, kr.unit)} / đích ${num(kr.target, kr.unit)} (ban đầu ${num(kr.start, kr.unit)})`}
          {' · '}phụ trách: {owner?.name}
        </div>
      </div>
      <Progress value={krProgress(kr, data.checkins)} expected={expected} />
      <Confidence value={last?.confidence} />
      <div style={{ minWidth: 92, textAlign: 'right' }}>
        {canCheckin && <button className="btn small primary" onClick={() => onCheckin(kr)}>Check-in</button>}
      </div>
    </div>
  );
}

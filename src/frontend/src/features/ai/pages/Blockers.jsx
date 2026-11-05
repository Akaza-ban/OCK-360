import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar, Empty, Pill } from '../../../components/ui.jsx';
import { CATEGORY, SEVERITY, ROUTING, routedUnitId, isSent } from '../../../lib/ai.js';
import { AiExplainBadge } from '../../../components/AiExplain.jsx';
import { dateTime } from '../../../lib/format.js';

// SCR-80 Vướng mắc chuyển đến (UC29): vướng mắc người báo đã gửi tới phòng mình, theo gợi ý của AI hoặc tự chọn.
// Gợi ý chưa được người báo xác nhận không hiện ở đây (BR-107).
export default function Blockers({ user }) {
  const { state, dispatch } = useStore();
  const dept = state.departments.find((d) => d.headId === user.id);
  const [tab, setTab] = useState('OPEN');
  const [notes, setNotes] = useState({});

  const all = state.checkinInsights.filter((i) => isSent(i) && routedUnitId(i) === dept?.id);
  const list = all.filter((i) => (tab === 'OPEN' ? i.routing === 'OPEN' : i.routing !== 'OPEN'));

  return (
    <>
      <PageHeader
        title="Vướng mắc chuyển đến"
        sub={`Những việc phòng khác đang chờ ${dept?.name}. AI đọc vướng mắc và gợi ý đơn vị; người báo bấm Gửi thì vướng mắc tới đây, và bạn quyết định nhận hay trả lại.`}
      />
      <div className="segmented" role="group" aria-label="Lọc theo trạng thái" style={{ marginBottom: 14 }}>
        <button aria-pressed={tab === 'OPEN'} onClick={() => setTab('OPEN')}>Đang chờ ({all.filter((i) => i.routing === 'OPEN').length})</button>
        <button aria-pressed={tab === 'DONE'} onClick={() => setTab('DONE')}>Đã xử lý ({all.filter((i) => i.routing !== 'OPEN').length})</button>
      </div>

      {!list.length && (
        <section className="panel">
          <Empty title={tab === 'OPEN' ? 'Không có vướng mắc nào đang chờ phòng bạn.' : 'Chưa xử lý vướng mắc nào.'}>
            Khi ai đó check-in và ghi vướng mắc cần {dept?.name} hỗ trợ, nó sẽ xuất hiện ở đây.
          </Empty>
        </section>
      )}

      <div className="stack">
        {list.map((i) => {
          const c = state.checkins.find((x) => x.id === i.checkinId);
          const kr = state.keyResults.find((k) => k.id === c.krId);
          const reporter = state.users.find((u) => u.id === c.userId);
          const from = state.departments.find((d) => d.id === reporter.deptId);
          const handler = state.users.find((u) => u.id === i.handledBy);
          return (
            <section key={i.checkinId} className="panel panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span className="person"><Avatar name={reporter.name} size={28} /><span><b>{reporter.name}</b> <span className="muted small">· {from.name} · {dateTime(c.at)}</span></span></span>
                <Pill value={ROUTING[i.routing]} />
              </div>
              <p className="quote" style={{ margin: '10px 0 6px' }}>{c.blocker}</p>
              <div className="small muted">
                Key Result: <a href={`#/okr/${kr.objectiveId}`}>{kr.title}</a>
              </div>
              <div className="ai-line">
                <AiExplainBadge target={{ kind: 'insight', checkinId: i.checkinId, flow: 'BLOCKER_ROUTING' }} />
                <span>{CATEGORY[i.category]}</span>
                <span className="muted">·</span>
                <span>Mức nghiêm trọng</span>
                <Pill value={SEVERITY[i.severity]} />
              </div>

              {i.routing === 'OPEN' ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <input
                    className="btn"
                    style={{ flex: 1, minWidth: 220, textAlign: 'left', cursor: 'text' }}
                    aria-label="Ghi chú gửi người báo vướng mắc"
                    placeholder="Ghi chú cho người báo, ví dụ: chiều nay QA gửi danh sách"
                    value={notes[i.checkinId] || ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [i.checkinId]: e.target.value }))}
                  />
                  <button className="btn primary" onClick={() => dispatch({ type: 'handleBlocker', checkinId: i.checkinId, routing: 'ACKNOWLEDGED', userId: user.id, note: notes[i.checkinId] || '' })}>Đã nhận xử lý</button>
                  <button className="btn" onClick={() => dispatch({ type: 'handleBlocker', checkinId: i.checkinId, routing: 'REJECTED', userId: user.id, note: notes[i.checkinId] || '' })}>Không liên quan phòng tôi</button>
                </div>
              ) : (
                <div className="comment" style={{ marginTop: 10 }}>
                  <span className="small"><b>{handler?.name}</b> <span className="muted">· {dateTime(i.handledAt)}</span></span>
                  <div>{i.handlerNote || <span className="muted">Không có ghi chú.</span>}</div>
                </div>
              )}
            </section>
          );
        })}
      </div>
      <p className="muted small" style={{ marginTop: 14 }}>
        Bạn không sửa được check-in của người khác. Chọn "Không liên quan phòng tôi" khi vướng mắc gửi nhầm đơn vị: vướng mắc được chuyển về quản lý trực tiếp của người báo, và lần gửi nhầm được ghi lại để đo độ chính xác của luồng.
      </p>
    </>
  );
}

import { useState } from 'react';
import { useStore } from '../../../lib/store.jsx';
import { Modal, CONFIDENCE } from '../../../components/ui.jsx';
import { currentValue, krProgress } from '../../../lib/okr.js';
import { num, pct } from '../../../lib/format.js';

export default function CheckinModal({ kr, user, onClose }) {
  const { state, dispatch } = useStore();
  const cur = currentValue(kr, state.checkins);
  const [value, setValue] = useState(kr.type === 'BOOLEAN' ? cur : String(cur));
  const [confidence, setConfidence] = useState('ON_TRACK');
  const [note, setNote] = useState('');
  const [blocker, setBlocker] = useState('');
  const [error, setError] = useState('');

  const parsed = kr.type === 'BOOLEAN' ? value : Number(String(value).replace(',', '.'));
  const preview = Number.isFinite(parsed) ? krProgress({ ...kr }, [{ krId: kr.id, value: parsed, at: '9999' }]) : null;

  const save = () => {
    if (!Number.isFinite(parsed)) {
      setError('Nhập một con số, ví dụ 25 hoặc 7,5.');
      return;
    }
    dispatch({ type: 'checkin', checkin: { krId: kr.id, value: parsed, confidence, note, blocker, userId: user.id } });
    onClose();
  };

  return (
    <Modal
      title="Check-in Key Result"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={save}>Lưu check-in</button>
        </>
      }
    >
      <div>
        <div style={{ fontWeight: 600 }}>{kr.title}</div>
        <div className="muted small">
          Ban đầu {num(kr.start, kr.unit)} · Đích {num(kr.target, kr.unit)} · Hiện tại {kr.type === 'BOOLEAN' ? (cur ? 'Đã hoàn thành' : 'Chưa hoàn thành') : num(cur, kr.unit)}
        </div>
      </div>

      {kr.type === 'BOOLEAN' ? (
        <div className="field">
          <span style={{ fontWeight: 600 }}>Trạng thái</span>
          <div className="segmented" role="group">
            <button aria-pressed={value === 0} onClick={() => setValue(0)}>Chưa hoàn thành</button>
            <button aria-pressed={value === 1} onClick={() => setValue(1)}>Đã hoàn thành</button>
          </div>
        </div>
      ) : (
        <div className="field">
          <label htmlFor="ck-value">Giá trị hiện tại ({kr.unit || 'số'})</label>
          <input id="ck-value" inputMode="decimal" value={value} onChange={(e) => { setValue(e.target.value); setError(''); }} aria-invalid={!!error} />
          {error ? <span className="error">{error}</span> : preview != null && <span className="hint">Tiến độ sau check-in: {pct(preview)}</span>}
        </div>
      )}

      <div className="field">
        <span style={{ fontWeight: 600 }}>Mức tự tin</span>
        <div className="segmented" role="group" aria-label="Mức tự tin">
          {Object.entries(CONFIDENCE).map(([k, c]) => (
            <button key={k} aria-pressed={confidence === k} onClick={() => setConfidence(k)}>{c.label}</button>
          ))}
        </div>
        {confidence === 'OFF_TRACK' && <span className="hint">Quản lý trực tiếp của bạn sẽ nhận thông báo.</span>}
      </div>
      <div className="field">
        <label htmlFor="ck-note">Ghi chú</label>
        <textarea id="ck-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tuần này bạn đã làm được gì?" />
      </div>
      <div className="field">
        <label htmlFor="ck-block">Vướng mắc</label>
        <textarea id="ck-block" value={blocker} onChange={(e) => setBlocker(e.target.value)} placeholder="Để trống nếu không có" style={{ minHeight: 56 }} />
      </div>
    </Modal>
  );
}

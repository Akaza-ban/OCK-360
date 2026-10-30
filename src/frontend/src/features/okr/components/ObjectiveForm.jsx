import { useState } from 'react';
import { useStore, useCycleData } from '../../../lib/store.jsx';
import { Modal, LEVEL_LABEL } from '../../../components/ui.jsx';
import { ALLOWED_PARENT, wouldCreateCycle } from '../../../lib/okr.js';
import { creatableLevels, headOfDept } from '../../../lib/auth.js';

const TYPE_LABEL = { NUMBER: 'Số', PERCENT: 'Phần trăm', BOOLEAN: 'Hoàn thành' };
const blankKr = (assigneeId) => ({ title: '', type: 'NUMBER', start: 0, target: '', unit: '', assigneeId });

export default function ObjectiveForm({ user, objective, onClose }) {
  const { dispatch } = useStore();
  const data = useCycleData();
  const levels = objective ? [objective.level] : creatableLevels(user, data);
  const [level, setLevel] = useState(objective?.level || 'INDIVIDUAL');
  const [title, setTitle] = useState(objective?.title || '');
  const [description, setDescription] = useState(objective?.description || '');
  const [parentId, setParentId] = useState(objective?.parentId || '');
  const [krs, setKrs] = useState(
    objective ? data.keyResults.filter((k) => k.objectiveId === objective.id) : [blankKr(user.id)],
  );
  const [errors, setErrors] = useState({});

  const parents = data.objectives.filter(
    (o) => ALLOWED_PARENT[level].includes(o.level) && o.id !== objective?.id && !(objective && wouldCreateCycle(objective.id, o.id, data.objectives)),
  );
  const myDept = headOfDept(user, data.departments);
  const mineCount = data.objectives.filter((o) => o.ownerId === user.id && o.level === 'INDIVIDUAL').length;

  const setKr = (i, patch) => setKrs((xs) => xs.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  const save = () => {
    const e = {};
    if (title.trim().length < 5) e.title = 'Tiêu đề cần ít nhất 5 ký tự.';
    if (!objective && level === 'INDIVIDUAL' && mineCount >= data.cycle.maxObjectives) e.title = `Bạn đã có ${data.cycle.maxObjectives} Objective, là số tối đa của chu kỳ.`;
    if (!krs.length) e.krs = 'Cần ít nhất 1 Key Result.';
    krs.forEach((k, i) => {
      if (!k.title.trim()) e[`kr${i}`] = 'Nhập tên Key Result.';
      else if (k.type !== 'BOOLEAN' && (k.target === '' || Number(k.target) === Number(k.start))) e[`kr${i}`] = 'Giá trị đích phải khác giá trị ban đầu.';
    });
    setErrors(e);
    if (Object.keys(e).length) return;
    dispatch({
      type: 'saveObjective',
      objective: {
        ...(objective || {}),
        cycleId: data.cycle.id,
        level,
        title: title.trim(),
        description,
        parentId: parentId || null,
        ownerId: objective?.ownerId || user.id,
        deptId: level === 'DEPARTMENT' ? myDept?.id || user.deptId : objective?.deptId || user.deptId,
      },
      keyResults: krs.map((k) => (k.type === 'BOOLEAN' ? { ...k, start: 0, target: 1, unit: '' } : { ...k, start: Number(k.start), target: Number(k.target) })),
    });
    onClose();
  };

  return (
    <Modal
      wide
      title={objective ? 'Sửa Objective' : 'Thêm Objective'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Hủy</button>
          <button className="btn primary" onClick={save}>{objective ? 'Lưu thay đổi' : 'Tạo Objective'}</button>
        </>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="of-level">Cấp</label>
          <select id="of-level" value={level} onChange={(e) => { setLevel(e.target.value); setParentId(''); }} disabled={levels.length === 1}>
            {levels.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="of-parent">Liên kết lên mục tiêu cấp trên</label>
          <select id="of-parent" value={parentId} onChange={(e) => setParentId(e.target.value)} disabled={level === 'COMPANY'}>
            <option value="">Không liên kết</option>
            {parents.map((o) => <option key={o.id} value={o.id}>[{LEVEL_LABEL[o.level]}] {o.title}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="of-title">Objective</label>
          <input id="of-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Viết test cho module thanh toán" aria-invalid={!!errors.title} />
          {errors.title && <span className="error">{errors.title}</span>}
        </div>
        <div className="field full">
          <label htmlFor="of-desc">Mô tả</label>
          <textarea id="of-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vì sao mục tiêu này quan trọng?" style={{ minHeight: 56 }} />
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h3>Key Result ({krs.length}/5)</h3>
          <button className="btn small" disabled={krs.length >= 5} onClick={() => setKrs((xs) => [...xs, blankKr(user.id)])}>Thêm Key Result</button>
        </div>
        {errors.krs && <span className="error">{errors.krs}</span>}
        {krs.map((k, i) => (
          <div key={k.id || i} className="panel" style={{ padding: 14, marginTop: 10 }}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 150px' }}>
              <div className="field">
                <label htmlFor={`kr-t-${i}`}>Key Result {i + 1}</label>
                <input id={`kr-t-${i}`} value={k.title} onChange={(e) => setKr(i, { title: e.target.value })} placeholder="Điều đo được, ví dụ: Viết test case" />
              </div>
              <div className="field">
                <label htmlFor={`kr-ty-${i}`}>Kiểu đo</label>
                <select id={`kr-ty-${i}`} value={k.type} onChange={(e) => setKr(i, { type: e.target.value })}>
                  {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            {k.type !== 'BOOLEAN' && (
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', marginTop: 10, alignItems: 'end' }}>
                <div className="field"><label htmlFor={`kr-s-${i}`}>Ban đầu</label><input id={`kr-s-${i}`} inputMode="decimal" value={k.start} onChange={(e) => setKr(i, { start: e.target.value })} /></div>
                <div className="field"><label htmlFor={`kr-g-${i}`}>Đích</label><input id={`kr-g-${i}`} inputMode="decimal" value={k.target} onChange={(e) => setKr(i, { target: e.target.value })} /></div>
                <div className="field"><label htmlFor={`kr-u-${i}`}>Đơn vị</label><input id={`kr-u-${i}`} value={k.unit} onChange={(e) => setKr(i, { unit: e.target.value })} placeholder={k.type === 'PERCENT' ? '%' : 'test case'} /></div>
                <button className="btn small danger" onClick={() => setKrs((xs) => xs.filter((_, j) => j !== i))} aria-label={`Xóa Key Result ${i + 1}`}>Xóa</button>
              </div>
            )}
            {k.type === 'BOOLEAN' && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted small">Tiến độ là 0% hoặc 100%.</span>
                <button className="btn small danger" onClick={() => setKrs((xs) => xs.filter((_, j) => j !== i))}>Xóa</button>
              </div>
            )}
            {errors[`kr${i}`] && <span className="error">{errors[`kr${i}`]}</span>}
          </div>
        ))}
        <p className="muted small" style={{ marginTop: 10 }}>Mục tiêu giảm (ví dụ giảm lỗi từ 50 xuống 20) được tính đúng tự động: chỉ cần nhập đích nhỏ hơn ban đầu.</p>
      </div>
    </Modal>
  );
}

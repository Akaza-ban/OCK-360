import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar } from '../../../components/ui.jsx';
import { UNIT_TYPE_LABEL } from '../../../lib/data.js';

// SCR-51 Phòng ban và team: cây tổ chức quyết định ai được sửa OKR phòng ban, OKR team.
export default function Departments() {
  const { state, dispatch } = useStore();
  const Node = ({ d, depth }) => {
    const head = state.users.find((u) => u.id === d.headId);
    const members = state.users.filter((u) => u.deptId === d.id);
    const kids = state.departments.filter((x) => x.parentId === d.id);
    const isTeam = d.type === 'TEAM';
    return (
      <>
        <tr>
          <td style={{ paddingLeft: 12 + depth * 28 }}>{depth > 0 && <span className="muted">└ </span>}<b>{d.name}</b></td>
          <td><span className={`tag ${isTeam ? 'team' : 'dept'}`}>{UNIT_TYPE_LABEL[d.type || 'DEPARTMENT']}</span></td>
          <td>{head && <span className="person"><Avatar name={head.name} size={24} />{head.name}</span>}</td>
          <td className="num">{members.length}</td>
          <td className="num">
            {!isTeam && d.parentId && <button className="btn small" onClick={() => dispatch({ type: 'toast', text: `Bản mẫu: thêm team vào ${d.name}.` })}>Thêm team</button>}{' '}
            <button className="btn small" onClick={() => dispatch({ type: 'toast', text: `Bản mẫu: mở biểu mẫu sửa ${d.name}.` })}>Sửa</button>
          </td>
        </tr>
        {kids.map((k) => <Node key={k.id} d={k} depth={depth + 1} />)}
      </>
    );
  };
  return (
    <>
      <PageHeader
        title="Phòng ban và team"
        sub="Team chỉ nằm ngay dưới một phòng ban. Trưởng phòng sửa OKR phòng ban và OKR các team của phòng; team lead sửa OKR team mình."
        actions={<button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Bản mẫu: mở biểu mẫu thêm phòng ban.' })}>Thêm phòng ban</button>}
      />
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Đơn vị</th><th>Loại</th><th>Người phụ trách</th><th className="num">Thành viên trực tiếp</th><th /></tr></thead>
            <tbody>{state.departments.filter((d) => !d.parentId).map((d) => <Node key={d.id} d={d} depth={0} />)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

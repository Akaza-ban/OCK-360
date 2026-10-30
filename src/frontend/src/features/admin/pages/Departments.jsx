import { useStore } from '../../../lib/store.jsx';
import { PageHeader, Avatar } from '../../../components/ui.jsx';

export default function Departments() {
  const { state, dispatch } = useStore();
  const Node = ({ d, depth }) => {
    const head = state.users.find((u) => u.id === d.headId);
    const members = state.users.filter((u) => u.deptId === d.id);
    const kids = state.departments.filter((x) => x.parentId === d.id);
    return (
      <>
        <tr>
          <td style={{ paddingLeft: 12 + depth * 28 }}>{depth > 0 && <span className="muted">└ </span>}<b>{d.name}</b></td>
          <td>{head && <span className="person"><Avatar name={head.name} size={24} />{head.name}</span>}</td>
          <td className="num">{members.length}</td>
          <td className="num"><button className="btn small" onClick={() => dispatch({ type: 'toast', text: `Bản mẫu: mở biểu mẫu sửa ${d.name}.` })}>Sửa</button></td>
        </tr>
        {kids.map((k) => <Node key={k.id} d={k} depth={depth + 1} />)}
      </>
    );
  };
  return (
    <>
      <PageHeader title="Phòng ban" sub="Cây phòng ban quyết định ai được sửa OKR phòng ban nào." actions={<button className="btn primary" onClick={() => dispatch({ type: 'toast', text: 'Bản mẫu: mở biểu mẫu thêm phòng ban.' })}>Thêm phòng ban</button>} />
      <section className="panel">
        <div className="panel-body table-wrap">
          <table className="table">
            <thead><tr><th>Phòng ban</th><th>Trưởng phòng</th><th className="num">Nhân viên</th><th /></tr></thead>
            <tbody>{state.departments.filter((d) => !d.parentId).map((d) => <Node key={d.id} d={d} depth={0} />)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}

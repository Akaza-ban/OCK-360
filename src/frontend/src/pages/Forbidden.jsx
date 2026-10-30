import { Empty } from '../components/ui.jsx';

export default function Forbidden({ notFound }) {
  return (
    <section className="panel" style={{ marginTop: 40 }}>
      <Empty
        title={notFound ? 'Không tìm thấy trang này.' : 'Bạn không có quyền xem trang này.'}
        action={<a className="btn primary" href="#/dashboard">Về Dashboard</a>}
      >
        {notFound ? 'Đường dẫn có thể đã thay đổi.' : 'Trang này chỉ dành cho một số vai trò. Nếu bạn cần quyền truy cập, hãy liên hệ phòng Nhân sự.'}
      </Empty>
    </section>
  );
}

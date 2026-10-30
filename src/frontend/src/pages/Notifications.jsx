import { useStore } from '../lib/store.jsx';
import { PageHeader, Empty } from '../components/ui.jsx';
import { dateTime } from '../lib/format.js';

export default function Notifications({ user }) {
  const { state, dispatch } = useStore();
  const list = state.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader title="Thông báo" sub={`${list.filter((n) => !n.read).length} chưa đọc`} actions={<button className="btn" onClick={() => dispatch({ type: 'readAll', userId: user.id })}>Đánh dấu tất cả đã đọc</button>} />
      <section className="panel">
        {!list.length && <Empty title="Bạn chưa có thông báo nào." />}
        <div className="panel-body">
          {list.map((n) => (
            <a key={n.id} href={n.link} onClick={() => dispatch({ type: 'readNotification', id: n.id })} style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--line-2)', textDecoration: 'none' }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 8, background: n.read ? 'transparent' : 'var(--bad)' }} />
              <span>
                <span style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</span>
                <span className="muted small" style={{ display: 'block' }}>{dateTime(n.at)}{n.read ? '' : ' · chưa đọc'}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

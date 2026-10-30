import { useEffect, useState } from 'react';
import { useStore } from './lib/store.jsx';
import { loadSession, saveSession, clearSession, canAccess } from './lib/auth.js';
import Login from './components/Login.jsx';
import Shell from './components/Shell.jsx';
import Dashboard from './features/dashboard/pages/Dashboard.jsx';
import MyOkr from './features/okr/pages/MyOkr.jsx';
import OkrTree from './features/okr/pages/OkrTree.jsx';
import ObjectiveDetail from './features/okr/pages/ObjectiveDetail.jsx';
import ReviewTodo from './features/reviews/pages/ReviewTodo.jsx';
import ReviewForm from './features/reviews/pages/ReviewForm.jsx';
import Nominate from './features/reviews/pages/Nominate.jsx';
import Approvals from './features/reviews/pages/Approvals.jsx';
import ReviewResult from './features/reviews/pages/ReviewResult.jsx';
import FinalResults from './features/results/pages/FinalResults.jsx';
import Reports from './features/results/pages/Reports.jsx';
import Cycles from './features/admin/pages/Cycles.jsx';
import Departments from './features/admin/pages/Departments.jsx';
import Users from './features/admin/pages/Users.jsx';
import Campaigns from './features/admin/pages/Campaigns.jsx';
import CampaignDetail from './features/admin/pages/CampaignDetail.jsx';
import Templates from './features/admin/pages/Templates.jsx';
import Audit from './features/admin/pages/Audit.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import Forbidden from './pages/Forbidden.jsx';

function useHashRoute() {
  const read = () => window.location.hash.replace(/^#/, '') || '/dashboard';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

function page(route, user) {
  const p = route.split('/').filter(Boolean);
  if (!canAccess(route, user)) return <Forbidden />;
  switch (p[0]) {
    case 'dashboard':
      return <Dashboard user={user} />;
    case 'okr':
      if (p[1] === 'my') return <MyOkr user={user} />;
      if (p[1] === 'tree') return <OkrTree user={user} />;
      return <ObjectiveDetail user={user} id={p[1]} />;
    case 'reviews':
      if (p[1] === 'todo') return <ReviewTodo user={user} />;
      if (p[1] === 'forms') return <ReviewForm user={user} id={p[2]} />;
      if (p[1] === 'nominate') return <Nominate user={user} />;
      if (p[1] === 'approvals') return <Approvals user={user} />;
      if (p[1] === 'results') return <ReviewResult user={user} revieweeId={p[2]} />;
      break;
    case 'final-results':
      return <FinalResults user={user} />;
    case 'reports':
      return <Reports user={user} />;
    case 'admin':
      if (p[1] === 'cycles') return <Cycles />;
      if (p[1] === 'departments') return <Departments />;
      if (p[1] === 'users') return <Users user={user} />;
      if (p[1] === 'campaigns') return p[2] ? <CampaignDetail id={p[2]} /> : <Campaigns />;
      if (p[1] === 'templates') return <Templates />;
      break;
    case 'audit':
      return <Audit />;
    case 'notifications':
      return <Notifications user={user} />;
    case 'profile':
      return <Profile user={user} />;
    case '403':
      return <Forbidden />;
    default:
  }
  return <Forbidden notFound />;
}

export default function App() {
  const { state } = useStore();
  const route = useHashRoute();
  const [session, setSession] = useState(loadSession);
  const user = session && state.users.find((u) => u.id === session.userId);

  if (!user) {
    return (
      <Login
        onLogin={(id) => {
          saveSession(id);
          setSession({ userId: id });
          window.location.hash = '#/dashboard';
        }}
      />
    );
  }

  return (
    <Shell
      user={user}
      route={route}
      onLogout={() => {
        clearSession();
        setSession(null);
        window.location.hash = '#/login';
      }}
    >
      {page(route, user)}
    </Shell>
  );
}

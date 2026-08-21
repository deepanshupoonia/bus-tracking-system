import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { DriverDashboard } from './pages/DriverDashboard.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { StudentDashboard } from './pages/StudentDashboard.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';

function Dashboard() {
  const { session, ready, logout } = useAuth();
  if (!ready) return <main className="page loading">Loading IIT Ropar Transport…</main>;
  if (!session) return <Navigate to="/login" replace />;
  const title = session.user.role === 'ADMIN' ? 'System administration' : session.user.role === 'DRIVER' ? 'Driver console' : 'Live tracking';
  return <main className="page"><header className="topbar"><a className="brand" href="/"><span className="brand-mark">I</span><span><strong>IIT Ropar</strong><small>Campus Transport</small></span></a><div className="user-menu"><span className="avatar">{session.user.name.slice(0, 1)}</span><span className="user-name">{session.user.name}</span><button className="text" onClick={logout}>Sign out</button></div></header><div className="shell"><aside className="sidebar"><p>Workspace</p><strong>{title}</strong><span>Rupnagar, Punjab</span><div className="sidebar-card"><i /> GPS updates<br /><b>every 5 seconds</b></div></aside>{session.user.role === 'ADMIN' ? <AdminDashboard /> : session.user.role === 'DRIVER' ? <DriverDashboard /> : <StudentDashboard />}</div></main>;
}
export default function App() { return <AuthProvider><Routes><Route path="/" element={<Dashboard />} /><Route path="/login" element={<LoginPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider>; }

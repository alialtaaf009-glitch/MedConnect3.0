import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/Auth.jsx';
import { useTheme } from './context/Theme.jsx';
import { useTimer } from './context/Timer.jsx';
import { api } from './lib/api';
import SignIn from './pages/SignIn.jsx';
import Setup from './pages/Setup.jsx';
import Home from './pages/Home.jsx';
import Partners from './pages/Partners.jsx';
import Osce from './pages/Osce.jsx';
import Connections from './pages/Connections.jsx';
import Profile from './pages/Profile.jsx';
import Chat from './pages/Chat.jsx';
import Focus from './pages/Focus.jsx';
import Motivation from './pages/Motivation.jsx';
import Legal from './pages/Legal.jsx';
import Reset from './pages/Reset.jsx';
import AddPartner from './pages/AddPartner.jsx';

function Icon({ name }) {
  const common = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></>,
    partners: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.4.3 4.2 2.1 4.2 4.8" /></>,
    osce: <><rect x="4" y="5" width="16" height="11" rx="1" /><path d="M9 20h6M12 16v4" /></>,
    chat: <><path d="M4 5h16v11H7l-3 3z" /></>,
    focus: <><circle cx="12" cy="13" r="8" /><path d="M12 13V9" /><path d="M9 2h6" /><path d="M12 2v3" /></>,
    profile: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1-2.3 3.1-3.5 5.5-3.5s4.5 1.2 5.5 3.5" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}


function TopBar({ user }) {
  const loc = useLocation();
  const nav = useNavigate();
  // top-level tabs show no back arrow; everything else does
  const roots = ['/home', '/partners', '/osce', '/chat', '/focus'];
  const showBack = !roots.includes(loc.pathname);
  const onProfile = loc.pathname === '/profile';
  const initials = (user?.name || 'Dr A').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  return (
    <div className="topbar">
      {showBack
        ? <button className="topbar-back" onClick={() => nav(-1)} aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        : <span style={{ width: 24 }} />}
      <div className="topbar-title">MedConnect</div>
      {onProfile
        ? <span style={{ width: 36 }} />
        : <button className="topbar-avatar" onClick={() => nav('/profile')} aria-label="Profile">{user?.avatar || initials}</button>}
    </div>
  );
}

function TabBar() {
  const timer = useTimer();
  const timerRunning = !!timer?.running;
  const [hasUnread, setHasUnread] = useState(false);
  const [hasRequests, setHasRequests] = useState(false);

  // poll conversations; show a dot on Chat if any incoming message is newer
  // than what we've marked as read (stored locally per the helper).
  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        const d = await api.conversations();
        const anyUnread = (d.conversations || []).some((c) =>
          c.last_sender == c.other_id &&
          new Date(c.last_at).getTime() > Number(localStorage.getItem('chat_read_' + c.other_id) || 0)
        );
        if (alive) setHasUnread(anyUnread);
      } catch (e) {}
      try {
        const cd = await api.connections();
        // incoming pending requests = someone asked to connect with me
        const pending = (cd.incoming || cd.requests || cd.pending || []).length;
        if (alive) setHasRequests(pending > 0);
      } catch (e) {}
    };
    check();
    const t = setInterval(check, 8000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const tabs = [
    ['/home', 'home', 'Home'],
    ['/partners', 'partners', 'Partners'],
    ['/osce', 'osce', 'OSCE'],
    ['/chat', 'chat', 'Chat'],
    ['/focus', 'focus', 'Focus'],
  ];
  return (
    <nav className="tabbar">
      {tabs.map(([to, ic, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ic" style={{ position: 'relative' }}>
            <Icon name={ic} />
            {ic === 'chat' && hasUnread && <span className="badge-dot" />}
            {ic === 'partners' && hasRequests && <span className="badge-dot" />}
            {ic === 'focus' && timerRunning && <span className="timer-live" />}
          </span>{label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const { mode, toggle } = useTheme();

  // hold the splash long enough for the draw animation to finish, even if auth resolves instantly
  const [splashDone, setSplashDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (loading || !splashDone) return (
    <div className="app">
      <div className="center splash" style={{ flexDirection: 'column', gap: 16 }}>
        <svg className="splash-draw" width="92" height="92" viewBox="0 0 64 64" aria-label="MedConnect">
          <line x1="32" y1="8" x2="32" y2="58" />
          <path className="snake" d="M32 16 q10 6 0 12 q-10 6 0 12 q10 6 0 10" />
          <path className="wings" d="M32 14 q-10 -2 -16 4" />
          <path className="wings" d="M32 14 q10 -2 16 4" />
          <circle cx="32" cy="9" r="3" />
        </svg>
        <div className="splash-brand">MedConnect</div>
        <div className="splash-tag"><span>Connect.</span> <span>Study.</span> <span>Succeed.</span></div>
      </div>
    </div>
  );

  // not signed in
  if (!user) {
    return (
      <div className="app">
        <button className="themebtn" onClick={toggle}>{mode === 'dark' ? '☀️' : '🌙'}</button>
        <Routes>
          <Route path="/legal" element={<Legal />} />
          <Route path="/reset" element={<Reset />} />
          <Route path="/add/:id" element={<SignIn />} />
          <Route path="*" element={<SignIn />} />
        </Routes>
      </div>
    );
  }

  // signed in but profile not set up
  if (!user.profile_complete) {
    return (
      <div className="app">
        <Routes>
          <Route path="*" element={<Setup />} />
        </Routes>
      </div>
    );
  }

  // main app
  return (
    <div className="app">
      <TopBar user={user} />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/osce" element={<Osce />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/motivation" element={<Motivation />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add/:id" element={<AddPartner />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
}

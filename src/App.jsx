import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
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

  if (loading) return (
    <div className="app">
      <div className="center" style={{ flexDirection: 'column', gap: 14 }}>
        <img src="/pwa-192.png" alt="MedConnect" style={{ width: 76, height: 76, borderRadius: 16 }} />
        <div style={{ color: 'var(--muted)', fontSize: 13 }}>MedConnect</div>
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


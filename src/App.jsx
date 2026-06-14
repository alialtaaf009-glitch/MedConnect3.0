import { useState, useEffect, useRef } from 'react';
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
import About from './pages/About.jsx';
import LabValues from './pages/LabValues.jsx';
import Formulas from './pages/Formulas.jsx';
import Checklist from './components/Checklist.jsx';
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


function Drawer({ open, onClose, user }) {
  const nav = useNavigate();
  const { mode, toggle } = useTheme();
  const { logout } = useAuth();
  const go = (path) => { onClose(); nav(path); };
  const exam = [user?.exam, user?.country].filter(Boolean).join(' · ');

  // lock the background page from scrolling while the drawer is open (stops scroll bleed)
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // native share sheet (same as the home invite card)
  const inviteFriend = async () => {
    const data = {
      title: 'MedConnect',
      text: "I'm using MedConnect to find study partners for medical exams — doctors only, matched by exam. Join me:",
      url: 'https://med-connect3-0.vercel.app',
    };
    try { if (navigator.share) { await navigator.share(data); return; } }
    catch (e) { if (e?.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(`${data.text} ${data.url}`); window.alert('Invite link copied!'); } catch (e) {}
  };

  // swipe-to-close: follow the finger leftward, release to close or snap back
  const [drag, setDrag] = useState(null); // current leftward px offset while dragging (>=0), or null
  const [confirmLogout, setConfirmLogout] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const horizontal = useRef(false);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    startX.current = t.clientX;
    startY.current = t.clientY;
    horizontal.current = false;
    setDrag(0);
  };
  const onTouchMove = (e) => {
    if (drag === null) return;
    const t = e.touches[0];
    const dx = t.clientX - startX.current;
    const dy = t.clientY - startY.current;
    // decide gesture direction once, so vertical scrolling of the checklist still works
    if (!horizontal.current) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      horizontal.current = Math.abs(dx) > Math.abs(dy);
      if (!horizontal.current) { setDrag(null); return; } // it's a vertical scroll — let it be
    }
    if (dx < 0) setDrag(-dx); // only track leftward (closing) movement
  };
  const onTouchEnd = () => {
    if (drag === null) return;
    const width = 310;
    if (drag > width * 0.33) onClose(); // dragged past a third -> close
    setDrag(null); // snap back (or stay closed)
  };

  // while dragging, move with the finger and kill the transition for 1:1 feel
  const dragStyle = drag !== null && drag > 0
    ? { transform: `translateX(${-drag}px)`, transition: 'none' }
    : undefined;
  const scrimStyle = drag !== null && drag > 0
    ? { opacity: Math.max(0, 1 - drag / 310), transition: 'none' }
    : undefined;

  return (
    <>
      <div className={`drawer-scrim ${open ? 'show' : ''}`} style={scrimStyle} onClick={onClose} />
      <aside className={`drawer ${open ? 'open' : ''}`} style={dragStyle}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="drawer-head">
          <button className="drawer-theme" onClick={toggle} aria-label="Toggle theme">{mode === 'dark' ? '🌙' : '☀️'}</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'Doctor'}</div>
            {exam && <div style={{ fontSize: 11, opacity: 0.85, marginTop: 1 }}>{exam}</div>}
          </div>
        </div>
        <div className="drawer-scroll">
          <Checklist />
          <div className="drawer-div" />
          <div className="drawer-sect">Tools</div>
          <button className="drawer-item" onClick={() => go('/labs')}>
            <svg viewBox="0 0 24 24"><path d="M9 3h6M10 3v6.5L5.5 17a2 2 0 0 0 1.7 3h9.6a2 2 0 0 0 1.7-3L14 9.5V3" /><path d="M8 14h8" /></svg>Lab values
          </button>
          <button className="drawer-item" onClick={() => go('/formulas')}>
            <svg viewBox="0 0 24 24"><path d="M4 4h16M4 4v16M9 9l4 4M13 9l-4 4M8 18h8" /></svg>Formulas
          </button>
          <div className="drawer-div" />
          <div className="drawer-sect">Grow</div>
          <button className="drawer-item" onClick={inviteFriend}>
            <svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M19 8v6M22 11h-6" /></svg>Invite a colleague
          </button>
          <div className="drawer-div" />
          <div className="drawer-sect">App</div>
          <button className="drawer-item" onClick={() => go('/about')}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>About MedConnect
          </button>
          <button className="drawer-item" onClick={() => go('/legal')}>
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>Privacy &amp; Terms
          </button>
          <div className="drawer-div" />
          <button className="drawer-item logout" onClick={() => setConfirmLogout(true)}>
            <svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>Log out
          </button>
        </div>
        <div className="drawer-foot">MedConnect v1.1.1 · Connect. Study. Succeed.</div>
      </aside>

      {confirmLogout && (
        <div className="modal-scrim" onClick={() => setConfirmLogout(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Log out?</div>
            <div className="sub" style={{ fontSize: 13, marginBottom: 18 }}>You'll need to sign in again to get back to your study partners.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setConfirmLogout(false)}>Cancel</button>
              <button className="btn" style={{ flex: 1, background: 'var(--rust)' }} onClick={() => { setConfirmLogout(false); onClose(); logout(); }}>Log out</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TopBar({ user }) {
  const loc = useLocation();
  const nav = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const roots = ['/home', '/partners', '/osce', '/chat', '/focus'];
  const showBack = !roots.includes(loc.pathname);
  const onProfile = loc.pathname === '/profile';
  const initials = (user?.name || 'Dr A').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  return (
    <>
      <div className="topbar">
        <div style={{ width: 36, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          {showBack
            ? <button className="topbar-back" onClick={() => nav(-1)} aria-label="Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
            : <button className="topbar-burger" onClick={() => setDrawerOpen(true)} aria-label="Menu">
                <span /><span /><span />
              </button>}
        </div>
        <div className="topbar-title">MedConnect</div>
        {onProfile
          ? <span style={{ width: 36 }} />
          : <button className="topbar-avatar" onClick={() => nav('/profile')} aria-label="Profile">{user?.avatar || initials}</button>}
      </div>
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />
    </>
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
  const loc = useLocation();
  // tapping the tab you're already on scrolls that page back to the top
  const handleTab = (to) => (e) => {
    if (loc.pathname === to) {
      e.preventDefault();
      const scroller = document.querySelector('.app-scroll') || window;
      if (scroller === window) window.scrollTo({ top: 0, behavior: 'smooth' });
      else scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  return (
    <nav className="tabbar">
      {tabs.map(([to, ic, label]) => (
        <NavLink key={to} to={to} onClick={handleTab(to)} className={({ isActive }) => (isActive ? 'active' : '')}>
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
        <Route path="/about" element={<About />} />
        <Route path="/labs" element={<LabValues />} />
        <Route path="/formulas" element={<Formulas />} />
        <Route path="/connections" element={<Connections />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add/:id" element={<AddPartner />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <TabBar />
    </div>
  );
        }

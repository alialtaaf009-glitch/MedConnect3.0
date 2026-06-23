import { useEffect, useRef, useState, useCallback, lazy, Suspense } from 'react';
import StudyTimer from '../components/StudyTimer.jsx';
const TileGame = lazy(() => import('../components/TileGame.jsx'));
import { useBack } from '../context/Back.jsx';


// anatomical minimal lungs that inflate on inhale, deflate on exhale (box-breathing)
function Lungs({ grow, size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ transformOrigin: 'center', transition: 'transform 3.9s ease-in-out', transform: grow ? 'scale(1)' : 'scale(0.55)', filter: 'drop-shadow(0 8px 18px rgba(168,68,42,.22))' }}>
      {/* trachea with cartilage rings */}
      <path d="M50 14 v30" stroke="var(--rust)" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M46 20 h8 M46 25 h8 M46 30 h8" stroke="var(--rust)" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      {/* primary bronchi splitting into each lung */}
      <path d="M50 42 q-7 3 -12 9" stroke="var(--rust)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <path d="M50 42 q7 3 12 9" stroke="var(--rust)" strokeWidth="2.8" strokeLinecap="round" fill="none" />
      {/* secondary bronchi branches */}
      <path d="M40 50 q-4 4 -5 10 M40 50 q-6 2 -9 6" stroke="var(--rust)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <path d="M60 50 q4 4 5 10 M60 50 q6 2 9 6" stroke="var(--rust)" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      {/* left lobe */}
      <path d="M44 32 C27 35 18 50 21 69 C22 82 33 86 40 81 C46 77 47 66 47 56 C47 44 47 35 44 32 Z" fill="var(--rust)" fillOpacity="0.16" stroke="var(--rust)" strokeWidth="3" strokeLinejoin="round" />
      {/* right lobe */}
      <path d="M56 32 C73 35 82 50 79 69 C78 82 67 86 60 81 C54 77 53 66 53 56 C53 44 53 35 56 32 Z" fill="var(--rust)" fillOpacity="0.16" stroke="var(--rust)" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

// 4-4-4-4 box breathing: a 60-second nervous-system reset between study blocks
function Breathe() {
  const [on, setOn] = useState(false);
  const [phase, setPhase] = useState(0); // 0 inhale · 1 hold · 2 exhale · 3 hold
  const [left, setLeft] = useState(60);
  const tick = useRef(null);

  useEffect(() => {
    if (!on) { clearInterval(tick.current); return; }
    let s = 0;
    setPhase(0); setLeft(60);
    tick.current = setInterval(() => {
      s += 1;
      if (s >= 60) { clearInterval(tick.current); setOn(false); setLeft(60); return; }
      setLeft(60 - s);
      setPhase(Math.floor(s / 4) % 4);
    }, 1000);
    return () => clearInterval(tick.current);
  }, [on]);

  const [big, setBig] = useState(false);
  const { enterImmersive, exitImmersive } = useBack();
  useEffect(() => { if (big) { enterImmersive(); return () => exitImmersive(); } }, [big, enterImmersive, exitImmersive]);
  const LABELS = ['Breathe in…', 'Hold…', 'Breathe out…', 'Hold…'];
  const grow = on && (phase === 0 || phase === 1); // big through inhale + hold

  if (big) {
    return (
      <div onClick={() => { setBig(false); setOn(false); }} className="fs-open" style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}>
        <div className="fs-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
          <div className="voice" style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 8 }}>60 seconds of calm. No side effects.</div>
          <Lungs grow={grow} size={180} />
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest)', marginTop: 18 }}>{on ? LABELS[phase] : 'Tap to begin'}</div>
          {on ? <div className="sub" style={{ marginTop: 4 }}>{left}s left · tap anywhere to stop</div>
              : <button className="btn" style={{ marginTop: 16, maxWidth: 200 }} onClick={(e) => { e.stopPropagation(); setOn(true); }}>Start</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="card tint-green" onClick={() => !on && setBig(true)} style={{ textAlign: 'center', cursor: 'pointer' }}>
      <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>60 seconds of calm. No side effects.</p>
      <p className="sub" style={{ fontSize: 11, marginTop: 2 }}>
        Box breathing — in 4, hold 4, out 4, hold 4. Tap for full-screen.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Lungs grow={grow} size={120} /></div>
      {on ? (
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--forest)' }}>{LABELS[phase]}</div>
          <div className="sub" style={{ fontSize: 11, marginTop: 2 }}>{left}s left · tap to stop</div>
          <button className="btn ghost" style={{ marginTop: 10, maxWidth: 160, margin: '10px auto 0' }} onClick={(e) => { e.stopPropagation(); setOn(false); }}>Stop</button>
        </div>
      ) : (
        <button className="btn" style={{ maxWidth: 200, margin: '0 auto' }} onClick={(e) => { e.stopPropagation(); setOn(true); }}>Start breathing</button>
      )}
    </div>
  );
}

export default function Focus() {
  return (
    <div className="screen" style={{ padding: 0 }}>
      <div style={{ background: 'var(--section-hero)', color: '#fff', padding: '18px 20px 32px', minHeight: 150, boxSizing: 'border-box' }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>Focus ☕</h1>
        <p style={{ fontSize: 12.5, opacity: 0.85, marginTop: 5, lineHeight: 1.45 }}>
          Set a block, tap the box for full-screen, and guard it like an <span style={{ color: 'var(--gold)', fontWeight: 700 }}>exam hall</span>.
        </p>
      </div>
      <div style={{ background: 'var(--paper)', borderRadius: '26px 26px 0 0', marginTop: -20, position: 'relative', padding: '18px 16px', minHeight: '60vh' }}>
        <StudyTimer />
        <DeepFocus />
        <TakeABreak />
      </div>
    </div>
  );
}


// ─────────────────────────────────────────────
// Deep Focus Mode — self-contained, no routing
// Overlay covers the entire screen when active.
// Break glass: hold 10s OR type the phrase.
// ─────────────────────────────────────────────
const PHRASE = 'i am losing focus';
const HOLD_SECS = 10;

function DeepFocusLocked({ secsLeft, method, onUnlock }) {
  // hold-to-break state
  const holdRef = useRef(null);
  const [holdPct, setHoldPct] = useState(0);
  const holdStep = useRef(null);

  const startHold = () => {
    const start = Date.now();
    holdStep.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / (HOLD_SECS * 1000)) * 100);
      setHoldPct(pct);
      if (pct >= 100) { clearInterval(holdStep.current); onUnlock('hold'); }
    }, 80);
  };
  const endHold = () => { clearInterval(holdStep.current); setHoldPct(0); };

  // phrase state
  const [typed, setTyped] = useState('');
  const phraseMatch = typed.trim().toLowerCase() === PHRASE;

  // live clock
  const h = String(Math.floor(secsLeft / 3600)).padStart(2, '0');
  const m = String(Math.floor((secsLeft % 3600) / 60)).padStart(2, '0');
  const sc = String(secsLeft % 60).padStart(2, '0');

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'linear-gradient(160deg,#1b3d30 0%,#163028 100%)', display: 'flex', flexDirection: 'column', color: '#fff', overflowY: 'auto' }}>
      {/* header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 14px) 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 17 }}>Deep Focus</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, opacity: .6, textTransform: 'uppercase' }}>Active</span>
      </div>

      {/* main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '28px 24px 20px', textAlign: 'center' }}>
        {/* countdown ring */}
        <div style={{ width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '2.5px solid rgba(255,255,255,.12)', display: 'grid', placeItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 36, lineHeight: 1 }}>{h}:{m}:{sc}</div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, opacity: .6, marginTop: 5, textTransform: 'uppercase' }}>Remaining</div>
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 22, marginBottom: 8 }}>Stay in the zone.</div>
        <div style={{ fontSize: 12.5, opacity: .75, lineHeight: 1.55, maxWidth: 240, marginBottom: 32 }}>Your app is locked until your focus session ends. You've got this.</div>

        {/* break glass */}
        {method === 'hold' ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div
              onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
              onTouchStart={startHold} onTouchEnd={endHold}
              style={{ position: 'relative', width: 220, height: 52, borderRadius: 999, border: '1.5px solid rgba(255,255,255,.28)', background: 'rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', userSelect: 'none', WebkitUserSelect: 'none' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: holdPct + '%', background: 'rgba(192,83,63,.55)', borderRadius: 999, transition: holdPct === 0 ? 'none' : 'width .08s linear' }} />
              <span style={{ position: 'relative', fontSize: 13, fontWeight: 700, letterSpacing: .3, opacity: .9 }}>Hold {HOLD_SECS}s to break glass</span>
            </div>
            <div style={{ fontSize: 11, opacity: .5 }}>are you sure you need to stop?</div>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <textarea
              value={typed} onChange={(e) => setTyped(e.target.value)}
              placeholder={'type "I am losing focus" to unlock'}
              style={{ width: '100%', background: 'rgba(255,255,255,.07)', border: '1.5px solid rgba(255,255,255,.18)', borderRadius: 14, padding: '12px 14px', color: '#fff', fontSize: 13.5, fontFamily: 'inherit', resize: 'none', outline: 'none', minHeight: 60, lineHeight: 1.45, caretColor: 'var(--gold)' }}
            />
            <div style={{ fontSize: 11, opacity: .5, textAlign: 'center', margin: '8px 0 12px' }}>type it slowly. mean it. then decide.</div>
            <button
              disabled={!phraseMatch}
              onClick={() => phraseMatch && onUnlock('phrase')}
              style={{ width: '100%', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', cursor: phraseMatch ? 'pointer' : 'default', background: phraseMatch ? 'var(--rust)' : 'rgba(255,255,255,.1)', color: phraseMatch ? '#fff' : 'rgba(255,255,255,.35)', transition: 'all .2s' }}>
              Unlock session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function DeepFocus() {
  const [open, setOpen] = useState(false);       // setup sheet open
  const [hrs, setHrs] = useState(1);
  const [mins, setMins] = useState(0);
  const [method, setMethod] = useState('hold'); // 'hold' | 'phrase'
  const [secsLeft, setSecsLeft] = useState(null); // null = not running
  const tickRef = useRef(null);

  const start = () => {
    const total = hrs * 3600 + mins * 60;
    if (total <= 0) return;
    setSecsLeft(total);
    setOpen(false);
    tickRef.current = setInterval(() => {
      setSecsLeft((s) => {
        if (s <= 1) { clearInterval(tickRef.current); return null; }
        return s - 1;
      });
    }, 1000);
  };

  const unlock = () => {
    clearInterval(tickRef.current);
    setSecsLeft(null);
  };

  // preset click
  const preset = (h, m) => { setHrs(h); setMins(m); };

  return (
    <>
      {/* locked overlay */}
      {secsLeft !== null && (
        <DeepFocusLocked secsLeft={secsLeft} method={method} onUnlock={unlock} />
      )}

      {/* card on Focus page */}
      <div style={{ borderTop: '1px solid var(--line)', margin: '4px 0 16px' }} />
      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>Deep Focus</span>
          </div>
          <button
            onClick={() => setOpen(!open)}
            style={{ background: open ? 'var(--forest)' : 'var(--paper-2)', color: open ? '#fff' : 'var(--forest)', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all .18s' }}>
            {open ? 'Cancel' : 'Set session →'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>Lock the app for a set time. Break glass to exit early — but make it count.</p>

        {open && (
          <div style={{ marginTop: 16, animation: 'tabPop .25s ease both' }}>
            {/* presets */}
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .8, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Duration</div>
            <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
              {[[0,25],[0,45],[1,0],[1,30],[2,0]].map(([h,m]) => {
                const on = hrs===h && mins===m;
                return (
                  <button key={h+'-'+m} onClick={() => preset(h,m)}
                    style={{ flex: 1, border: `1.5px solid ${on ? 'var(--forest)' : 'var(--line)'}`, background: on ? 'var(--paper-2)' : 'var(--card)', color: on ? 'var(--forest)' : 'var(--muted)', borderRadius: 10, padding: '7px 2px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s' }}>
                    {h > 0 ? `${h}h` : ''}{m > 0 ? `${h>0?' ':''}${m}m` : ''}
                  </button>
                );
              })}
            </div>

            {/* break-glass method */}
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .8, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>Break-glass override</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['hold','⏱', 'Hold 10 seconds','Press & hold to exit'],['phrase','✍️','Type a phrase','"I am losing focus"']].map(([k,ic,t,s]) => (
                <div key={k} onClick={() => setMethod(k)}
                  style={{ flex: 1, border: `1.5px solid ${method===k ? 'var(--forest)' : 'var(--line)'}`, background: method===k ? '#eef4ee' : 'var(--card)', borderRadius: 14, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all .18s' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{ic}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{t}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>

            <button onClick={start}
              style={{ width: '100%', border: 'none', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', background: 'linear-gradient(135deg,var(--forest),#2c6a55)', color: '#fff', cursor: 'pointer', boxShadow: '0 4px 16px rgba(31,77,63,.28)' }}>
              Start deep focus →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Unified "Take a break" section with a pill toggle: Breathing | Memory
function TakeABreak() {
  const [tab, setTab] = useState('breathe');
  return (
    <>
      <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0 16px' }} />
      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Take a break</div>
      <div style={{ display: 'flex', background: 'var(--paper-2)', borderRadius: 999, padding: 4, marginBottom: 14 }}>
        <button onClick={() => setTab('breathe')} style={{ flex: 1, border: 'none', borderRadius: 999, padding: '9px', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: tab === 'breathe' ? 'var(--card)' : 'transparent', color: tab === 'breathe' ? 'var(--forest)' : 'var(--muted)', boxShadow: tab === 'breathe' ? '0 1px 4px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>🫁 Breathing</button>
        <button onClick={() => setTab('game')} style={{ flex: 1, border: 'none', borderRadius: 999, padding: '9px', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer', background: tab === 'game' ? 'var(--card)' : 'transparent', color: tab === 'game' ? 'var(--forest)' : 'var(--muted)', boxShadow: tab === 'game' ? '0 1px 4px rgba(0,0,0,.08)' : 'none', transition: 'all .15s' }}>🫀 Memory</button>
      </div>
      {tab === 'breathe' ? <Breathe /> : <Suspense fallback={<div className="center" style={{ minHeight: 160 }}><div className="spinner" /></div>}><TileGame /></Suspense>}
    </>
  );
}

import { useEffect, useRef, useState } from 'react';
import StudyTimer from '../components/StudyTimer.jsx';
import TileGame from '../components/TileGame.jsx';
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
      <div style={{ background: 'var(--section-hero)', color: '#fff', padding: '18px 20px 30px' }}>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>Focus ☕</h1>
        <p style={{ fontSize: 12.5, opacity: 0.85, marginTop: 5, lineHeight: 1.45 }}>
          Set a block, tap the box for full-screen, and guard it like an exam hall.
        </p>
      </div>
      <div style={{ background: 'var(--paper)', borderRadius: '26px 26px 0 0', marginTop: -18, position: 'relative', padding: '18px 16px', minHeight: '64vh' }}>
        <StudyTimer />
        <TakeABreak />
      </div>
    </div>
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
      {tab === 'breathe' ? <Breathe /> : <TileGame />}
    </>
  );
}

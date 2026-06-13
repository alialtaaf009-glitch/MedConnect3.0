import { useEffect, useRef, useState } from 'react';
import StudyTimer from '../components/StudyTimer.jsx';


// anatomical minimal lungs that inflate on inhale, deflate on exhale (box-breathing)
function Lungs({ grow, size = 120 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none"
      style={{ transformOrigin: 'center', transition: 'transform 3.9s ease-in-out', transform: grow ? 'scale(1)' : 'scale(0.55)', filter: 'drop-shadow(0 8px 18px rgba(168,68,42,.22))' }}>
      <path d="M50 18 v34" stroke="var(--rust)" strokeWidth="4" strokeLinecap="round" />
      <path d="M50 22 q-3 -8 -10 -8" stroke="var(--rust)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M50 22 q3 -8 10 -8" stroke="var(--rust)" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M44 30 C28 32 20 48 22 68 C23 80 32 84 39 80 C45 76 46 66 46 56 C46 44 46 34 44 30 Z" fill="var(--rust)" fillOpacity="0.18" stroke="var(--rust)" strokeWidth="3.2" strokeLinejoin="round" />
      <path d="M56 30 C72 32 80 48 78 68 C77 80 68 84 61 80 C55 76 54 66 54 56 C54 44 54 34 56 30 Z" fill="var(--rust)" fillOpacity="0.18" stroke="var(--rust)" strokeWidth="3.2" strokeLinejoin="round" />
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
  const LABELS = ['Breathe in…', 'Hold…', 'Breathe out…', 'Hold…'];
  const grow = on && (phase === 0 || phase === 1); // big through inhale + hold

  if (big) {
    return (
      <div onClick={() => { setBig(false); setOn(false); }} style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer', animation: 'fadeUp .3s ease both' }}>
        <div className="voice" style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 8 }}>60 seconds of calm. No side effects.</div>
        <Lungs grow={grow} size={180} />
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--forest)', marginTop: 18 }}>{on ? LABELS[phase] : 'Tap to begin'}</div>
        {on ? <div className="sub" style={{ marginTop: 4 }}>{left}s left · tap anywhere to stop</div>
            : <button className="btn" style={{ marginTop: 16, maxWidth: 200 }} onClick={(e) => { e.stopPropagation(); setOn(true); }}>Start</button>}
      </div>
    );
  }

  return (
    <>
    <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0 16px' }} />
    <div className="card tint-green" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700, position: 'relative' }}>Take a break
        <span onClick={() => setBig(true)} style={{ position: 'absolute', right: 0, top: 0, fontSize: 17, fontWeight: 700, color: 'var(--subtle)', cursor: 'pointer', lineHeight: 1 }}>›</span>
      </div>
      <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>60 seconds of calm. No side effects.</p>
      <p className="sub" style={{ fontSize: 11, marginTop: 2 }}>
        Box breathing — in 4, hold 4, out 4, hold 4.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center' }}><Lungs grow={grow} size={120} /></div>
      {on ? (
        <>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--forest)' }}>{LABELS[phase]}</div>
          <div className="sub" style={{ fontSize: 11, marginTop: 2 }}>{left}s left · tap to stop</div>
          <button className="btn ghost" style={{ marginTop: 10, maxWidth: 160, margin: '10px auto 0' }} onClick={() => setOn(false)}>Stop</button>
        </>
      ) : (
        <button className="btn" style={{ maxWidth: 200, margin: '0 auto' }} onClick={() => setOn(true)}>Start breathing</button>
      )}
    </div>
    </>
  );
}

export default function Focus() {
  return (
    <div className="screen">
      <h1 className="h1">Focus ☕</h1>
      <p className="voice sub" style={{ marginBottom: 16, fontSize: 14.5 }}>
        Coffee in hand? Good. Set a block, tap the box for full-screen, and guard it like an exam hall.
      </p>
      <StudyTimer />
      <Breathe />
    </div>
  );
}

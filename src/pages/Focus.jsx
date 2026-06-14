import { useEffect, useRef, useState } from 'react';
import StudyTimer from '../components/StudyTimer.jsx';


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
  const LABELS = ['Breathe in…', 'Hold…', 'Breathe out…', 'Hold…'];
  const grow = on && (phase === 0 || phase === 1); // big through inhale + hold

  if (big) {
    return (
      <div onClick={() => { setBig(false); setOn(false); }} style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer', animation: 'fadeUp .2s ease-out both' }}>
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
    <div className="card tint-green" onClick={() => !on && setBig(true)} style={{ textAlign: 'center', cursor: 'pointer' }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Take a break</div>
      <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>60 seconds of calm. No side effects.</p>
      <p className="sub" style={{ fontSize: 11, marginTop: 2 }}>
        Box breathing — in 4, hold 4, out 4, hold 4.
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

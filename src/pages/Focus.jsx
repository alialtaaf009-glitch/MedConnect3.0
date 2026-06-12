import { useEffect, useRef, useState } from 'react';
import StudyTimer from '../components/StudyTimer.jsx';

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

  const LABELS = ['Breathe in…', 'Hold…', 'Breathe out…', 'Hold…'];
  const grow = on && (phase === 0 || phase === 1); // big through inhale + hold

  return (
    <>
    <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0 16px' }} />
    <div className="card tint-gold" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 15, fontWeight: 700 }}>Take a break</div>
      <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>60 seconds of calm. No side effects.</p>
      <p className="sub" style={{ fontSize: 11, marginTop: 2 }}>
        Box breathing — in 4, hold 4, out 4, hold 4.
      </p>
      <div className="breathe-ball" style={{ transform: grow ? 'scale(1)' : 'scale(0.42)' }} />
      {on ? (
        <>
          <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--forest)' }}>{LABELS[phase]}</div>
          <div className="sub" style={{ fontSize: 11, marginTop: 2 }}>{left}s left · tap to stop</div>
          <button className="btn ghost" style={{ marginTop: 10, maxWidth: 160 }} onClick={() => setOn(false)}>Stop</button>
        </>
      ) : (
        <button className="btn" style={{ maxWidth: 200 }} onClick={() => setOn(true)}>Start breathing</button>
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

import { useState } from 'react';
import { useTimer, SOUNDS, playSound } from '../context/Timer.jsx';

function haptic(ms = 25) {
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {}
}

// progress ring (SVG). frac = 0..1 filled.
function Ring({ frac, size, danger, children }) {
  const stroke = size < 200 ? 11 : 14;
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--paper-2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={danger ? 'var(--rust)' : 'var(--forest)'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          style={{ transition: 'stroke-dashoffset .3s linear, stroke .3s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

export default function StudyTimer() {
  const t = useTimer();
  const [fullscreen, setFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');
  if (!t) return null;

  const onStartPause = () => { haptic(18); t.startPause(); };
  const onReset = () => { haptic(22); t.reset(); };
  const onPreset = (m) => { haptic(12); t.pickPreset(m); };
  const onSwitchMode = (m) => { haptic(12); t.switchMode(m); };
  const onPickSound = (key) => { haptic(12); t.setSound(key); playSound(key); };

  const shown = t.mode === 'timer' ? t.secondsLeft : t.elapsed;
  const mm = String(Math.floor(shown / 60)).padStart(2, '0');
  const ss = String(shown % 60).padStart(2, '0');
  const danger = t.done || (t.mode === 'timer' && t.secondsLeft < 60 && t.running);

  const frac = t.mode === 'timer'
    ? (t.target ? t.secondsLeft / t.target : 0)
    : (t.elapsed % 60) / 60;

  const startLabel = t.running ? 'Pause'
    : (t.mode === 'timer' && t.secondsLeft < t.target) || (t.mode === 'stopwatch' && t.elapsed > 0) ? 'Resume' : 'Start';

  const applyCustom = () => {
    const v = parseInt(custom, 10);
    if (v > 0) { haptic(12); t.setCustomMinutes(v); }
    setEditing(false); setCustom('');
  };

  const ModeTabs = () => (
    <div className="tabs" style={{ marginBottom: 18, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
      <button className={`tab ${t.mode === 'timer' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchMode('timer'); }}>Timer</button>
      <button className={`tab ${t.mode === 'stopwatch' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); onSwitchMode('stopwatch'); }}>Stopwatch</button>
    </div>
  );

  const ClockFace = ({ big }) => {
    const fs = big ? 'min(15vw, 64px)' : 44;
    if (editing && t.mode === 'timer') {
      return (
        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <input autoFocus className="input" type="number" min="1" placeholder="min" value={custom}
            onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyCustom(); }}
            style={{ marginBottom: 0, width: 90, textAlign: 'center', fontSize: 22, fontFamily: "'Fraunces',serif" }} />
          <button className="btn-sm" onClick={applyCustom}>Set</button>
        </div>
      );
    }
    return (
      <div onClick={(e) => { if (t.mode === 'timer' && !t.running) { e.stopPropagation(); setEditing(true); setCustom(String(Math.round(t.target / 60))); } }}
        style={{ cursor: t.mode === 'timer' && !t.running ? 'pointer' : 'default', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: fs, fontWeight: 700, color: danger ? 'var(--rust)' : 'var(--forest)', lineHeight: 1, letterSpacing: 1 }}>
          {mm}:{ss}
        </div>
        <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>
          {t.done ? 'done' : t.running ? 'focus' : t.mode === 'timer' ? 'tap to set' : 'stopwatch'}
        </div>
      </div>
    );
  };

  const Controls = ({ big }) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: big ? 30 : 20 }} onClick={(e) => e.stopPropagation()}>
      <button className="btn" style={{ flex: 1, maxWidth: big ? 200 : 150 }} onClick={onStartPause}>{startLabel}</button>
      <button className="btn ghost" style={{ flex: 1, maxWidth: big ? 140 : 110 }} onClick={onReset}>Reset</button>
    </div>
  );

  if (fullscreen) {
    const fsSize = Math.min(300, (typeof window !== 'undefined' ? window.innerWidth : 360) - 80);
    return (
      <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, animation: 'fadeUp .3s cubic-bezier(0.34, 1.56, 0.64, 1) both', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'calc(env(safe-area-inset-top, 0px) + 60px) 24px calc(env(safe-area-inset-bottom, 0px) + 40px)', cursor: 'pointer' }}>
        <ModeTabs />
        <Ring frac={frac} size={fsSize} danger={danger}>
          <ClockFace big={true} />
        </Ring>
        {t.done && <div style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 18, marginTop: 16 }}>Time's up! 🎉</div>}
        <Controls big={true} />
        <p className="sub" style={{ fontSize: 12, marginTop: 26 }}>Tap anywhere to exit full-screen</p>
      </div>
    );
  }

  return (
    <div className="card" onClick={() => setFullscreen(true)} style={{ marginBottom: 18, textAlign: 'center', borderColor: 'var(--forest)', minHeight: 280, cursor: 'pointer' }}>
      <ModeTabs />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <Ring frac={frac} size={180} danger={danger}>
          <ClockFace big={false} />
        </Ring>
        {t.mode === 'timer' && !editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            {[25, 45, 60].map((m) => (
              <button key={m} className={`chip ${t.target === m * 60 ? 'on' : ''}`} style={{ minWidth: 62 }} onClick={() => onPreset(m)}>{m} min</button>
            ))}
          </div>
        )}
      </div>

      <Controls big={false} />

      <div style={{ marginTop: 14 }} onClick={(e) => e.stopPropagation()}>
        <span className="sub" style={{ fontSize: 11, marginRight: 6 }}>Sound:</span>
        {Object.entries(SOUNDS).map(([key, s]) => (
          <button key={key} className={`chip ${t.sound === key ? 'on' : ''}`} style={{ fontSize: 11, padding: '4px 10px', marginRight: 4 }} onClick={() => onPickSound(key)}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}

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
  const [showOptions, setShowOptions] = useState(false);
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

  // idle = not running AND not yet started (fresh). active = running or paused mid-session.
  const started = t.running || (t.mode === 'timer' && t.secondsLeft < t.target) || (t.mode === 'stopwatch' && t.elapsed > 0);

  const Controls = ({ big }) => (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: big ? 30 : 20, minHeight: big ? 58 : 50, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
      {!started ? (
        <button className="btn" style={{ maxWidth: big ? 220 : 180, padding: big ? '16px 52px' : '14px 44px' }} onClick={onStartPause}>Start</button>
      ) : (
        <div key="active-controls" style={{ display: 'flex', gap: 12, justifyContent: 'center' }} className="timer-reveal-once">
          <button className="btn" style={{ maxWidth: big ? 170 : 140, padding: big ? '14px 34px' : '13px 28px' }} onClick={onStartPause}>{t.running ? 'Pause' : 'Resume'}</button>
          <button className="btn ghost" style={{ maxWidth: big ? 130 : 110, padding: big ? '14px 28px' : '13px 24px' }} onClick={onReset}>Reset</button>
        </div>
      )}
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
        {t.done && <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}><span className="heart-beat" style={{ fontSize: 30 }}>🫀</span><span style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 18 }}>Time's up!</span></div>}
        <Controls big={true} />
        <p className="sub" style={{ fontSize: 12, marginTop: 26 }}>Tap anywhere to exit full-screen</p>
      </div>
    );
  }

  return (
    <div className="card" onClick={() => setFullscreen(true)} style={{ marginBottom: 18, textAlign: 'center', borderColor: 'var(--forest)', minHeight: 280, cursor: 'pointer' }}>
      <ModeTabs />

      <Ring frac={frac} size={190} danger={danger}>
        <ClockFace big={false} />
      </Ring>

      <Controls big={false} />

      {/* collapsible options — keeps the clock minimal by default */}
      {!started && (
        <div style={{ marginTop: 16 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowOptions((s) => !s)} className="link" style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            {showOptions ? 'Hide options ▴' : '⚙ Options ▾'}
          </button>
          {showOptions && (
            <div style={{ marginTop: 12, animation: 'fadeUp .25s ease both' }}>
              {t.mode === 'timer' && (
                <>
                  <div className="sub" style={{ fontSize: 11, marginBottom: 6 }}>Length</div>
                  <div className="chips" style={{ justifyContent: 'center', marginBottom: 14 }}>
                    {[25, 45, 60].map((m) => (
                      <button key={m} className={`chip ${t.target === m * 60 ? 'on' : ''}`} onClick={() => onPreset(m)}>{m} min</button>
                    ))}
                  </div>
                </>
              )}
              <div className="sub" style={{ fontSize: 11, marginBottom: 6 }}>Alarm sound</div>
              <div className="chips" style={{ justifyContent: 'center' }}>
                {Object.entries(SOUNDS).map(([key, s]) => (
                  <button key={key} className={`chip ${t.sound === key ? 'on' : ''}`} onClick={() => onPickSound(key)}>{s.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

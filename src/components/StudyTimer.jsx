import { useState } from 'react';
import { useTimer, SOUNDS, playSound } from '../context/Timer.jsx';

// ---- Study timer (Pomodoro): consumes the app-wide Timer context so it survives tab switches ----
export default function StudyTimer() {
  const t = useTimer();
  const [custom, setCustom] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  if (!t) return null;

  const shown = t.mode === 'timer' ? t.secondsLeft : t.elapsed;
  const mm = String(Math.floor(shown / 60)).padStart(2, '0');
  const ss = String(shown % 60).padStart(2, '0');

  const startLabel = t.running ? 'Pause'
    : (t.mode === 'timer' && t.secondsLeft < t.target) || (t.mode === 'stopwatch' && t.elapsed > 0) ? 'Resume' : 'Start';

  const ModeTabs = () => (
    <div className="tabs" style={{ marginBottom: 12, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
      <button className={`tab ${t.mode === 'timer' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); t.switchMode('timer'); }}>Timer</button>
      <button className={`tab ${t.mode === 'stopwatch' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); t.switchMode('stopwatch'); }}>Stopwatch</button>
    </div>
  );
  const Controls = ({ big }) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: big ? 28 : 4 }} onClick={(e) => e.stopPropagation()}>
      <button className="btn" style={{ flex: 1, maxWidth: big ? 200 : 150 }} onClick={t.startPause}>{startLabel}</button>
      <button className="btn ghost" style={{ flex: 1, maxWidth: big ? 140 : 110 }} onClick={t.reset}>Reset</button>
    </div>
  );

  // ---- Full-screen distraction-free view (tap anywhere to exit) ----
  if (fullscreen) {
    return (
      <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}>
        <button className="link" style={{ position: 'absolute', top: 18, right: 20, fontSize: 15 }} onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}>✕ Close</button>
        <ModeTabs />
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 96, fontWeight: 900, color: t.done ? 'var(--rust)' : 'var(--forest)', lineHeight: 1, letterSpacing: 2 }}>
          {mm}:{ss}
        </div>
        {t.done && <div style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 18, marginTop: 10 }}>Time's up! 🎉</div>}
        <Controls big={true} />
        <p className="sub" style={{ fontSize: 12, marginTop: 26 }}>Tap anywhere to exit full-screen</p>
      </div>
    );
  }

  return (
    <div className="card" onClick={() => setFullscreen(true)} style={{ marginBottom: 18, textAlign: 'center', borderColor: 'var(--forest)', minHeight: 280, cursor: 'pointer' }}>
      <ModeTabs />

      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 52, fontWeight: 900, color: t.done ? 'var(--rust)' : 'var(--forest)', lineHeight: 1.1, letterSpacing: 1 }}>
        {mm}:{ss}
      </div>
      {t.done && <div style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>Time's up! 🎉</div>}

      {t.mode === 'timer' && (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="chips" style={{ justifyContent: 'center', marginTop: 10, marginBottom: 8 }}>
            {[25, 45, 60].map((m) => (
              <button key={m} className={`chip ${t.target === m * 60 ? 'on' : ''}`} onClick={() => t.pickPreset(m)}>{m} min</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            <input className="input" style={{ marginBottom: 0, width: 110, textAlign: 'center' }} type="number" min="1" placeholder="Custom" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button className="btn-sm" onClick={() => { t.setCustomMinutes(parseInt(custom, 10)); }}>Set</button>
          </div>
        </div>
      )}

      {t.mode === 'stopwatch' && <div style={{ height: 12 }} />}

      <Controls big={false} />

      <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
        <span className="sub" style={{ fontSize: 11, marginRight: 6 }}>Sound:</span>
        {Object.entries(SOUNDS).map(([key, s]) => (
          <button key={key} className={`chip ${t.sound === key ? 'on' : ''}`} style={{ fontSize: 11, padding: '4px 10px', marginRight: 4 }} onClick={() => { t.setSound(key); playSound(key); }}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}


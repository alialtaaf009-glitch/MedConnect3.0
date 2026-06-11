import { createContext, useContext, useEffect, useRef, useState } from 'react';

const TimerCtx = createContext(null);

// Sound options — all synthesized via Web Audio (no files needed)
export const SOUNDS = {
  beep:  { label: 'Beep',  freq: 880, type: 'sine',     dur: 0.6 },
  chime: { label: 'Chime', freq: 1318, type: 'triangle', dur: 0.9 },
  bell:  { label: 'Bell',  freq: 660, type: 'square',   dur: 0.5 },
};

export function playSound(key) {
  const s = SOUNDS[key] || SOUNDS.beep;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = s.type; o.frequency.value = s.freq;
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s.dur);
    o.start(); o.stop(ctx.currentTime + s.dur);
    // a second little ring for chime/bell
    if (key !== 'beep') {
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.connect(g2); g2.connect(ctx.destination);
      o2.type = s.type; o2.frequency.value = s.freq * 1.5;
      g2.gain.setValueAtTime(0.001, ctx.currentTime + 0.25);
      g2.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.27);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25 + s.dur);
      o2.start(ctx.currentTime + 0.25); o2.stop(ctx.currentTime + 0.25 + s.dur);
    }
  } catch (e) {}
}

export function TimerProvider({ children }) {
  const [mode, setMode] = useState('timer');         // 'timer' | 'stopwatch'
  const [target, setTarget] = useState(25 * 60);     // chosen timer length
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sound, setSound] = useState(localStorage.getItem('timer_sound') || 'beep');
  const intervalRef = useRef(null);

  useEffect(() => { localStorage.setItem('timer_sound', sound); }, [sound]);

  // single app-level ticker — keeps running regardless of which screen is mounted
  useEffect(() => {
    if (!running) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (mode === 'timer') {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setDone(true);
            playSound(sound);
            return 0;
          }
          return s - 1;
        });
      } else {
        setElapsed((e) => e + 1);
      }
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode, sound]);

  const pickPreset = (min) => { setRunning(false); setDone(false); setTarget(min * 60); setSecondsLeft(min * 60); };
  const setCustomMinutes = (min) => {
    if (!min || min < 1) return;
    setRunning(false); setDone(false); setTarget(min * 60); setSecondsLeft(min * 60);
  };
  const startPause = () => { setDone(false); setRunning((r) => !r); };
  const reset = () => {
    setRunning(false); setDone(false);
    if (mode === 'timer') setSecondsLeft(target);
    else setElapsed(0);
  };
  const switchMode = (m) => {
    setRunning(false); setDone(false); setMode(m);
    if (m === 'timer') setSecondsLeft(target); else setElapsed(0);
  };

  return (
    <TimerCtx.Provider value={{
      mode, target, secondsLeft, elapsed, running, done, sound,
      setSound, pickPreset, setCustomMinutes, startPause, reset, switchMode,
    }}>
      {children}
    </TimerCtx.Provider>
  );
}

export const useTimer = () => useContext(TimerCtx);


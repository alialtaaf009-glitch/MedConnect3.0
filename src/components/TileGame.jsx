import { useEffect, useRef, useState } from 'react';
import { useBack } from '../context/Back.jsx';

// 🫀 Memory Match — find matching medical emoji pairs.
// Same pattern as Breathe: inline on the card, tap to expand to fullscreen.

const EMOJIS = ['🫀', '🫁', '🧠', '🦴', '🩺', '💊', '🩸', '🧬', '🩹', '💉', '🧪', '🔬'];

function makeBoard(pairCount) {
  const picked = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const tiles = [];
  picked.forEach((e, i) => {
    tiles.push({ id: i * 2, emoji: e, matched: false, flipped: false });
    tiles.push({ id: i * 2 + 1, emoji: e, matched: false, flipped: false });
  });
  return tiles.sort(() => Math.random() - 0.5);
}

export default function TileGame() {
  const [tiles, setTiles] = useState(() => makeBoard(8));
  const [picked, setPicked] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [won, setWon] = useState(false);
  const lock = useRef(false);

  const [bestMoves, setBestMoves] = useState(() => { try { return parseInt(localStorage.getItem('tiles_best_moves') || '0', 10); } catch (e) { return 0; } });
  const [bestTime,  setBestTime]  = useState(() => { try { return parseInt(localStorage.getItem('tiles_best_time')  || '0', 10); } catch (e) { return 0; } });

  const [big, setBig] = useState(false);
  const { enterImmersive, exitImmersive } = useBack();
  useEffect(() => { if (big) { enterImmersive(); return () => exitImmersive(); } }, [big, enterImmersive, exitImmersive]);

  useEffect(() => {
    if (!running || won) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, won]);

  useEffect(() => {
    if (tiles.every((t) => t.matched) && !won && moves > 0) {
      setWon(true); setRunning(false);
      try {
        if (bestMoves === 0 || moves < bestMoves) { localStorage.setItem('tiles_best_moves', String(moves)); setBestMoves(moves); }
        if (bestTime === 0  || seconds < bestTime)  { localStorage.setItem('tiles_best_time',  String(seconds)); setBestTime(seconds); }
      } catch (e) {}
    }
  }, [tiles, won, moves, seconds, bestMoves, bestTime]);

  const reset = () => {
    setTiles(makeBoard(8)); setPicked([]); setMoves(0); setSeconds(0); setWon(false); setRunning(false); lock.current = false;
  };

  const flip = (i) => {
    if (lock.current) return;
    if (tiles[i].matched || tiles[i].flipped) return;
    if (!running) setRunning(true);
    const nextTiles = tiles.map((t, idx) => idx === i ? { ...t, flipped: true } : t);
    const nextPicked = [...picked, i];
    setTiles(nextTiles); setPicked(nextPicked);
    if (nextPicked.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextPicked;
      if (nextTiles[a].emoji === nextTiles[b].emoji) {
        setTimeout(() => {
          setTiles((cur) => cur.map((t, idx) => (idx === a || idx === b) ? { ...t, matched: true } : t));
          setPicked([]);
        }, 320);
      } else {
        lock.current = true;
        setTimeout(() => {
          setTiles((cur) => cur.map((t, idx) => (idx === a || idx === b) ? { ...t, flipped: false } : t));
          setPicked([]);
          lock.current = false;
        }, 720);
      }
    }
  };

  const Cell = ({ t, i, size }) => (
    <div onClick={(e) => { e.stopPropagation(); flip(i); }}
      className={`tile-cell ${t.matched ? 'matched' : (t.flipped ? '' : 'face-down')}`}
      style={{ width: size, height: size, fontSize: typeof size === 'number' ? Math.round(size * 0.5) : '1.7em' }}>
      {(t.flipped || t.matched) ? t.emoji : ''}
    </div>
  );

  const Stats = ({ inline }) => (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: inline ? 11.5 : 13, color: 'var(--muted)', fontWeight: 600, marginTop: inline ? 4 : 0, marginBottom: inline ? 0 : 12 }}>
      <span>⏱ {seconds}s</span>
      <span>🎯 {moves}</span>
      {!inline && bestMoves > 0 && <span style={{ opacity: 0.8 }}>★ {bestMoves}m · {bestTime}s</span>}
    </div>
  );

  if (big) {
    const cols = 4;
    const gap = 10;
    const boardArea = `min(calc(100vw - 32px), calc(100vh - 200px))`;
    const cellSize = `calc((${boardArea} - ${(cols - 1) * gap}px) / ${cols})`;

    return (
      <div className="fs-open" style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, display: 'flex', flexDirection: 'column', padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
        <TileStyles />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={reset} className="bouncy" style={{ background: 'transparent', border: '1.5px solid var(--line)', color: 'var(--ink)', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Restart</button>
          <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 800, color: 'var(--forest)' }}>Memory Match</div>
          <button onClick={() => setBig(false)} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', width: 34, height: 34, borderRadius: 999, opacity: 0.5 }}>✕</button>
        </div>

        <Stats inline={false} />

        <div style={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cellSize})`, gap }}>
            {tiles.map((t, i) => <Cell key={t.id} t={t} i={i} size={cellSize} />)}
          </div>
        </div>

        {won && <WinModal moves={moves} seconds={seconds} bestMoves={bestMoves} bestTime={bestTime} onReset={reset} onClose={() => { setBig(false); reset(); }} />}
      </div>
    );
  }

  const inlineCell = 52;
  return (
    <div className="card tint-green" onClick={() => setBig(true)} style={{ textAlign: 'center', cursor: 'pointer' }}>
      <TileStyles />
      <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>A 60-second brain reset. Find the pairs.</p>
      <p className="sub" style={{ fontSize: 11, marginTop: 2 }}>Tap tiles to play · tap card edges for full-screen</p>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(4, ${inlineCell}px)`, gap: 8, justifyContent: 'center', margin: '12px auto 6px' }}
        onClick={(e) => e.stopPropagation()}>
        {tiles.map((t, i) => <Cell key={t.id} t={t} i={i} size={inlineCell} />)}
      </div>

      <Stats inline={true} />

      {won ? (
        <div onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--forest)', marginTop: 8 }}>🎉 Matched! {moves} moves · {seconds}s</div>
          <button className="btn ghost bouncy" style={{ marginTop: 8, maxWidth: 160, margin: '8px auto 0' }} onClick={(e) => { e.stopPropagation(); reset(); }}>Play again</button>
        </div>
      ) : (
        bestMoves > 0 && <p className="sub" style={{ fontSize: 10.5, marginTop: 4, opacity: 0.75 }}>Best: {bestMoves} moves · {bestTime}s</p>
      )}
    </div>
  );
}

function WinModal({ moves, seconds, bestMoves, bestTime, onReset, onClose }) {
  const newBest = (moves === bestMoves || seconds === bestTime);
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(31, 77, 63, 0.78)', display: 'grid', placeItems: 'center', padding: 24, zIndex: 5 }}>
      <div style={{ background: 'var(--card)', borderRadius: 18, padding: '28px 22px', textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <div style={{ fontSize: 46, marginBottom: 4 }}>🎉</div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 900, color: 'var(--forest)', marginBottom: 4 }}>Matched!</div>
        <p className="sub" style={{ fontSize: 13.5, marginBottom: 16 }}>{moves} moves · {seconds}s</p>
        {newBest && <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginBottom: 12 }}>⭐ New best!</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onReset} className="btn bouncy" style={{ flex: 1, background: 'var(--forest)' }}>Play again</button>
          <button onClick={onClose} className="btn ghost bouncy" style={{ padding: '11px 16px' }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function TileStyles() {
  return (
    <style>{`
      .tile-cell {
        border-radius: 12px;
        background: var(--card);
        border: 1.5px solid var(--line);
        display: grid; place-items: center;
        cursor: pointer; user-select: none;
        line-height: 1;
        transition: transform .18s, opacity .25s, background .2s;
      }
      .tile-cell:active { transform: scale(0.94); }
      .tile-cell.face-down { background: var(--forest); border-color: var(--forest); color: transparent; }
      .tile-cell.face-down::after { content: '🩺'; opacity: 0.18; font-size: 0.55em; }
      .tile-cell.matched { opacity: 0.5; background: #d9e6dd; border-color: var(--forest); }
      [data-theme="dark"] .tile-cell.matched { background: #234034; }
    `}</style>
  );
}

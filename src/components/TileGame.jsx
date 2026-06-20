import { useEffect, useRef, useState } from 'react';
import { useBack } from '../context/Back.jsx';

// 🫀 Memory Match — flip tiles, find matching medical emoji pairs.
// Card visual matches Breathe (tint-green) so the two break options blend.

const EMOJIS = ['🫀', '🫁', '🧠', '🦴', '🩺', '💊', '🩸', '🧬', '🩹', '💉', '🧪', '🔬'];

// Pick N pairs at random, return shuffled array of 2N tiles
function makeBoard(pairs) {
  const picked = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairs);
  const tiles = [];
  picked.forEach((e, i) => {
    tiles.push({ id: i * 2, emoji: e, matched: false, flipped: false });
    tiles.push({ id: i * 2 + 1, emoji: e, matched: false, flipped: false });
  });
  return tiles.sort(() => Math.random() - 0.5);
}

export default function TileGame() {
  const [open, setOpen] = useState(false);
  const [bestMoves, setBestMoves] = useState(() => { try { return parseInt(localStorage.getItem('tiles_best_moves') || '0', 10); } catch (e) { return 0; } });
  const [bestTime, setBestTime] = useState(() => { try { return parseInt(localStorage.getItem('tiles_best_time') || '0', 10); } catch (e) { return 0; } });

  return (
    <>
      <div className="card tint-green" onClick={() => setOpen(true)} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <p className="voice sub" style={{ fontSize: 14, marginTop: 2 }}>A 60-second brain reset. Find the matching pairs.</p>
        <div style={{ fontSize: 28, margin: '8px 0 2px', letterSpacing: 4 }}>🫀 🫁 🧠</div>
        {(bestMoves > 0 || bestTime > 0) && (
          <p className="sub" style={{ fontSize: 11, marginTop: 4 }}>
            Best: {bestMoves > 0 ? `${bestMoves} moves` : ''}{bestMoves > 0 && bestTime > 0 ? ' · ' : ''}{bestTime > 0 ? `${bestTime}s` : ''}
          </p>
        )}
        <button className="btn" style={{ maxWidth: 220, margin: '12px auto 0' }}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
          ⛶ Play fullscreen
        </button>
      </div>
      {open && <TileOverlay
        onClose={() => setOpen(false)}
        bestMoves={bestMoves}
        bestTime={bestTime}
        onBestMoves={(m) => setBestMoves(m)}
        onBestTime={(t) => setBestTime(t)}
      />}
    </>
  );
}

function TileOverlay({ onClose, bestMoves, bestTime, onBestMoves, onBestTime }) {
  const [tiles, setTiles] = useState(() => makeBoard(8));    // 16 tiles, 4×4
  const [picked, setPicked] = useState([]);                  // up to 2 indexes
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [won, setWon] = useState(false);
  const lock = useRef(false);
  const { enterImmersive, exitImmersive } = useBack();

  useEffect(() => { enterImmersive(); return () => exitImmersive(); }, [enterImmersive, exitImmersive]);

  // timer
  useEffect(() => {
    if (won) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [won]);

  const reset = () => {
    setTiles(makeBoard(8)); setPicked([]); setMoves(0); setSeconds(0); setWon(false); lock.current = false;
  };

  const flip = (i) => {
    if (lock.current) return;
    if (tiles[i].matched || tiles[i].flipped) return;
    const nextTiles = tiles.map((t, idx) => idx === i ? { ...t, flipped: true } : t);
    const nextPicked = [...picked, i];
    setTiles(nextTiles);
    setPicked(nextPicked);

    if (nextPicked.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = nextPicked;
      if (nextTiles[a].emoji === nextTiles[b].emoji) {
        // match
        setTimeout(() => {
          setTiles((cur) => cur.map((t, idx) => (idx === a || idx === b) ? { ...t, matched: true } : t));
          setPicked([]);
        }, 350);
      } else {
        // miss
        lock.current = true;
        setTimeout(() => {
          setTiles((cur) => cur.map((t, idx) => (idx === a || idx === b) ? { ...t, flipped: false } : t));
          setPicked([]);
          lock.current = false;
        }, 750);
      }
    }
  };

  // detect win
  useEffect(() => {
    if (tiles.every((t) => t.matched) && !won) {
      setWon(true);
      // save bests
      try {
        if (bestMoves === 0 || moves < bestMoves) { localStorage.setItem('tiles_best_moves', String(moves)); onBestMoves(moves); }
        if (bestTime === 0 || seconds < bestTime) { localStorage.setItem('tiles_best_time', String(seconds)); onBestTime(seconds); }
      } catch (e) {}
    }
  }, [tiles, won, moves, seconds, bestMoves, bestTime, onBestMoves, onBestTime]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 4000,
      background: 'var(--tile-bg, #eaf1ec)',
      display: 'flex', flexDirection: 'column',
      padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px)',
    }}>
      <style>{`
        [data-theme="dark"] .tile-overlay-bg { background: #16241c; }
        .tile-cell {
          aspect-ratio: 1;
          border-radius: 14px;
          background: var(--card);
          border: 1.5px solid var(--line);
          display: grid; place-items: center;
          cursor: pointer; user-select: none;
          font-size: clamp(28px, 8vw, 44px);
          transition: transform .2s, background .2s, opacity .2s;
        }
        .tile-cell:active { transform: scale(0.95); }
        .tile-cell.face-down { background: var(--forest); color: var(--forest); border-color: var(--forest); }
        .tile-cell.face-down::after { content: '🩺'; font-size: clamp(18px, 5vw, 28px); opacity: 0.18; color: #fff; }
        .tile-cell.matched { opacity: 0.45; border-color: var(--forest); background: #d9e6dd; }
        [data-theme="dark"] .tile-cell.matched { background: #234034; }
      `}</style>
      <div className="tile-overlay-bg" style={{ position: 'absolute', inset: 0, background: '#eaf1ec', zIndex: -1 }} />

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={reset} style={{ background: 'transparent', border: '1.5px solid var(--line)', color: 'var(--ink)', borderRadius: 999, padding: '7px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>↻ Restart</button>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 800, color: 'var(--forest)' }}>Memory Match</div>
        <button onClick={onClose} aria-label="Close" style={{ background: 'transparent', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', width: 34, height: 34, borderRadius: 999, opacity: 0.55 }}>✕</button>
      </div>

      {/* stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 14, fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>
        <span>⏱ {seconds}s</span>
        <span>🎯 {moves} moves</span>
      </div>

      {/* board */}
      <div style={{
        flex: 1, display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '1fr',
        gap: 10, alignContent: 'center',
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        {tiles.map((t, i) => (
          <div key={t.id}
            className={`tile-cell ${t.matched ? 'matched' : (t.flipped ? '' : 'face-down')}`}
            onClick={() => flip(i)}>
            {(t.flipped || t.matched) && t.emoji}
          </div>
        ))}
      </div>

      {/* win overlay */}
      {won && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(31, 77, 63, 0.78)', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ background: 'var(--card)', borderRadius: 18, padding: '28px 22px', textAlign: 'center', maxWidth: 320, width: '100%' }}>
            <div style={{ fontSize: 46, marginBottom: 4 }}>🎉</div>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 900, color: 'var(--forest)', marginBottom: 4 }}>Matched!</div>
            <p className="sub" style={{ fontSize: 13.5, marginBottom: 16 }}>{moves} moves · {seconds}s</p>
            {(moves === bestMoves || seconds === bestTime) && (moves > 0) && (
              <p style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, marginBottom: 12 }}>⭐ New best!</p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={reset} className="btn bouncy" style={{ flex: 1, background: 'var(--forest)' }}>Play again</button>
              <button onClick={onClose} className="btn ghost bouncy" style={{ padding: '11px 16px' }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


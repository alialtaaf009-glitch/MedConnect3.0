import { useEffect, useRef, useState } from 'react';

// 🧬 DNA Pulse — a minimal, retina-sharp flappy break game.
// Card with a "Play fullscreen" launch; the game runs in a fullscreen overlay.
// Breathing and its own fullscreen are untouched — this is self-contained.

const THEME_COLORS = {
  light: { bg: '#fbfaf5', ink: '#16302a', helix: '#1f6f57', rung: '#c4502f', accent: '#b98a2e', glow: 'rgba(31,111,87,.25)' },
  dark: { bg: '#0e1512', ink: '#dff0e8', helix: '#3ea784', rung: '#e0764f', accent: '#d8a73e', glow: 'rgba(62,167,132,.35)' },
};

function isDark() {
  try { return document.documentElement.getAttribute('data-theme') === 'dark'; } catch (e) { return false; }
}

export default function DnaGame() {
  const [open, setOpen] = useState(false);
  const [best, setBest] = useState(() => { try { return parseInt(localStorage.getItem('dna_best') || '0', 10); } catch (e) { return 0; } });

  return (
    <>
      <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0 16px' }} />
      <div className="card" onClick={() => setOpen(true)} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>🧬 DNA Pulse</div>
          {best > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Best {best}</div>}
        </div>
        <p className="sub" style={{ fontSize: 12.5, marginTop: 2, textAlign: 'left' }}>
          A quick brain-break. Flap the capsule through the strands.
        </p>
        <button className="btn" style={{ maxWidth: 220, margin: '12px auto 0', background: 'var(--forest)' }}
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}>
          ⛶ Play fullscreen
        </button>
      </div>
      {open && <DnaOverlay onClose={() => setOpen(false)} onBest={(b) => setBest(b)} />}
    </>
  );
}

function DnaOverlay({ onClose, onBest }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    let bird, pipes, score, state;
    let GAP, PIPE_W, SPACING, SPEED, GRAV, FLAP;
    let best = 0;
    try { best = parseInt(localStorage.getItem('dna_best') || '0', 10); } catch (e) {}

    const colors = () => THEME_COLORS[isDark() ? 'dark' : 'light'];

    function fit() {
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const cssW = window.innerWidth, cssH = window.innerHeight;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      W = cssW; H = cssH;
      tune();
    }
    function tune() {
      GAP = Math.max(150, H * 0.30);
      PIPE_W = Math.max(46, W * 0.13);
      SPACING = Math.max(220, W * 0.66);
      SPEED = Math.max(2.4, W * 0.0072);
      GRAV = H * 0.00085 * 0.9 + 0.18;
      FLAP = -(H * 0.014 * 0.5 + 3.8);
      const bw = Math.max(36, W * 0.1);
      if (!bird) bird = { x: W * 0.26, y: H / 2, v: 0, w: bw, h: bw * 0.48 };
      else { bird.w = bw; bird.h = bw * 0.48; bird.x = W * 0.26; }
    }
    function mk(x) { const m = H * 0.12; const top = m + Math.random() * (H - GAP - m * 2); return { x, top, passed: false }; }
    function reset() { pipes = []; score = 0; state = 'ready'; for (let i = 0; i < 3; i++) pipes.push(mk(W + i * SPACING + W * 0.4)); }
    function flap() { if (state === 'ready') state = 'play'; if (state === 'dead') { reset(); return; } bird.v = FLAP; }

    function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

    function drawPill(cx, cy, w, h, rot) {
      const c = colors();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); const r = h / 2;
      ctx.shadowColor = c.glow; ctx.shadowBlur = 14;
      ctx.lineWidth = 2.8; ctx.strokeStyle = c.helix; ctx.fillStyle = c.bg;
      rr(-w / 2, -h / 2, w, h, r); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2); ctx.lineWidth = 2; ctx.strokeStyle = c.helix; ctx.stroke();
      ctx.fillStyle = c.rung; ctx.beginPath(); ctx.arc(-w / 4, 0, h * 0.16, 0, 7); ctx.fill();
      ctx.restore();
    }
    function dna(x, top, bot) {
      const c = colors(); const cx = x + PIPE_W / 2, amp = PIPE_W / 2 - 3;
      const strand = (y0, y1) => {
        ctx.lineCap = 'round';
        ctx.shadowColor = c.glow; ctx.shadowBlur = 8;
        ctx.strokeStyle = c.helix; ctx.lineWidth = 3;
        ctx.beginPath(); for (let py = y0; py < y1; py += 3) { const o = Math.sin(py * 0.085) * amp; py === y0 ? ctx.moveTo(cx + o, py) : ctx.lineTo(cx + o, py); } ctx.stroke();
        ctx.beginPath(); for (let py = y0; py < y1; py += 3) { const o = Math.sin(py * 0.085 + Math.PI) * amp; py === y0 ? ctx.moveTo(cx + o, py) : ctx.lineTo(cx + o, py); } ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = c.rung; ctx.lineWidth = 2.2;
        for (let py = y0 + 6; py < y1; py += 15) { const o = Math.sin(py * 0.085) * amp; ctx.beginPath(); ctx.moveTo(cx + o, py); ctx.lineTo(cx - o, py); ctx.stroke(); }
      };
      strand(-6, top); strand(bot, H + 6);
    }
    function draw() {
      const c = colors();
      ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
      pipes.forEach((p) => dna(p.x, p.top, p.top + GAP));
      drawPill(bird.x, bird.y, bird.w, bird.h, Math.max(-0.5, Math.min(0.8, bird.v * 0.05)));
      ctx.fillStyle = c.ink; ctx.font = '800 ' + Math.round(H * 0.07) + 'px Fraunces, serif'; ctx.textAlign = 'center';
      ctx.fillText(score, W / 2, H * 0.13);
      if (state === 'ready') { ctx.fillStyle = c.ink; ctx.globalAlpha = 0.7; ctx.font = '600 ' + Math.round(H * 0.028) + 'px Inter'; ctx.fillText('tap to start', W / 2, H / 2 - GAP * 0.4); ctx.globalAlpha = 1; }
      if (state === 'dead') {
        ctx.fillStyle = c.ink; ctx.globalAlpha = 0.08; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        ctx.fillStyle = c.ink; ctx.font = '800 ' + Math.round(H * 0.05) + 'px Fraunces, serif'; ctx.fillText('flatline', W / 2, H / 2 - 10);
        ctx.globalAlpha = 0.78; ctx.font = '600 ' + Math.round(H * 0.026) + 'px Inter';
        ctx.fillText('score ' + score + '  ·  best ' + best, W / 2, H / 2 + H * 0.04);
        ctx.fillText('tap to retry', W / 2, H / 2 + H * 0.08); ctx.globalAlpha = 1;
      }
    }
    function step() {
      if (state === 'play') {
        bird.v += GRAV; bird.y += bird.v;
        pipes.forEach((p) => {
          p.x -= SPEED;
          if (!p.passed && p.x + PIPE_W < bird.x) { p.passed = true; score++; if (score > best) { best = score; try { localStorage.setItem('dna_best', String(best)); } catch (e) {} onBest && onBest(best); } }
          if (bird.x + bird.w / 2 > p.x && bird.x - bird.w / 2 < p.x + PIPE_W) { if (bird.y - bird.h / 2 < p.top || bird.y + bird.h / 2 > p.top + GAP) state = 'dead'; }
        });
        if (pipes[0].x + PIPE_W < 0) { pipes.shift(); pipes.push(mk(pipes[pipes.length - 1].x + SPACING)); }
        if (bird.y + bird.h / 2 > H || bird.y - bird.h / 2 < 0) state = 'dead';
      }
      draw();
    }

    fit();
    reset();
    let raf;
    const loop = () => { step(); raf = requestAnimationFrame(loop); };
    loop();

    const onTap = (e) => { e.preventDefault(); flap(); };
    const onKey = (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); } };
    canvas.addEventListener('pointerdown', onTap);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', fit);
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('pointerdown', onTap); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'var(--paper)' }}>
      <button onClick={onClose} aria-label="Close game"
        style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 16, zIndex: 2, background: 'rgba(0,0,0,.28)', color: '#fff', border: 'none', borderRadius: 999, width: 40, height: 40, fontSize: 19, cursor: 'pointer' }}>✕</button>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', touchAction: 'manipulation' }} />
    </div>
  );
            }


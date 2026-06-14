import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QUOTES, quoteOfTheDay } from '../lib/quotes';
import { api } from '../lib/api';

export default function Motivation() {
  const nav = useNavigate();
  const today = quoteOfTheDay();
  const [favIds, setFavIds] = useState([]);
  const [tab, setTab] = useState('today');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getFavourites().then((d) => setFavIds(d.ids || [])).catch(() => {});
  }, []);

  const toggle = async (id) => {
    if (busy) return;
    setBusy(true);
    const isFav = favIds.includes(id);
    try {
      const d = await api.toggleFavourite(id, isFav ? 'remove' : 'add');
      setFavIds(d.ids || []);
    } catch (e) {} finally { setBusy(false); }
  };

  const Star = ({ id }) => {
    const on = favIds.includes(id);
    return (
      <button className="star-btn" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', display: 'inline-flex', alignItems: 'center' }} onClick={() => toggle(id)} aria-label={on ? 'Unfavourite' : 'Favourite'}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={on ? 'var(--gold)' : 'none'} stroke={on ? 'var(--gold)' : 'var(--subtle)'} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" style={{ display: 'block' }}>
          <path d="M12 3.2c.4 0 .77.23.95.6l2.18 4.46 4.92.72c.83.12 1.16 1.14.56 1.72l-3.56 3.47.84 4.9c.14.82-.72 1.45-1.46 1.06L12 17.8l-4.4 2.32c-.74.39-1.6-.24-1.46-1.06l.84-4.9-3.56-3.47c-.6-.58-.27-1.6.56-1.72l4.92-.72L11.05 3.8c.18-.37.55-.6.95-.6z" />
        </svg>
      </button>
    );
  };

  // selectable background themes for the quote card & download
  const THEMES = [
    { name: 'Ivory', bg: '#f4f1e8', ink: '#15201c', accent: '#1f4d3f' },
    { name: 'Forest', bg: '#1f4d3f', ink: '#f4f1e8', accent: '#b98a2e' },
    { name: 'Rust', bg: '#a8442a', ink: '#fdf6f2', accent: '#f4d9c5' },
    { name: 'Gold', bg: '#b98a2e', ink: '#1f1404', accent: '#1f4d3f' },
    { name: 'Slate', bg: '#2c3a36', ink: '#eef2f0', accent: '#b98a2e' },
  ];
  const [theme, setTheme] = useState(THEMES[0]);

  const downloadQuote = (text) => {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    const x = c.getContext('2d');
    // background (selected theme)
    x.fillStyle = theme.bg; x.fillRect(0, 0, 1080, 1080);
    // subtle dotted texture in the ink colour
    x.globalAlpha = 0.06; x.fillStyle = theme.ink;
    for (let i = 40; i < 1080; i += 44) for (let j = 40; j < 1080; j += 44) { x.beginPath(); x.arc(i, j, 2, 0, 7); x.fill(); }
    x.globalAlpha = 1;
    // quote text (wrapped)
    x.fillStyle = theme.ink; x.textAlign = 'center';
    x.font = '600 52px Georgia, serif';
    const words = ('“' + text + '”').split(' ');
    let line = '', lines = [];
    for (const w of words) {
      if ((line + w).length > 26) { lines.push(line.trim()); line = ''; }
      line += w + ' ';
    }
    lines.push(line.trim());
    const startY = 540 - (lines.length * 35);
    lines.forEach((l, i) => x.fillText(l, 540, startY + i * 70));
    // footer
    x.fillStyle = theme.accent; x.font = '700 34px Georgia, serif';
    x.fillText('MedConnect', 540, 980);
    const link = document.createElement('a');
    link.download = 'medconnect-motivation.png';
    link.href = c.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="screen">
      <h1 className="h1">Daily Motivation</h1>
      <div className="tabs" style={{ marginTop: 14 }}>
        <button className={`tab ${tab === 'today' ? 'on' : ''}`} onClick={() => setTab('today')}>Today</button>
        <button className={`tab ${tab === 'favs' ? 'on' : ''}`} onClick={() => setTab('favs')}>Favourites {favIds.length || ''}</button>
      </div>

      {tab === 'today' && (
        <>
          <div className="card" style={{ padding: 24, textAlign: 'center', background: theme.bg, transition: 'background .3s ease' }}>
            <div style={{ fontSize: 30, marginBottom: 12, color: theme.accent }}>✦</div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 21, fontWeight: 500, lineHeight: 1.4, marginBottom: 18, color: theme.ink, transition: 'color .3s ease' }}>
              “{today.text}”
            </p>
            <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 14, fontWeight: 700, color: theme.accent }}>MedConnect</div>
          </div>

          {/* background theme picker */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14 }}>
            {THEMES.map((t) => (
              <button key={t.name} onClick={() => setTheme(t)} aria-label={t.name}
                style={{ width: 30, height: 30, borderRadius: '50%', background: t.bg, border: theme.name === t.name ? '2.5px solid var(--forest)' : '1.5px solid var(--line)', cursor: 'pointer', transform: theme.name === t.name ? 'scale(1.12)' : 'scale(1)', transition: 'transform .2s ease' }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center', marginTop: 16 }}>
            <Star id={today.id} />
            <button className="btn ghost" onClick={() => downloadQuote(today.text)}>⬇ Download wallpaper</button>
          </div>
          <div className="sub" style={{ fontSize: 12, marginTop: 8, textAlign: 'center' }}>Pick a colour, then save it as your wallpaper ✨</div>
        </>
      )}

      {tab === 'favs' && (
        <>
          {favIds.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <p className="sub">No favourites yet. Star quotes you love and they'll collect here.</p>
            </div>
          )}
          {favIds.map((id) => (
            <div key={id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, fontFamily: "'Inter',system-ui,sans-serif", fontSize: 16, lineHeight: 1.45 }}>“{QUOTES[id]}”</div>
              <Star id={id} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

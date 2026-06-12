import { useEffect, useState } from 'react';
import { QUOTES, quoteOfTheDay } from '../lib/quotes';
import { api } from '../lib/api';

export default function Motivation() {
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

  const Star = ({ id }) => (
    <button className="link" style={{ fontSize: 22, lineHeight: 1 }} onClick={() => toggle(id)}>
      {favIds.includes(id) ? '★' : '☆'}
    </button>
  );

  const downloadQuote = (text) => {
    const c = document.createElement('canvas');
    c.width = 1080; c.height = 1080;
    const x = c.getContext('2d');
    // background
    x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, 1080, 1080);
    // dotted texture
    x.fillStyle = '#ece7d8';
    for (let i = 40; i < 1080; i += 44) for (let j = 40; j < 1080; j += 44) { x.beginPath(); x.arc(i, j, 2, 0, 7); x.fill(); }
    // quote text (wrapped)
    x.fillStyle = '#15201c'; x.textAlign = 'center';
    x.font = '600 52px Georgia, serif';
    const words = ('“' + text + '”').split(' ');
    let line = '', y = 430; const lines = [];
    for (const w of words) {
      if ((line + w).length > 26) { lines.push(line.trim()); line = ''; }
      line += w + ' ';
    }
    lines.push(line.trim());
    const startY = 540 - (lines.length * 35);
    lines.forEach((l, i) => x.fillText(l, 540, startY + i * 70));
    // footer
    x.fillStyle = '#1f4d3f'; x.font = '700 34px Georgia, serif';
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
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 12 }}>✦</div>
          <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 21, fontWeight: 600, lineHeight: 1.4, marginBottom: 18 }}>
            “{today.text}”
          </p>
          <Star id={today.id} />
          <div className="sub" style={{ fontSize: 12, marginTop: 8 }}>Tap the star to save this to your favourites</div>
          <button className="btn ghost" style={{ marginTop: 16 }} onClick={() => downloadQuote(today.text)}>⬇ Download as image</button>
        </div>
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


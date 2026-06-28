import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';

const COLORS = [
  { id: 'c1', bar: '#2c8a5a', label: 'Green' },
  { id: 'c2', bar: '#c47a3a', label: 'Amber' },
  { id: 'c3', bar: '#1f9bb8', label: 'Blue' },
  { id: 'c4', bar: '#d24a30', label: 'Red' },
];
const colorBar = (id) => (COLORS.find(c => c.id === id) || COLORS[0]).bar;
const DURATIONS = ['30 min', '45 min', '1 hour', '90 min', '2 hours', '3 hours'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// local YYYY-MM-DD (no UTC shift)
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ── Block editor modal (centered) ────────────────────────────────────────────
function BlockEditor({ block, day, onSave, onClose }) {
  const [topic, setTopic] = useState(block?.topic || '');
  const [time, setTime] = useState(block?.time || '');
  const [duration, setDuration] = useState(block?.duration || '1 hour');
  const [note, setNote] = useState(block?.note || '');
  const [color, setColor] = useState(block?.color || 'c1');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!topic.trim()) return;
    setSaving(true);
    try {
      const res = block?.id
        ? await api.blockUpdate(block.id, day, time, topic.trim(), duration, note, color)
        : await api.blockCreate(day, time, topic.trim(), duration, note, color);
      if (!res?.block) throw new Error('No block returned from server');
      onSave(res.block);
    } catch (e) {
      alert('Could not save block:\n' + (e?.message || 'unknown error'));
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 14px' }}>
      <div style={{ width: '100%', maxWidth: 380, maxHeight: '88vh', overflowY: 'auto', background: 'var(--paper)', borderRadius: 22, padding: '18px 18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 18, color: 'var(--ink)' }}>{block?.id ? 'Edit block' : 'New study block'}</span>
          <button onClick={onClose} style={{ background: 'var(--paper-2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>×</button>
        </div>
        <label style={lblS}>Topic</label>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. Cardiology" maxLength={60} style={inpS} />
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <div style={{ flex: 1 }}>
            <label style={lblS}>Time</label>
            <input value={time} onChange={e => setTime(e.target.value)} placeholder="7:00 AM" maxLength={20} style={inpS} />
          </div>
          <div style={{ width: 130 }}>
            <label style={lblS}>Length</label>
            <select value={duration} onChange={e => setDuration(e.target.value)} style={inpS}>
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <label style={{ ...lblS, marginTop: 10 }}>Note (optional)</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. ECGs + murmurs" maxLength={80} style={inpS} />
        <label style={{ ...lblS, marginTop: 12 }}>Colour</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {COLORS.map(c => (
            <button key={c.id} onClick={() => setColor(c.id)} aria-label={c.label}
              style={{ width: 32, height: 32, borderRadius: '50%', background: c.bar, border: color === c.id ? '3px solid var(--ink)' : '3px solid transparent', cursor: 'pointer', transition: 'transform .15s', transform: color === c.id ? 'scale(1.1)' : 'scale(1)' }} />
          ))}
        </div>
        <button onClick={save} disabled={saving || !topic.trim()}
          style={{ width: '100%', border: 'none', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', background: topic.trim() ? 'linear-gradient(135deg,var(--forest),#2c6a55)' : 'var(--line)', color: topic.trim() ? '#fff' : 'var(--muted)', cursor: topic.trim() ? 'pointer' : 'default', transition: 'all .2s' }}>
          {saving ? 'Saving…' : block?.id ? 'Save changes' : 'Add to calendar'}
        </button>
        {block?.id && (
          <button onClick={() => onSave(null, block.id)} style={{ width: '100%', border: 'none', background: 'none', color: 'var(--rust)', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit', marginTop: 10, cursor: 'pointer' }}>Delete block</button>
        )}
      </div>
    </div>
  );
}
const lblS = { fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.4px', display: 'block', marginBottom: 5 };
const inpS = { width: '100%', border: '1.5px solid var(--line)', borderRadius: 10, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--card)', outline: 'none' };

// ── Main page ────────────────────────────────────────────────────────────────
export default function StudyPlanner() {
  const { user } = useAuth();
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(ymd(today));
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // null | 'new' | block

  const examDate = user?.exam_date ? new Date(user.exam_date) : null;
  const examYmd = examDate ? ymd(examDate) : null;
  const daysToExam = examDate ? Math.ceil((examDate - today) / 86400000) : null;

  // load blocks for the visible month (+/- to catch edges)
  useEffect(() => {
    const from = ymd(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1));
    const to = ymd(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0));
    setLoading(true);
    api.blocks(from, to).then(d => setBlocks(d.blocks || [])).finally(() => setLoading(false));
  }, [viewMonth]);

  const handleSave = async (block, deleteId) => {
    if (deleteId) {
      try { await api.blockDelete(deleteId); setBlocks(prev => prev.filter(b => b.id !== deleteId)); } catch (_) {}
      setEditor(null); return;
    }
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === block.id);
      return idx >= 0 ? prev.map(b => b.id === block.id ? block : b) : [...prev, block];
    });
    setEditor(null);
  };

  const toggleDone = async (id) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, done: !b.done } : b));
    try { await api.blockToggle(id); } catch (_) { setBlocks(prev => prev.map(b => b.id === id ? { ...b, done: !b.done } : b)); }
  };

  // build the calendar grid (Mon-first)
  const year = viewMonth.getFullYear(), month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const blocksByDay = {};
  blocks.forEach(b => { (blocksByDay[b.day] = blocksByDay[b.day] || []).push(b); });

  const selBlocks = (blocksByDay[selected] || []).slice().sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  const selDate = new Date(selected + 'T00:00:00');
  const selLabel = selDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div className="screen" style={{ padding: 0 }}>
      {/* hero */}
      <div style={{ background: 'var(--section-hero)', color: '#fff', padding: '18px 20px 32px', minHeight: 150, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -6, bottom: -14, fontSize: 84, opacity: .1, lineHeight: 1, pointerEvents: 'none' }}>📅</div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 7, position: 'relative' }}>✦ Study Planner</div>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 24, lineHeight: 1, position: 'relative' }}>Your Calendar</h1>
        {daysToExam != null && daysToExam >= 0 && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8, position: 'relative' }}>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 20, color: 'var(--gold)' }}>{daysToExam}</span>
            <span style={{ fontSize: 12, opacity: .85 }}>days until your exam</span>
          </div>
        )}
      </div>

      {/* sheet */}
      <div style={{ background: 'var(--paper)', borderRadius: '26px 26px 0 0', marginTop: -20, position: 'relative', padding: '18px 14px 90px', minHeight: '60vh' }}>
        {/* month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => setViewMonth(new Date(year, month - 1, 1))} style={navBtnS}>‹</button>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 16, color: 'var(--ink)' }}>{MONTHS[month]} {year}</span>
          <button onClick={() => setViewMonth(new Date(year, month + 1, 1))} style={navBtnS}>›</button>
        </div>

        {/* calendar */}
        <div style={{ background: 'var(--card)', borderRadius: 18, padding: '12px 10px', boxShadow: '0 3px 12px rgba(31,77,63,.05)', marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 6 }}>
            {DOW.map((d, i) => <span key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>{d}</span>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const ds = ymd(new Date(year, month, d));
              const isToday = ds === ymd(today);
              const isSel = ds === selected;
              const isExam = ds === examYmd;
              const dayBlocks = blocksByDay[ds] || [];
              const dotCount = Math.min(dayBlocks.length, 3);
              let bg = 'transparent', col = 'var(--ink)', fw = 600;
              if (isSel) { bg = 'var(--forest)'; col = '#fff'; fw = 800; }
              else if (isExam) { bg = '#fde0d8'; col = 'var(--rust)'; fw = 800; }
              else if (isToday) { bg = 'var(--paper-2)'; fw = 800; }
              return (
                <div key={i} onClick={() => setSelected(ds)}
                  style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: fw, color: col, background: bg, borderRadius: 10, cursor: 'pointer', position: 'relative' }}>
                  {d}
                  {dotCount > 0 && (
                    <div style={{ position: 'absolute', bottom: 5, display: 'flex', gap: 2 }}>
                      {Array.from({ length: dotCount }).map((_, k) => (
                        <span key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: isSel ? '#fff' : 'var(--gold)', display: 'block' }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* selected day header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>{selLabel}</span>
          <button onClick={() => setEditor('new')} style={{ background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 999, padding: '6px 13px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add block</button>
        </div>

        {/* blocks for selected day */}
        {loading ? <div className="center" style={{ minHeight: 80 }}><div className="spinner" /></div> : selBlocks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32 }}>🗓️</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, marginTop: 6 }}>No study blocks this day.<br />Tap "Add block" to plan one.</p>
          </div>
        ) : selBlocks.map(b => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'var(--card)', borderRadius: 14, padding: '11px 13px', marginBottom: 8, boxShadow: '0 2px 8px rgba(31,77,63,.05)', position: 'relative', overflow: 'hidden', opacity: b.done ? .55 : 1 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: colorBar(b.color) }} />
            {b.time && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', width: 56, flexShrink: 0 }}>{b.time}</div>}
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setEditor(b)}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', textDecoration: b.done ? 'line-through' : 'none' }}>{b.topic}</div>
              {(b.duration || b.note) && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{[b.duration, b.note].filter(Boolean).join(' · ')}</div>}
            </div>
            <button onClick={() => toggleDone(b.id)} style={{ width: 26, height: 26, borderRadius: '50%', border: b.done ? 'none' : '1.5px solid var(--line)', background: b.done ? 'var(--forest)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }}>
              {b.done && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5L20 7" /></svg>}
            </button>
          </div>
        ))}
      </div>

      {editor && <BlockEditor block={editor === 'new' ? null : editor} day={selected} onSave={handleSave} onClose={() => setEditor(null)} />}
    </div>
  );
}
const navBtnS = { width: 30, height: 30, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--forest)', fontSize: 16 };


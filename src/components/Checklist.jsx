import { useState, useEffect } from 'react';

// a simple study checklist saved to localStorage (this device).
// shape: [{ id, text, done }]
const KEY = 'checklist_v1';

export default function Checklist() {
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch (e) {}
  }, []);
  const save = (next) => { setItems(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {} };

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    save([...items, { id: Date.now(), text: t, done: false }]);
    setDraft('');
  };
  const toggle = (id) => save(items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  const remove = (id) => save(items.filter((i) => i.id !== id));

  const done = items.filter((i) => i.done).length;

  return (
    <div style={{ padding: '14px 18px 10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--gold)' }}>📋 Today's checklist</span>
        {items.length > 0 && <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 600 }}>{done} / {items.length}</span>}
      </div>

      {items.length === 0 && (
        <div style={{ fontSize: 12.5, color: 'var(--subtle)', fontStyle: 'italic', padding: '2px 0 8px' }}>
          No tasks yet — add one below, like “Revise cardiology MCQs”.
        </div>
      )}

      {items.map((i) => (
        <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
          <button onClick={() => toggle(i.id)} aria-label={i.done ? 'Mark not done' : 'Mark done'}
            style={{ width: 20, height: 20, borderRadius: 7, border: '2px solid var(--forest)', background: i.done ? 'var(--forest)' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0, transition: 'background .15s ease, transform .2s cubic-bezier(0.34,1.56,0.64,1)' }}>
            {i.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>}
          </button>
          <span style={{ fontSize: 13.5, flex: 1, textDecoration: i.done ? 'line-through' : 'none', color: i.done ? 'var(--subtle)' : 'var(--ink)' }}>{i.text}</span>
          <button onClick={() => remove(i.id)} aria-label="Delete task" style={{ color: 'var(--subtle)', fontSize: 16, cursor: 'pointer', padding: '0 2px', opacity: 0.6, background: 'none', border: 'none' }}>×</button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add(); }}
          placeholder="Add a study task…" className="input"
          style={{ flex: 1, marginBottom: 0, padding: '9px 11px', fontSize: 13 }} />
        <button onClick={add} aria-label="Add task" className="btn-sm"
          style={{ width: 38, fontSize: 20, padding: 0, borderRadius: 10 }}>+</button>
      </div>
    </div>
  );
}


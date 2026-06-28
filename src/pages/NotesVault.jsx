import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';

// ── Tag pill ────────────────────────────────────────────────────────────────
function Tag({ label }) {
  if (!label) return null;
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--paper-2)', color: 'var(--muted)' }}>{label}</span>;
}

// ── Note editor modal ───────────────────────────────────────────────────────
function NoteEditor({ note, onSave, onClose }) {
  const [title, setTitle] = useState(note?.title || '');
  const [body, setBody] = useState(note?.body || '');
  const [tags, setTags] = useState(note?.tags || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = note?.id
        ? await api.noteUpdate(note.id, title.trim(), body, tags)
        : await api.noteCreate(title.trim(), body, tags);
      onSave(res.note);
    } catch (_) {} finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'var(--paper)', borderRadius: '26px 26px 0 0', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}>
        {/* header — fixed */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px', flexShrink: 0 }}>
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 18, color: 'var(--ink)' }}>{note?.id ? 'Edit note' : 'New note'}</span>
          <button onClick={onClose} style={{ background: 'var(--paper-2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>×</button>
        </div>
        {/* body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 16px' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={100}
            style={{ width: '100%', border: '1.5px solid var(--line)', borderRadius: 12, padding: '11px 13px', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--card)', outline: 'none', marginBottom: 10 }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your notes, mnemonics, summaries..." rows={7}
            style={{ width: '100%', border: '1.5px solid var(--line)', borderRadius: 12, padding: '11px 13px', fontSize: 13.5, fontFamily: "'Newsreader', Georgia, serif", color: 'var(--ink)', background: 'var(--card)', outline: 'none', resize: 'none', lineHeight: 1.6, marginBottom: 10 }} />
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tag (e.g. Cardiology, MRCP)" maxLength={60}
            style={{ width: '100%', border: '1.5px solid var(--line)', borderRadius: 12, padding: '11px 13px', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', background: 'var(--card)', outline: 'none' }} />
        </div>
        {/* save — pinned at bottom, always visible */}
        <div style={{ padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <button onClick={save} disabled={saving || !title.trim()}
            style={{ width: '100%', border: 'none', borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', background: title.trim() ? 'linear-gradient(135deg,var(--forest),#2c6a55)' : 'var(--line)', color: title.trim() ? '#fff' : 'var(--muted)', cursor: title.trim() ? 'pointer' : 'default', transition: 'all .2s' }}>
            {saving ? 'Saving…' : note?.id ? 'Save changes' : 'Create note'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Share picker modal ──────────────────────────────────────────────────────
function SharePicker({ note, partners, onShare, onClose }) {
  const [picked, setPicked] = useState(null);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (!picked) return;
    setSharing(true);
    try { await api.noteShare(note.id, picked); onShare(); }
    catch (_) {} finally { setSharing(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'var(--paper)', borderRadius: '26px 26px 0 0', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        {/* header — fixed */}
        <div style={{ padding: '18px 18px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 18, color: 'var(--ink)' }}>Share note</span>
            <button onClick={onClose} style={{ background: 'var(--paper-2)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>×</button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>"{note.title}"</p>
        </div>
        {/* partner list — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px' }}>
          {!partners.length && <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '24px 0' }}>No study partners yet — connect with someone first.</p>}
          {partners.map((p, i) => (
            <div key={p.id} onClick={() => setPicked(p.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 7, cursor: 'pointer', background: picked === p.id ? 'var(--paper-2)' : 'var(--card)', border: `1.5px solid ${picked === p.id ? 'var(--forest)' : 'var(--line)'}` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>{p.avatar || '🧑‍⚕️'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{p.name}</div>
                {p.exam && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{p.exam}</div>}
              </div>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: picked === p.id ? 'var(--forest)' : 'transparent', border: picked === p.id ? 'none' : '1.5px solid var(--line)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                {picked === p.id && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M5 12l5 5L20 7"/></svg>}
              </div>
            </div>
          ))}
        </div>
        {/* send — pinned at bottom */}
        <div style={{ padding: '12px 18px calc(env(safe-area-inset-bottom, 0px) + 16px)', borderTop: '1px solid var(--line)', flexShrink: 0 }}>
          <button onClick={share} disabled={!picked || sharing}
            style={{ width: '100%', border: 'none', borderRadius: 14, padding: 13, fontSize: 14, fontWeight: 800, fontFamily: 'inherit', background: picked ? 'linear-gradient(135deg,var(--forest),#2c6a55)' : 'var(--line)', color: picked ? '#fff' : 'var(--muted)', cursor: picked ? 'pointer' : 'default', transition: 'all .2s' }}>
            {sharing ? 'Sharing…' : picked ? `Send to ${partners.find(p => p.id === picked)?.name?.split(' ')[0] || 'partner'} →` : 'Select a partner'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function NotesVault() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine');
  const [notes, setNotes] = useState([]);
  const [shared, setShared] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState(null); // null | 'new' | note object
  const [sharePicker, setSharePicker] = useState(null); // null | note
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    Promise.all([
      api.notes().then(d => setNotes(d.notes || [])),
      api.notesShared().then(d => setShared(d.shared || [])),
      api.connections().then(d => {
      const uid = user?.id;
      const mapped = (d.connected || []).map(c => {
        const iAm = c.requester === uid;
        return {
          id:     iAm ? c.recipient     : c.requester,
          name:   iAm ? c.recipient_name  : c.requester_name,
          exam:   iAm ? c.recipient_exam  : c.requester_exam,
          avatar: iAm ? c.recipient_avatar: c.requester_avatar,
        };
      });
      setPartners(mapped);
    }),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSave = (note) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === note.id);
      return idx >= 0 ? prev.map(n => n.id === note.id ? note : n) : [note, ...prev];
    });
    setEditor(null);
    showToast(editor?.id ? 'Note updated ✓' : 'Note created ✓');
  };

  const handleDelete = async (id) => {
    try {
      await api.noteDelete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      showToast('Note deleted');
    } catch (_) {}
  };

  const handleSaveShared = async (shareId) => {
    try {
      const res = await api.noteSave(shareId);
      setNotes(prev => [res.note, ...prev]);
      setShared(prev => prev.map(s => s.share_id === shareId ? { ...s, saved: true } : s));
      showToast('Saved to My Notes ✓');
    } catch (_) {}
  };

  const fmt = (ts) => {
    const d = new Date(ts), now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `${diff || 1}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  return (
    <div className="screen" style={{ padding: 0 }}>
      {/* hero */}
      <div style={{ background: 'var(--section-hero)', color: '#fff', padding: '18px 20px 32px', minHeight: 150, boxSizing: 'border-box', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, bottom: -16, fontSize: 90, opacity: .1, lineHeight: 1, pointerEvents: 'none' }}>📝</div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.2, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 7, position: 'relative' }}>✦ Notes Vault</div>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 26, lineHeight: 1, position: 'relative' }}>My Notes</h1>
        <p style={{ fontSize: 12.5, opacity: .85, marginTop: 6, lineHeight: 1.5, position: 'relative' }}>Personal notes & mnemonics — share any with a study partner.</p>
      </div>

      {/* sheet */}
      <div style={{ background: 'var(--paper)', borderRadius: '26px 26px 0 0', marginTop: -20, position: 'relative', padding: '20px 16px 90px', minHeight: '60vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div className="tabs" style={{ flex: 1, marginBottom: 0 }}>
            <button className={`tab ${tab === 'mine' ? 'on' : ''}`} onClick={() => setTab('mine')}>Mine {notes.length > 0 ? notes.length : ''}</button>
            <button className={`tab ${tab === 'shared' ? 'on' : ''}`} onClick={() => setTab('shared')}>Shared with me {shared.length > 0 ? shared.length : ''}</button>
          </div>
          <button onClick={() => setEditor('new')}
            style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--forest)', color: '#fff', border: 'none', fontSize: 22, fontWeight: 300, display: 'grid', placeItems: 'center', boxShadow: '0 4px 14px rgba(31,77,63,.28)', cursor: 'pointer', flexShrink: 0, lineHeight: 1 }}>+</button>
        </div>

        {loading && <div className="center" style={{ minHeight: 120 }}><div className="spinner" /></div>}

        {/* MY NOTES */}
        {!loading && tab === 'mine' && (
          <>
            {notes.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 38, marginBottom: 12 }}>📝</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>No notes yet</p>
                <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>Tap + to jot down a mnemonic, summary or key fact.</p>
              </div>
            )}
            {notes.map(n => (
              <div key={n.id} className="card" style={{ padding: '13px 14px', marginBottom: 9, cursor: 'pointer' }} onClick={() => setEditor(n)}>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)', marginBottom: 4 }}>{n.title}</div>
                {n.body && <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.body}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {n.tags && <Tag label={n.tags} />}
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto' }}>{fmt(n.updated_at)}</span>
                  <button onClick={e => { e.stopPropagation(); setSharePicker(n); }}
                    style={{ background: 'none', border: '1px solid var(--line)', borderRadius: 8, padding: '3px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--forest)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>
                    Share
                  </button>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete this note?')) handleDelete(n.id); }}
                    style={{ background: 'none', border: '1px solid #fde0d8', borderRadius: 8, padding: '3px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--rust)', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* SHARED WITH ME */}
        {!loading && tab === 'shared' && (
          <>
            {shared.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 38, marginBottom: 12 }}>🤝</div>
                <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>Nothing shared yet</p>
                <p style={{ fontSize: 12.5, lineHeight: 1.5 }}>When a study partner shares notes with you, they'll appear here.</p>
              </div>
            )}
            {shared.map(s => (
              <div key={s.share_id} className="card" style={{ padding: '13px 14px', marginBottom: 9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 13, flexShrink: 0 }}>{s.from_avatar || '🧑‍⚕️'}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>from {s.from_name} · {fmt(s.shared_at)}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--ink)', marginBottom: 4 }}>{s.title}</div>
                {s.body && <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.body}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  {s.tags && <Tag label={s.tags} />}
                  {s.saved
                    ? <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--forest)', marginLeft: 'auto' }}>✓ Saved to mine</span>
                    : <button onClick={() => handleSaveShared(s.share_id)} style={{ marginLeft: 'auto', background: 'var(--paper-2)', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 11, fontWeight: 700, color: 'var(--forest)', cursor: 'pointer', fontFamily: 'inherit' }}>Save to mine</button>}
                </div>
              </div>
            ))}
          </>
        )}


      </div>

      {/* modals */}
      {editor && <NoteEditor note={editor === 'new' ? null : editor} onSave={handleSave} onClose={() => setEditor(null)} />}
      {sharePicker && <SharePicker note={sharePicker} partners={partners} onShare={() => { setSharePicker(null); showToast('Note shared ✓'); }} onClose={() => setSharePicker(null)} />}

      {/* toast */}
      {toast && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 'calc(env(safe-area-inset-bottom,0px) + 80px)', zIndex: 3000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ background: 'var(--forest)', color: '#fff', fontSize: 13, fontWeight: 700, padding: '11px 20px', borderRadius: 999, boxShadow: '0 6px 20px rgba(20,40,30,.3)', animation: 'tabPop .3s ease both' }}>{toast}</div>
        </div>
      )}
    </div>
  );
                                                                                   }

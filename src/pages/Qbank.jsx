import { useState, useEffect } from 'react';
import { useAuth } from '../context/Auth.jsx';
import { api } from '../lib/api.js';
import { examColor } from '../lib/examColors.js';

// Qbank progress tracker — solo by default, optional per-partner sharing.
// Tracks per topic: done / total / correct. Overall is derived.
export default function Qbank() {
  const { user } = useAuth();
  const [bank, setBank] = useState(user?.question_bank || user?.exam || 'My Qbank');
  const [rows, setRows] = useState([]);          // [{bank, topic, done, total, correct}]
  const [sharingWith, setSharingWith] = useState([]); // [{grantee_id, bank}]
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ topic: '', done: '', total: '', correct: '' });
  const [shareOpen, setShareOpen] = useState(false);
  const [partners, setPartners] = useState([]);
  const [compareId, setCompareId] = useState(null);
  const [compareRows, setCompareRows] = useState([]);
  const [compareName, setCompareName] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.qbankGet();
      setRows(d.progress || []);
      setSharingWith(d.sharingWith || []);
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const bankRows = rows.filter((r) => r.bank === bank);
  const banks = [...new Set([bank, ...rows.map((r) => r.bank)])];

  const totals = bankRows.reduce((a, r) => ({
    done: a.done + (r.done || 0), total: a.total + (r.total || 0), correct: a.correct + (r.correct || 0),
  }), { done: 0, total: 0, correct: 0 });
  const pctDone = totals.total ? Math.round((totals.done / totals.total) * 100) : 0;
  const pctAcc = totals.done ? Math.round((totals.correct / totals.done) * 100) : 0;

  const color = examColor(user?.exam) || '#1f4d3f';

  const saveTopic = async () => {
    if (!draft.topic.trim()) return;
    const done = parseInt(draft.done, 10) || 0;
    const total = parseInt(draft.total, 10) || 0;
    const correct = parseInt(draft.correct, 10) || 0;
    await api.qbankSave(bank, draft.topic.trim(), done, total, Math.min(correct, done));
    setDraft({ topic: '', done: '', total: '', correct: '' });
    setAdding(false);
    load();
  };
  const delTopic = async (topic) => { await api.qbankDeleteTopic(bank, topic); load(); };

  const openShare = async () => {
    setShareOpen(true);
    try {
      const d = await api.connections();
      const me = user?.id;
      const list = (d.connected || d.connections || []).map((c) => {
        const iAmReq = c.requester == me;
        return { id: iAmReq ? c.recipient : c.requester, name: iAmReq ? c.recipient_name : c.requester_name, avatar: iAmReq ? c.recipient_avatar : c.requester_avatar };
      });
      setPartners(list);
    } catch (e) { setPartners([]); }
  };

  const isSharedWith = (pid) => sharingWith.some((g) => g.grantee_id == pid && g.bank === bank);
  const toggleShare = async (pid, on) => {
    await api.qbankSetShare(pid, bank, on);
    load();
  };

  const openCompare = async (pid, name) => {
    setCompareId(pid); setCompareName(name); setCompareRows([]);
    try {
      const d = await api.qbankCompare(pid, bank);
      setCompareRows(d.progress || []);
    } catch (e) { setCompareRows([]); }
  };

  const accColor = (p) => p >= 70 ? '#2c7a4b' : p >= 50 ? '#b98a2e' : '#a8442a';

  return (
    <div className="screen">
      <h1 className="serif" style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>Qbank Tracker</h1>
      <p className="sub" style={{ marginBottom: 16 }}>Track your question-bank progress, solo or shared.</p>

      {/* bank selector */}
      {banks.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          {banks.map((b) => (
            <button key={b} onClick={() => setBank(b)} style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: bank === b ? 'none' : '1.5px solid var(--line)', background: bank === b ? color : 'var(--card)', color: bank === b ? '#fff' : 'var(--muted)',
            }}>{b}</button>
          ))}
        </div>
      )}

      {/* overall summary card */}
      <div style={{ borderRadius: 18, padding: 18, marginBottom: 16, background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 }}>{bank} · Overall</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div>
            <div className="serif" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{totals.done}<span style={{ fontSize: 16, opacity: 0.7 }}>/{totals.total || '?'}</span></div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>questions done</div>
          </div>
          <div>
            <div className="serif" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1 }}>{pctAcc}%</div>
            <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>accuracy</div>
          </div>
        </div>
        {totals.total > 0 && (
          <div style={{ marginTop: 14, height: 7, borderRadius: 999, background: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
            <div style={{ width: `${pctDone}%`, height: '100%', background: '#fff', borderRadius: 999 }} />
          </div>
        )}
      </div>

      {/* share button */}
      <button onClick={openShare} className="btn ghost" style={{ width: '100%', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        👥 Manage sharing
        {sharingWith.filter((g) => g.bank === bank).length > 0 && (
          <span style={{ background: color, color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 999, padding: '2px 8px' }}>
            Sharing with {sharingWith.filter((g) => g.bank === bank).length}
          </span>
        )}
      </button>

      {/* topics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>Topics</span>
        <button onClick={() => setAdding(true)} className="link" style={{ fontSize: 13, fontWeight: 700 }}>+ Add topic</button>
      </div>

      {loading && <div className="spinner" style={{ margin: '20px auto' }} />}

      {!loading && bankRows.length === 0 && !adding && (
        <p className="sub" style={{ fontStyle: 'italic', padding: '8px 0 16px' }}>No topics yet. Add your first chapter to start tracking.</p>
      )}

      {bankRows.map((r) => {
        const acc = r.done ? Math.round((r.correct / r.done) * 100) : 0;
        const prog = r.total ? Math.round((r.done / r.total) * 100) : 0;
        return (
          <div key={r.topic} style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 14, padding: 14, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.topic}</span>
              <button onClick={() => delTopic(r.topic)} style={{ background: 'none', border: 'none', color: 'var(--subtle)', cursor: 'pointer', fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>
              <span>{r.done}/{r.total || '?'} done</span>
              <span style={{ color: accColor(acc), fontWeight: 700 }}>{acc}% accuracy</span>
            </div>
            {r.total > 0 && (
              <div style={{ marginTop: 8, height: 5, borderRadius: 999, background: 'var(--paper-2)', overflow: 'hidden' }}>
                <div style={{ width: `${prog}%`, height: '100%', background: color }} />
              </div>
            )}
          </div>
        );
      })}

      {adding && (
        <div style={{ background: 'var(--card)', border: `1.5px solid ${color}`, borderRadius: 14, padding: 14, marginBottom: 8 }}>
          <input className="input" placeholder="Topic / chapter (e.g. Cardiology)" value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} style={{ marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input" type="number" placeholder="Done" value={draft.done} onChange={(e) => setDraft({ ...draft, done: e.target.value })} style={{ marginBottom: 0, flex: 1 }} />
            <input className="input" type="number" placeholder="Total" value={draft.total} onChange={(e) => setDraft({ ...draft, total: e.target.value })} style={{ marginBottom: 0, flex: 1 }} />
            <input className="input" type="number" placeholder="Correct" value={draft.correct} onChange={(e) => setDraft({ ...draft, correct: e.target.value })} style={{ marginBottom: 0, flex: 1 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveTopic} className="btn" style={{ background: color, flex: 1, padding: '9px' }}>Save</button>
            <button onClick={() => { setAdding(false); setDraft({ topic: '', done: '', total: '', correct: '' }); }} className="btn ghost" style={{ padding: '9px 16px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <div className="overlay" onClick={() => setShareOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, borderRadius: '18px 18px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Share “{bank}” progress</h2>
            <p className="sub" style={{ fontSize: 12.5, marginBottom: 6 }}>Private by default. Turn a partner on to let them see your chapter accuracy for this bank. Turn off anytime — it stops instantly.</p>
            <p className="sub" style={{ fontSize: 11, color: 'var(--subtle)', marginBottom: 14 }}>🔒 Shares accuracy only — never your actual questions.</p>
            {partners.length === 0 && <p className="sub">No connected partners yet.</p>}
            {partners.map((p) => {
              const on = isSharedWith(p.id);
              const theyShare = false; // could be derived from sharedToMe
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 19 }}>{p.avatar || '🩺'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                    <div style={{ fontSize: 11.5, color: on ? '#2c7a4b' : 'var(--subtle)' }}>{on ? 'You share with them' : 'Not sharing'}</div>
                  </div>
                  <button onClick={() => toggleShare(p.id, !on)} style={{
                    width: 46, height: 27, borderRadius: 999, border: 'none', cursor: 'pointer', position: 'relative',
                    background: on ? color : 'var(--line)', transition: 'background .2s',
                  }}>
                    <span style={{ position: 'absolute', top: 3, left: on ? 22 : 3, width: 21, height: 21, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                  </button>
                </div>
              );
            })}
            <button onClick={() => setShareOpen(false)} className="btn ghost" style={{ width: '100%', marginTop: 14 }}>Done</button>
          </div>
        </div>
      )}

      {/* partners who share WITH me → compare */}
      <SharedToMe bank={bank} onCompare={openCompare} />

      {/* COMPARE MODAL */}
      {compareId && (
        <div className="overlay" onClick={() => setCompareId(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, borderRadius: '18px 18px 0 0', maxHeight: '80vh', overflowY: 'auto' }}>
            <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{compareName} · {bank}</h2>
            {compareRows.length === 0 && <p className="sub">No shared progress for this bank yet.</p>}
            {compareRows.map((r) => {
              const acc = r.done ? Math.round((r.correct / r.done) * 100) : 0;
              const mine = bankRows.find((m) => m.topic === r.topic);
              const myAcc = mine && mine.done ? Math.round((mine.correct / mine.done) * 100) : null;
              return (
                <div key={r.topic} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginBottom: 5 }}>
                    <span>{r.topic}</span>
                    <span style={{ color: accColor(acc) }}>{acc}%{myAcc !== null && <span style={{ color: 'var(--subtle)', fontWeight: 400 }}> · you {myAcc}%</span>}</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 999, background: 'var(--paper-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${acc}%`, height: '100%', background: accColor(acc) }} />
                  </div>
                </div>
              );
            })}
            <button onClick={() => setCompareId(null)} className="btn ghost" style={{ width: '100%', marginTop: 14 }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// partners who have granted ME access for this bank
function SharedToMe({ bank, onCompare }) {
  const [list, setList] = useState([]);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const d = await api.qbankGet();
        const grants = (d.sharedToMe || []).filter((g) => g.bank === bank);
        if (!grants.length) { if (active) setList([]); return; }
        const conn = await api.connections();
        const rows = (conn.connected || conn.connections || []);
        const named = grants.map((g) => {
          const c = rows.find((r) => r.requester == g.grantor_id || r.recipient == g.grantor_id);
          let name = 'Partner', avatar = '🩺';
          if (c) { const iAmReq = c.requester != g.grantor_id; name = iAmReq ? c.recipient_name : c.requester_name; avatar = iAmReq ? c.recipient_avatar : c.requester_avatar; }
          return { id: g.grantor_id, name, avatar };
        });
        if (active) setList(named);
      } catch (e) {}
    })();
    return () => { active = false; };
  }, [bank]);

  if (list.length === 0) return null;
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--subtle)', marginBottom: 10 }}>Partners sharing with you</div>
      {list.map((p) => (
        <button key={p.id} onClick={() => onCompare(p.id, p.name)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 14, marginBottom: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 18 }}>{p.avatar || '🩺'}</div>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, fontSize: 14 }}>{p.name}</span>
          <span className="link" style={{ fontSize: 13, fontWeight: 700 }}>Compare ›</span>
        </button>
      ))}
    </div>
  );
            }


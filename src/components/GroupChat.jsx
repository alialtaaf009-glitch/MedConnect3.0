import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { SendIcon, IcoPlus, IcoUsers, IcoLeave, IcoTrash, otherPerson, Stamp } from './ChatBits.jsx';

export default function GroupChat({ me, groupId, onBack }) {
  const [data, setData] = useState({ messages: [], members: [], group: null });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const endRef = useRef(null);

  const load = () => api.group(groupId).then((d) => setData(d)).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [groupId]);
  // only scroll when a genuinely new message lands (not on every 4s poll)
  const lastMsgId = (data.messages || []).length ? data.messages[data.messages.length - 1].id : 0;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lastMsgId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const b = text.trim(); setText('');
    try { await api.sendGroupMessage(groupId, b); await load(); } catch (e) {} finally { setSending(false); }
  };
  const openAdd = async () => {
    setMenu(false);
    try { const d = await api.connections(); setFriends((d.connected || []).map((c) => otherPerson(c, me?.id))); } catch (e) { setFriends([]); }
    setAddOpen(true);
  };
  const addMember = async (uid) => {
    try { await api.addGroupMember(groupId, uid); await load(); window.alert('Added to group.'); } catch (e) {}
  };
  const leave = async () => {
    setMenu(false);
    if (!window.confirm('Leave this group?')) return;
    try { await api.leaveGroup(groupId); onBack(); } catch (e) {}
  };
  const del = async () => {
    setMenu(false);
    if (!window.confirm('Delete this group for everyone? This cannot be undone.')) return;
    try { await api.deleteGroup(groupId); onBack(); } catch (e) {}
  };

  const isCreator = data.group && data.group.creator == me?.id;
  const memberIds = new Set((data.members || []).map((m) => m.id));
  const item = { display: 'flex', alignItems: 'center', gap: 9 };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 76px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="link" onClick={onBack}>‹ Back</button>
        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setMembersOpen(true)}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{data.group?.name || 'Group'}</h2>
          <div className="meta">{(data.members || []).length} members · tap to view</div>
        </div>
        <div style={{ position: 'relative' }}>
          <button className="link" style={{ fontSize: 22, lineHeight: 1 }} onClick={() => setMenu(!menu)}>⋯</button>
          {menu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 110 }} onClick={() => setMenu(false)} />
              <div className="popover">
                <button style={item} onClick={() => { setMenu(false); setMembersOpen(true); }}><IcoUsers /> View members</button>
                <button style={item} onClick={openAdd}><IcoPlus /> Add a connection</button>
                <button style={item} onClick={leave}><IcoLeave /> Leave group</button>
                {isCreator && <button style={{ ...item, color: 'var(--rust)' }} onClick={del}><IcoTrash /> Delete group</button>}
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>
        {(data.messages || []).length === 0 && <p className="sub" style={{ textAlign: 'center', marginTop: 20 }}>No messages yet. Say hello to your study group 👋</p>}
        {(data.messages || []).map((m) => {
          const mine = m.sender == me?.id;
          const init = (m.sender_name || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
          const parts = m.body.split(/(https?:\/\/[^\s]+)/g);
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 7, marginBottom: 8 }}>
              {!mine && <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: m.sender_avatar ? 16 : 11, color: 'var(--forest)', fontWeight: 700, flexShrink: 0 }}>{m.sender_avatar || init}</div>}
              <div style={{ maxWidth: '72%', padding: '8px 12px', borderRadius: 14, fontSize: 14, background: mine ? 'var(--forest)' : 'var(--card)', color: mine ? '#fff' : 'var(--ink)', border: mine ? 'none' : '1.5px solid var(--line)', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                {!mine && <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rust)', marginBottom: 2 }}>{m.sender_name}</div>}
                {parts.map((p, i) => /^https?:\/\//.test(p) ? <a key={i} href={p} target="_blank" rel="noreferrer" style={{ color: mine ? '#cdeee2' : 'var(--forest)', textDecoration: 'underline' }}>{p}</a> : p)}
                <Stamp ts={m.created_at} light={mine} />
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {membersOpen && (
        <div onClick={() => setMembersOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Group members</h2>
            {(data.members || []).map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: m.avatar ? 18 : 12, color: 'var(--forest)', fontWeight: 700 }}>{m.avatar || (m.name || 'Dr')[0]}</div>
                <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{m.name}</span>
                {data.group && m.id == data.group.creator && <span className="meta" style={{ fontSize: 11 }}>creator</span>}
              </div>
            ))}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setMembersOpen(false)}>Close</button>
          </div>
        </div>
      )}

      {addOpen && (
        <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340, width: '100%' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Add a connection</h2>
            {friends.filter((f) => !memberIds.has(f.id)).length === 0 && <p className="sub" style={{ fontSize: 13 }}>All your connections are already in this group.</p>}
            {friends.filter((f) => !memberIds.has(f.id)).map((f) => (
              <button key={f.id} className="menu-item" onClick={() => addMember(f.id)}>
                {(f.avatar || '🩺')} {f.name} <span className="link" style={{ marginLeft: 'auto' }}>Add ›</span>
              </button>
            ))}
            <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setAddOpen(false)}>Done</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--line)', background: 'var(--paper)', flexShrink: 0 }}>
        <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Message the group…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <button onClick={send} disabled={sending} aria-label="Send" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--forest)', color: '#fff', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.6 : 1 }}><SendIcon /></button>
      </div>
    </div>
  );
}

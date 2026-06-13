import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { SendIcon, IcoTrash, IcoLeave, IcoBan, IcoFlag, Stamp } from './ChatBits.jsx';

export default function DirectChat({ me, withId, withName, withAv, onBack }) {
  const [messages, setMessages] = useState([]);
  const [avatars, setAvatars] = useState({});
  const [peer, setPeer] = useState(null);
  const myInit = (me?.name || 'Me').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const theirInit = (withName || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const Avatar = ({ emoji, init }) => (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: emoji ? 16 : 11, color: 'var(--forest)', fontWeight: 700, flexShrink: 0 }}>{emoji || init}</div>
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef(null);

  const load = () => api.conversation(withId).then((d) => { setMessages(d.messages || []); if (d.avatars) setAvatars(d.avatars); if (d.peer) setPeer(d.peer); localStorage.setItem('chat_read_' + withId, String(Date.now())); }).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [withId]);
  // only scroll when a genuinely new message lands (not on every 4s poll)
  const lastMsgId = messages.length ? messages[messages.length - 1].id : 0;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lastMsgId]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const body = text.trim();
    setText('');
    try { await api.sendMessage(withId, body); await load(); } catch (e) {} finally { setSending(false); }
  };

  const doDelete = async () => {
    setMenu(false);
    if (!window.confirm('Delete this entire chat? This cannot be undone.')) return;
    try { await api.deleteChat(withId); setMessages([]); } catch (e) {}
  };
  const doBlock = async () => {
    setMenu(false);
    if (!window.confirm(`Block ${withName}? They will be removed from your connections and can no longer message you.`)) return;
    try { await api.blockUser(withId); onBack(); } catch (e) {}
  };
  const doUnfriend = async () => {
    setMenu(false);
    if (!window.confirm(`Remove ${withName} from your connections? You can reconnect later.`)) return;
    try { await api.unfriendUser(withId); onBack(); } catch (e) {}
  };
  const doReport = async () => {
    setMenu(false);
    const reason = window.prompt('Briefly, what are you reporting? (optional)') || '';
    try { await api.reportUser(withId, reason); window.alert('Report submitted. Thank you.'); } catch (e) {}
  };

  const item = { display: 'flex', alignItems: 'center', gap: 9 };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', paddingBottom: 76, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="link" onClick={onBack}>‹ Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{withName}</h2>
          {peer && <div className="meta" style={{ fontSize: 11 }}>{[peer.exam, peer.country, peer.timezone].filter(Boolean).join(' · ')}</div>}
        </div>
        <div style={{ position: 'relative' }}>
          <button className="link" style={{ fontSize: 22, lineHeight: 1 }} onClick={() => setMenu(!menu)}>⋯</button>
          {menu && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 110 }} onClick={() => setMenu(false)} />
              <div className="popover">
                <button style={item} onClick={doDelete}><IcoTrash /> Delete chat</button>
                <button style={item} onClick={doUnfriend}><IcoLeave /> Unfriend</button>
                <button style={item} onClick={doBlock}><IcoBan /> Block user</button>
                <button style={{ ...item, color: 'var(--rust)' }} onClick={doReport}><IcoFlag /> Report user</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>
        {messages.length === 0 && <p className="sub" style={{ textAlign: 'center', marginTop: 20 }}>Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender == me.id;
          const parts = m.body.split(/(https?:\/\/[^\s]+)/g);
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 7, marginBottom: 8 }}>
              {!mine && <Avatar emoji={avatars[m.sender] || withAv} init={theirInit} />}
              <div style={{
                maxWidth: '72%', padding: '10px 13px', borderRadius: 14, fontSize: 14,
                background: mine ? 'var(--forest)' : 'var(--card)',
                color: mine ? '#ffffff' : 'var(--ink)',
                border: mine ? 'none' : '1.5px solid var(--line)',
                whiteSpace: 'pre-line', wordBreak: 'break-word',
              }}>
                {parts.map((p, i) =>
                  /^https?:\/\//.test(p)
                    ? <a key={i} href={p} target="_blank" rel="noreferrer" style={{ color: mine ? '#cdeee2' : 'var(--forest)', textDecoration: 'underline' }}>{p}</a>
                    : p
                )}
                <Stamp ts={m.created_at} light={mine} />
              </div>
              {mine && <Avatar emoji={avatars[m.sender] || me?.avatar} init={myInit} />}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--line)', position: 'sticky', bottom: 0, background: 'var(--paper)' }}>
        <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Type a message…"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <button onClick={send} disabled={sending} aria-label="Send" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--forest)', color: '#fff', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, opacity: sending ? 0.6 : 1 }}><SendIcon /></button>
      </div>
    </div>
  );
}

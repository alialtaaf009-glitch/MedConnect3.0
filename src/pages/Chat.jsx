import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';

export default function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const withId = params.get('with');
  const withName = params.get('name') || 'Chat';
  const withAv = params.get('av') || '';

  if (withId) return <Conversation me={user} withId={withId} withName={withName} withAv={withAv} onBack={() => nav('/chat')} />;
  return <ConversationList nav={nav} />;
}

function ConversationList({ nav }) {
  const [convos, setConvos] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    api.conversations().then((d) => { setConvos(d.conversations || []); setStatus('ok'); }).catch(() => setStatus('error'));
    // opening the Messages tab marks everything as read
    localStorage.setItem('chat_last_read', String(Date.now()));
  }, []);

  if (status === 'loading') return <div className="center">Loading…</div>;

  return (
    <div className="screen">
      <h1 className="h1" style={{ marginBottom: 14 }}>Messages</h1>
      {convos.length === 0 && (
        <p className="sub" style={{ textAlign: 'center', marginTop: 30 }}>
          No conversations yet. Connect with a partner, then start chatting from the Connections tab.
        </p>
      )}
      {convos.map((c) => {
        const init = (c.name || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
        return (
          <div key={c.other_id} className="row" style={{ cursor: 'pointer' }}
            onClick={() => nav(`/chat?with=${c.other_id}&name=${encodeURIComponent(c.name)}&av=${encodeURIComponent(c.avatar || '')}`)}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: c.avatar ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0 }}>{c.avatar || init}</div>
            <div className="grow">
              <div className="name">{c.name}</div>
              <div className="meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.last_sender == c.other_id ? '' : 'You: '}{c.last_body}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Conversation({ me, withId, withName, withAv, onBack }) {
  const [messages, setMessages] = useState([]);
  const myInit = (me?.name || 'Me').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const theirInit = (withName || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const Avatar = ({ emoji, init }) => (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: emoji ? 16 : 11, color: 'var(--forest)', fontWeight: 700, flexShrink: 0 }}>{emoji || init}</div>
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef(null);

  const load = () => api.conversation(withId).then((d) => setMessages(d.messages || [])).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [withId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

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

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 76px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="link" onClick={onBack}>‹ Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 600, flex: 1 }}>{withName}</h2>
        <button className="link" style={{ fontSize: 22, lineHeight: 1 }} onClick={() => setMenu(!menu)}>⋯</button>
      </div>

      {menu && (
        <div className="card" style={{ padding: 6, marginBottom: 10 }}>
          <button className="menu-item" onClick={doDelete}>🗑️ Delete chat</button>
          <button className="menu-item" onClick={doUnfriend}>👋 Unfriend</button>
          <button className="menu-item" onClick={doBlock}>🚫 Block user</button>
          <button className="menu-item danger" onClick={doReport}>⚑ Report user</button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 10 }}>
        {messages.length === 0 && <p className="sub" style={{ textAlign: 'center', marginTop: 20 }}>Say hello 👋</p>}
        {messages.map((m) => {
          const mine = m.sender == me.id;
          // make any URLs in the message tappable
          const parts = m.body.split(/(https?:\/\/[^\s]+)/g);
          return (
            <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 7, marginBottom: 8 }}>
              {!mine && <Avatar emoji={withAv} init={theirInit} />}
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
              </div>
              {mine && <Avatar emoji={me?.avatar} init={myInit} />}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
        <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Type a message…"
          value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <button className="btn-sm" onClick={send} disabled={sending}>Send</button>
      </div>
    </div>
  );
}

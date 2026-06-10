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
  const groupId = params.get('group');

  if (groupId) return <GroupConversation me={user} groupId={groupId} onBack={() => nav('/chat?tab=groups')} />;
  if (withId) return <Conversation me={user} withId={withId} withName={withName} withAv={withAv} onBack={() => nav('/chat')} />;
  return <ConversationList nav={nav} me={user} />;
}

function ConversationList({ nav, me }) {
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') === 'groups' ? 'groups' : 'direct');
  const [convos, setConvos] = useState([]);
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState('loading');
  const [creating, setCreating] = useState(false);
  const [gname, setGname] = useState('');
  const [friends, setFriends] = useState([]);
  const [picked, setPicked] = useState([]);

  useEffect(() => {
    api.conversations().then((d) => { setConvos(d.conversations || []); setStatus('ok'); }).catch(() => setStatus('error'));
    api.groups().then((d) => setGroups(d.groups || [])).catch(() => {});
    localStorage.setItem('chat_last_read', String(Date.now()));
  }, []);

  const openCreate = async () => {
    setCreating(true);
    try {
      const d = await api.connections();
      setFriends(d.connected || []);
    } catch (e) { setFriends([]); }
  };
  const togglePick = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const doCreate = async () => {
    if (!gname.trim()) { window.alert('Give your group a name.'); return; }
    try {
      const d = await api.createGroup(gname.trim(), picked);
      setCreating(false); setGname(''); setPicked([]);
      nav(`/chat?group=${d.group.id}`);
    } catch (e) { window.alert('Could not create group.'); }
  };

  if (status === 'loading') return <div className="center">Loading…</div>;

  return (
    <div className="screen">
      <h1 className="h1" style={{ marginBottom: 12 }}>Messages</h1>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab ${tab === 'direct' ? 'on' : ''}`} onClick={() => setTab('direct')}>Direct</button>
        <button className={`tab ${tab === 'groups' ? 'on' : ''}`} onClick={() => setTab('groups')}>Groups</button>
      </div>

      {tab === 'direct' && (
        <>
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
        </>
      )}

      {tab === 'groups' && (
        <>
          <button className="btn" style={{ marginBottom: 14 }} onClick={openCreate}>＋ Create study group</button>
          {groups.length === 0 && (
            <p className="sub" style={{ textAlign: 'center', marginTop: 20 }}>
              No study groups yet. Create one and invite your connections to study together.
            </p>
          )}
          {groups.map((g) => (
            <div key={g.id} className="row" style={{ cursor: 'pointer' }} onClick={() => nav(`/chat?group=${g.id}`)}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--forest)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, flexShrink: 0 }}>👥</div>
              <div className="grow">
                <div className="name">{g.name}</div>
                <div className="meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.member_count} member{g.member_count === 1 ? '' : 's'}{g.last_body ? ' · ' + g.last_body : ''}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {creating && (
        <div onClick={() => setCreating(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360, width: '100%' }}>
            <h2 className="serif" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>New study group</h2>
            <input className="input" placeholder="Group name (e.g. MRCP May 2026)" value={gname} onChange={(e) => setGname(e.target.value)} />
            <div className="label" style={{ marginTop: 4 }}>Invite connections</div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {friends.length === 0 && <p className="sub" style={{ fontSize: 13 }}>No connections yet to add. You can add people later.</p>}
              {friends.map((f) => (
                <button key={f.id} className="menu-item" onClick={() => togglePick(f.id)}>
                  <span>{(f.avatar || '🩺')} {f.name}</span>
                  <span style={{ marginLeft: 'auto' }}>{picked.includes(f.id) ? '✓' : '+'}</span>
                </button>
              ))}
            </div>
            <button className="btn" style={{ marginTop: 12 }} onClick={doCreate}>Create group</button>
            <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupConversation({ me, groupId, onBack }) {
  const [data, setData] = useState({ messages: [], members: [], group: null });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const endRef = useRef(null);

  const load = () => api.group(groupId).then((d) => setData(d)).catch(() => {});
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [groupId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [data.messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const b = text.trim(); setText('');
    try { await api.sendGroupMessage(groupId, b); await load(); } catch (e) {} finally { setSending(false); }
  };
  const openAdd = async () => {
    setMenu(false);
    try { const d = await api.connections(); setFriends(d.connected || []); } catch (e) { setFriends([]); }
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

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 76px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button className="link" onClick={onBack}>‹ Back</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{data.group?.name || 'Group'}</h2>
          <div className="meta">{(data.members || []).length} members</div>
        </div>
        <button className="link" style={{ fontSize: 22, lineHeight: 1 }} onClick={() => setMenu(!menu)}>⋯</button>
      </div>

      {menu && (
        <div className="card" style={{ padding: 6, marginBottom: 10 }}>
          <button className="menu-item" onClick={openAdd}>＋ Add a connection</button>
          <button className="menu-item" onClick={leave}>👋 Leave group</button>
          {isCreator && <button className="menu-item danger" onClick={del}>🗑️ Delete group</button>}
        </div>
      )}

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
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {addOpen && (
        <div onClick={() => setAddOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340, width: '100%' }}>
            <h2 className="serif" style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Add a connection</h2>
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

      <div style={{ display: 'flex', gap: 8, paddingTop: 10, borderTop: '1px solid var(--line)', position: 'sticky', bottom: 0, background: 'var(--paper)' }}>
        <input className="input" style={{ marginBottom: 0, flex: 1 }} placeholder="Message the group…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
        <button className="btn-sm" onClick={send} disabled={sending}>Send</button>
      </div>
    </div>
  );
}

function Conversation({ me, withId, withName, withAv, onBack }) {
  const [messages, setMessages] = useState([]);
  const [avatars, setAvatars] = useState({});
  const myInit = (me?.name || 'Me').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const theirInit = (withName || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
  const Avatar = ({ emoji, init }) => (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--paper-2)', border: '1px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: emoji ? 16 : 11, color: 'var(--forest)', fontWeight: 700, flexShrink: 0 }}>{emoji || init}</div>
  );
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [menu, setMenu] = useState(false);
  const endRef = useRef(null);

  const load = () => api.conversation(withId).then((d) => { setMessages(d.messages || []); if (d.avatars) setAvatars(d.avatars); }).catch(() => {});
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
        <button className="btn-sm" onClick={send} disabled={sending}>Send</button>
      </div>
    </div>
  );
    }
                                                                            

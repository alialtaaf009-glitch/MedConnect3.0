import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';
import { otherPerson } from '../components/ChatBits.jsx';
import GroupChat from '../components/GroupChat.jsx';
import DirectChat from '../components/DirectChat.jsx';

export default function Chat() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const withId = params.get('with');
  const withName = params.get('name') || 'Chat';
  const withAv = params.get('av') || '';
  const groupId = params.get('group');

  if (groupId) return <GroupChat me={user} groupId={groupId} onBack={() => nav('/chat?tab=groups')} />;
  if (withId) return <DirectChat me={user} withId={withId} withName={withName} withAv={withAv} onBack={() => nav('/chat')} />;
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

  // long-press to delete a chat
  const pressTimer = useRef(null);
  const longFired = useRef(false);
  const pressStart = (c) => {
    longFired.current = false;
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) {} }
      if (window.confirm(`Delete your chat with ${c.name}? This cannot be undone.`)) {
        api.deleteChat(c.other_id).then(() => setConvos((v) => v.filter((x) => x.other_id !== c.other_id))).catch(() => {});
      }
    }, 550);
  };
  const pressEnd = () => clearTimeout(pressTimer.current);

  useEffect(() => {
    api.conversations().then((d) => {
      const sorted = (d.conversations || []).slice().sort((a, b) => new Date(b.last_at) - new Date(a.last_at));
      setConvos(sorted); setStatus('ok');
    }).catch(() => setStatus('error'));
    api.groups().then((d) => setGroups(d.groups || [])).catch(() => {});
  }, []);

  const openCreate = async () => {
    setCreating(true);
    try {
      const d = await api.connections();
      setFriends((d.connected || []).map((c) => otherPerson(c, me?.id)));
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

  if (status === 'loading') return <div className="center" style={{minHeight:200}}><div className="spinner" /></div>;

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
          {convos.length > 0 && <p className="sub" style={{ fontSize: 11, marginBottom: 8 }}>Hold a chat to delete it.</p>}
          {convos.map((c) => {
            const init = (c.name || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
            const unread = c.last_sender == c.other_id && new Date(c.last_at).getTime() > Number(localStorage.getItem('chat_read_' + c.other_id) || 0);
            return (
              <div key={c.other_id} className="row" style={{ cursor: 'pointer' }}
                onTouchStart={() => pressStart(c)} onTouchEnd={pressEnd} onTouchMove={pressEnd}
                onMouseDown={() => pressStart(c)} onMouseUp={pressEnd} onMouseLeave={pressEnd}
                onContextMenu={(e) => e.preventDefault()}
                onClick={() => { if (longFired.current) return; nav(`/chat?with=${c.other_id}&name=${encodeURIComponent(c.name)}&av=${encodeURIComponent(c.avatar || '')}`); }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: c.avatar ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0 }}>{c.avatar || init}</div>
                <div className="grow">
                  <div className="name">{c.name}</div>
                  <div className="meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: unread ? 700 : 400, color: unread ? 'var(--ink)' : undefined }}>
                    {c.last_sender == c.other_id ? '' : 'You: '}{c.last_body}
                  </div>
                </div>
                {unread && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--rust)', flexShrink: 0 }} />}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>New study group</h2>
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


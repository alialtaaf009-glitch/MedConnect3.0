import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';
import { isOnline as online } from '../lib/presence';

export default function Connections() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('connected');
  const [data, setData] = useState({ connected: [], pending: [], requests: [] });
  const [status, setStatus] = useState('loading');

  const load = () => {
    setStatus('loading');
    api.connections().then((d) => { setData(d); setStatus('ok'); }).catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const respond = async (id, action) => { try { await api.respond(id, action); load(); } catch (e) {} };

  if (status === 'loading') return <div className="center">Loading…</div>;
  const list = data[tab] || [];

  return (
    <div className="screen">
      <div className="tabs">
        <button className="tab" onClick={() => nav('/partners')}>Discover</button>
        <button className="tab on">My connections</button>
      </div>
      <h1 className="h1" style={{ marginBottom: 14 }}>Connections</h1>
      <div className="tabs">
        {['connected','pending','requests'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase()+t.slice(1)} {data[t]?.length || 0}
          </button>
        ))}
      </div>
      {list.length === 0 && <p className="sub" style={{ textAlign:'center', marginTop:24 }}>Nothing here yet.</p>}
      {list.map((c) => {
        // "the other person" is whichever side isn't me
        const iAmRequester = c.requester == user.id;
        const name = iAmRequester ? c.recipient_name : c.requester_name;
        const exam = iAmRequester ? c.recipient_exam : c.requester_exam;
        const otherId = iAmRequester ? c.recipient : c.requester;
        const otherSeen = iAmRequester ? c.recipient_seen : c.requester_seen;
        return (
          <div key={c.id} className="row">
            <div className="grow">
              <div className="name">
                {tab === 'connected' && <span className={online(otherSeen) ? 'dot-online' : 'dot-offline'}></span>}
                {name}
              </div>
              <div className="meta">{exam}</div>
            </div>
            {tab === 'requests' ? (
              <div style={{ display:'flex', gap:7 }}>
                <button className="btn-sm" onClick={() => respond(c.id, 'accept')}>Accept</button>
                <button className="btn-sm ghost" onClick={() => respond(c.id, 'decline')}>✕</button>
              </div>
            ) : tab === 'connected' ? (
              <button className="btn-sm" onClick={() => nav(`/chat?with=${otherId}&name=${encodeURIComponent(name)}`)}>Message</button>
            ) : (
              <span className="pill pending">PENDING</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { examColor } from '../lib/examColors';
import { useAuth } from '../context/Auth.jsx';
import { isOnline as online } from '../lib/presence';

export default function Connections() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tab, setTab] = useState('connected');
  const [data, setData] = useState({ connected: [], pending: [], requests: [] });
  const [status, setStatus] = useState('loading');
  const [peek, setPeek] = useState(null);

  const load = () => {
    setStatus('loading');
    api.connections().then((d) => { setData(d); setStatus('ok'); }).catch(() => setStatus('error'));
  };
  useEffect(load, []);

  const respond = async (id, action) => { try { await api.respond(id, action); load(); } catch (e) {} };

  if (status === 'loading') return <div className="center" style={{minHeight:200}}><div className="spinner" /></div>;
  const list = data[tab] || [];

  return (
    <div className="screen">
      <div className="tabs">
        <button className="tab" onClick={() => nav('/partners')}>Discover</button>
        <button className="tab on">Study partners</button>
      </div>
      <h1 className="h1" style={{ marginBottom: 14 }}>Study partners</h1>
      <div className="tabs">
        {['connected','pending','requests'].map((t) => (
          <button key={t} className={`tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)} style={{ position: 'relative' }}>
            {t === 'connected' ? 'Partners' : t[0].toUpperCase()+t.slice(1)} {data[t]?.length || 0}
            {t === 'requests' && (data.requests?.length || 0) > 0 && (
              <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
            )}
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
        const av = iAmRequester ? c.recipient_avatar : c.requester_avatar;
        const init = (name || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');
        return (
          <div key={c.id} className="row" style={{ borderLeft: `4px solid ${examColor(exam)}` }}>
            <div onClick={() => setPeek({ name, exam, avatar: av, bio: iAmRequester ? c.recipient_bio : c.requester_bio })} style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: `2px solid ${examColor(exam)}`, display: 'grid', placeItems: 'center', fontSize: av ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>{av || init}</div>
            <div className="grow">
              <div className="name">
                {tab === 'connected' && <span className={online(otherSeen) ? 'dot-online' : 'dot-offline'}></span>}
                {name}
              </div>
              <div className="meta" style={{ color: examColor(exam), fontWeight: 700 }}>{exam}</div>
            </div>
            {tab === 'requests' ? (
              <div style={{ display:'flex', gap:7 }}>
                <button className="btn-sm" onClick={() => respond(c.id, 'accept')}>Accept</button>
                <button className="btn-sm ghost" onClick={() => respond(c.id, 'decline')}>✕</button>
              </div>
            ) : tab === 'connected' ? (
              <button className="btn-sm" onClick={() => nav(`/chat?with=${otherId}&name=${encodeURIComponent(name)}&av=${encodeURIComponent(av || '')}`)}>Message</button>
            ) : (
              <span className="pill pending">PENDING</span>
            )}
          </div>
        );
      })}
      {peek && (
        <div onClick={() => setPeek(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:100, padding:24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth:320, width:'100%', textAlign:'center' }}>
            <div style={{ width:70, height:70, borderRadius:'50%', background:'var(--paper-2)', border:'1.5px solid var(--line)', display:'grid', placeItems:'center', fontSize:34, margin:'0 auto 10px' }}>{peek.avatar || '🩺'}</div>
            <h2 className="serif" style={{ fontSize:19, fontWeight:700 }}>{peek.name}</h2>
            <p className="sub" style={{ fontSize:13 }}>{peek.exam}</p>
            {peek.bio && <p style={{ fontSize:13, fontStyle:'italic', color:'var(--muted)', marginTop:8, lineHeight:1.5 }}>“{peek.bio}”</p>}
            <button className="btn ghost" style={{ marginTop:14 }} onClick={() => setPeek(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}


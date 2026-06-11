import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { isOnline } from '../lib/presence';

export default function Partners() {
  const nav = useNavigate();
  const [matches, setMatches] = useState([]);
  const [status, setStatus] = useState('loading');
  const [err, setErr] = useState('');

  const load = () => {
    setStatus('loading');
    api.matches().then((d) => { setMatches(d.matches || []); setStatus('ok'); })
      .catch((e) => { setErr(e.message); setStatus('error'); });
  };
  useEffect(load, []);

  const connect = async (id) => {
    setMatches((m) => m.filter((x) => x.user.id !== id));
    try { await api.sendRequest(id); } catch (e) {}
  };

  const Toggle = () => (
    <div className="tabs">
      <button className="tab on">Discover</button>
      <button className="tab" onClick={() => nav('/connections')}>Study partners</button>
    </div>
  );

  if (status === 'loading') return <div className="screen"><Toggle /><div className="center">Loading…</div></div>;
  if (status === 'error') return <div className="screen"><Toggle /><div className="center" style={{ flexDirection:'column' }}><p>{err}</p><button className="link" onClick={load}>Try again</button></div></div>;

  return (
    <div className="screen">
      <Toggle />
      <h1 className="h1">Find partners</h1>
      <p className="sub" style={{ marginBottom: 14 }}>Matched by exam, country & timezone.</p>
      {matches.length === 0 && (
        <div className="card" style={{ textAlign:'center' }}>
          <p style={{ fontWeight:600, marginBottom:6 }}>No new partners to show right now</p>
          <p className="sub" style={{ fontSize:13 }}>
            People you've already connected with appear under your connections, not here.
            As more doctors join, new matches will show up on this screen.
          </p>
        </div>
      )}
      {matches.map((m) => (
        <div key={m.user.id} className="row">
          <div style={{ width:42, height:42, borderRadius:'50%', background:'var(--paper-2)', border:'1.5px solid var(--line)', display:'grid', placeItems:'center', fontSize:22, flexShrink:0 }}>{m.user.avatar || '🩺'}</div>
          <div className="grow">
            <div className="name">
              <span className={isOnline(m.user.last_seen) ? 'dot-online' : 'dot-offline'}></span>
              {m.user.name}
            </div>
            <div className="meta">{m.user.exam} · {m.user.country} · {m.matchPercent}% match</div>
          </div>
          <button className="btn-sm" onClick={() => connect(m.user.id)}>Connect</button>
        </div>
      ))}
    </div>
  );
}


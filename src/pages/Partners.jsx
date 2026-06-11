import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { isOnline } from '../lib/presence';

export default function Partners() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const filterExam = params.get('exam');   // e.g. "MRCP" or "SMLE"
  const filterPart = params.get('part');   // e.g. "PACES"
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

  // When the user tapped a specific exam from Home, only show partners on that exam.
  // We match on the exam family (text before "—") so "MRCP" matches "MRCP — PACES", etc.
  const examLabel = filterExam ? (filterPart ? `${filterExam} ${filterPart}` : filterExam) : null;
  const visible = filterExam
    ? matches.filter((m) => {
        const theirFamily = (m.user.exam || '').split('—')[0].trim().toLowerCase();
        const want = filterExam.trim().toLowerCase();
        return theirFamily === want || (m.user.exam || '').toLowerCase().includes(want);
      })
    : matches;

  const Toggle = () => (
    <div className="tabs">
      <button className="tab on">Discover</button>
      <button className="tab" onClick={() => nav('/connections')}>Study partners</button>
    </div>
  );

  if (status === 'loading') return <div className="screen"><Toggle /><div className="center" style={{minHeight:200}}><div className="spinner" /></div></div>;
  if (status === 'error') return <div className="screen"><Toggle /><div className="center" style={{ flexDirection:'column' }}><p>{err}</p><button className="link" onClick={load}>Try again</button></div></div>;

  return (
    <div className="screen">
      <Toggle />
      <h1 className="h1">{examLabel ? `${examLabel} partners` : 'Find partners'}</h1>
      <p className="sub" style={{ marginBottom: 14 }}>
        {examLabel ? 'Doctors preparing for this exam.' : 'Matched by exam, country & timezone.'}
        {filterExam && <> · <button className="link" onClick={() => nav('/partners')}>Show all</button></>}
      </p>

      {visible.length === 0 && filterExam && (
        <div className="card" style={{ textAlign:'center' }}>
          <p style={{ fontWeight:700, fontSize:16, marginBottom:6 }}>No {examLabel} partners yet 🌱</p>
          <p className="sub" style={{ fontSize:13, lineHeight:1.55 }}>
            You're early! MedConnect's just getting started, so your exam's still filling up.
            Be the first — or invite a colleague to study with you.
          </p>
        </div>
      )}

      {visible.length === 0 && !filterExam && (
        <div className="card" style={{ textAlign:'center' }}>
          <p style={{ fontWeight:600, marginBottom:6 }}>No new partners to show right now</p>
          <p className="sub" style={{ fontSize:13 }}>
            People you've already connected with appear under your connections, not here.
            As more doctors join, new matches will show up on this screen.
          </p>
        </div>
      )}

      {visible.map((m) => (
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


import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { examColor } from '../lib/examColors';
import { useAuth } from '../context/Auth.jsx';
import { isOnline } from '../lib/presence';

// Local starring of partners (this device). Stored as an array of partner ids.
const STAR_KEY = 'starred_partners_v1';
const loadStars = () => { try { return JSON.parse(localStorage.getItem(STAR_KEY) || '[]'); } catch (e) { return []; } };
const saveStars = (arr) => { try { localStorage.setItem(STAR_KEY, JSON.stringify(arr)); } catch (e) {} };

export default function Partners() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const filterExam = params.get('exam');
  const filterPart = params.get('part');

  const initialTab = params.get('tab') === 'mine' ? 'mine' : params.get('tab') === 'requests' ? 'requests' : 'discover';
  const [tab, setTab] = useState(initialTab);

  const [matches, setMatches] = useState([]);
  const [conns, setConns] = useState({ connected: [], pending: [], requests: [] });
  const [mStatus, setMStatus] = useState('loading');
  const [cStatus, setCStatus] = useState('loading');
  const [err, setErr] = useState('');
  const [peek, setPeek] = useState(null);
  const [stars, setStars] = useState(loadStars());

  const loadMatches = () => {
    setMStatus('loading');
    api.matches().then((d) => { setMatches(d.matches || []); setMStatus('ok'); })
      .catch((e) => { setErr(e.message); setMStatus('error'); });
  };
  const loadConns = () => {
    setCStatus('loading');
    api.connections().then((d) => { setConns({ connected: d.connected || [], pending: d.pending || [], requests: d.requests || [] }); setCStatus('ok'); })
      .catch(() => setCStatus('error'));
  };
  useEffect(() => { loadMatches(); loadConns(); }, []);

  const connect = async (id) => {
    setMatches((m) => m.filter((x) => x.user.id !== id));
    try { await api.sendRequest(id); loadConns(); } catch (e) {}
  };
  const respond = async (id, action) => { try { await api.respond(id, action); loadConns(); } catch (e) {} };

  const toggleStar = (id) => {
    setStars((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      saveStars(next);
      return next;
    });
  };

  const examLabel = filterExam ? (filterPart ? `${filterExam} ${filterPart}` : filterExam) : null;
  const visibleMatches = filterExam
    ? matches.filter((m) => {
        const theirFamily = (m.user.exam || '').split('—')[0].trim().toLowerCase();
        const want = filterExam.trim().toLowerCase();
        return theirFamily === want || (m.user.exam || '').toLowerCase().includes(want);
      })
    : matches;

  const reqCount = conns.requests?.length || 0;

  const other = (c) => {
    const iAmRequester = c.requester == user.id;
    return {
      name: iAmRequester ? c.recipient_name : c.requester_name,
      exam: iAmRequester ? c.recipient_exam : c.requester_exam,
      id: iAmRequester ? c.recipient : c.requester,
      seen: iAmRequester ? c.recipient_seen : c.requester_seen,
      avatar: iAmRequester ? c.recipient_avatar : c.requester_avatar,
      bio: iAmRequester ? c.recipient_bio : c.requester_bio,
    };
  };
  const initials = (name) => (name || 'Dr').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');

  const myPartners = [...(conns.connected || [])].sort((a, b) => {
    const sa = stars.includes(other(a).id) ? 1 : 0;
    const sb = stars.includes(other(b).id) ? 1 : 0;
    return sb - sa;
  });

  const Tabs = () => (
    <div className="tabs" style={{ marginBottom: 18 }}>
      {[['discover', 'Discover'], ['mine', 'My Partners'], ['requests', 'Requests']].map(([key, label]) => (
        <button key={key} className={`tab ${tab === key ? 'on' : ''}`} onClick={() => setTab(key)} style={{ position: 'relative' }}>
          {label}
          {key === 'requests' && reqCount > 0 && <span className="tab-dot" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <h1 className="h1" style={{ fontFamily: "'Fraunces',Georgia,serif", color: 'var(--forest)' }}>Study Partners</h1>
      <p className="sub" style={{ marginBottom: 14 }}>Find, connect, and study together.</p>

      <Tabs />

      {tab === 'discover' && (
        <>
          {examLabel && (
            <p className="sub" style={{ marginBottom: 14 }}>
              Showing {examLabel} partners · <button className="link" onClick={() => nav('/partners')}>Show all</button>
            </p>
          )}
          {mStatus === 'loading' && <div className="center" style={{ minHeight: 160 }}><div className="spinner" /></div>}
          {mStatus === 'error' && <div className="center" style={{ flexDirection: 'column' }}><p>{err}</p><button className="link" onClick={loadMatches}>Try again</button></div>}
          {mStatus === 'ok' && visibleMatches.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{examLabel ? `No ${examLabel} partners yet 🌱` : 'No new partners right now'}</p>
              <p className="sub" style={{ fontSize: 13, lineHeight: 1.55 }}>
                {examLabel ? "You're early! Be the first — or invite a colleague to study with you." : 'As more doctors join, new matches will show up here.'}
              </p>
            </div>
          )}
          {mStatus === 'ok' && visibleMatches.map((m) => (
            <div key={m.user.id} className="row" style={{ borderLeft: `4px solid ${examColor(m.user.exam)}` }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: `2px solid ${examColor(m.user.exam)}`, display: 'grid', placeItems: 'center', fontSize: 22, flexShrink: 0 }}>{m.user.avatar || '🩺'}</div>
              <div className="grow">
                <div className="name">
                  <span className={isOnline(m.user.last_seen) ? 'dot-online' : 'dot-offline'}></span>
                  {m.user.name}
                </div>
                <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span><span style={{ color: examColor(m.user.exam), fontWeight: 700 }}>{m.user.exam}</span> · {m.user.country}</span>
                  <span className={`match-pill ${m.matchPercent >= 80 ? 'pill-exc' : m.matchPercent >= 55 ? 'pill-good' : 'pill-fair'}`}>
                    {m.matchPercent}% · {m.matchPercent >= 80 ? 'Excellent' : m.matchPercent >= 55 ? 'Good' : 'Fair'}
                  </span>
                </div>
              </div>
              <button className="btn-sm btn-cta" onClick={() => connect(m.user.id)}>Connect</button>
            </div>
          ))}
        </>
      )}

      {tab === 'mine' && (
        <>
          {cStatus === 'loading' && <div className="center" style={{ minHeight: 160 }}><div className="spinner" /></div>}
          {cStatus === 'ok' && myPartners.length === 0 && (conns.pending?.length || 0) === 0 && (
            <p className="sub" style={{ textAlign: 'center', marginTop: 24 }}>No partners yet. Head to Discover to connect with someone!</p>
          )}
          {myPartners.map((c) => {
            const o = other(c);
            const starred = stars.includes(o.id);
            return (
              <div key={c.id} className="row">
                <div onClick={() => setPeek({ name: o.name, exam: o.exam, avatar: o.avatar, bio: o.bio })} style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: o.avatar ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>{o.avatar || initials(o.name)}</div>
                <div className="grow">
                  <div className="name"><span className={isOnline(o.seen) ? 'dot-online' : 'dot-offline'}></span>{o.name}</div>
                  <div className="meta" style={{ color: examColor(o.exam), fontWeight: 700 }}>{o.exam}</div>
                </div>
                <button className="star-btn" onClick={() => toggleStar(o.id)} aria-label={starred ? 'Unstar' : 'Star'} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: starred ? 'var(--gold)' : 'var(--subtle)', marginRight: 4 }}>{starred ? '★' : '☆'}</button>
                <button className="btn-sm" onClick={() => nav(`/chat?with=${o.id}&name=${encodeURIComponent(o.name)}&av=${encodeURIComponent(o.avatar || '')}`)}>Message</button>
              </div>
            );
          })}
          {(conns.pending?.length || 0) > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--subtle)', margin: '18px 2px 8px' }}>Awaiting their reply</div>
              {conns.pending.map((c) => {
                const o = other(c);
                return (
                  <div key={c.id} className="row">
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: o.avatar ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0 }}>{o.avatar || initials(o.name)}</div>
                    <div className="grow">
                      <div className="name">{o.name}</div>
                      <div className="meta" style={{ color: examColor(o.exam), fontWeight: 700 }}>{o.exam}</div>
                    </div>
                    <span className="pill pending">PENDING</span>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {cStatus === 'loading' && <div className="center" style={{ minHeight: 160 }}><div className="spinner" /></div>}
          {cStatus === 'ok' && reqCount === 0 && (
            <p className="sub" style={{ textAlign: 'center', marginTop: 24 }}>No requests right now. When someone asks to study with you, they'll appear here.</p>
          )}
          {conns.requests.map((c) => {
            const o = other(c);
            return (
              <div key={c.id} className="row">
                <div onClick={() => setPeek({ name: o.name, exam: o.exam, avatar: o.avatar, bio: o.bio })} style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: o.avatar ? 22 : 15, color: 'var(--forest)', fontWeight: 600, flexShrink: 0, cursor: 'pointer' }}>{o.avatar || initials(o.name)}</div>
                <div className="grow">
                  <div className="name">{o.name}</div>
                  <div className="meta" style={{ color: examColor(o.exam), fontWeight: 700 }}>{o.exam}</div>
                </div>
                <div style={{ display: 'flex', gap: 7 }}>
                  <button className="btn-sm" onClick={() => respond(c.id, 'accept')}>Accept</button>
                  <button className="btn-sm ghost" onClick={() => respond(c.id, 'decline')}>✕</button>
                </div>
              </div>
            );
          })}
        </>
      )}

      {peek && (
        <div onClick={() => setPeek(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320, width: '100%', textAlign: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 34, margin: '0 auto 10px' }}>{peek.avatar || '🩺'}</div>
            <h2 className="serif" style={{ fontSize: 19, fontWeight: 700 }}>{peek.name}</h2>
            <p className="sub" style={{ fontSize: 13 }}>{peek.exam}</p>
            {peek.bio && <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>“{peek.bio}”</p>}
            <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => setPeek(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

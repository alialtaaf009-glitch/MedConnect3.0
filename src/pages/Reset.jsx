import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token');

  // Stage 1: request a reset (no token in URL)
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // Stage 2: set new password (token in URL)
  const [pw, setPw] = useState('');

  const request = async () => {
    setBusy(true); setMsg(''); setLink('');
    try {
      const d = await api.resetRequest(email);
      // until email is configured, the API returns a test link
      if (d.resetLink) setLink(d.resetLink);
      setMsg('If that email exists, a reset link has been created.');
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  const confirm = async () => {
    setBusy(true); setMsg('');
    try {
      await api.resetConfirm(token, pw);
      setMsg('Password updated! Redirecting to sign in…');
      setTimeout(() => nav('/'), 1500);
    } catch (e) { setMsg(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="screen" style={{ paddingTop: 50 }}>
      <button className="link" onClick={() => nav('/')}>‹ Back to sign in</button>
      <h1 className="h1" style={{ margin: '14px 0 8px' }}>Reset password</h1>

      {!token ? (
        <>
          <p className="sub" style={{ marginBottom: 16 }}>Enter your email and we'll send a reset link.</p>
          <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn" onClick={request} disabled={busy}>{busy ? 'Please wait…' : 'Send reset link'}</button>
          {link && (
            <div className="card" style={{ marginTop: 16 }}>
              <p className="sub" style={{ fontSize: 12 }}>Email isn't configured yet, so here's your test link:</p>
              <button className="link" onClick={() => nav(link)}>Open reset link ›</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="sub" style={{ marginBottom: 16 }}>Choose a new password.</p>
          <input className="input" placeholder="New password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button className="btn" onClick={confirm} disabled={busy}>{busy ? 'Saving…' : 'Set new password'}</button>
        </>
      )}
      {msg && <p style={{ color: 'var(--forest)', fontSize: 13, marginTop: 12 }}>{msg}</p>}
    </div>
  );
}

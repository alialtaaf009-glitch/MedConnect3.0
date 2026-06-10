import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';

export default function SignIn() {
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      if (mode === 'register') await register(name, email, password);
      else await login(email, password);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="screen" style={{ paddingTop: 44, textAlign: 'center' }}>
      <img src="/pwa-192.png" alt="MedConnect" style={{ width: 72, height: 72, borderRadius: 16, margin: '0 auto 16px', display: 'block' }} />
      <h1 className="h1">MedConnect</h1>
      <p className="sub" style={{ marginBottom: 18 }}>— Connect. Study. Succeed. —</p>

      <div style={{ marginBottom: 26 }}>
        <div style={{ fontWeight: 700, color: 'var(--teal)', fontSize: 13, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 8 }}>
          For doctors, by doctors
        </div>
        <p style={{ color: 'var(--ink)', fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          Find the right study partner for your medical exam.
        </p>
        <p className="sub" style={{ fontSize: 13.5, lineHeight: 1.5, marginTop: 0 }}>
          Match with verified doctors preparing for the same boards, the same exam parts, and on a compatible timeline — wherever they are in the world.
        </p>
      </div>

      {mode === 'register' && (
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <input className="input" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

      {err && <p style={{ color: 'var(--rose)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
      <button className="btn" onClick={submit} disabled={busy}>
        {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in'}
      </button>
      <button className="link" style={{ marginTop: 16 }} onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Create an account' : 'Have an account? Sign in'}
      </button>
      {mode === 'login' && (
        <button className="link" style={{ display: 'block', margin: '10px auto 0', color: 'var(--muted)' }} onClick={() => nav('/reset')}>
          Forgot password?
        </button>
      )}
      <p className="sub" style={{ fontSize: 11, marginTop: 24 }}>
        Your clinical data stays private — never sold, never advertised against.{' '}
        <button className="link" style={{ fontSize: 11, padding: 0 }} onClick={() => nav('/legal')}>Privacy & Terms</button>
      </p>
    </div>
  );
}


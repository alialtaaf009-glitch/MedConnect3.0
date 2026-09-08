import { useState, useEffect } from 'react';
import { pushSupported, isSubscribed, subscribePush } from '../lib/push.js';

// Shows once, the first time someone reaches Home with push notifications
// available but not yet turned on. Explains the value BEFORE triggering the
// real browser permission dialog — asking cold tends to get auto-declined,
// and once declined, re-enabling requires digging into device settings.
export default function NotifyPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!pushSupported()) return;
      if (localStorage.getItem('notif_prompted')) return;
      const already = await isSubscribed().catch(() => false);
      if (already) { localStorage.setItem('notif_prompted', '1'); return; }
      setShow(true);
    })();
  }, []);

  const dismiss = () => { localStorage.setItem('notif_prompted', '1'); setShow(false); };

  const enable = async () => {
    setBusy(true);
    try { await subscribePush(); } catch (e) {}
    setBusy(false);
    dismiss();
  };

  if (!show) return null;

  return (
    <div onClick={dismiss} style={{ position: 'fixed', inset: 0, zIndex: 3500, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 14px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, background: 'var(--paper)', borderRadius: 22, padding: '26px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 19, marginBottom: 8, color: 'var(--ink)' }}>Never miss a message</div>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.55, marginBottom: 22 }}>
          Turn on notifications to know instantly when a study partner messages you or sends a request.
        </p>
        <button className="btn" onClick={enable} disabled={busy} style={{ marginBottom: 10 }}>
          {busy ? 'Enabling…' : 'Enable notifications'}
        </button>
        <button className="btn ghost" onClick={dismiss}>Not now</button>
      </div>
    </div>
  );
}

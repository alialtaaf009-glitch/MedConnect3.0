import { useAuth } from '../context/Auth.jsx';

const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const FEATURES = [
  ['🎨', 'More colours & themes', 'Exclusive wallpaper backgrounds, gradients and fonts for your motivation quotes.'],
  ['🩺', 'Full OSCE station bank', 'Every station for your exam — not just the free three — with marking schemes and timed mock circuits.'],
  ['🌿', 'More Take a Break exercises', 'New guided breathing patterns, quick stretches and reset routines to study calmer.'],
];

export default function Pro() {
  const { user } = useAuth();
  const isPro = user?.pro_active;

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ fontSize: 40, marginBottom: 6 }}>👑</div>
        <h1 className="h1" style={{ fontFamily: "'Fraunces',Georgia,serif", color: 'var(--forest)', marginBottom: 4 }}>MedConnect Pro</h1>
        {isPro
          ? <p className="sub">You're a Pro member — thank you for supporting MedConnect 💛</p>
          : <p className="sub" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gold)' }}>Coming soon</p>}
      </div>

      {FEATURES.map(([ic, title, desc]) => (
        <div key={title} className="row" style={{ alignItems: 'flex-start', gap: 13, opacity: isPro ? 1 : 0.92 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 21, flexShrink: 0 }}>{ic}</div>
          <div className="grow">
            <div className="name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {title}
              {!isPro && <span style={{ color: 'var(--subtle)', display: 'inline-flex' }}><LockIcon size={13} /></span>}
            </div>
            <div className="meta" style={{ color: 'var(--muted)', fontWeight: 400, lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
          </div>
        </div>
      ))}

      {!isPro && (
        <div className="card" style={{ marginTop: 16, textAlign: 'center', background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-2) 100%)', color: '#fff', border: 'none' }}>
          <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 16, lineHeight: 1.5, marginBottom: 4 }}>
            We're crafting a premium tier for doctors who want more from MedConnect.
          </p>
          <p style={{ fontSize: 12, opacity: 0.85 }}>It's on the way — everything in the app today stays free.</p>
        </div>
      )}
    </div>
  );
}


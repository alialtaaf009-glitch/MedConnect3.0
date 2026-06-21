const LockIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const FEATURES = [
  ['🌈', 'More colours & themes', 'Exclusive wallpaper backgrounds and fonts for your quotes.'],
  ['🩺', 'Full OSCE station bank', 'Every station for your exam, with marking schemes and timed mocks.'],
  ['🌿', 'More Take a Break exercises', 'New guided breathing patterns and quick reset routines.'],
  ['⬇', 'Export your flashcards', 'Download any deck as CSV — import straight into Anki, Excel, or Sheets.'],
];

export default function Pro() {
  const isPro = false; // payments not live yet — everyone sees the upgrade view

  const notify = () => {
    const subject = encodeURIComponent('Notify me about MedConnect Pro');
    const body = encodeURIComponent("Hi MedConnect team,\n\nI'd love to be notified when MedConnect Pro becomes available.\n\nThanks!");
    window.location.href = `mailto:medconnectsupport.io@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="screen">
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>👑</div>
        <h1 className="h1" style={{ fontFamily: "'Fraunces',Georgia,serif", color: 'var(--forest)', marginBottom: 6 }}>MedConnect Pro</h1>
        {isPro
          ? <p className="sub">You're a Pro member — thank you for supporting MedConnect 💛</p>
          : <p className="sub" style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)' }}>Coming soon</p>}
      </div>

      {FEATURES.map(([ic, title, desc]) => (
        <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 2px' }}>
          <div style={{ fontSize: 24, flexShrink: 0, width: 30, textAlign: 'center' }}>{ic}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}>
              {title}
              {!isPro && <span style={{ color: 'var(--subtle)', display: 'inline-flex' }}><LockIcon /></span>}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5, marginTop: 2 }}>{desc}</div>
          </div>
        </div>
      ))}

      {!isPro && (
        <div style={{ marginTop: 22, textAlign: 'center' }}>
          <button className="btn" style={{ maxWidth: 260, margin: '0 auto' }} onClick={notify}>Notify me when available</button>
          <p className="sub" style={{ fontSize: 11.5, marginTop: 12, lineHeight: 1.5 }}>Everything in the app today stays free. Pro just adds more.</p>
        </div>
      )}
    </div>
  );
}

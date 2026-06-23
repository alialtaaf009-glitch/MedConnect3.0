export default function AboutDev() {
  return (
    <div className="screen">
      <h1 className="h1">About the developer</h1>

      <div className="card" style={{ textAlign: 'center', padding: '22px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 36, boxShadow: '0 4px 12px rgba(31,77,63,.18)' }}>👨‍⚕️</div>
            <span style={{ position: 'absolute', top: -4, right: -6, fontSize: 22 }}>✨</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>Dr. Ali Altaf</div>
        <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>MBBS &middot; Founder &amp; Developer</div>
        <div style={{ fontSize: 12, color: 'var(--rust)', fontWeight: 700, marginTop: 6, letterSpacing: 0.5 }}>Doctor. Dreamer. Builder.</div>
        <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink)', marginTop: 14 }}>
          Built by a doctor who understands the challenges of exam preparation. MedConnect was created to make studying less isolated and more collaborative.
        </p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 12, fontStyle: 'italic' }}>
          Made with care in Lahore, Pakistan. 🌿
        </p>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'stretch', background: 'var(--paper-2)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🌙</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>many nights<br />of coffee</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)', alignSelf: 'stretch', margin: '10px 0' }} />
          <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>💻</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>built with<br />lots of code</div>
          </div>
          <div style={{ width: 1, background: 'var(--line)', alignSelf: 'stretch', margin: '10px 0' }} />
          <div style={{ flex: 1, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>🩺</div>
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>for doctors,<br />by a doctor</div>
          </div>
        </div>
      </div>
    </div>
  );
}


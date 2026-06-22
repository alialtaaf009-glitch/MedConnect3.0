import { useNavigate } from 'react-router-dom';

export default function About() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <h1 className="h1">About MedConnect</h1>

      <div className="card" style={{ lineHeight: 1.65 }}>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: 'var(--forest)', marginBottom: 14 }}>
          Preparing for medical licensing exams is a rigorous and often isolating journey. MedConnect was created to change that.
        </p>
        <p style={{ marginBottom: 12 }}>
          We connect doctors worldwide preparing for the same professional milestones, including USMLE, MRCP, PLAB, FCPS and many more, to foster meaningful, peer-to-peer study partnerships. Whether you are seeking a study partner in your timezone, accountability for your revision schedule, or a collaborator for OSCE practice, our platform bridges the gap.
        </p>
        <p style={{ marginBottom: 12 }}>
          Your professional data and privacy are held to the highest standard, ensuring a secure environment for your study journey.
        </p>
        <p style={{ marginBottom: 12 }}>
          Built on the simple principle that clinicians study better together, MedConnect is designed to help you stay focused, practice effectively, and succeed, one revision at a time.
        </p>
        <p style={{ marginBottom: 0, color: 'var(--muted)', fontWeight: 600 }}>
          Built by doctors, for doctors.
        </p>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 900, color: 'var(--forest)' }}>MedConnect</div>
        <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 700, marginTop: 4 }}>Connect · Study · Succeed</div>
        <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 10 }}>Version 1.1.1</div>
      </div>

      <button className="btn ghost" onClick={() => nav('/legal')} style={{ marginTop: 4 }}>Privacy &amp; Terms</button>

      {/* About the developer */}
      <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0 14px' }} />
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 800, color: 'var(--forest)', marginBottom: 10, textAlign: 'center' }}>About the developer</h2>
      <div className="card" style={{ textAlign: 'center', padding: '18px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ position: 'relative', width: 64, height: 64 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', fontSize: 32, boxShadow: '0 4px 12px rgba(31,77,63,.18)' }}>👨‍⚕️</div>
            <span style={{ position: 'absolute', top: -4, right: -6, fontSize: 20 }}>✨</span>
          </div>
        </div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>Dr. Ali Altaf</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>MBBS &middot; Founder &amp; Developer</div>
        <div style={{ fontSize: 11.5, color: 'var(--rust)', fontWeight: 700, marginTop: 6, letterSpacing: 0.5 }}>Doctor. Dreamer. Builder.</div>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--ink)', marginTop: 12 }}>
          Built by a doctor who understands the challenges of exam preparation. MedConnect was created to make studying less isolated and more collaborative.
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 12, fontStyle: 'italic' }}>
          Made with care in Lahore, Pakistan. 🌿
        </p>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'stretch', background: 'var(--paper-2)', borderRadius: 14, overflow: 'hidden' }}>
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

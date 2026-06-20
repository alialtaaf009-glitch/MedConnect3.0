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

      {/* ===== About the developer ===== */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 30, marginBottom: 4 }}>
        <SparkIcon size={20} />
        <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 24, fontWeight: 900, color: 'var(--forest)' }}>
          About the developer
        </h2>
      </div>
      <div style={{ width: 54, height: 3, borderRadius: 3, background: 'var(--forest)', margin: '0 auto 18px' }} />

      <div className="card" style={{ textAlign: 'center', padding: '28px 22px', borderRadius: 28 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 132, height: 132, borderRadius: '50%', background: '#d8e4cc', overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 58, lineHeight: 1 }}>
            🩺
          </div>
          {/* gold accent lines */}
          <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: 'absolute', top: -4, right: -10 }}>
            <g stroke="#f0b429" strokeWidth="3.4" strokeLinecap="round">
              <line x1="7" y1="22" x2="17" y2="16" />
              <line x1="12" y1="31" x2="22" y2="26" />
              <line x1="4" y1="12" x2="14" y2="7" />
            </g>
          </svg>
        </div>

        {/* Name + role */}
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 30, fontWeight: 900, color: 'var(--ink, #14342a)', lineHeight: 1.1 }}>
          Dr. Ali Altaf
        </div>
        <div style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600, marginTop: 6 }}>
          MBBS · Founder &amp; Developer
        </div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'var(--paper-2, #e7ecdd)', borderRadius: 999, padding: '10px 18px', marginTop: 18 }}>
          <HeartOutline />
          <span style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: 0.6, color: 'var(--forest)' }}>DOCTOR. DREAMER. BUILDER.</span>
        </div>

        {/* divider */}
        <div style={{ width: 56, height: 1, background: 'var(--line)', margin: '20px auto' }} />

        {/* bio */}
        <p style={{ fontSize: 17, lineHeight: 1.7, color: '#3a4a40', maxWidth: 380, margin: '0 auto' }}>
          MedConnect was born from my own experience preparing for licensing exams. From endless nights of studying to building this app — it&apos;s my way of paying it forward. <span style={{ color: '#7cb342' }}>&#9829;</span>
        </p>

        {/* stat boxes */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: '#eef1e6', borderRadius: 20, padding: '22px 8px', marginTop: 24 }}>
          <Stat label="Many nights of coffee"><MoonIcon /></Stat>
          <Sep />
          <Stat label="Built with lots of code"><CodeIcon /></Stat>
          <Sep />
          <Stat label="For doctors, by a doctor"><StethIcon /></Stat>
        </div>

        {/* footer */}
        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontStyle: 'italic', fontSize: 17, color: 'var(--forest)', marginTop: 22 }}>
          Made with care in Lahore, Pakistan 🌿
        </p>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function Stat({ children, label }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '0 6px' }}>
      {children}
      <span style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3, color: '#2c3b32' }}>{label}</span>
    </div>
  );
}
function Sep() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />;
}
function MoonIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6.4 6.4 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      <path d="M19 3v4" /><path d="M17 5h4" />
    </svg>
  );
}
function CodeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
      <line x1="14.5" y1="4" x2="9.5" y2="20" />
    </svg>
  );
}
function StethIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}
function HeartOutline() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rust, #c0533f)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}
function SparkIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="var(--gold, #d4a537)">
      <path d="M12 2l1.7 6.6L20 10l-6.3 1.4L12 18l-1.7-6.6L4 10l6.3-1.4z" />
    </svg>
  );
}

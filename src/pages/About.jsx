import { useNavigate } from 'react-router-dom';
import aliAvatar from '../assets/ali-avatar.png';

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
      <div style={{ borderTop: '1px solid var(--line)', margin: '28px 0 16px' }} />
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 900, color: 'var(--forest)', marginBottom: 12, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ color: 'var(--gold, #b98a2e)' }}>✨</span>
        About the developer
      </h2>

      <div className="card" style={{ textAlign: 'center', padding: '24px 18px' }}>
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 104, height: 104, borderRadius: '50%', background: 'var(--paper-2, #e6ecdd)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
            <img src={aliAvatar} alt="Dr. Ali Altaf" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ position: 'absolute', top: -2, right: -6, fontSize: 18 }}>✨</span>
        </div>

        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 900, color: 'var(--ink)' }}>Dr. Ali Altaf</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600, marginTop: 3 }}>MBBS · Founder &amp; Developer</div>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'var(--paper-2, #e6ecdd)', borderRadius: 999, padding: '8px 16px', marginTop: 14 }}>
          <span style={{ color: 'var(--rust, #c0533f)' }}>♥</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: 0.6, color: 'var(--forest)' }}>DOCTOR. DREAMER. BUILDER.</span>
        </div>

        {/* small divider */}
        <div style={{ width: 56, height: 1, background: 'var(--line)', margin: '18px auto' }} />

        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink)', maxWidth: 360, margin: '0 auto' }}>
          MedConnect was born from my own experience preparing for licensing exams. From endless nights of studying to building this app &mdash; it&apos;s my way of paying it forward. <span style={{ color: 'var(--rust, #c0533f)' }}>&#9829;</span>
        </p>

        {/* Stat boxes */}
        <div style={{ display: 'flex', alignItems: 'stretch', background: 'var(--paper-2, #eef2e6)', borderRadius: 18, padding: '18px 6px', marginTop: 20 }}>
          <Stat emoji="🌙" label="Many nights of coffee" />
          <Sep />
          <Stat emoji="</>" label="Built with lots of code" mono />
          <Sep />
          <Stat emoji="🩺" label="For doctors, by a doctor" />
        </div>

        <p style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontStyle: 'italic', color: 'var(--forest)', marginTop: 18 }}>
          Made with care in Lahore, Pakistan 🌿
        </p>
      </div>
    </div>
  );
}

function Stat({ emoji, label, mono }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 4px' }}>
      <span style={{ fontSize: mono ? 18 : 22, fontWeight: mono ? 800 : 400, color: 'var(--forest)', fontFamily: mono ? 'ui-monospace, monospace' : 'inherit', lineHeight: 1 }}>
        {emoji}
      </span>
      <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.25, color: 'var(--ink)' }}>{label}</span>
    </div>
  );
}

function Sep() {
  return <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />;
}

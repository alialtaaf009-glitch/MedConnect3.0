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
      <div style={{ borderTop: '1px solid var(--line)', margin: '28px 0 16px' }} />
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 900, color: 'var(--forest)', marginBottom: 12, textAlign: 'center' }}>About the developer</h2>
      <div className="card" style={{ textAlign: 'center', padding: '20px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <img src="/ali-avatar.png" alt="Dr. Ali Altaf"
            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 14px rgba(31,77,63,.25)', border: '2px solid var(--card)' }} />
        </div>
        <div style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 900, color: 'var(--ink)' }}>Dr. Ali Altaf</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginTop: 2, letterSpacing: 0.3 }}>MBBS · Founder &amp; Developer</div>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14.5, lineHeight: 1.65, color: 'var(--ink)', marginTop: 14, textAlign: 'left' }}>
          A doctor by training, MedConnect was born from my own experience preparing for licensing exams &mdash; long nights of solo revision, scattered resources, and the quiet wish for a partner who got it. I built this app, end to end, from my phone, to give other clinicians the study companion I wanted myself.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12, fontStyle: 'italic' }}>
          Made with care in Lahore, Pakistan. 🌿
        </p>
      </div>
    </div>
  );
}


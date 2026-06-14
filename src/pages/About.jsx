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
          We connect doctors worldwide preparing for the same professional milestones — including USMLE, MRCP, PLAB, FCPS and many more — to foster meaningful, peer-to-peer study partnerships. Whether you are seeking a study partner in your timezone, accountability for your revision schedule, or a collaborator for OSCE practice, our platform bridges the gap.
        </p>
        <p style={{ marginBottom: 12 }}>
          Your professional data and privacy are held to the highest standard, ensuring a secure environment for your study journey.
        </p>
        <p style={{ marginBottom: 12 }}>
          Built on the simple principle that clinicians study better together, MedConnect is designed to help you stay focused, practice effectively, and succeed — one revision at a time.
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
    </div>
  );
}

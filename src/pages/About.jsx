import { useNavigate } from 'react-router-dom';

export default function About() {
  const nav = useNavigate();
  return (
    <div className="screen">
      <h1 className="h1">About MedConnect</h1>

      <div className="card" style={{ lineHeight: 1.65 }}>
        <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, color: 'var(--forest)', marginBottom: 14 }}>
          Preparing for a medical licensing exam can feel lonely. MedConnect exists so it doesn’t have to be.
        </p>
        <p style={{ marginBottom: 12 }}>
          MedConnect connects doctors preparing for the same exams — MRCP, PLAB, USMLE, FCPS, and many more — so you can find a study partner who’s on the same path, in a compatible timezone, working toward the same goal.
        </p>
        <p style={{ marginBottom: 12 }}>
          It’s built around a simple belief: doctors study better together. Find a partner, keep each other accountable, practise OSCE stations over video, share a quiet focus session, and show up for each other one revision at a time.
        </p>
        <p style={{ marginBottom: 0, color: 'var(--muted)' }}>
          Made for doctors, by a doctor — with care, and a lot of late nights.
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


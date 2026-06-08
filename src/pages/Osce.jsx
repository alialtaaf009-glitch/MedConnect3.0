import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/Auth.jsx';

const STATIONS = {
  'MRCP — PACES': ['Breathlessness history','Thyroid eye disease','Breaking bad news','Abdominal exam','Mixed valve disease','Acromegaly consult'],
  'MRCS — Part B (OSCE)': ['Anatomy — brachial plexus','Consent for chole','Examine neck lump','Surgical suturing','Inguinal hernia','Post-op sepsis'],
  'PLAB / UKMLA — 2': ['Chest pain history','Explain diabetes dx','Cranial nerve exam','Manage anaphylaxis','Post-op fever call','Discuss HRT risks'],
};
const FREE = 3;

// realistic per-exam station durations (minutes)
const EXAM_MINUTES = {
  'MRCP — PACES': 10,            // PACES encounters run ~10 min (history/communication)
  'MRCS — Part B (OSCE)': 9,     // MRCS Part B stations ~9 min
  'PLAB / UKMLA — 2': 8,         // PLAB 2 / UKMLA CPSA stations ~8 min
};

// what MedConnect Pro unlocks (shown under locked stations)
const PRO_FEATURES = [
  'All OSCE stations for every exam (not just 3)',
  'Full marking schemes & model answers',
  'Timed mock circuits',
  'Priority partner matching',
];

// lightweight scenario text so free stations are actually usable solo
const SCENARIOS = {
  // ---- MRCP PACES ----
  'Breathlessness history': 'Mr Khan, 58, has had three months of progressive breathlessness on exertion. Take a focused history.',
  'Thyroid eye disease': 'A 42-year-old presents with bulging eyes and grittiness. Assess for thyroid eye disease and thyroid status.',
  'Breaking bad news': 'A 62-year-old patient\'s scan shows metastatic cancer. Sensitively break the news and discuss the next steps.',
  // ---- MRCS Part B ----
  'Anatomy — brachial plexus': 'Using the diagram provided, describe the anatomy of the brachial plexus and its clinical relevance.',
  'Consent for chole': 'A 45-year-old is listed for a laparoscopic cholecystectomy. Take informed consent for the procedure.',
  'Examine neck lump': 'A 35-year-old has noticed an anterior neck lump. Examine the neck and present your findings.',
  // ---- PLAB 2 / UKMLA ----
  'Chest pain history': 'A 45-year-old has come to A&E with central chest pain. Take a focused history.',
  'Explain diabetes dx': 'A 50-year-old has just been diagnosed with type 2 diabetes. Explain the diagnosis and initial management.',
  'Cranial nerve exam': 'A 60-year-old presents with a new facial droop. Perform a cranial nerve examination.',
};

export default function Osce() {
  const { user } = useAuth();
  const exams = Object.keys(STATIONS);
  const [exam, setExam] = useState(exams.includes(user?.exam) ? user.exam : exams[0]);
  const [active, setActive] = useState(null); // station name being practised
  const [showPro, setShowPro] = useState(false);
  const isPro = user?.pro_active;
  const stations = STATIONS[exam] || [];

  if (active) return <Station name={active} minutes={EXAM_MINUTES[exam] || 8} onBack={() => setActive(null)} />;

  return (
    <div className="screen">
      {showPro && (
        <div onClick={() => setShowPro(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:100, padding:24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth:340, textAlign:'center' }}>
            <div style={{ fontSize:38 }}>🔒</div>
            <h2 className="serif" style={{ fontSize:20, fontWeight:700, margin:'8px 0' }}>This is a Pro station</h2>
            <p className="sub" style={{ fontSize:14, lineHeight:1.5, marginBottom:12 }}>
              You've got {FREE} free stations. MedConnect Pro unlocks:
            </p>
            <div style={{ textAlign:'left', margin:'0 auto 4px', maxWidth:260 }}>
              {PRO_FEATURES.map((f) => (
                <div key={f} style={{ display:'flex', gap:8, fontSize:13.5, marginBottom:7 }}>
                  <span style={{ color:'var(--forest)' }}>✓</span><span>{f}</span>
                </div>
              ))}
            </div>
            <p className="sub" style={{ fontSize:12, fontStyle:'italic' }}>Coming soon.</p>
            <button className="btn" style={{ marginTop:16 }} onClick={() => setShowPro(false)}>Got it</button>
          </div>
        </div>
      )}
      <h1 className="h1">OSCE Practice</h1>
      <p className="sub" style={{ marginBottom:14 }}>Timed station practice. Free stations are open to try solo; live partner mode is coming.</p>
      <div className="chips" style={{ marginBottom:16 }}>
        {exams.map((e) => (
          <button key={e} className={`chip ${exam === e ? 'on' : ''}`} onClick={() => setExam(e)}>{e}</button>
        ))}
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Fraunces',serif" }}>{exam} stations</h2>
      {!isPro && <p className="sub" style={{ fontSize:12, marginBottom:10 }}>{FREE} free · unlock the rest with Pro</p>}
      {stations.map((st, i) => {
        const locked = !isPro && i >= FREE;
        return (
          <div key={st} className="row" style={{ justifyContent:'space-between', opacity: locked ? .65 : 1, cursor:'pointer' }}
            onClick={() => { if (locked) { setShowPro(true); } else { setActive(st); } }}>
            <span style={{ fontWeight:600 }}>{locked ? '🔒 ' : ''}{st}</span>
            {locked ? <span className="pill" style={{ background:'var(--gold)', color:'#2a1c05' }}>PRO</span>
                    : <span className="link">Practise ›</span>}
          </div>
        );
      })}
    </div>
  );
}

function Station({ name, minutes, onBack }) {
  const total = (minutes || 8) * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); }
    return () => clearInterval(ref.current);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const scenario = SCENARIOS[name] || 'Read the station title and practise your structured approach: introduce yourself, take a focused history or perform the task, summarise, and give a differential and plan. Aim to finish within the 8-minute timer.';

  return (
    <div className="screen">
      <button className="link" onClick={onBack}>‹ Back to stations</button>
      <h1 className="h1" style={{ fontSize:24, margin:'12px 0 6px' }}>{name}</h1>
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Fraunces',serif", fontSize:44, fontWeight:900, color: seconds === 0 ? 'var(--rust)' : 'var(--forest)' }}>{mm}:{ss}</div>
        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button className="btn" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Start'}</button>
          <button className="btn ghost" onClick={() => { setRunning(false); setSeconds(total); }}>Reset</button>
        </div>
      </div>
      <div className="card">
        <div className="label" style={{ marginTop:0 }}>The scenario</div>
        <p style={{ fontSize:15, lineHeight:1.6, whiteSpace:'pre-line' }}>{scenario}</p>
      </div>
      <p className="sub" style={{ fontSize:12 }}>Solo practice mode. Live partner video (each taking candidate & examiner roles) is on the roadmap.</p>
    </div>
  );
}

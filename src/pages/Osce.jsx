import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/Auth.jsx';
import { useBack } from '../context/Back.jsx';
import { api } from '../lib/api';

const STATIONS = {
  'MRCP — PACES': ['Breathlessness history','Thyroid eye disease','Breaking bad news','Abdominal exam','Mixed valve disease','Acromegaly consult'],
  'MRCS — Part B (OSCE)': ['Anatomy — brachial plexus','Consent for chole','Examine neck lump','Surgical suturing','Inguinal hernia','Post-op sepsis'],
  'PLAB 2 / UKMLA CPSA': ['Chest pain history','Explain diabetes dx','Cranial nerve exam','Manage anaphylaxis','Post-op fever call','Discuss HRT risks'],
  'FCPS — IMM / Clinical': ['Examine the cardiovascular system','Take a fever history','Counsel on warfarin','Examine the chest','Diabetic foot assessment','Explain a CT head finding'],
  'MRCEM / FRCEM — OSCE': ['Manage the breathless patient','ECG interpretation','Trauma primary survey','Breaking bad news in ED','Joint aspiration consent','Paediatric fever assessment'],
  'MRCGP — SCA / CSA': ['Tired all the time','Manage a worried parent','Contraception counselling','Low mood consultation','Explain a new diagnosis','Telephone triage call'],
};
const FREE = 3;

// realistic per-exam station durations (minutes)
const EXAM_MINUTES = {
  'MRCP — PACES': 10,            // PACES encounters run ~10 min (history/communication)
  'MRCS — Part B (OSCE)': 9,     // MRCS Part B stations ~9 min
  'PLAB 2 / UKMLA CPSA': 8,         // PLAB 2 / UKMLA CPSA stations ~8 min
  'FCPS — IMM / Clinical': 10,   // FCPS clinical/long-short cases
  'MRCEM / FRCEM — OSCE': 7,     // MRCEM OSCE stations ~7 min
  'MRCGP — SCA / CSA': 12,       // GP consultations run ~12 min
};

// what MedConnect Pro unlocks (shown under locked stations)
const PRO_FEATURES = [
  'All OSCE stations for every exam (not just 3)',
  'Full marking schemes & model answers',
  'Timed mock circuits',
  'Priority partner matching',
];
// total stations promised per exam (shown on the Pro lock)
const TOTAL_STATIONS = {
  'MRCP — PACES': '200+',
  'MRCS — Part B (OSCE)': '150+',
  'PLAB 2 / UKMLA CPSA': '250+',
  'FCPS — IMM / Clinical': '120+',
  'MRCEM / FRCEM — OSCE': '150+',
  'MRCGP — SCA / CSA': '180+',
};

// fuller scenario text — sets the scene and the task clearly (still the candidate's task only)
const SCENARIOS = {
  // ---- MRCP PACES ----
  'Breathlessness history': 'You are seeing Mr Khan, a 58-year-old retired teacher, in the medical clinic. Over the past three months he has noticed he becomes breathless walking up the stairs at home, and now stops twice on the way up. He has a long smoking history. Take a focused history from him, then summarise your findings and outline your differential and initial investigations.',
  'Thyroid eye disease': 'A 42-year-old office worker attends clinic concerned about her appearance — she feels her eyes have started "bulging" and they often feel gritty and watery. She has also lost some weight recently. Take a focused history and assess her thyroid status and eye involvement, then explain your impression and the next steps to her.',
  'Breaking bad news': 'You are in a quiet side room with a 62-year-old whose recent CT scan shows what is almost certainly metastatic cancer. They have come in expecting "the results." Sensitively share the news, respond to their reaction, address their immediate concerns and questions, and agree the next steps together.',
  // ---- MRCS Part B ----
  'Anatomy — brachial plexus': 'At this anatomy station you are shown a labelled diagram of the brachial plexus. Describe its structure from roots to terminal branches, and explain the clinical consequences of injury at two different points along its course.',
  'Consent for chole': 'A 45-year-old with symptomatic gallstones is on the list for an elective laparoscopic cholecystectomy tomorrow. Take informed consent: explain the procedure in plain terms, the benefits, the common and serious risks, the alternatives, and what recovery involves — and respond to their questions.',
  'Examine neck lump': 'A 35-year-old presents having noticed a lump at the front of the neck. Carry out a focused examination of the neck lump as you would in the exam, commenting on your findings as you go, then present your findings and your differential diagnosis.',
  // ---- PLAB 2 / UKMLA ----
  'Chest pain history': 'A 45-year-old has presented to the Emergency Department with central chest pain that began two hours ago. Take a focused history to characterise the pain and screen for red flags and cardiac risk factors, then summarise and give your differential and immediate plan.',
  'Explain diabetes dx': 'A 50-year-old has attended to discuss recent blood tests, which confirm a new diagnosis of type 2 diabetes. Explain the diagnosis in accessible terms, discuss what it means for them, cover the initial management and monitoring, and address their concerns.',
  'Cranial nerve exam': 'A 60-year-old has presented with a new facial droop noticed this morning. Perform a cranial nerve examination, narrating what you are testing, then present your findings and suggest where the lesion might be.',
  // ---- FCPS — IMM / Clinical ----
  'Examine the cardiovascular system': 'A 55-year-old has been admitted with exertional breathlessness and ankle swelling. Perform a focused cardiovascular examination, commenting on your findings as you proceed, then present your findings and your differential to the examiner.',
  'Take a fever history': 'A 28-year-old presents with a two-week history of intermittent fever, night sweats and weight loss. Take a focused history to build a differential, paying attention to TB, enteric fever and other locally relevant causes, then summarise and outline your initial investigations.',
  'Counsel on warfarin': 'A patient is being started on warfarin after a diagnosis of atrial fibrillation. Counsel them: explain why it is needed, how INR monitoring works, key dietary and drug interactions, signs of bleeding, and what to do if a dose is missed — and answer their questions.',
  // ---- MRCEM / FRCEM — OSCE ----
  'Manage the breathless patient': 'A 64-year-old is brought to resus acutely breathless and unable to speak in full sentences. Assess them using an ABCDE approach, narrating your actions and the immediate management you would initiate at each step, and state the investigations you would request.',
  'ECG interpretation': 'You are handed the ECG of a 70-year-old with chest pain. Interpret it systematically, state your diagnosis, and outline the immediate management and disposition for this patient in the Emergency Department.',
  'Trauma primary survey': 'A young adult arrives by ambulance following a high-speed road traffic collision. Perform a primary survey using the <C>ABCDE approach, verbalising the life-threatening problems you are looking for and the interventions you would make at each stage.',
  // ---- MRCGP — SCA / CSA ----
  'Tired all the time': 'A 34-year-old attends your GP surgery saying they have felt exhausted for the last three months. Take a focused history exploring physical, psychological and social causes, agree a shared management plan, and safety-net appropriately within the consultation.',
  'Manage a worried parent': 'A parent has brought their 3-year-old to your GP clinic with a few days of fever and reduced appetite, and is very anxious. Take a focused history, address their concerns and ideas, explain your assessment, and agree a safe plan together including clear safety-netting.',
  'Contraception counselling': 'A 24-year-old attends to discuss starting contraception. Explore their needs and preferences, take a relevant history including any contraindications, explain the suitable options in a balanced way, and support them to reach a shared decision.',
};

const LockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

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
            <div style={{ display:'grid', placeItems:'center', color:'var(--forest)' }}><LockIcon size={34} /></div>
            <h2 className="serif" style={{ fontSize:20, fontWeight:700, margin:'8px 0' }}>This is a Pro station</h2>
            <p className="sub" style={{ fontSize:14, lineHeight:1.5, marginBottom:12 }}>
              You've got {FREE} free stations. MedConnect Pro unlocks <strong>{TOTAL_STATIONS[exam] || '200+'} {exam.split('—')[0].trim()} stations</strong> plus:
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
      <p className="sub" style={{ marginBottom:14 }}>Timed station practice — solo, or live with a partner over a Meet link.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        {exams.map((e) => {
          const on = exam === e;
          return (
            <button key={e} onClick={() => setExam(e)} style={{
              display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
              padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
              border: on ? '2px solid var(--forest)' : '1.5px solid var(--line)',
              background: on ? 'var(--forest)' : 'var(--card)',
              color: on ? '#fff' : 'var(--ink)',
              fontFamily: 'inherit', fontSize: 16, fontWeight: 700,
              boxShadow: on ? '0 4px 14px rgba(31,77,63,.22)' : '0 1px 3px rgba(20,40,30,.05)',
              transition: 'transform .2s cubic-bezier(0.34,1.56,0.64,1), background .2s ease, box-shadow .2s ease',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: on ? 'rgba(255,255,255,.18)' : 'var(--paper-2)', display: 'grid', placeItems: 'center', fontSize: 17, flexShrink: 0 }}>🩺</span>
              <span style={{ flex: 1 }}>{e}</span>
              <span style={{ fontSize: 18, opacity: on ? 1 : 0.4 }}>{on ? '✓' : '›'}</span>
            </button>
          );
        })}
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Inter',system-ui,sans-serif" }}>{exam} stations</h2>
      {!isPro && <p className="sub" style={{ fontSize:12, marginBottom:10 }}>{FREE} free · unlock the rest with Pro</p>}
      {stations.map((st, i) => {
        const locked = !isPro && i >= FREE;
        return (
          <div key={st} className="row" style={{ justifyContent:'space-between', opacity: locked ? .55 : 1, cursor:'pointer', gap: 10 }}
            onClick={() => { if (locked) { setShowPro(true); } else { setActive(st); } }}>
            <span style={{ width: 26, height: 26, borderRadius: '50%', background: locked ? 'var(--paper-2)' : 'var(--forest)', color: locked ? 'var(--subtle)' : '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
            <span style={{ fontWeight:600, flex: 1 }}>{st}</span>
            {locked ? <span style={{ color:'var(--subtle)', opacity:0.7 }}><LockIcon /></span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--forest)', fontSize: 13 }}>Practise
                        <span className="chev-round" style={{ width: 24, height: 24 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
                      </span>}
          </div>
        );
      })}
    </div>
  );
}

function Station({ name, minutes, onBack }) {
  const { user: stnMe } = useAuth();
  const { registerBack, clearBack } = useBack();
  useEffect(() => { registerBack(() => onBack()); return () => clearBack(); }, [onBack, registerBack, clearBack]);
  const total = (minutes || 8) * 60;
  const [seconds, setSeconds] = useState(total);
  const [running, setRunning] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [friends, setFriends] = useState([]);
  const [meetUrl, setMeetUrl] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    if (running) { ref.current = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000); }
    return () => clearInterval(ref.current);
  }, [running]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');
  const scenario = SCENARIOS[name] || 'Read the station title and practise your structured approach: introduce yourself, take a focused history or perform the task, summarise, and give a differential and plan.';

  const startVideo = async () => {
    // build a unique, hard-to-guess Jitsi room — the URL IS the room, so it's
    // truly shareable (same link works for everyone) and opens in the browser.
    const slug = name.replace(/[^a-zA-Z0-9]+/g, '').slice(0, 18);
    const rand = Math.random().toString(36).slice(2, 8);
    const url = `https://meet.jit.si/MedConnect-${slug}-${rand}`;
    setMeetUrl(url);
    window.open(url, '_blank');
    // load connected friends to offer sharing the link
    try {
      const d = await api.connections();
      const rows = (d.connected || d.connections || []).filter((c) => (c.status ? c.status === 'accepted' : true));
      setFriends(rows.map((c) => {
        const iAmRequester = c.requester == stnMe?.id;
        return {
          id: iAmRequester ? c.recipient : c.requester,
          name: iAmRequester ? c.recipient_name : c.requester_name,
          avatar: iAmRequester ? c.recipient_avatar : c.requester_avatar,
        };
      }));
    } catch (e) { setFriends([]); }
    setShowShare(true);
  };

  const shareTo = async (friendId) => {
    try {
      await api.sendMessage(friendId, `📹 Join me for OSCE practice — "${name}". Video room: ${meetUrl}`);
      window.alert('Invite sent in your chat with them.');
    } catch (e) {}
    setShowShare(false);
  };

  return (
    <div className="screen">
      {showShare && (
        <div onClick={() => setShowShare(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:100, padding:24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth:340, width:'100%' }}>
            <h2 className="serif" style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>📹 Share the video room</h2>
            <p className="sub" style={{ fontSize:13, marginBottom:12 }}>Your private video room is ready and open in a new tab. Send the link to a partner below — they'll get it in your chat and join the same room.</p>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input className="input" value={meetUrl} readOnly style={{ marginBottom:0, flex:1, fontSize:13 }} onFocus={(e) => e.target.select()} />
              <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(meetUrl); window.alert('Link copied!'); }}>Copy</button>
            </div>
            {friends.length === 0 ? (
              <p className="sub" style={{ fontSize:13 }}>No connections yet. Connect with a partner first, then invite them here.</p>
            ) : friends.map((f) => (
              <button key={f.id || f.other_id} className="menu-item" onClick={() => shareTo(f.id || f.other_id)}>
                {(f.avatar || '🩺')} {f.name} <span className="link" style={{ marginLeft:'auto' }}>Send invite ›</span>
              </button>
            ))}
            <button className="btn ghost" style={{ marginTop:12 }} onClick={() => setShowShare(false)}>Close</button>
          </div>
        </div>
      )}
      <h1 className="h1" style={{ fontSize:24, margin:'12px 0 6px' }}>{name}</h1>
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Inter',system-ui,sans-serif", fontSize:44, fontWeight:900, color: seconds === 0 ? 'var(--rust)' : 'var(--forest)' }}>{mm}:{ss}</div>
        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button className="btn" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Start'}</button>
          <button className="btn ghost" onClick={() => { setRunning(false); setSeconds(total); }}>Reset</button>
        </div>
      </div>
      <div className="card">
        <div className="label" style={{ marginTop:0 }}>The scenario</div>
        <p style={{ fontSize:15, lineHeight:1.6, whiteSpace:'pre-line' }}>{scenario}</p>
      </div>
      <button className="btn" style={{ background:'var(--violet)', marginTop: 28 }} onClick={startVideo}>📹 Practise live with a partner</button>
      <p className="sub" style={{ fontSize:12, marginTop:8 }}>Opens a Google Meet and lets you send the link to a connected partner — one of you plays candidate, the other examiner.</p>
    </div>
  );
}

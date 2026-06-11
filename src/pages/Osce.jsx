import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/Auth.jsx';
import { useTimer, SOUNDS, playSound } from '../context/Timer.jsx';
import { api } from '../lib/api';

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
// total stations promised per exam (shown on the Pro lock)
const TOTAL_STATIONS = {
  'MRCP — PACES': '200+',
  'MRCS — Part B (OSCE)': '150+',
  'PLAB / UKMLA — 2': '250+',
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
};

// ---- Study timer (Pomodoro): consumes the app-wide Timer context so it survives tab switches ----
function StudyTimer() {
  const t = useTimer();
  const [custom, setCustom] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  if (!t) return null;

  const shown = t.mode === 'timer' ? t.secondsLeft : t.elapsed;
  const mm = String(Math.floor(shown / 60)).padStart(2, '0');
  const ss = String(shown % 60).padStart(2, '0');

  const startLabel = t.running ? 'Pause'
    : (t.mode === 'timer' && t.secondsLeft < t.target) || (t.mode === 'stopwatch' && t.elapsed > 0) ? 'Resume' : 'Start';

  const ModeTabs = () => (
    <div className="tabs" style={{ marginBottom: 12, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>
      <button className={`tab ${t.mode === 'timer' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); t.switchMode('timer'); }}>Timer</button>
      <button className={`tab ${t.mode === 'stopwatch' ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); t.switchMode('stopwatch'); }}>Stopwatch</button>
    </div>
  );
  const Controls = ({ big }) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: big ? 28 : 4 }} onClick={(e) => e.stopPropagation()}>
      <button className="btn" style={{ flex: 1, maxWidth: big ? 200 : 150 }} onClick={t.startPause}>{startLabel}</button>
      <button className="btn ghost" style={{ flex: 1, maxWidth: big ? 140 : 110 }} onClick={t.reset}>Reset</button>
    </div>
  );

  // ---- Full-screen distraction-free view (tap anywhere to exit) ----
  if (fullscreen) {
    return (
      <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'pointer' }}>
        <button className="link" style={{ position: 'absolute', top: 18, right: 20, fontSize: 15 }} onClick={(e) => { e.stopPropagation(); setFullscreen(false); }}>✕ Close</button>
        <ModeTabs />
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 96, fontWeight: 900, color: t.done ? 'var(--rust)' : 'var(--forest)', lineHeight: 1, letterSpacing: 2 }}>
          {mm}:{ss}
        </div>
        {t.done && <div style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 18, marginTop: 10 }}>Time's up! 🎉</div>}
        <Controls big={true} />
        <p className="sub" style={{ fontSize: 12, marginTop: 26 }}>Tap anywhere to exit full-screen</p>
      </div>
    );
  }

  return (
    <div className="card" onClick={() => setFullscreen(true)} style={{ marginBottom: 18, textAlign: 'center', borderColor: 'var(--forest)', minHeight: 280, cursor: 'pointer' }}>
      <ModeTabs />

      <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 52, fontWeight: 900, color: t.done ? 'var(--rust)' : 'var(--forest)', lineHeight: 1.1, letterSpacing: 1 }}>
        {mm}:{ss}
      </div>
      {t.done && <div style={{ color: 'var(--rust)', fontWeight: 700, fontSize: 14, marginTop: 2 }}>Time's up! 🎉</div>}

      {t.mode === 'timer' && (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="chips" style={{ justifyContent: 'center', marginTop: 10, marginBottom: 8 }}>
            {[25, 45, 60].map((m) => (
              <button key={m} className={`chip ${t.target === m * 60 ? 'on' : ''}`} onClick={() => t.pickPreset(m)}>{m} min</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
            <input className="input" style={{ marginBottom: 0, width: 110, textAlign: 'center' }} type="number" min="1" placeholder="Custom min" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <button className="btn-sm" onClick={() => { t.setCustomMinutes(parseInt(custom, 10)); }}>Set</button>
          </div>
        </div>
      )}

      {t.mode === 'stopwatch' && <div style={{ height: 12 }} />}

      <Controls big={false} />

      <div style={{ marginTop: 12 }} onClick={(e) => e.stopPropagation()}>
        <span className="sub" style={{ fontSize: 11, marginRight: 6 }}>Sound:</span>
        {Object.entries(SOUNDS).map(([key, s]) => (
          <button key={key} className={`chip ${t.sound === key ? 'on' : ''}`} style={{ fontSize: 11, padding: '4px 10px', marginRight: 4 }} onClick={() => { t.setSound(key); playSound(key); }}>{s.label}</button>
        ))}
      </div>
    </div>
  );
}

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
      <p className="sub" style={{ marginBottom:14 }}>Timed station practice. Free stations are open to try solo; live partner mode is coming.</p>

      <div className="chips" style={{ marginBottom:16 }}>
        {exams.map((e) => (
          <button key={e} className={`chip ${exam === e ? 'on' : ''}`} onClick={() => setExam(e)}>{e}</button>
        ))}
      </div>
      <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Newsreader',Georgia,serif" }}>{exam} stations</h2>
      {!isPro && <p className="sub" style={{ fontSize:12, marginBottom:10 }}>{FREE} free · unlock the rest with Pro</p>}
      {stations.map((st, i) => {
        const locked = !isPro && i >= FREE;
        return (
          <div key={st} className="row" style={{ justifyContent:'space-between', opacity: locked ? .55 : 1, cursor:'pointer' }}
            onClick={() => { if (locked) { setShowPro(true); } else { setActive(st); } }}>
            <span style={{ fontWeight:600 }}>{st}</span>
            {locked ? <span className="meta" style={{ fontSize:11, color:'var(--subtle)', opacity:0.7 }}>Locked</span>
                    : <span className="link">Practise ›</span>}
          </div>
        );
      })}

      <div style={{ borderTop: '1px solid var(--line)', margin: '26px 0 16px' }} />
      <h2 style={{ fontSize:18, fontWeight:700, fontFamily:"'Newsreader',Georgia,serif", marginBottom:4 }}>Focus Mode ☕</h2>
      <p className="sub" style={{ fontSize:12, marginBottom:12 }}>A focus timer for your study sessions. Tap the clock to go full-screen.</p>
      <StudyTimer />
    </div>
  );
}

function Station({ name, minutes, onBack }) {
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
    const url = 'https://meet.google.com/new';
    window.open(url, '_blank');
    setMeetUrl(url);
    // load connected friends to offer sharing the link
    try {
      const d = await api.connections();
      const accepted = (d.connections || d.connected || []).filter((c) => (c.status ? c.status === 'accepted' : true));
      setFriends(accepted);
    } catch (e) { setFriends([]); }
    setShowShare(true);
  };

  const shareTo = async (friendId) => {
    try {
      await api.sendMessage(friendId, `📹 Join me for OSCE practice — "${name}". Video room: ${meetUrl}\n(If a fresh room opened for me, I'll paste the real link here.)`);
      window.alert('Invite sent in your chat with them.');
    } catch (e) {}
    setShowShare(false);
  };

  return (
    <div className="screen">
      {showShare && (
        <div onClick={() => setShowShare(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'grid', placeItems:'center', zIndex:100, padding:24 }}>
          <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth:340, width:'100%' }}>
            <h2 className="serif" style={{ fontSize:18, fontWeight:700, marginBottom:6 }}>📹 Share the video link</h2>
            <p className="sub" style={{ fontSize:13, marginBottom:12 }}>A Google Meet opened in a new tab. Copy the link or send it to a connected partner — they'll get it in your chat.</p>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <input className="input" readOnly value={meetUrl} style={{ marginBottom:0, flex:1, fontSize:13 }} onFocus={(e) => e.target.select()} />
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
      <button className="link" onClick={onBack}>‹ Back to stations</button>
      <h1 className="h1" style={{ fontSize:24, margin:'12px 0 6px' }}>{name}</h1>
      <div className="card" style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Newsreader',Georgia,serif", fontSize:44, fontWeight:900, color: seconds === 0 ? 'var(--rust)' : 'var(--forest)' }}>{mm}:{ss}</div>
        <div style={{ display:'flex', gap:10, marginTop:12 }}>
          <button className="btn" onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Start'}</button>
          <button className="btn ghost" onClick={() => { setRunning(false); setSeconds(total); }}>Reset</button>
        </div>
      </div>
      <div className="card">
        <div className="label" style={{ marginTop:0 }}>The scenario</div>
        <p style={{ fontSize:15, lineHeight:1.6, whiteSpace:'pre-line' }}>{scenario}</p>
      </div>
      <button className="btn" style={{ background:'var(--violet)' }} onClick={startVideo}>📹 Practise live with a partner</button>
      <p className="sub" style={{ fontSize:12, marginTop:8 }}>Opens a Google Meet and lets you send the link to a connected partner — one of you plays candidate, the other examiner.</p>
    </div>
  );
}


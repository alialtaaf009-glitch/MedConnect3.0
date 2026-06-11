import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';
import { useTheme } from '../context/Theme.jsx';

const APP_VERSION = '1.0.0';

const AVATARS = ['🩺','💉','🧬','🦴','🫀','🧠','👨‍⚕️','👩‍⚕️','🥼','🔬','💊','🚑',
  '🐱','🦊','🦉','🐼','🐨','🦁','🐸','🦋','🐧','🐢','🦄','🐙',
  '🌟','🔥','🌙','🍀','⚡','🎯','📚','☕'];
const COUNTRIES = ['Pakistan','United Kingdom','United States','Saudi Arabia / Gulf','Australia','India','Other'];
const TIMEZONES = ['GMT-8 (US Pacific)','GMT-5 (US Eastern)','GMT+0 (UK)','GMT+1 (Europe)','GMT+3 (Gulf / Saudi)','GMT+5 (Pakistan)','GMT+5:30 (India)','GMT+8 (Singapore/China)','GMT+10 (Australia East)'];
const QBANKS = ['PassMedicine','Pastest','BMJ OnExamination','Plabable','UWorld','AMBOSS','MRCPUK Question Bank','Marrow','PrepLadder','DAMS','Cerebellum','eGurukul','Other'];
const TIMES = ['Early mornings','Daytime','Evenings','Late nights'];

// chips that can be DESELECTED — tap a selected chip to clear it
function Chips({ label, options, value, onChange, optional }) {
  return (
    <div>
      <label className="label">{label}{optional ? '  (optional)' : ''}</label>
      <div className="chips">
        {options.map((o) => (
          <button key={o} className={`chip ${value === o ? 'on' : ''}`}
            onClick={() => onChange(value === o ? '' : o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const { mode, toggle } = useTheme();
  const nav = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🩺');
  const [country, setCountry] = useState(user?.country || COUNTRIES[0]);
  const [timezone, setTimezone] = useState(user?.timezone || '');
  const [questionBank, setQuestionBank] = useState(user?.question_bank || '');
  const [studyTime, setStudyTime] = useState(user?.study_time || '');
  const [attempt, setAttempt] = useState(user?.attempt || '');
  const [examDate, setExamDate] = useState(user?.exam_date ? user.exam_date.slice(0, 10) : '');
  const [regCouncil, setRegCouncil] = useState(user?.reg_council || '');
  const [regNumber, setRegNumber] = useState(user?.reg_number || '');
  const [medicalSchool, setMedicalSchool] = useState(user?.medical_school || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const { user: updated } = await api.updateProfile({ name, avatar, country, timezone, questionBank, studyTime, examDate, attempt, regCouncil, regNumber, medicalSchool, bio });
      setUser(updated);
      setEditing(false);
    } catch (e) {} finally { setBusy(false); }
  };

  const doDelete = async () => {
    setBusy(true);
    try { await api.deleteAccount(); logout(); } catch (e) { setBusy(false); }
  };

  const Row = ({ k, v }) => (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'13px 0', borderBottom:'1px solid var(--line)', gap: 16 }}>
      <span className="meta" style={{ fontSize:14, flexShrink:0 }}>{k}</span>
      <span style={{ fontWeight:600, fontSize:14, textAlign:'right' }}>{v || '—'}</span>
    </div>
  );

  if (editing) {
    return (
      <div className="screen">
        <h1 className="h1" style={{ fontSize:24, marginBottom:14 }}>Edit profile</h1>

        <label className="label">Choose your avatar</label>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button key={a} className={`avatar-cell ${avatar === a ? 'on' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
          ))}
        </div>

        <label className="label">Display name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="label">Short bio <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400 }}>(optional — what you're looking for)</span></label>
        <textarea className="input" rows={3} style={{ resize:'vertical', fontFamily:'inherit' }} placeholder="e.g. MRCP Part 1 in May, looking for an evening study partner to do PassMedicine questions together." value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />

        <label className="label">Medical school <span style={{ textTransform:'none', letterSpacing:0, fontWeight:400 }}>(optional)</span></label>
        <input className="input" placeholder="e.g. King Edward Medical University" value={medicalSchool} onChange={(e) => setMedicalSchool(e.target.value)} />

        <label className="label">Exam date <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(for your countdown)</span></label>
        <input className="input" type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />

        <Chips label="Which sitting/attempt" options={['1st sitting','2nd sitting','3rd sitting','4th+ sitting']} value={attempt} onChange={setAttempt} optional />
        <Chips label="Country" options={COUNTRIES} value={country} onChange={setCountry} />
        <Chips label="Timezone" options={TIMEZONES} value={timezone} onChange={setTimezone} optional />
        <Chips label="Question bank" options={QBANKS} value={questionBank} onChange={setQuestionBank} optional />
        <Chips label="Preferred study time" options={TIMES} value={studyTime} onChange={setStudyTime} optional />

        <label className="label">Medical registration <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>(self-reported)</span></label>
        <select className="select" value={regCouncil} onChange={(e) => setRegCouncil(e.target.value)}>
          <option value="">Select council (optional)</option>
          <option value="PMDC">PMDC (Pakistan)</option>
          <option value="GMC">GMC (UK)</option>
          <option value="IMC">IMC (Ireland)</option>
          <option value="SCFHS">SCFHS (Saudi)</option>
          <option value="AHPRA">AHPRA (Australia)</option>
          <option value="Other">Other</option>
        </select>
        <input className="input" placeholder="Registration number" value={regNumber} onChange={(e) => setRegNumber(e.target.value)} />

        <button className="btn" style={{ marginTop:22 }} onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        <button className="btn ghost" style={{ marginTop:10 }} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="screen">
      <div style={{ textAlign:'center', marginTop:10 }}>
        <div style={{ width:84, height:84, borderRadius:'50%', background:'var(--paper-2)', border:'1.5px solid var(--line)', display:'grid', placeItems:'center', fontSize:42, margin:'0 auto 12px' }}>{user?.avatar || '🩺'}</div>
        <h1 className="h1" style={{ fontSize:24 }}>{user?.name}</h1>
        <p className="sub">{user?.country}</p>
        {user?.bio && <p style={{ fontSize:14, lineHeight:1.5, color:'var(--muted)', maxWidth:340, margin:'8px auto 0', fontStyle:'italic' }}>“{user.bio}”</p>}
      </div>
      <div className="card" style={{ marginTop:16 }}>
        <Row k="Exam" v={user?.exam} />
        <Row k="Exam date" v={user?.exam_date ? user.exam_date.slice(0, 10) : '—'} />
        <Row k="Attempt" v={user?.attempt} />
        <Row k="Medical school" v={user?.medical_school} />
        <Row k="Timezone" v={user?.timezone} />
        <Row k="Question bank" v={user?.question_bank} />
        <Row k="Study time" v={user?.study_time} />
        <Row k="Registration" v={user?.reg_council ? `${user.reg_council} ${user.reg_number} (self-reported)` : '—'} />
      </div>
      <button className="btn" onClick={() => setEditing(true)}>Edit profile</button>
      <button className="btn ghost" style={{ marginTop:10 }} onClick={toggle}>{mode === 'dark' ? '☀️  Light mode' : '🌙  Dark mode'}</button>
      <button className="btn ghost" style={{ marginTop:10, color:'var(--rust)', borderColor:'var(--rust)' }} onClick={logout}>Log out</button>

      <div style={{ textAlign:'center', marginTop:18 }}>
        <button className="link" onClick={() => nav('/legal')}>Privacy & Terms</button>
        <span className="meta" style={{ margin:'0 8px' }}>·</span>
        <button className="link" onClick={() => { window.location.href = 'mailto:medconnectsupport.io@gmail.com?subject=MedConnect%20feature%20request'; }}>Request a feature</button>
      </div>

      {!confirmDel ? (
        <button className="link" style={{ display:'block', margin:'14px auto 0', color:'var(--subtle)', fontSize:13 }} onClick={() => setConfirmDel(true)}>Delete my account</button>
      ) : (
        <div className="card" style={{ marginTop:14, borderColor:'var(--rust)' }}>
          <p style={{ fontSize:14, marginBottom:10 }}>Permanently delete your account and all your data? This can't be undone.</p>
          <button className="btn" style={{ background:'var(--rust)' }} onClick={doDelete} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete everything'}</button>
          <button className="btn ghost" style={{ marginTop:8 }} onClick={() => setConfirmDel(false)}>Cancel</button>
        </div>
      )}

      <p className="meta" style={{ textAlign:'center', marginTop:20, fontSize:11, opacity:0.7 }}>MedConnect v{APP_VERSION}</p>
    </div>
  );
                                                                       }


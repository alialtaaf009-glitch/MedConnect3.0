import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/Auth.jsx';

const EXAMS = ['MRCP — Part 1','MRCP — Part 2 (Written)','MRCP — PACES','MRCS — Part A','MRCS — Part B (OSCE)',
  'PLAB / UKMLA — 1','PLAB / UKMLA — 2','USMLE — Step 1','USMLE — Step 2 CK','FCPS — Part 1','FCPS — Part 2','AMC — Part 1','SMLE','Other'];
const COUNTRIES = ['Pakistan','United Kingdom','United States','Saudi Arabia / Gulf','Australia','India','Other'];
const QBANKS = ['PassMedicine','Pastest','BMJ OnExamination','Plabable','UWorld','AMBOSS','MRCPUK Question Bank','Marrow','PrepLadder','DAMS','Cerebellum','eGurukul','Other'];
const TIMES = ['Early mornings','Daytime','Evenings','Late nights'];
const TIMEZONES = [
  'GMT-8 (US Pacific)', 'GMT-5 (US Eastern)', 'GMT+0 (UK)', 'GMT+1 (Europe)',
  'GMT+3 (Gulf / Saudi)', 'GMT+5 (Pakistan)', 'GMT+5:30 (India)', 'GMT+8 (Singapore/China)',
  'GMT+10 (Australia East)',
];

function Chips({ label, options, value, onChange, optional }) {
  return (
    <div>
      <label className="label">{label}{optional ? '  (optional)' : ''}</label>
      <div className="chips">
        {options.map((o) => (
          <button key={o} className={`chip ${value === o ? 'on' : ''}`} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    </div>
  );
}

export default function Setup() {
  const { setUser } = useAuth();
  const [exam, setExam] = useState(EXAMS[0]);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [questionBank, setQuestionBank] = useState('');
  const [studyTime, setStudyTime] = useState('');
  const [timezone, setTimezone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const { user } = await api.updateProfile({ exam, country, timezone, questionBank, studyTime });
      setUser(user);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="screen">
      <h1 className="h1" style={{ textAlign: 'center', fontSize: 23 }}>Set up your profile</h1>
      <p className="sub" style={{ textAlign: 'center', marginBottom: 8 }}>This powers your matches. Takes 30 seconds.</p>
      <Chips label="Exam you're preparing for" options={EXAMS} value={exam} onChange={setExam} />
      <Chips label="Country" options={COUNTRIES} value={country} onChange={setCountry} />
      <Chips label="Timezone" options={TIMEZONES} value={timezone} onChange={setTimezone} />
      <Chips label="Question bank" options={QBANKS} value={questionBank} onChange={setQuestionBank} optional />
      <Chips label="Preferred study time" options={TIMES} value={studyTime} onChange={setStudyTime} optional />
      {err && <p style={{ color: 'var(--rose)', fontSize: 13, marginTop: 12 }}>{err}</p>}
      <button className="btn" style={{ marginTop: 24 }} onClick={save} disabled={busy}>
        {busy ? 'Saving…' : 'Save & find study partners'}
      </button>
    </div>
  );
}


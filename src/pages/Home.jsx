import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { quoteOfTheDay } from '../lib/quotes';
import { api } from '../lib/api';

// country -> exams -> parts (three levels, like the prototype)
const CATALOG = [
  ['🇺🇸', 'United States', [
    ['USMLE', ['Step 1', 'Step 2 CK', 'Step 3']],
  ]],
  ['🇬🇧', 'United Kingdom', [
    ['MRCP', ['Part 1', 'Part 2 (Written)', 'PACES']],
    ['MRCS', ['Part A', 'Part B (OSCE)']],
    ['MRCPCH', ['FOP', 'TAS', 'AKP', 'Clinical']],
    ['MRCGP', ['AKT', 'SCA']],
    ['MRCPath', ['Part 1', 'Part 2']],
    ['MRCEM', ['Primary', 'Intermediate SBA', 'OSCE']],
    ['MRCOG', ['Part 1', 'Part 2', 'Part 3 (Clinical)']],
    ['MRCPsych', ['Paper A', 'Paper B', 'CASC']],
    ['PLAB / UKMLA', ['PLAB 1 / AKT', 'PLAB 2 / CPSA']],
  ]],
  ['🇵🇰', 'Pakistan', [
    ['FCPS Part 1', ['Medicine & Allied', 'Surgery & Allied', 'Gynae & Obs', 'Paediatrics', 'Anaesthesia', 'Radiology', 'Pathology', 'Ophthalmology', 'ENT', 'Psychiatry']],
    ['IMM', ['Medicine', 'Surgery', 'Gynae & Obs', 'Paediatrics', 'Anaesthesia', 'Radiology', 'Pathology', 'Ophthalmology', 'ENT']],
    ['FCPS Part 2', ['Medicine', 'Surgery', 'Gynae & Obs', 'Paediatrics', 'Anaesthesia', 'Radiology', 'Pathology', 'Ophthalmology', 'ENT', 'Psychiatry']],
    ['MCPS', ['Medicine', 'Surgery', 'Gynae & Obs', 'Paediatrics', 'Anaesthesia', 'Psychiatry']],
  ]],
  ['🇦🇺', 'Australia', [
    ['AMC', ['CAT MCQ (Part 1)', 'Clinical (Part 2)']],
    ['RACP', ['Written (Basic Training)', 'Clinical']],
    ['RACS', ['Surgical (GSSE / Fellowship)']],
  ]],
  ['🇸🇦', 'Saudi Arabia', [
    ['SMLE', ['Saudi Medical Licensing Exam']],
    ['Saudi Board', ['Promotion Exam', 'Final Written', 'Final Clinical (OSCE)']],
    ['SCFHS Prometric', ['Specialist / Consultant']],
  ]],
  ['🇮🇳', 'India', [
    ['NEET-PG', ['Medicine & Allied', 'Surgery & Allied', 'Obs & Gynae', 'Paediatrics', 'Pathology', 'Pharmacology', 'PSM / Community Medicine']],
    ['INI-CET', ['AIIMS / PGIMER entrance']],
    ['FMGE / NExT', ['NExT Step 1 (Theory)', 'NExT Step 2 (Practical)', 'FMGE Screening']],
    ['NEET-SS', ['Super-specialty entrance']],
  ]],
];


// country-code map for round flag images (flagcdn.com)
const FLAG_CODE = { 'United States': 'us', 'United Kingdom': 'gb', 'Pakistan': 'pk', 'Australia': 'au', 'Saudi Arabia': 'sa', 'India': 'in' };
function Flag({ country, emoji, size = 34 }) {
  const code = FLAG_CODE[country];
  const [broken, setBroken] = useState(false);
  if (!code || broken) return <span className="flag-circ" style={{ width: size, height: size, fontSize: size * 0.5, overflow: 'visible' }}>{emoji}</span>;
  return (
    <span className="flag-circ" style={{ width: size, height: size }}>
      <img src={`https://flagcdn.com/w80/${code}.png`} alt={country + ' flag'} onError={() => setBroken(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
}

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [openCountry, setOpenCountry] = useState('');
  const [openExam, setOpenExam] = useState('');
  const [browseMode, setBrowseMode] = useState('country'); // 'country' | 'exam'
  const initials = (user?.name || 'Dr A').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join('');

  // exam countdown
  let daysLeft = null;
  if (user?.exam_date) {
    const t = new Date(user.exam_date).getTime();
    if (!isNaN(t)) daysLeft = Math.ceil((t - Date.now()) / 86400000);
  }
  const quote = quoteOfTheDay();
  const [streak, setStreak] = useState(user?.current_streak || 0);
  const [studiedToday, setStudiedToday] = useState(user?.studied_today || false);
  const [marking, setMarking] = useState(false);
  const markStudy = async () => {
    if (marking || studiedToday) return;
    setMarking(true);
    try {
      const d = await api.markStudy();
      if (d.user) { setStreak(d.user.current_streak || 0); setStudiedToday(true); }
    } catch (e) {} finally { setMarking(false); }
  };
  const [counts, setCounts] = useState({});
  const [nudges, setNudges] = useState([]);
  const [invited, setInvited] = useState(false);

  // native share sheet on Android & iOS; clipboard fallback elsewhere
  const inviteFriend = async () => {
    const data = {
      title: 'MedConnect',
      text: "I'm using MedConnect to find study partners for medical exams — doctors only, matched by exam. Join me:",
      url: 'https://med-connect3-0.vercel.app',
    };
    try {
      if (navigator.share) { await navigator.share(data); return; }
    } catch (e) { if (e?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      setInvited(true); setTimeout(() => setInvited(false), 3000);
    } catch (e) {}
  };

  useEffect(() => { api.getStats().then((d) => setCounts(d.counts || {})).catch(() => {}); }, []);
  useEffect(() => { api.connections().then((d) => setNudges(d.nudges || [])).catch(() => {}); }, []);

  const examCount = (label) => {
    const family = label.split(' ')[0];
    let n = 0;
    for (const [key, val] of Object.entries(counts)) {
      if (key.split('—')[0].trim().split(' ')[0] === family) n = Math.max(n, val);
    }
    return n;
  };

  return (
    <div className="screen">
      <div className="card" onClick={() => nav('/profile')} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--forest)', fontWeight: 600, fontSize: user?.avatar ? 26 : 18 }}>{user?.avatar || initials}</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--forest)' }}>Profile</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Welcome back, {user?.name}</div>
            <div className="meta">{[user?.exam, user?.country].filter(Boolean).join(' · ') || 'Ready to match'}</div>
          </div>
          <span style={{ color: 'var(--subtle)', fontSize: 18, flexShrink: 0 }}>›</span>
        </div>
      </div>

      {nudges.length > 0 && (
        <div onClick={() => nav(`/chat?with=${nudges[0].id}&name=${encodeURIComponent(nudges[0].name)}&av=${encodeURIComponent(nudges[0].avatar || '')}`)}
          style={{ cursor: 'pointer', marginTop: 12, padding: '12px 14px', borderRadius: 14, background: 'var(--forest)', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{nudges[0].avatar || '👋'}</div>
          <div style={{ flex: 1, lineHeight: 1.35 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Say hi to {nudges[0].name}! 👋</div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {nudges.length === 1
                ? (nudges[0].exam && nudges[0].exam === user?.exam
                    ? `You matched — also preparing for ${nudges[0].exam}. Break the ice before your next study slot.`
                    : nudges[0].exam
                      ? `You matched — they're preparing for ${nudges[0].exam}. Break the ice and say hello.`
                      : `You matched! Break the ice and say hello.`)
                : `You have ${nudges.length} new matches waiting to hear from you.`}
            </div>
          </div>
          <span style={{ fontSize: 18 }}>›</span>
        </div>
      )}

      <div style={{ textAlign: 'center', padding: '6px 10px 12px' }}>
        <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: 1.2, color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 4 }}>
          For doctors, by doctors
        </div>
        <p className="serif" style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.3, color: 'var(--forest)', margin: 0 }}>
          Find the right study partner for your medical exam.
        </p>
      </div>

      {/* compact momentum row: countdown + streak side by side */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {daysLeft !== null && (
          <div className="card" style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderColor: 'var(--forest)', margin: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--forest)', textTransform: 'uppercase' }}>Countdown</div>
            <div style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 30, fontWeight: 900, color: 'var(--forest)', lineHeight: 1.15 }}>
              {daysLeft > 0 ? daysLeft : daysLeft === 0 ? 'Today' : '—'}
            </div>
            <div className="sub" style={{ fontSize: 10, marginTop: 0 }}>{daysLeft > 0 ? 'days to exam' : daysLeft === 0 ? 'exam day!' : 'passed'}</div>
          </div>
        )}
        <div className="card" style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderColor: 'var(--forest)', margin: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--forest)', textTransform: 'uppercase' }}>Study Streak</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--rust)', lineHeight: 1.2, marginTop: 2 }}>
            <span style={{ fontSize: 18 }}>🔥</span> {streak}
          </div>
          {studiedToday ? (
            <div className="sub" style={{ fontSize: 10, marginTop: 3, color: 'var(--forest)', fontWeight: 700 }}>✓ done today</div>
          ) : (
            <button onClick={markStudy} disabled={marking} style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--forest)', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
              {marking ? '…' : 'Mark today ✓'}
            </button>
          )}
        </div>
      </div>

      {/* slim motivation line with a clear tappable link */}
      <div onClick={() => nav('/motivation')} style={{ cursor: 'pointer', padding: '4px 2px 0', marginBottom: 4 }}>
        <p style={{ fontFamily: "'Inter',system-ui,sans-serif", fontSize: 14, fontStyle: 'italic', lineHeight: 1.4, color: 'var(--muted)', marginBottom: 4 }}>
          “{quote.text}”
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: 'var(--forest)' }}>
          ✦ Open the motivation wall <span style={{ fontSize: 14 }}>›</span>
        </div>
      </div>

      <h2 className="serif" style={{ fontSize: 18, fontWeight: 600, margin: '18px 0 12px' }}>Explore study partners</h2>

      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab ${browseMode === 'country' ? 'on' : ''}`} onClick={() => { setBrowseMode('country'); setOpenExam(''); }}>By country</button>
        <button className={`tab ${browseMode === 'exam' ? 'on' : ''}`} onClick={() => { setBrowseMode('exam'); setOpenExam(''); }}>By exam</button>
      </div>

      {browseMode === 'exam' && (
        <>
          {CATALOG.flatMap(([flag, country, exams]) => exams.map(([exam, parts]) => ({ flag, country, exam, parts })))
            .map(({ flag, country, exam, parts }) => {
              const key = 'exam|' + country + '|' + exam;
              return (
                <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, cursor: 'pointer' }}
                    onClick={() => setOpenExam(openExam === key ? '' : key)}>
                    <Flag country={country} emoji={flag} size={30} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{exam}</span>
                    {examCount(exam) >= 2 && (
                      <span style={{ fontSize: 11, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 20, padding: '3px 9px', marginRight: 4, fontWeight: 700 }}>
                        {examCount(exam)}
                      </span>
                    )}
                    <span className="meta" style={{ fontSize: 11 }}>{openExam === key ? '▲' : '▼'}</span>
                  </div>
                  {openExam === key && parts.map((part, pi) => {
                    const accents = ['var(--forest)', 'var(--rust)', 'var(--gold)', 'var(--forest-2)'];
                    return (
                      <div key={part} className="exam-accent" style={{ '--ec': accents[pi % accents.length], padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{part}</span>
                        <span style={{ color: 'var(--subtle)', fontSize: 13 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </>
      )}

      {browseMode === 'country' && CATALOG.map(([flag, country, exams]) => (
        <div key={country} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14, cursor: 'pointer' }}
            onClick={() => setOpenCountry(openCountry === country ? '' : country)}>
            <Flag country={country} emoji={flag} />
            <span style={{ flex: 1, fontWeight: 600 }}>{country}</span>
            <span className="meta">{openCountry === country ? '▲' : '▼'}</span>
          </div>

          {openCountry === country && exams.map(([exam, parts]) => {
            const key = country + '|' + exam;
            return (
              <div key={exam} style={{ borderTop: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 12px 40px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}
                  onClick={() => setOpenExam(openExam === key ? '' : key)}>
                  <span style={{ flex: 1 }}>{exam}</span>
                  {examCount(exam) >= 2 && (
                    <span style={{ fontSize: 11, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 20, padding: '3px 9px', marginRight: 8, fontFamily: "'Inter',system-ui,sans-serif", fontWeight: 700 }}>
                      {examCount(exam)} doctors
                    </span>
                  )}
                  <span className="meta" style={{ fontSize: 11 }}>{openExam === key ? '▲' : '▼'}</span>
                </div>
                {openExam === key && parts.map((part, pi) => {
                  const accents = ['var(--forest)', 'var(--rust)', 'var(--gold)', 'var(--forest-2)'];
                  const ec = accents[pi % accents.length];
                  return (
                    <div key={part} className="exam-accent" style={{ '--ec': ec, padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', flex: 1 }}>{part}</span>
                      <span style={{ color: 'var(--subtle)', fontSize: 13 }}>›</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}

      {/* invite a colleague — native share sheet (Android & iOS), clipboard fallback */}
      <div className="card" style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Know a doctor who needs a study partner?</div>
        <p className="sub" style={{ fontSize: 13, marginBottom: 12 }}>MedConnect grows one colleague at a time.</p>
        <button className="btn" onClick={inviteFriend}>Invite your friends</button>
        {invited && <p className="sub" style={{ fontSize: 12, marginTop: 8, color: 'var(--forest)', fontWeight: 700 }}>Link copied — paste it anywhere! ✓</p>}
      </div>
    </div>
  );
}


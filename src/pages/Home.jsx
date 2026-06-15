import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.jsx';
import { useBack } from '../context/Back.jsx';
import { quoteOfTheDay } from '../lib/quotes';
import Motivation from './Motivation.jsx';
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

// v1 vibrancy: each exam family carries its own signature color
const EXAM_COLORS = {
  'USMLE': '#1a5a8a', 'MRCP': '#1a6b5a', 'MRCS': '#2a6a8a', 'MRCPCH': '#1a7a4a',
  'MRCGP': '#3a7a4a', 'MRCPath': '#2a5a6a', 'MRCEM': '#1a5f7a', 'MRCOG': '#2e4a7a',
  'MRCPsych': '#1a6b8a', 'PLAB / UKMLA': '#1a7a6a', 'FCPS Part 1': '#1a7a4a',
  'FCPS Part 2': '#3a6a3a', 'IMM': '#2a6a7a', 'MCPS': '#3a7a4a',
  'AMC': '#1a5f7a', 'RACP': '#1a6b5a', 'RACS': '#2a5a6a',
  'SMLE': '#2e4a7a', 'Saudi Board': '#1a6b8a', 'SCFHS Prometric': '#2a6a8a',
  'NEET-PG': '#3a7a4a', 'INI-CET': '#1a7a6a', 'FMGE / NExT': '#1a5a8a', 'NEET-SS': '#2a6a7a',
};
const examColor = (exam) => EXAM_COLORS[exam] || EXAM_COLORS[exam.split(' ')[0]] || 'var(--forest)';

const FLAG_CODE = { 'United States': 'us', 'United Kingdom': 'gb', 'Pakistan': 'pk', 'Australia': 'au', 'Saudi Arabia': 'sa', 'India': 'in' };

// cute rounded-point star — fills gold when active, soft outline when not
function StarIcon({ filled }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24"
      fill={filled ? 'var(--gold)' : 'none'}
      stroke={filled ? 'var(--gold)' : 'var(--subtle)'}
      strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"
      style={{ display: 'block' }}>
      <path d="M12 3.2c.4 0 .77.23.95.6l2.18 4.46 4.92.72c.83.12 1.16 1.14.56 1.72l-3.56 3.47.84 4.9c.14.82-.72 1.45-1.46 1.06L12 17.8l-4.4 2.32c-.74.39-1.6-.24-1.46-1.06l.84-4.9-3.56-3.47c-.6-.58-.27-1.6.56-1.72l4.92-.72L11.05 3.8c.18-.37.55-.6.95-.6z" />
    </svg>
  );
}

function Flag({ country, emoji, size = 34 }) {
  const code = FLAG_CODE[country];
  const [broken, setBroken] = useState(false);
  if (!code || broken) return <span className="flag-circ" style={{ width: size, height: size, fontSize: size * 0.5, overflow: 'visible' }}>{emoji}</span>;
  return (
    <span className="flag-circ" style={{ width: size, height: size }}>
      <img src={`https://flagcdn.com/w160/${code}.png`} alt={country + ' flag'} onError={() => setBroken(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
}

// "Explore study partners" browser: by-country / by-exam trees with partner counts
function ExploreBrowse() {
  const nav = useNavigate();
  const [openCountry, setOpenCountry] = useState('');
  const [openExam, setOpenExam] = useState('');
  const [browseMode, setBrowseMode] = useState('country'); // 'country' | 'exam'
  // "lock in" pins: chosen countries/exams float to top; others collapse behind Show all
  const [pinC, setPinC] = useState(() => { try { return JSON.parse(localStorage.getItem('pin_countries') || '[]'); } catch (e) { return []; } });
  const [pinE, setPinE] = useState(() => { try { return JSON.parse(localStorage.getItem('pin_exams') || '[]'); } catch (e) { return []; } });
  const [showAllC, setShowAllC] = useState(false);
  const [showAllE, setShowAllE] = useState(false);
  const togglePinC = (name) => setPinC((p) => { const n = p.includes(name) ? p.filter((x) => x !== name) : [...p, name]; localStorage.setItem('pin_countries', JSON.stringify(n)); return n; });
  const togglePinE = (key) => setPinE((p) => { const n = p.includes(key) ? p.filter((x) => x !== key) : [...p, key]; localStorage.setItem('pin_exams', JSON.stringify(n)); return n; });

  const [counts, setCounts] = useState({});
  useEffect(() => { api.getStats().then((d) => setCounts(d.counts || {})).catch(() => {}); }, []);

  // counts for a specific exam PART (best-effort mapping to users' exam strings)
  const partCount = (exam, part) => {
    const fam = exam.split(' ')[0];
    const SPECIAL = { 'PLAB 1 / AKT': 'PLAB 1 / UKMLA AKT', 'PLAB 2 / CPSA': 'PLAB 2 / UKMLA CPSA' };
    // signup stores e.g. "FCPS — Part 1 — Radiology"; the catalog label is "FCPS Part 1"
    const dashed = exam.replace(/^(\w+)\s+(Part\s+\d+)$/, '$1 — $2'); // "FCPS Part 1" -> "FCPS — Part 1"
    const candidates = [SPECIAL[part], `${exam} — ${part}`, `${dashed} — ${part}`, `${fam} — ${part}`, exam === 'SMLE' ? 'SMLE' : null];
    let n = 0;
    for (const k of candidates) if (k && counts[k]) n = Math.max(n, counts[k]);
    return n;
  };
  const examCount = (label) => {
    const family = label.split(' ')[0];
    let n = 0;
    for (const [key, val] of Object.entries(counts)) {
      if (key.split('—')[0].trim().split(' ')[0] === family) n = Math.max(n, val);
    }
    return n;
  };

  const orderedCountries = (() => {
    const p = CATALOG.filter((x) => pinC.includes(x[1]));
    const r = CATALOG.filter((x) => !pinC.includes(x[1]));
    return pinC.length && !showAllC ? p : [...p, ...r];
  })();
  const allExams = CATALOG.flatMap(([flag, country, exams]) => exams.map(([exam, parts]) => ({ flag, country, exam, parts })));
  const orderedExams = (() => {
    const kk = (x) => 'exam|' + x.country + '|' + x.exam;
    const p = allExams.filter((x) => pinE.includes(kk(x)));
    const r = allExams.filter((x) => !pinE.includes(kk(x)));
    return pinE.length && !showAllE ? p : [...p, ...r];
  })();

  return (
    <>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab ${browseMode === 'country' ? 'on' : ''}`} onClick={() => { setBrowseMode('country'); setOpenExam(''); }}>By country</button>
        <button className={`tab ${browseMode === 'exam' ? 'on' : ''}`} onClick={() => { setBrowseMode('exam'); setOpenExam(''); }}>By exam</button>
      </div>

      {((browseMode === 'country' && pinC.length > 0) || (browseMode === 'exam' && pinE.length > 0)) && (
        <button className="link" style={{ display: 'block', margin: '0 auto 12px', fontSize: 12.5, fontWeight: 700 }}
          onClick={() => browseMode === 'country' ? setShowAllC(!showAllC) : setShowAllE(!showAllE)}>
          {(browseMode === 'country' ? showAllC : showAllE) ? 'Show pinned only ▴' : 'Show all ▾'}
        </button>
      )}

      {browseMode === 'exam' && (
        <>
          {orderedExams.map(({ flag, country, exam, parts }) => {
              const key = 'exam|' + country + '|' + exam;
              const ecx = examColor(exam);
              return (
                <div key={key} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${ecx}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, cursor: 'pointer' }}
                    onClick={() => setOpenExam(openExam === key ? '' : key)}>
                    <Flag country={country} emoji={flag} size={30} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{exam}</span>
                    {examCount(exam) >= 2 && (
                      <span style={{ fontSize: 11, color: '#fff', background: ecx, borderRadius: 20, padding: '3px 9px', fontWeight: 700 }}>
                        {examCount(exam)}
                      </span>
                    )}
                    <span className={`star-btn ${pinE.includes(key) ? 'on twinkle' : ''}`} onClick={(e) => { e.stopPropagation(); togglePinE(key); }} style={{ padding: '0 5px', display: 'inline-flex' }}><StarIcon filled={pinE.includes(key)} /></span>
                    <span className="meta" style={{ fontSize: 11 }}><span style={{ display: 'inline-block', transition: 'transform .25s ease', transform: openExam === key ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span></span>
                  </div>
                  {openExam === key && parts.map((part) => {
                    return (
                      <div key={part} className="exam-accent" style={{ '--ec': ecx, padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{part}</span>
                        {partCount(exam, part) >= 1 && <span style={{ fontSize: 10.5, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '2px 8px', fontWeight: 700, marginRight: 6 }}>{partCount(exam, part)}</span>}
                        <span style={{ color: 'var(--subtle)', fontSize: 13 }}>›</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </>
      )}

      {browseMode === 'country' && orderedCountries.map(([flag, country, exams]) => (
        <div key={country} className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: 14, cursor: 'pointer' }}
            onClick={() => setOpenCountry(openCountry === country ? '' : country)}>
            <Flag country={country} emoji={flag} />
            <span style={{ flex: 1, fontWeight: 600 }}>{country}</span>
            <span className={`star-btn ${pinC.includes(country) ? 'on twinkle' : ''}`} onClick={(e) => { e.stopPropagation(); togglePinC(country); }} style={{ padding: '0 5px', display: 'inline-flex' }}><StarIcon filled={pinC.includes(country)} /></span>
            <span className="meta" style={{ fontSize: 17, fontWeight: 700, color: 'var(--subtle)', transition: 'transform .25s ease', transform: openCountry === country ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}>›</span>
          </div>

          {openCountry === country && exams.map(([exam, parts]) => {
            const key = country + '|' + exam;
            return (
              <div key={exam} style={{ borderTop: '1px solid var(--line)', borderLeft: `4px solid ${examColor(exam)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 12px 40px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}
                  onClick={() => setOpenExam(openExam === key ? '' : key)}>
                  <span style={{ flex: 1 }}>{exam}</span>
                  {examCount(exam) >= 2 && (
                    <span style={{ fontSize: 11, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '3px 9px', marginRight: 8, fontWeight: 700 }}>
                      {examCount(exam)} doctors
                    </span>
                  )}
                  <span className="meta" style={{ fontSize: 11 }}><span style={{ display: 'inline-block', transition: 'transform .25s ease', transform: openExam === key ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span></span>
                </div>
                {openExam === key && parts.map((part) => {
                  const ec = examColor(exam);
                  return (
                    <div key={part} className="exam-accent" style={{ '--ec': ec, padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', flex: 1 }}>{part}</span>
                      {partCount(exam, part) >= 1 && <span style={{ fontSize: 10.5, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '2px 8px', fontWeight: 700, marginRight: 6 }}>{partCount(exam, part)}</span>}
                      <span style={{ color: 'var(--subtle)', fontSize: 13 }}>›</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

// Countdown + Study Streak tiles, each with a tap-to-expand pop-out.
function Momentum({ user }) {
  // user-hideable tiles (Profile -> Home screen)
  const hideCd = localStorage.getItem('hide_countdown') === '1';
  const hideSt = localStorage.getItem('hide_streak') === '1';

  // exam countdown
  let daysLeft = null;
  if (user?.exam_date) {
    const t = new Date(user.exam_date).getTime();
    if (!isNaN(t)) daysLeft = Math.ceil((t - Date.now()) / 86400000);
  }

  // streak
  const [streak, setStreak] = useState(user?.current_streak || 0);
  // remember today's mark locally (keyed to the date) so the button doesn't revert on re-render
  const todayKey = 'studied_' + new Date().toISOString().slice(0, 10);
  const [studiedToday, setStudiedToday] = useState(user?.studied_today || localStorage.getItem(todayKey) === '1');
  const [marking, setMarking] = useState(false);
  const burstConfetti = () => {
    const colors = ['#a8442a', '#1f4d3f', '#b98a2e', '#2c6a55'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'confetti-piece';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 240 - 120) + 'px');
      p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.left = (45 + Math.random() * 10) + '%';
      p.style.animationDelay = (Math.random() * 0.15) + 's';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1300);
    }
  };
  const markStudy = async () => {
    if (marking || studiedToday) return;
    setMarking(true);
    try {
      const d = await api.markStudy();
      if (d.user) {
        setStreak(d.user.current_streak || 0); setStudiedToday(true); localStorage.setItem(todayKey, '1');
        burstConfetti();
        if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
      }
    } catch (e) {} finally { setMarking(false); }
  };

  // pop-outs
  const [cdOpen, setCdOpen] = useState(false);
  const [stOpen, setStOpen] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    if (!cdOpen) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [cdOpen]);

  // adaptive coach line — urgency without panic
  const coachLine = (d) => {
    if (d > 60) return 'Plenty of runway.';
    if (d > 14) return 'Sharpening phase.';
    if (d > 2)  return 'Lock in.';
    if (d >= 0) return 'Trust your prep. Rest well.';
    return 'Update your exam date in Profile.';
  };

  return (
    <>
      {(!hideCd && daysLeft !== null) || !hideSt ? (
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        {!hideCd && daysLeft !== null && (
          <div className="card" onClick={() => setCdOpen(true)} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderColor: 'var(--forest)', margin: 0, cursor: 'pointer', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '50%', right: 11, transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'var(--subtle)', opacity: 0.9, lineHeight: 1 }}>›</span>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--forest)', textTransform: 'uppercase' }}>Countdown</div>
            <div className="display-num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--forest)', lineHeight: 1.15 }}>
              {daysLeft > 0 ? daysLeft : daysLeft === 0 ? 'Today' : '—'}
            </div>
            <div className="sub" style={{ fontSize: 10, marginTop: 0 }}>{daysLeft > 0 ? 'days to exam' : daysLeft === 0 ? 'exam day!' : 'passed'}</div>
          </div>
        )}
        {!hideSt && (
        <div className="card" onClick={() => setStOpen(true)} style={{ flex: 1, textAlign: 'center', padding: '12px 8px', borderColor: 'var(--forest)', margin: 0, cursor: 'pointer', position: 'relative' }}>
          <span style={{ position: 'absolute', top: '50%', right: 11, transform: 'translateY(-50%)', fontSize: 18, fontWeight: 700, color: 'var(--subtle)', opacity: 0.9, lineHeight: 1 }}>›</span>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: 'var(--forest)', textTransform: 'uppercase' }}>Study Streak</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--rust)', lineHeight: 1.2, marginTop: 2 }}>
            <span style={{ fontSize: 18 }}>🔥</span> {streak}
          </div>
          {studiedToday ? (
            <div style={{ marginTop: 5 }}><span className="match-pill pill-exc">✓ done today</span></div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); markStudy(); }} disabled={marking} style={{ marginTop: 4, fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--rust)', border: 'none', borderRadius: 999, padding: '5px 11px', cursor: 'pointer' }}>
              {marking ? '…' : 'Mark today ✓'}
            </button>
          )}
        </div>
        )}
      </div>
      ) : null}

      {cdOpen && user?.exam_date && (() => {
        const examTs = new Date(user.exam_date).getTime();
        const diff = Math.max(0, examTs - nowTs);
        const totSec = Math.floor(diff / 1000);
        const totDays = Math.floor(totSec / 86400);
        const weeks = Math.floor(totDays / 7);
        const days = totDays % 7;
        const hh = String(Math.floor((totSec % 86400) / 3600)).padStart(2, '0');
        const mm2 = String(Math.floor((totSec % 3600) / 60)).padStart(2, '0');
        const ss = String(totSec % 60).padStart(2, '0');
        const dLeft = Math.ceil((examTs - nowTs) / 86400000);
        return (
          <div onClick={() => setCdOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: '100%', textAlign: 'center', animation: 'popIn .3s cubic-bezier(0.34, 1.56, 0.64, 1) both', margin: 0 }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--rust)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 6px', display: 'block' }}>
                <path d="M6 2h12M6 22h12M6 2c0 4 3 6 6 10 3-4 6-6 6-10M6 22c0-4 3-6 6-10" />
              </svg>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--rust)', textTransform: 'uppercase' }}>{user?.exam || 'Your exam'}</div>
              <div className="sub" style={{ fontSize: 12, marginTop: 2 }}>{new Date(user.exam_date).toDateString()}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0 4px' }}>
                <div style={{ flex: 1, maxWidth: 90 }}>
                  <div className="display-num" style={{ fontSize: 34, fontWeight: 700, color: 'var(--forest)', lineHeight: 1 }}>{weeks}</div>
                  <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>weeks</div>
                </div>
                <div style={{ flex: 1, maxWidth: 90 }}>
                  <div className="display-num" style={{ fontSize: 34, fontWeight: 700, color: 'var(--forest)', lineHeight: 1 }}>{days}</div>
                  <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>days</div>
                </div>
              </div>
              <div className="display-num" style={{ fontSize: 30, fontWeight: 700, color: 'var(--rust)', letterSpacing: 2, fontVariantNumeric: 'tabular-nums', margin: '6px 0 2px' }}>
                {hh}:{mm2}:{ss}
              </div>
              <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>hours · minutes · seconds</div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 999, padding: '5px 14px', margin: '14px 0 2px' }}>{coachLine(dLeft)}</div>
              <button className="btn ghost" style={{ marginTop: 12 }} onClick={() => setCdOpen(false)}>Back to it</button>
            </div>
          </div>
        );
      })()}

      {stOpen && (() => {
        const best = Math.max(user?.longest_streak || 0, streak);
        const line = !studiedToday
          ? 'One tap keeps the flame alive.'
          : streak >= best && streak > 1
            ? "You're at your peak. Don't look down."
            : streak === 0
              ? 'Every legendary streak starts at day one.'
              : "Today's locked in. See you tomorrow, doctor.";
        return (
          <div onClick={() => setStOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', zIndex: 100, padding: 24 }}>
            <div onClick={(e) => e.stopPropagation()} className="card" style={{ maxWidth: 340, width: '100%', textAlign: 'center', animation: 'popIn .3s cubic-bezier(0.34, 1.56, 0.64, 1) both', margin: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--rust)', textTransform: 'uppercase' }}>Study Streak</div>
              <div style={{ fontSize: 52, lineHeight: 1.1, marginTop: 8 }}>🔥</div>
              <div className="display-num" style={{ fontSize: 40, fontWeight: 700, color: 'var(--rust)', lineHeight: 1.1 }}>{streak}</div>
              <div className="sub" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>day{streak === 1 ? '' : 's'} in a row</div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 12 }}>
                <span style={{ fontSize: 15 }}>🏆</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--forest)' }}>Personal best: {best} day{best === 1 ? '' : 's'}</span>
              </div>
              {(() => {
                const fullTrees = Math.floor(streak / 7);
                const dayInWeek = streak % 7;
                const sprout = dayInWeek === 0 ? '' : dayInWeek < 3 ? '🌱' : dayInWeek < 6 ? '🌿' : '🌳';
                return (
                  <div style={{ marginTop: 14, padding: '12px 8px', background: 'var(--paper-2)', borderRadius: 12 }}>
                    <div style={{ fontSize: 19, lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {fullTrees > 0 ? '🌳'.repeat(Math.min(fullTrees, 21)) : ''}{sprout}
                      {fullTrees === 0 && dayInWeek === 0 && <span className="sub" style={{ fontSize: 12 }}>Study today to plant your first sprout 🌱</span>}
                    </div>
                    <div className="sub" style={{ fontSize: 10.5, marginTop: 6 }}>
                      {fullTrees > 0 && `${fullTrees} week${fullTrees === 1 ? '' : 's'} grown`}{fullTrees > 0 && dayInWeek > 0 ? ' · ' : ''}{dayInWeek > 0 && `${7 - dayInWeek} day${7 - dayInWeek === 1 ? '' : 's'} to your next tree`}
                    </div>
                    <div className="sub" style={{ fontSize: 10, marginTop: 8, opacity: 0.8 }}>🌱 → 🌳 Every 7 study days grows a new tree.</div>
                  </div>
                );
              })()}
              <p className="voice" style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)', margin: '12px 6px 4px', lineHeight: 1.45 }}>{line}</p>
              {!studiedToday && (
                <button className="btn btn-cta" style={{ marginTop: 10 }} disabled={marking} onClick={markStudy}>
                  {marking ? '…' : 'Mark today ✓'}
                </button>
              )}
              <button className="btn ghost" style={{ marginTop: 8 }} onClick={() => setStOpen(false)}>Keep going</button>
            </div>
          </div>
        );
      })()}
    </>
  );
}

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || 'Dr A').replace(/^Dr\.?\s+/i, '').trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join('');
  const quote = quoteOfTheDay();
  const [showMotivation, setShowMotivation] = useState(false);
  const { registerBack, clearBack } = useBack();
  useEffect(() => {
    if (showMotivation) { registerBack(() => setShowMotivation(false)); return () => clearBack(); }
  }, [showMotivation, registerBack, clearBack]);

  const [nudges, setNudges] = useState([]);

  const [invited, setInvited] = useState(false);
  useEffect(() => { api.connections().then((d) => setNudges(d.nudges || [])).catch(() => {}); }, []);

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

  return (
    <div className="screen">
      <div onClick={() => setShowMotivation(true)} style={{ cursor: 'pointer', marginTop: 4, padding: '18px 18px', borderRadius: 18, background: 'linear-gradient(135deg, var(--forest) 0%, var(--forest-2) 100%)', color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 6px 20px rgba(31,77,63,.28)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, position: 'relative' }}>
          Hi Dr. {(user?.name || '').replace(/^Dr\.?\s+/i, '').split(' ')[0] || 'Doctor'} — a thought for today
        </div>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 17, fontWeight: 500, lineHeight: 1.4, position: 'relative', paddingRight: 28 }}>
          <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700, color: 'var(--gold)', verticalAlign: '-9px', lineHeight: 0, marginRight: 1 }}>“</span>{quote.text}<span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 26, fontWeight: 700, color: 'var(--gold)', verticalAlign: '-9px', lineHeight: 0, marginLeft: 1 }}>”</span>
        </div>
        {quote.author && <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontStyle: 'italic', color: 'var(--gold)', marginTop: 6, paddingRight: 28 }}>— {quote.author}</div>}
        <div style={{ position: 'absolute', top: '50%', right: 14, transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', fontSize: 15, opacity: 0.9 }}>›</div>
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

      <div style={{ padding: '10px 4px 8px', textAlign: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 4 }}>
          For doctors, by doctors
        </div>
        <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontVariationSettings: '"opsz" 18', fontSize: 16, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.2px', color: 'var(--forest)', margin: 0, whiteSpace: 'nowrap' }}>
          Find the right <em style={{ fontStyle: 'italic' }}>study partner</em> for your exam
        </h1>
      </div>

      <Momentum user={user} />


      <h2 className="serif" style={{ fontSize: 18, fontWeight: 600, margin: '18px 0 12px' }}>Explore study partners</h2>

      <ExploreBrowse />

      {/* invite a colleague — native share sheet (Android & iOS), clipboard fallback */}
      <div className="card" style={{ textAlign: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Know a doctor who needs a study partner?</div>
        <p className="sub" style={{ fontSize: 13, marginBottom: 12 }}>MedConnect grows one colleague at a time.</p>
        <button className="btn btn-cta" onClick={inviteFriend}>Invite your friends</button>
        {invited && <p className="sub" style={{ fontSize: 12, marginTop: 8, color: 'var(--forest)', fontWeight: 700 }}>Link copied — paste it anywhere! ✓</p>}
      </div>

      {showMotivation && (
        <div className="fs-open" style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="fs-content" style={{ minHeight: '100%', position: 'relative' }}>
            <Motivation onBack={() => setShowMotivation(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

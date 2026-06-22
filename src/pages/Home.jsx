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

// one clean representative colour per country (for the ring accent)
const FLAG_COLOR = {
  'United States': '#3c3b6e',
  'United Kingdom': '#C8102E',
  'Pakistan': '#01411C',
  'Australia': '#00247D',
  'Saudi Arabia': '#006C35',
  'India': '#FF9933',
};
const flagColor = (country) => FLAG_COLOR[country] || 'var(--forest)';

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

function Flag({ country, emoji, size = 34, ring }) {
  const code = FLAG_CODE[country];
  const [broken, setBroken] = useState(false);
  const ringStyle = ring ? { boxShadow: `0 0 0 2.5px ${ring}, 0 0 0 4.5px var(--card)` } : {};
  if (!code || broken) return <span className="flag-circ" style={{ width: size, height: size, fontSize: size * 0.5, overflow: 'visible', ...ringStyle }}>{emoji}</span>;
  return (
    <span className="flag-circ" style={{ width: size, height: size, ...ringStyle }}>
      <img src={`https://flagcdn.com/w160/${code}.png`} alt={country + ' flag'} onError={() => setBroken(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
}

// small ringed dot used as the exam accent token
function DotRing({ color, size = 30 }) {
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `0 0 0 2.5px ${color}, 0 0 0 4.5px var(--card)` }}>
      <span style={{ width: size * 0.4, height: size * 0.4, borderRadius: '50%', background: color }} />
    </span>
  );
}

// "Explore study partners" browser: by-country / by-exam trees with partner counts
function ExploreBrowse() {
  const nav = useNavigate();
  const ls = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const [openCountry, setOpenCountryRaw] = useState(() => ls('explore_open_country', ''));
  const setOpenCountry = (v) => { setOpenCountryRaw(v); lsSet('explore_open_country', v); };
  const [openExam, setOpenExamRaw] = useState(() => ls('explore_open_exam', ''));
  const setOpenExam = (v) => { setOpenExamRaw(v); lsSet('explore_open_exam', v); };
  const [browseMode, setBrowseModeRaw] = useState(() => ls('explore_mode', 'country'));
  const setBrowseMode = (v) => { setBrowseModeRaw(v); lsSet('explore_mode', v); };
  // starred countries/exams float to the top; a toggle lets you show only your pinned set
  const [pinC, setPinC] = useState(() => { try { return JSON.parse(localStorage.getItem('pin_countries') || '[]'); } catch (e) { return []; } });
  const [pinE, setPinE] = useState(() => { try { return JSON.parse(localStorage.getItem('pin_exams') || '[]'); } catch (e) { return []; } });
  const [pinnedOnly, setPinnedOnlyRaw] = useState(() => ls('explore_pinned_only', '0') === '1');
  const setPinnedOnly = (v) => { const next = typeof v === 'function' ? v(pinnedOnly) : v; setPinnedOnlyRaw(next); lsSet('explore_pinned_only', next ? '1' : '0'); };
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
    return pinnedOnly && pinC.length ? p : [...p, ...r];
  })();
  const allExams = CATALOG.flatMap(([flag, country, exams]) => exams.map(([exam, parts]) => ({ flag, country, exam, parts })));
  const orderedExams = (() => {
    const kk = (x) => 'exam|' + x.country + '|' + x.exam;
    const p = allExams.filter((x) => pinE.includes(kk(x)));
    const r = allExams.filter((x) => !pinE.includes(kk(x)));
    return pinnedOnly && pinE.length ? p : [...p, ...r];
  })();

  return (
    <>
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button className={`tab ${browseMode === 'country' ? 'on' : ''}`} onClick={() => { setBrowseMode('country'); setOpenExam(''); }}>By Country</button>
        <button className={`tab ${browseMode === 'exam' ? 'on' : ''}`} onClick={() => { setBrowseMode('exam'); setOpenExam(''); }}>By Exam</button>
      </div>

      {((browseMode === 'country' && pinC.length > 0) || (browseMode === 'exam' && pinE.length > 0)) && (
        <button onClick={() => setPinnedOnly(!pinnedOnly)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, margin: '0 auto 16px', padding: '7px 15px', borderRadius: 999, border: '1.5px solid var(--line)', background: pinnedOnly ? 'var(--forest)' : 'transparent', color: pinnedOnly ? '#fff' : 'var(--forest)', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill={pinnedOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15 8.5 22 9.3 17 14 18.3 21 12 17.5 5.7 21 7 14 2 9.3 9 8.5 12 2" /></svg>
          {pinnedOnly ? 'Showing your starred' : 'Show starred only'}
        </button>
      )}

      {browseMode === 'exam' && (
        <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 10px rgba(20,40,30,.08)' }}>
          {orderedExams.map(({ flag, country, exam, parts }, idx) => {
              const key = 'exam|' + country + '|' + exam;
              const ecx = examColor(exam);
              return (
                <div key={key} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 18px', cursor: 'pointer' }}
                    onClick={() => setOpenExam(openExam === key ? '' : key)}>
                    <Flag country={country} emoji={flag} size={30} ring={flagColor(country)} />
                    <span style={{ flex: 1, fontWeight: 600 }}>{exam}</span>
                    {examCount(exam) >= 2 && (
                      <span style={{ fontSize: 11, color: '#fff', background: ecx, borderRadius: 20, padding: '3px 9px', fontWeight: 700 }}>
                        {examCount(exam)}
                      </span>
                    )}
                    <span className={`star-btn ${pinE.includes(key) ? 'on twinkle' : ''}`} onClick={(e) => { e.stopPropagation(); togglePinE(key); }} style={{ padding: '0 5px', display: 'inline-flex' }}><StarIcon filled={pinE.includes(key)} /></span>
                    <span className={`chev-round ${openExam === key ? 'open' : ''}`} style={{ width: 24, height: 24 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
                  </div>
                  {openExam === key && parts.map((part) => {
                    return (
                      <div key={part} style={{ padding: '11px 18px 11px 22px', borderTop: '1px solid var(--line)', background: 'var(--paper-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11 }}
                        onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                        <DotRing color={ecx} size={20} />
                        <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{part}</span>
                        {partCount(exam, part) >= 1 && <span style={{ fontSize: 10.5, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '2px 8px', fontWeight: 700, marginRight: 6 }}>{partCount(exam, part)}</span>}
                        <span className="chev-round" style={{ width: 24, height: 24 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
        </div>
      )}

      {browseMode === 'country' && (
      <div style={{ background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 10px rgba(20,40,30,.08)' }}>
        {orderedCountries.map(([flag, country, exams], idx) => (
        <div key={country} style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 18px', cursor: 'pointer' }}
            onClick={() => setOpenCountry(openCountry === country ? '' : country)}>
            <Flag country={country} emoji={flag} ring={flagColor(country)} />
            <span style={{ flex: 1, fontWeight: 600 }}>{country}</span>
            <span className={`star-btn ${pinC.includes(country) ? 'on twinkle' : ''}`} onClick={(e) => { e.stopPropagation(); togglePinC(country); }} style={{ padding: '0 5px', display: 'inline-flex' }}><StarIcon filled={pinC.includes(country)} /></span>
            <span className={`chev-round ${openCountry === country ? 'open' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          </div>

          {openCountry === country && exams.map(([exam, parts]) => {
            const key = country + '|' + exam;
            return (
              <div key={exam} style={{ borderTop: '1px solid var(--line)', background: 'var(--paper-2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px 12px 24px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }}
                  onClick={() => setOpenExam(openExam === key ? '' : key)}>
                  <DotRing color={examColor(exam)} size={20} />
                  <span style={{ flex: 1 }}>{exam}</span>
                  {examCount(exam) >= 2 && (
                    <span style={{ fontSize: 11, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '3px 9px', marginRight: 8, fontWeight: 700 }}>
                      {examCount(exam)} doctors
                    </span>
                  )}
                  <span className={`chev-round ${openExam === key ? 'open' : ''}`} style={{ width: 24, height: 24 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
                </div>
                {openExam === key && parts.map((part) => {
                  const ec = examColor(exam);
                  return (
                    <div key={part} style={{ padding: '11px 18px 11px 40px', borderTop: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      onClick={() => nav(`/partners?exam=${encodeURIComponent(exam)}&part=${encodeURIComponent(part)}`)}>
                      <DotRing color={ec} size={16} />
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)', flex: 1 }}>{part}</span>
                      {partCount(exam, part) >= 1 && <span style={{ fontSize: 10.5, color: '#fff', background: examColor(exam), borderRadius: 20, padding: '2px 8px', fontWeight: 700, marginRight: 6 }}>{partCount(exam, part)}</span>}
                      <span className="chev-round" style={{ width: 24, height: 24 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        ))}
        </div>
      )}
    </>
  );
}

// Quick row: Qbank · Flashcards · Countdown · Streak (circles). Stats open inline; tools navigate.
function QuickRow({ user, nav, onGreen }) {
  // user-hideable tiles (Profile -> Home screen)
  const hideCd = localStorage.getItem('hide_countdown') === '1';
  const hideSt = localStorage.getItem('hide_streak') === '1';
  const hideQb = localStorage.getItem('hide_qbank') === '1';
  const hideFc = localStorage.getItem('hide_flashcards') === '1';

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
  // per-day study log (local) → powers the streak dots. { 'YYYY-MM-DD': 1 }
  const logStudyDay = () => {
    try {
      const log = JSON.parse(localStorage.getItem('study_days') || '{}');
      log[new Date().toISOString().slice(0, 10)] = 1;
      localStorage.setItem('study_days', JSON.stringify(log));
    } catch (e) {}
  };
  const last7 = (() => {
    let log = {};
    try { log = JSON.parse(localStorage.getItem('study_days') || '{}'); } catch (e) {}
    // ensure today reflects studiedToday even before a fresh log write
    if (studiedToday) log[new Date().toISOString().slice(0, 10)] = 1;
    const out = []; const d = new Date(); d.setDate(d.getDate() - 6);
    const L = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 0; i < 7; i++) {
      const k = d.toISOString().slice(0, 10);
      out.push({ on: !!log[k], letter: L[d.getDay()], isToday: k === new Date().toISOString().slice(0, 10) });
      d.setDate(d.getDate() + 1);
    }
    return out;
  })();
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
        logStudyDay();
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

  // ---- Qbank summary (folded in from QbankCard) ----
  const [qStats, setQStats] = useState({ loading: true });
  useEffect(() => {
    let active = true;
    api.qbankGet().then((d) => {
      if (!active) return;
      const rows = d.progress || [];
      if (!rows.length) { setQStats({ empty: true }); return; }
      const t = rows.reduce((a, r) => ({ done: a.done + (r.done || 0), correct: a.correct + (r.correct || 0) }), { done: 0, correct: 0 });
      const acc = t.done ? Math.round((t.correct / t.done) * 100) : 0;
      setQStats({ done: t.done, acc });
    }).catch(() => { if (active) setQStats({ empty: true }); });
    return () => { active = false; };
  }, []);
  const qSub = qStats.loading ? 'Loading…' : qStats.empty ? 'Start tracking your progress' : `${qStats.done} done · ${qStats.acc}% accuracy`;

  // ---- Flashcards due (best-effort; no badge if endpoint absent) ----
  const [due, setDue] = useState(null);
  useEffect(() => {
    let active = true;
    if (typeof api.flashcardsDue === 'function') {
      api.flashcardsDue().then((d) => { if (active) setDue(d?.due ?? d?.count ?? 0); }).catch(() => { if (active) setDue(0); });
    } else { setDue(0); }
    return () => { active = false; };
  }, []);

  // shared circle wrapper
  const Circle = ({ tint, color, glow, onClick, badge, selected, children, label }) => (
    <div onClick={onClick} className="qi-press" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
      <div className="qi-shape" style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', background: tint, color, display: 'grid', placeItems: 'center', boxShadow: glow || '0 6px 14px rgba(31,77,63,.12)', transition: 'transform .18s cubic-bezier(.34,1.7,.5,1), box-shadow .25s' }}>
        {badge != null && (
          <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: 'var(--rust)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'grid', placeItems: 'center', border: `2px solid ${onGreen ? '#1c4337' : 'var(--paper)'}`, zIndex: 3, animation: 'qBadge .5s cubic-bezier(.34,1.7,.5,1) both' }}>{badge}</span>
        )}
        {children}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: onGreen ? 'rgba(255,255,255,.85)' : 'var(--muted)', textAlign: 'center', lineHeight: 1.15 }}>{label}</div>
    </div>
  );

  const finalStretch = daysLeft != null && daysLeft > 0 && daysLeft <= 10;
  const WINDOW = 180;
  const frac = daysLeft == null ? 0 : (daysLeft > 0 ? Math.max(0, Math.min(1, (WINDOW - daysLeft) / WINDOW)) : 1);
  const R2 = 27, C2 = 2 * Math.PI * R2;

  return (
    <>
      <style>{`
        @keyframes qBadge{0%{transform:scale(0)}70%{transform:scale(1.25)}100%{transform:scale(1)}}
        .qi-press:active .qi-shape{transform:scale(.88)}
      `}</style>

      {/* paddingTop gives the fire breathing room from the motivation box */}
      <div style={{ display: 'flex', gap: 10, margin: '2px 0 4px', paddingTop: 8 }}>
        {/* Qbank — navigates */}
        {!hideQb && (
        <Circle tint="#dff0e4" color="#147a52" glow="0 6px 14px rgba(20,122,82,.18)" label="Qbank" selected={false} onClick={() => nav('/qbank')}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" /><rect x="12" y="8" width="3" height="10" /><rect x="17" y="14" width="3" height="4" /></svg>
        </Circle>
        )}

        {/* Flashcards — navigates */}
        {!hideFc && (
        <Circle tint="#fbeccb" color="#c08a1e" glow="0 6px 14px rgba(192,138,30,.20)" label="Flashcards" selected={false} badge={due ? due : null} onClick={() => nav('/flashcards')}>
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M7 10h5M7 13.5h3" /><path d="M20 8.5v8a2 2 0 0 1-2 2H8.5" /></svg>
        </Circle>
        )}

        {/* Countdown — opens inline detail */}
        {!hideCd && daysLeft !== null && (
      <Circle tint="transparent" color="#1f9bb8" glow="none" label="Countdown" onClick={() => setCdOpen(true)}>
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r={R2} fill="#dceff3" />
              <circle cx="32" cy="32" r={R2} fill="none" stroke="#c2e2e9" strokeWidth="5" />
              <circle cx="32" cy="32" r={R2} fill="none" stroke={finalStretch ? '#d98a1e' : '#1f9bb8'} strokeWidth="5" strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={C2 * (1 - frac)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
            </svg>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <b style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: daysLeft > 99 ? 16 : 19, color: finalStretch ? '#c0533f' : '#15795a', lineHeight: 1 }}>{daysLeft > 0 ? daysLeft : daysLeft === 0 ? '0' : '—'}</b>
              <span style={{ fontSize: 7.5, fontWeight: 800, letterSpacing: 1, color: '#5a8a7a', marginTop: 1 }}>{daysLeft >= 0 ? 'DAYS' : 'PASSED'}</span>
            </div>
          </Circle>
        )}

        {/* Streak — fire is the mark-today tap; circle body opens detail */}
        {!hideSt && (
          <Circle tint="#fde0d8" color="#d24a30" glow="0 6px 14px rgba(210,74,48,.22)" label="Streak" onClick={() => setStOpen(true)}>
            <span
              onClick={(e) => { e.stopPropagation(); if (!studiedToday) markStudy(); }}
              style={{ position: 'absolute', top: -6, right: -6, fontSize: 17, zIndex: 4, cursor: 'pointer', filter: studiedToday ? 'drop-shadow(0 1px 3px rgba(210,74,48,.4))' : 'grayscale(.7) opacity(.55) drop-shadow(0 1px 2px rgba(0,0,0,.12))' }}
            >🔥</span>
            <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontWeight: 900, fontSize: 24, color: '#d24a30', lineHeight: 1 }}>{streak}</span>
          </Circle>
        )}
      </div>


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
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--rust)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 6px', display: 'block' }}>
                <path d="M12 2c1 4-2 5-2 8a4 4 0 0 0 8 0c0-1-.5-2-1-3 .5 3-2 3-2 1 0-2-1-4-3-6z" />
                <path d="M8.5 12c-.8 1-1.5 2.2-1.5 3.8a5 5 0 0 0 10 0c0-1.2-.4-2.3-1-3.2" />
              </svg>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: 'var(--rust)', textTransform: 'uppercase' }}>Study Streak</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '16px 0 4px' }}>
                <div style={{ flex: 1, maxWidth: 90 }}>
                  <div className="display-num" style={{ fontSize: 34, fontWeight: 700, color: 'var(--rust)', lineHeight: 1 }}>{streak}</div>
                  <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>day{streak === 1 ? '' : 's'} in a row</div>
                </div>
                <div style={{ flex: 1, maxWidth: 90 }}>
                  <div className="display-num" style={{ fontSize: 34, fontWeight: 700, color: 'var(--forest)', lineHeight: 1 }}>{best}</div>
                  <div className="sub" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>personal best</div>
                </div>
              </div>
              <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 999, padding: '5px 14px', margin: '14px 0 2px' }}>{line}</div>
              <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
                {studiedToday ? '🔥 Today is logged — see you tomorrow' : '🔥 Tap the flame on Home to log today'}
              </div>
              {!studiedToday && (
                <button className="btn btn-cta" style={{ marginTop: 12 }} disabled={marking} onClick={markStudy}>
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
  const [nudgesOpen, setNudgesOpen] = useState(false);
  const [dismissed, setDismissed] = useState(() => { try { return JSON.parse(localStorage.getItem('dismissed_nudges') || '[]'); } catch (e) { return []; } });
  const dismissNudge = (id) => {
    setDismissed((prev) => { const next = [...new Set([...prev, id])]; try { localStorage.setItem('dismissed_nudges', JSON.stringify(next)); } catch (e) {} return next; });
  };
  const liveNudges = nudges.filter((n) => !dismissed.includes(n.id));

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
    <div className="screen" style={{ padding: 0 }}>
      {/* ===== GREEN BAND: greeting + motivation quote + nudges + quick circles ===== */}
      <div style={{ background: 'linear-gradient(165deg, #1f4d3f 0%, #163a2f 100%)', padding: '14px 18px 30px', color: '#fff' }}>
        <div onClick={() => setShowMotivation(true)} style={{ cursor: 'pointer', position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>
            Hi Dr. {(user?.name || '').replace(/^Dr\.?\s+/i, '').split(' ')[0] || 'Doctor'} — a thought for today
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, fontFamily: "'Newsreader', Georgia, serif", fontSize: 18, fontWeight: 500, lineHeight: 1.42 }}>
              <span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 25, fontWeight: 700, color: 'var(--gold)', verticalAlign: '-9px', lineHeight: 0, marginRight: 1 }}>“</span>{quote.text}<span style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 25, fontWeight: 700, color: 'var(--gold)', verticalAlign: '-9px', lineHeight: 0, marginLeft: 1 }}>”</span>
              {quote.author && <span style={{ display: 'block', fontFamily: "'Newsreader', Georgia, serif", fontSize: 13, fontStyle: 'italic', color: 'var(--gold)', marginTop: 6 }}>— {quote.author}</span>}
            </div>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', fontSize: 16, flexShrink: 0 }}>›</div>
          </div>
        </div>

        {liveNudges.length > 0 && (() => {
          const first = liveNudges[0];
          const rest = liveNudges.slice(1);
          const Row = ({ n, divided }) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderTop: divided ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
              <div onClick={() => nav(`/chat?with=${n.id}&name=${encodeURIComponent(n.name)}&av=${encodeURIComponent(n.avatar || '')}`)} style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.18)', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0, cursor: 'pointer' }}>{n.avatar || '👋'}</div>
              <div style={{ flex: 1, minWidth: 0, lineHeight: 1.3, cursor: 'pointer' }} onClick={() => nav(`/chat?with=${n.id}&name=${encodeURIComponent(n.name)}&av=${encodeURIComponent(n.avatar || '')}`)}>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</div>
                {n.exam && <div style={{ fontSize: 11.5, opacity: 0.82 }}>{n.exam}</div>}
              </div>
              <button onClick={() => nav(`/chat?with=${n.id}&name=${encodeURIComponent(n.name)}&av=${encodeURIComponent(n.avatar || '')}`)} style={{ background: '#fff', color: 'var(--forest)', border: 'none', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit' }}>Say hi</button>
              <button onClick={() => dismissNudge(n.id)} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', cursor: 'pointer', padding: 4, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
          );
          return (
            <div style={{ marginTop: 14, borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: '#fff' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--gold)', padding: '11px 14px 0' }}>
                🎉 {liveNudges.length === 1 ? 'New study partner' : `${liveNudges.length} new study partners`}
              </div>
              <Row n={first} />
              {rest.length > 0 && nudgesOpen && rest.map((n) => <Row key={n.id} n={n} divided />)}
              {rest.length > 0 && (
                <button onClick={() => setNudgesOpen(!nudgesOpen)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px', borderTop: '1px solid rgba(255,255,255,.15)', background: 'rgba(255,255,255,.08)', border: 'none', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {nudgesOpen ? 'Show less' : `Show ${rest.length} more`}
                  <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', transition: 'transform .25s ease', transform: nudgesOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                  </span>
                </button>
              )}
            </div>
          );
        })()}

        <div style={{ marginTop: 18 }}>
          <QuickRow user={user} nav={nav} onGreen />
        </div>
      </div>

      {/* ===== CURVED LIGHT SHEET: Explore + invite + footer ===== */}
      <div style={{ background: 'var(--paper)', borderRadius: '28px 28px 0 0', marginTop: -16, position: 'relative', zIndex: 1, padding: '22px 18px 20px' }}>
        <h2 className="serif" style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 21, fontWeight: 900, letterSpacing: '-0.3px', color: 'var(--forest)', margin: '0 0 12px' }}>Explore Study Partners</h2>

        <ExploreBrowse />

        {/* invite a colleague — slim rust pill, native share sheet (Android & iOS), clipboard fallback */}
        <div onClick={inviteFriend} style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 999, padding: '12px 16px', marginTop: 20, cursor: 'pointer', background: 'linear-gradient(135deg, #1f4d3f 0%, #2c6a55 100%)', color: '#fff', boxShadow: '0 4px 14px rgba(31,77,63,.25)' }}>
          <span style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'grid', placeItems: 'center', fontSize: 19, flexShrink: 0 }}>👋</span>
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>Study better, together — invite a colleague</span>
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.22)', display: 'grid', placeItems: 'center', flexShrink: 0, color: '#fff' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </span>
        </div>
        {invited && <p className="sub" style={{ fontSize: 12, marginTop: 8, textAlign: 'center', color: 'var(--forest)', fontWeight: 700 }}>Link copied — paste it anywhere! ✓</p>}

        {/* signature footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '28px 0 8px', opacity: 0.55 }}>
          <span style={{ height: 1, width: 28, background: 'var(--line)' }} />
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>For doctors, by doctors</span>
          <span style={{ height: 1, width: 28, background: 'var(--line)' }} />
        </div>
      </div>

      {showMotivation && (
        <div className="fs-open" style={{ position: 'fixed', inset: 0, background: 'var(--paper)', zIndex: 1000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 72px)' }}>
          <div className="fs-content" style={{ minHeight: '100%', position: 'relative' }}>
            <Motivation onBack={() => setShowMotivation(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// Slim Qbank summary card — shows overall progress, taps through to the full tracker.
function QbankCard({ nav }) {
  const [stats, setStats] = useState({ loading: true });
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    let active = true;
    api.qbankGet().then((d) => {
      if (!active) return;
      const rows = d.progress || [];
      if (!rows.length) { setStats({ empty: true }); return; }
      const t = rows.reduce((a, r) => ({ done: a.done + (r.done || 0), total: a.total + (r.total || 0), correct: a.correct + (r.correct || 0) }), { done: 0, total: 0, correct: 0 });
      const acc = t.done ? Math.round((t.correct / t.done) * 100) : 0;
      setStats({ done: t.done, acc, banks: [...new Set(rows.map((r) => r.bank))].length });
    }).catch(() => { if (active) setStats({ empty: true }); });
    return () => { active = false; };
  }, []);

  const subtitle = stats.empty
    ? 'Start tracking your question progress'
    : `${stats.done} done · ${stats.acc}% accuracy${stats.banks > 1 ? ` · ${stats.banks} banks` : ''}`;

  return (
    <button onClick={() => nav('/qbank')}
      onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 13, margin: '4px 0 6px', padding: '13px 15px',
        background: 'var(--card)', border: '1.5px solid var(--line)', borderRadius: 16, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
        boxShadow: '0 2px 8px rgba(20,40,30,.05)', transform: pressed ? 'scale(0.97)' : 'scale(1)', transition: 'transform .12s ease',
      }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--paper-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--forest)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v14H4zM4 9h16M9 9v10" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14.5, color: 'var(--ink)' }}>Qbank Tracker</div>
        {stats.loading
          ? <div style={{ height: 11, width: 130, borderRadius: 6, background: 'var(--paper-2)', marginTop: 4 }} />
          : <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--paper-2)', display: 'grid', placeItems: 'center', color: 'var(--forest)', fontWeight: 800, flexShrink: 0 }}>›</span>
    </button>
  );
}

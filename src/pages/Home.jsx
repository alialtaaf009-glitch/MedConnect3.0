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
  const [counts, setCounts] = useState({});
  useEffect(() => { api.getStats().then((d) => setCounts(d.counts || {})).catch(() => {}); }, []);

  // count for a browse exam label like "MRCP Part 1" -> match its family "MRCP"
  const examCount = (label) => {
    const family = label.split(' ')[0]; // "MRCP", "FCPS", "USMLE"...
    // sum any stored exam whose family matches
    let n = 0;
    for (const [key, val] of Object.entries(counts)) {
      if (key.split('—')[0].trim().split(' ')[0] === family) n = Math.max(n, val);
    }
    return n;
  };

  return (
    <div className="screen">
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 50, height: 50, borderRadius: 15, background: 'var(--paper-2)', border: '1.5px solid var(--line)', display: 'grid', placeItems: 'center', color: 'var(--forest)', fontWeight: 600, fontSize: user?.avatar ? 26 : 18 }}>{user?.avatar || initials}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Welcome back, {user?.name}</div>
            <div className="meta">{[user?.exam, user?.country].filter(Boolean).join(' · ') || 'Ready to match'}</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '4px 6px 8px' }}>
        <p className="serif" style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25, marginBottom: 8 }}>
          Find the right study partner for your medical exam.
        </p>
        <p className="sub" style={{ fontSize: 13.5, lineHeight: 1.55, marginTop: 0 }}>
          Match with verified doctors preparing for the same boards, the same exam parts, and on a compatible timeline — wherever they are in the world.
        </p>
      </div>

      {daysLeft !== null && (
        <div className="card" style={{ textAlign: 'center', borderColor: 'var(--rust)' }}>
          <div className="label" style={{ marginTop: 0, color: 'var(--rust)' }}>Exam countdown</div>
          <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 900, color: 'var(--forest)' }}>
            {daysLeft > 0 ? daysLeft : daysLeft === 0 ? 'Today' : 'Passed'}
          </div>
          {daysLeft > 0 && <div className="sub" style={{ marginTop: 0 }}>days until {user?.exam || 'your exam'}</div>}
        </div>
      )}
<div className="card" style={{ textAlign: 'center' }}>
        <div className="label" style={{ marginTop: 0, color: 'var(--forest)' }}>Study streak</div>
        <div style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 40, fontWeight: 900, color: 'var(--rust)' }}>
          🔥 {user?.current_streak || 0}
        </div>
        <div className="sub" style={{ marginTop: 0 }}>
          {(user?.current_streak || 0) === 1 ? 'day' : 'days'} in a row · keep it going
        </div>
        {(user?.longest_streak || 0) > (user?.current_streak || 0) && (
          <div className="meta" style={{ fontSize: 11, marginTop: 4 }}>
            Best: {user.longest_streak} days
          </div>
        )}
      </div>
      <div className="card" style={{ cursor: 'pointer' }} onClick={() => nav('/motivation')}>
        <div className="label" style={{ marginTop: 0 }}>✦ Daily motivation</div>
        <p style={{ fontFamily: "'Newsreader',Georgia,serif", fontSize: 16, lineHeight: 1.4 }}>“{quote.text}”</p>
        <div className="link" style={{ marginTop: 6 }}>Open the motivation wall ›</div>
      </div>

      <h2 className="serif" style={{ fontSize: 18, fontWeight: 600, margin: '24px 0 12px' }}>Explore study partners</h2>

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
                    <span style={{ fontSize: 16 }}>{flag}</span>
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
                      <div key={part} className="exam-accent" style={{ '--ec': accents[pi % accents.length], padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer' }}
                        onClick={() => nav('/partners')}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{part}</span>
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
            <span style={{ fontSize: 20 }}>{flag}</span>
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
                    <span style={{ fontSize: 11, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 20, padding: '3px 9px', marginRight: 8, fontFamily: "'Newsreader',Georgia,serif", fontWeight: 700 }}>
                      {examCount(exam)} doctors
                    </span>
                  )}
                  <span className="meta" style={{ fontSize: 11 }}>{openExam === key ? '▲' : '▼'}</span>
                </div>
                {openExam === key && parts.map((part, pi) => {
                  const accents = ['var(--forest)', 'var(--rust)', 'var(--gold)', 'var(--forest-2)'];
                  const ec = accents[pi % accents.length];
                  return (
                    <div key={part} className="exam-accent" style={{ '--ec': ec, padding: '11px 16px 11px 22px', borderTop: '1px solid var(--line)', cursor: 'pointer' }}
                      onClick={() => nav('/partners')}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{part}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}


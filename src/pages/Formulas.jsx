import { useState } from 'react';

// Common clinical formulas — reference only (no calculators). Grouped by specialty.
// Each: [name, formula, note]
const DATA = [
  ['🫀 General Medicine', [
    ['Body Mass Index (BMI)', 'weight (kg) ÷ height (m)²', 'Normal 18.5–24.9 · Overweight 25–29.9 · Obese ≥30'],
    ['Body Surface Area (Mosteller)', '√[(height cm × weight kg) ÷ 3600]', 'Used for drug dosing, e.g. chemotherapy.'],
    ['Anion Gap', '(Na⁺ + K⁺) − (Cl⁻ + HCO₃⁻)', 'Normal 8–16 mmol/L. Raised in lactic acidosis, DKA, toxins, renal failure.'],
    ['Corrected Calcium', 'Ca + 0.02 × (40 − albumin g/L)', 'Adjusts total calcium for low albumin.'],
    ['Corrected Sodium (hyperglycaemia)', 'Na + 0.4 × [(glucose − 5.5) ÷ 5.5]', 'Add ~0.4 mmol/L Na per 1 mmol/L glucose above 5.5.'],
    ['Plasma Osmolality', '2×Na + glucose + urea', 'Normal 275–295 mosmol/kg.'],
    ['Mean Arterial Pressure (MAP)', 'DBP + ⅓(SBP − DBP)', 'Target ≥65 mmHg in sepsis.'],
  ]],
  ['🫁 Respiratory', [
    ['A–a Gradient', 'PAO₂ − PaO₂', 'PAO₂ = (FiO₂ × [Patm − 6.3]) − (PaCO₂ ÷ 0.8). Normal ≈ (age÷4)+4.'],
    ["Winter's Formula", 'expected PaCO₂ = 1.5×HCO₃ + 8 (±2)', 'Checks respiratory compensation in metabolic acidosis (kPa: ×0.133).'],
  ]],
  ['💧 Renal & Fluids', [
    ['Fractional Excretion of Na (FENa)', '(UNa × PCr) ÷ (PNa × UCr) × 100', '<1% pre-renal · >2% intrinsic (ATN).'],
    ['eGFR (concept)', 'based on creatinine, age, sex (CKD-EPI)', 'Use a validated calculator clinically; shown here for recall.'],
    ['Maintenance Fluids (4-2-1)', '4 mL/kg (first 10kg) + 2 (next 10) + 1 (rest) /hr', 'Holliday–Segar hourly maintenance rate.'],
  ]],
  ['❤️ Cardiology', [
    ['QTc (Bazett)', 'QT ÷ √(RR interval)', 'Prolonged if >440 ms (men) / >460 ms (women).'],
    ['CHA₂DS₂-VASc', 'CHF, HTN, Age≥75(2), DM, Stroke(2), Vascular, Age 65-74, Sex(F)', 'AF stroke risk; score ≥2 → consider anticoagulation.'],
  ]],
  ['🔥 Surgery / Critical Care', [
    ['Parkland Formula (burns)', '4 mL × weight (kg) × % TBSA burned', 'First 24h crystalloid. Give ½ over first 8h, ½ over next 16h. Reference only.'],
    ['Glasgow Coma Scale', 'Eyes (4) + Verbal (5) + Motor (6)', 'Range 3–15. ≤8 → consider airway protection.'],
  ]],
  ['🤰 Obs & Gynae', [
    ["Estimated Due Date (Naegele's)", 'LMP − 3 months + 7 days + 1 year', 'Assumes regular 28-day cycle.'],
    ['Bishop Score', 'dilation + effacement + station + consistency + position', '≥8 favourable for induction.'],
  ]],
  ['🧸 Paediatrics', [
    ['Estimated Weight (APLS)', '(age + 4) × 2', 'For children 1–10 years.'],
    ['ETT Internal Diameter', '(age ÷ 4) + 4 mm (uncuffed)', 'Reference only — airway decisions need clinical judgement.'],
    ['Fluid Bolus', '10–20 mL/kg crystalloid', 'Reassess after each bolus.'],
  ]],
];

function Item({ nm, formula, note }) {
  return (
    <div className="card" style={{ padding: '13px 14px', marginBottom: 10 }}>
      <div style={{ fontSize: 14.5, fontWeight: 700 }}>{nm}</div>
      <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontSize: 14.5, color: 'var(--forest)', background: 'var(--paper-2)', borderRadius: 8, padding: '9px 12px', margin: '9px 0', lineHeight: 1.5 }}>{formula}</div>
      <div style={{ fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.5 }}>{note}</div>
    </div>
  );
}

export default function Formulas() {
  const [q, setQ] = useState('');
  const [collapsed, setCollapsed] = useState({});
  const f = q.toLowerCase().trim();
  const toggle = (g) => setCollapsed((c) => ({ ...c, [g]: !c[g] }));

  const groups = DATA.map(([group, rows]) => {
    const matched = rows.filter((r) => !f || (r[0] + ' ' + r[1] + ' ' + r[2]).toLowerCase().includes(f) || group.toLowerCase().includes(f));
    return [group, matched];
  }).filter(([, m]) => m.length > 0);

  return (
    <div className="screen">
      <h1 className="h1" style={{ fontFamily: "'Fraunces',Georgia,serif", color: 'var(--forest)' }}>Formulas</h1>
      <p className="sub" style={{ marginBottom: 12 }}>Common clinical formulas for quick recall.</p>

      <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search — e.g. BMI, anion gap, EDD…" style={{ marginBottom: 8 }} />
      <p className="sub" style={{ fontSize: 10.5, fontStyle: 'italic', textAlign: 'center', marginBottom: 16, color: 'var(--subtle)' }}>
        For study & reference only. Always verify before any clinical use.
      </p>

      {groups.length === 0 && <div className="sub" style={{ textAlign: 'center', padding: '24px 0' }}>No matches. Try another term.</div>}

      {groups.map(([group, rows]) => {
        const isCollapsed = collapsed[group] && !f;
        return (
          <div key={group} style={{ marginBottom: 16 }}>
            <button onClick={() => toggle(group)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px 8px', fontFamily: 'inherit' }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--gold)' }}>{group}</span>
              <span style={{ fontSize: 13, color: 'var(--subtle)', transition: 'transform .25s ease', transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', display: 'inline-block' }}>›</span>
            </button>
            {!isCollapsed && rows.map((r, i) => <Item key={i} nm={r[0]} formula={r[1]} note={r[2]} />)}
          </div>
        );
      })}
    </div>
  );
}


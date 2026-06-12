// shared per-exam signature colors (v1 vibrancy system)
export const EXAM_COLORS = {
  'USMLE': '#1a5a8a', 'MRCP': '#1a6b5a', 'MRCS': '#2a6a8a', 'MRCPCH': '#1a7a4a',
  'MRCGP': '#3a7a4a', 'MRCPath': '#2a5a6a', 'MRCEM': '#1a5f7a', 'MRCOG': '#2e4a7a',
  'MRCPsych': '#1a6b8a', 'PLAB / UKMLA': '#1a7a6a', 'PLAB': '#1a7a6a', 'FCPS Part 1': '#1a7a4a',
  'FCPS Part 2': '#3a6a3a', 'FCPS': '#1a7a4a', 'IMM': '#2a6a7a', 'MCPS': '#3a7a4a',
  'AMC': '#1a5f7a', 'RACP': '#1a6b5a', 'RACS': '#2a5a6a',
  'SMLE': '#2e4a7a', 'Saudi Board': '#1a6b8a', 'SCFHS Prometric': '#2a6a8a',
  'NEET-PG': '#3a7a4a', 'INI-CET': '#1a7a6a', 'FMGE / NExT': '#1a5a8a', 'NEET-SS': '#2a6a7a',
};
export const examColor = (exam) => {
  if (!exam) return 'var(--forest)';
  const fam = exam.split('—')[0].trim();
  return EXAM_COLORS[fam] || EXAM_COLORS[fam.split(' ')[0]] || 'var(--forest)';
};


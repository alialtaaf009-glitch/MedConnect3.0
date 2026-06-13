import { sql, getUserId, safeUser, readBody } from './_shared/util.js';

export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM users WHERE id = ${uid}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Could not delete account' });
    }
  }
  // GET /api/profile?user=ID -> public mini-card for QR / share links
  if (req.method === 'GET') {
    const target = parseInt(req.query.user, 10);
    if (!target) return res.status(400).json({ error: 'user id required' });
    try {
      const rows = await sql`SELECT id, name, avatar, exam, country FROM users WHERE id = ${target}`;
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ user: rows[0] });
    } catch (e) {
      return res.status(500).json({ error: 'Lookup failed' });
    }
  }
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = readBody(req);
    const hasExamDate = Object.prototype.hasOwnProperty.call(body, 'examDate');
    const examDateVal = hasExamDate ? (body.examDate || null) : undefined;

    // Update the simple text fields first
    await sql`
      UPDATE users SET
        name = COALESCE(${body.name}, name),
        exam = COALESCE(${body.exam}, exam),
        country = COALESCE(${body.country}, country),
        attempt = COALESCE(${body.attempt}, attempt),
        timezone = COALESCE(${body.timezone}, timezone),
        question_bank = COALESCE(${body.questionBank}, question_bank),
        study_time = COALESCE(${body.studyTime}, study_time),
        avatar = COALESCE(${body.avatar}, avatar),
        reg_council = COALESCE(${body.regCouncil}, reg_council),
        reg_number = COALESCE(${body.regNumber}, reg_number),
        bio = COALESCE(${body.bio}, bio),
        profile_complete = TRUE
      WHERE id = ${uid}`;

    // medical school column (separate statement, value pulled from body to avoid any identifier typos)
    if (body.medicalSchool !== undefined) {
      await sql`UPDATE users SET medical_school = ${body.medicalSchool} WHERE id = ${uid}`;
    }

    // current focus (self-creating column so no manual migration is needed)
    if (body.focus !== undefined) {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS focus TEXT DEFAULT ''`;
      await sql`UPDATE users SET focus = ${body.focus} WHERE id = ${uid}`;
    }

    // gender (optional, self-creating column)
    if (body.gender !== undefined) {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT ''`;
      await sql`UPDATE users SET gender = ${body.gender} WHERE id = ${uid}`;
    }

    // exam date (clear or set)
    if (hasExamDate) {
      await sql`UPDATE users SET exam_date = ${examDateVal} WHERE id = ${uid}`;
    }

    const rows = await sql`SELECT * FROM users WHERE id = ${uid}`;
    return res.status(200).json({ user: safeUser(rows[0]) });
  } catch (e) {
    return res.status(500).json({ error: 'Could not update profile [v3]: ' + (e.message || String(e)) });
  }
}

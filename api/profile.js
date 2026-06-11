import { sql, getUserId, safeUser, readBody } from './_shared/util.js';

export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  // DELETE /api/profile -> permanently delete the user's account
  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM users WHERE id = ${uid}`; // cascades to messages, connections, etc.
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'Could not delete account' });
    }
  }
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = readBody(req);
    const { exam, country, attempt, timezone, questionBank, studyTime, avatar, name, regCouncil, regNumber, medicalSchool, bio } = body;
    // exam_date: only touch it if the key was sent; empty string clears it
    const hasExamDate = Object.prototype.hasOwnProperty.call(body, 'examDate');
    const examDateVal = hasExamDate ? (body.examDate || null) : undefined;
    const rows = await sql`
      UPDATE users SET
        name = COALESCE(${name}, name),
        exam = COALESCE(${exam}, exam),
        country = COALESCE(${country}, country),
        attempt = COALESCE(${attempt}, attempt),
        timezone = COALESCE(${timezone}, timezone),
        question_bank = COALESCE(${questionBank}, question_bank),
        study_time = COALESCE(${studyTime}, study_time),
        avatar = COALESCE(${avatar}, avatar),
        exam_date = CASE WHEN ${hasExamDate} THEN ${examDateVal} ELSE exam_date END,
        reg_council = COALESCE(${regCouncil}, reg_council),
        reg_number = COALESCE(${regNumber}, reg_number),
        medical_school = COALESCE(${medicalSchool}, medical_school),
        bio = COALESCE(${bio}, bio),
        profile_complete = TRUE
      WHERE id = ${uid}
      RETURNING *`;
    return res.status(200).json({ user: safeUser(rows[0]) });
  } catch (e) {
    return res.status(500).json({ error: 'Could not update profile [v2]: ' + (e.message || String(e)) });
  }
}


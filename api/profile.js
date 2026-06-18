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
    // ---- Qbank tracker: GET /api/profile?qbank=1 ----
    if (req.query.qbank) {
      try {
        await ensureQbankTables();
        const mine = await sql`SELECT bank, topic, done, total, correct FROM qbank_progress WHERE user_id = ${uid} ORDER BY topic`;
        // partners I've granted access to see me, and who grants access to me
        const grantsOut = await sql`SELECT grantee_id, bank FROM share_grants WHERE grantor_id = ${uid}`;
        const grantsIn = await sql`SELECT grantor_id, bank FROM share_grants WHERE grantee_id = ${uid}`;
        return res.status(200).json({ progress: mine, sharingWith: grantsOut, sharedToMe: grantsIn });
      } catch (e) {
        return res.status(500).json({ error: 'Qbank load failed: ' + (e.message || e) });
      }
    }
    // ---- Qbank comparison: GET /api/profile?compare=PARTNER_ID&bank=BANK ----
    if (req.query.compare) {
      try {
        await ensureQbankTables();
        const partner = parseInt(req.query.compare, 10);
        const bank = req.query.bank || '';
        // only return partner data if THEY granted ME access for this bank
        const grant = await sql`SELECT 1 FROM share_grants WHERE grantor_id = ${partner} AND grantee_id = ${uid} AND bank = ${bank} LIMIT 1`;
        if (!grant.length) return res.status(403).json({ error: 'Not shared', progress: [] });
        const rows = await sql`SELECT bank, topic, done, total, correct FROM qbank_progress WHERE user_id = ${partner} AND bank = ${bank} ORDER BY topic`;
        return res.status(200).json({ progress: rows });
      } catch (e) {
        return res.status(500).json({ error: 'Compare failed', progress: [] });
      }
    }
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
  // ---- Qbank tracker writes: POST /api/profile ----
  if (req.method === 'POST') {
    try {
      await ensureQbankTables();
      const body = readBody(req);

      // save/update a topic row
      if (body.action === 'save_progress') {
        const { bank, topic, done, total, correct } = body;
        if (!bank || !topic) return res.status(400).json({ error: 'bank and topic required' });
        await sql`
          INSERT INTO qbank_progress (user_id, bank, topic, done, total, correct)
          VALUES (${uid}, ${bank}, ${topic}, ${done || 0}, ${total || 0}, ${correct || 0})
          ON CONFLICT (user_id, bank, topic)
          DO UPDATE SET done = ${done || 0}, total = ${total || 0}, correct = ${correct || 0}`;
        return res.status(200).json({ ok: true });
      }

      // delete a topic row
      if (body.action === 'delete_topic') {
        await sql`DELETE FROM qbank_progress WHERE user_id = ${uid} AND bank = ${body.bank} AND topic = ${body.topic}`;
        return res.status(200).json({ ok: true });
      }

      // toggle sharing with a partner for a bank: grant on = insert, off = delete row
      if (body.action === 'set_share') {
        const grantee = parseInt(body.partnerId, 10);
        if (!grantee || !body.bank) return res.status(400).json({ error: 'partnerId and bank required' });
        if (body.on) {
          await sql`INSERT INTO share_grants (grantor_id, grantee_id, bank) VALUES (${uid}, ${grantee}, ${body.bank}) ON CONFLICT (grantor_id, grantee_id, bank) DO NOTHING`;
        } else {
          await sql`DELETE FROM share_grants WHERE grantor_id = ${uid} AND grantee_id = ${grantee} AND bank = ${body.bank}`;
        }
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'Unknown action' });
    } catch (e) {
      return res.status(500).json({ error: 'Qbank write failed: ' + (e.message || e) });
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

    // study styles (optional multi-tag, self-creating column)
    if (body.studyStyles !== undefined) {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_styles TEXT DEFAULT ''`;
      await sql`UPDATE users SET study_styles = ${body.studyStyles} WHERE id = ${uid}`;
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

// Self-creating tables (no manual migration needed), matching the existing pattern.
async function ensureQbankTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS qbank_progress (
      user_id INTEGER NOT NULL,
      bank TEXT NOT NULL,
      topic TEXT NOT NULL,
      done INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      correct INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, bank, topic)
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS share_grants (
      grantor_id INTEGER NOT NULL,
      grantee_id INTEGER NOT NULL,
      bank TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (grantor_id, grantee_id, bank)
    )`;
}

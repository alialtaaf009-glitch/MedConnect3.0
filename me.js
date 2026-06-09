import { sql, getUserId, safeUser } from './_shared/util.js';

export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const meRows = await sql`SELECT * FROM users WHERE id = ${uid}`;
    const me = meRows[0];

    // broad exam family = text before the "—" (e.g. "MRCP — PACES" -> "MRCP")
    const family = (me.exam || '').split('—')[0].trim();

    // candidates: everyone else with a complete profile, not already linked.
    // We DON'T hard-filter by exam here — we fetch broadly, then SCORE by closeness,
    // so the Partners tab is never mysteriously empty.
    const rows = await sql`
      SELECT u.* FROM users u
      WHERE u.id <> ${uid}
        AND u.profile_complete = TRUE
        AND u.id NOT IN (
          SELECT recipient FROM connections WHERE requester = ${uid}
          UNION
          SELECT requester FROM connections WHERE recipient = ${uid}
        )
        AND u.id NOT IN (
          SELECT blocked FROM blocks WHERE blocker = ${uid}
          UNION
          SELECT blocker FROM blocks WHERE blocked = ${uid}
        )
      LIMIT 100`;

    const matches = rows.map((u) => {
      let score = 40;
      const theirFamily = (u.exam || '').split('—')[0].trim();
      if (u.exam && me.exam && u.exam === me.exam) score += 45;          // exact same exam+part
      else if (family && theirFamily && family === theirFamily) score += 30; // same exam family
      if (u.country && u.country === me.country) score += 15;
      if (u.timezone && u.timezone === me.timezone) score += 10;
      return { user: safeUser(u), matchPercent: Math.min(score, 99) };
    }).sort((a, b) => b.matchPercent - a.matchPercent);

    return res.status(200).json({ matches });
  } catch (e) {
    return res.status(500).json({ error: 'Could not fetch matches' });
  }
}

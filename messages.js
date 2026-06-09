import { sql, getUserId, safeUser } from './_shared/util.js';

export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  // stamp last_seen on every identity check (happens on app load / refresh)
  const rows = await sql`UPDATE users SET last_seen = now() WHERE id = ${uid} RETURNING *`;
  if (!rows.length) return res.status(401).json({ error: 'User not found' });
  return res.status(200).json({ user: safeUser(rows[0]) });
}

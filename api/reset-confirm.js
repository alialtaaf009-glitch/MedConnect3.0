import bcrypt from 'bcryptjs';
import { sql, readBody } from './_shared/util.js';

// POST /api/reset-confirm { token, password }
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { token, password } = readBody(req);
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });

    const rows = await sql`SELECT * FROM reset_tokens WHERE token = ${token} AND used = FALSE`;
    const t = rows[0];
    if (!t) return res.status(400).json({ error: 'Invalid or used reset link' });
    if (new Date(t.expires_at) < new Date()) return res.status(400).json({ error: 'Reset link expired' });

    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${t.user_id}`;
    await sql`UPDATE reset_tokens SET used = TRUE WHERE id = ${t.id}`;
    return res.status(200).json({ ok: true, message: 'Password updated. You can now sign in.' });
  } catch (e) {
    return res.status(500).json({ error: 'Could not reset password' });
  }
}

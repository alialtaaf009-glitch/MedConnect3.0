import bcrypt from 'bcryptjs';
import { sql, signToken, safeUser, readBody } from './_shared/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email, password } = readBody(req);
    const rows = await sql`SELECT * FROM users WHERE email = ${(email || '').toLowerCase()}`;
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    return res.status(200).json({ token: signToken(user), user: safeUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' });
  }
}

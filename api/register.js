import bcrypt from 'bcryptjs';
import { sql, signToken, safeUser, readBody } from './_shared/util.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { name, email, password } = readBody(req);
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email.toLowerCase()}, ${hash})
      RETURNING *`;
    const user = rows[0];
    return res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (e) {
    return res.status(500).json({ error: 'Registration failed' });
  }
}

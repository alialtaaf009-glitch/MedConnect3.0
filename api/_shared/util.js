import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

export const sql = neon(process.env.DATABASE_URL);

export function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

export function getUserId(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET).id; }
  catch { return null; }
}

export function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...rest } = row;
  return rest;
}

// Vercel passes parsed JSON in req.body for POST/PUT/PATCH automatically,
// but guard in case it's a string.
export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

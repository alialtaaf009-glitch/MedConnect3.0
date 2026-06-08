import crypto from 'crypto';
import { sql, readBody } from './_shared/util.js';

// POST /api/reset-request { email }
// Creates a reset token. EMAIL SENDING IS A TODO — see note below.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email } = readBody(req);
    const rows = await sql`SELECT id FROM users WHERE email = ${(email || '').toLowerCase()}`;
    // Always respond success (don't reveal whether an email exists)
    if (!rows.length) return res.status(200).json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await sql`INSERT INTO reset_tokens (user_id, token, expires_at) VALUES (${rows[0].id}, ${token}, ${expires.toISOString()})`;

    // ============================================================
    // TODO: EMAIL SENDING — plug in an email service here.
    // The reset link the user should receive is:
    //   https://med-connect2-0.vercel.app/reset?token=<token>
    //
    // Easiest free option: Resend (resend.com).
    //   1. Sign up, verify a sender, get an API key.
    //   2. Add RESEND_API_KEY to Vercel env vars.
    //   3. Replace the block below with a fetch to Resend's API:
    //
    //   await fetch('https://api.resend.com/emails', {
    //     method: 'POST',
    //     headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    //     body: JSON.stringify({
    //       from: 'MedConnect <noreply@yourdomain>',
    //       to: email,
    //       subject: 'Reset your MedConnect password',
    //       html: `<p>Reset your password: <a href="https://med-connect2-0.vercel.app/reset?token=${token}">click here</a> (expires in 1 hour).</p>`
    //     })
    //   });
    // ============================================================

    // Until email is wired up, we return the link so you can test the flow.
    // REMOVE the resetLink from this response once real email is enabled.
    return res.status(200).json({ ok: true, resetLink: `/reset?token=${token}`, note: 'Email sending not configured yet — see TODO in reset-request.js' });
  } catch (e) {
    return res.status(500).json({ error: 'Could not start reset' });
  }
}

import { sql, getUserId, readBody } from './_shared/util.js';

export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  try {
    if (req.method === 'GET') {
      const all = await sql`
        SELECT c.*, ru.name AS requester_name, ru.exam AS requester_exam, ru.last_seen AS requester_seen,
               cu.name AS recipient_name, cu.exam AS recipient_exam, cu.last_seen AS recipient_seen
        FROM connections c
        JOIN users ru ON ru.id = c.requester
        JOIN users cu ON cu.id = c.recipient
        WHERE c.requester = ${uid} OR c.recipient = ${uid}`;
      const connected = all.filter((c) => c.status === 'accepted');
      const pending   = all.filter((c) => c.status === 'pending' && c.requester === uid);
      const requests  = all.filter((c) => c.status === 'pending' && c.recipient === uid);
      return res.status(200).json({ connected, pending, requests });
    }

    if (req.method === 'POST') {
      const { recipientId } = readBody(req);
      if (!recipientId) return res.status(400).json({ error: 'recipientId required' });
      if (Number(recipientId) === uid) return res.status(400).json({ error: 'Cannot connect with yourself' });
      try {
        const rows = await sql`
          INSERT INTO connections (requester, recipient, status)
          VALUES (${uid}, ${recipientId}, 'pending') RETURNING *`;
        return res.status(201).json({ connection: rows[0] });
      } catch (e) {
        return res.status(409).json({ error: 'Request already exists' });
      }
    }

    if (req.method === 'PATCH') {
      const id = req.query.id;
      const { action } = readBody(req);
      const status = action === 'accept' ? 'accepted' : 'declined';
      const rows = await sql`
        UPDATE connections SET status = ${status}
        WHERE id = ${id} AND recipient = ${uid} RETURNING *`;
      if (!rows.length) return res.status(403).json({ error: 'Not your request to answer' });
      return res.status(200).json({ connection: rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Connection action failed' });
  }
}

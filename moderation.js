import { sql, getUserId, readBody } from './_shared/util.js';

// GET  /api/messages                  -> list of conversations (people + last message)
// GET  /api/messages?with=USER_ID     -> full conversation with that user
// POST /api/messages  { to, body }    -> send a message
export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });

  try {
    if (req.method === 'GET') {
      const other = req.query.with ? parseInt(req.query.with, 10) : null;

      if (other) {
        // full conversation, oldest first
        const msgs = await sql`
          SELECT * FROM messages
          WHERE (sender = ${uid} AND recipient = ${other})
             OR (sender = ${other} AND recipient = ${uid})
          ORDER BY created_at ASC`;
        // include both users' avatars so the client always shows the right emoji
        const people = await sql`SELECT id, name, avatar FROM users WHERE id = ${uid} OR id = ${other}`;
        const avatars = {};
        for (const p of people) avatars[p.id] = p.avatar || '';
        return res.status(200).json({ messages: msgs, avatars });
      }

      // conversation list: the most recent message with each other person
      const rows = await sql`
        SELECT DISTINCT ON (sub.other_id)
               sub.other_id   AS other_id,
               u.name         AS name,
               u.exam         AS exam,
               u.avatar       AS avatar,
               u.last_seen    AS last_seen,
               sub.body       AS last_body,
               sub.created_at AS last_at,
               sub.sender     AS last_sender
        FROM (
          SELECT m.id, m.sender, m.recipient, m.body, m.created_at,
                 CASE WHEN m.sender = ${uid} THEN m.recipient ELSE m.sender END AS other_id
          FROM messages m
          WHERE m.sender = ${uid} OR m.recipient = ${uid}
        ) sub
        JOIN users u ON u.id = sub.other_id
        ORDER BY sub.other_id, sub.created_at DESC`;
      return res.status(200).json({ conversations: rows });
    }

    if (req.method === 'POST') {
      const { to, body } = readBody(req);
      const toId = parseInt(to, 10);
      if (!toId || !body || !body.trim()) return res.status(400).json({ error: 'to and body required' });
      const rows = await sql`
        INSERT INTO messages (sender, recipient, body)
        VALUES (${uid}, ${toId}, ${body.trim()})
        RETURNING *`;
      return res.status(201).json({ message: rows[0] });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({ error: 'Messaging failed: ' + e.message });
  }
}

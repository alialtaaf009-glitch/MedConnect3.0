import { sql, getUserId, readBody } from './_shared/util.js';

// POST /api/moderation { action: 'block'|'report'|'delete_chat', targetId, reason? }
export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { action, targetId, reason } = readBody(req);
    const tid = parseInt(targetId, 10);
    if (!action || !tid) return res.status(400).json({ error: 'action and targetId required' });

    if (action === 'delete_chat') {
      await sql`DELETE FROM messages
        WHERE (sender = ${uid} AND recipient = ${tid})
           OR (sender = ${tid} AND recipient = ${uid})`;
      return res.status(200).json({ ok: true, message: 'Chat deleted' });
    }

    if (action === 'block') {
      await sql`INSERT INTO blocks (blocker, blocked) VALUES (${uid}, ${tid})
                ON CONFLICT (blocker, blocked) DO NOTHING`;
      // blocking also removes any connection + the chat
      await sql`DELETE FROM connections
        WHERE (requester = ${uid} AND recipient = ${tid})
           OR (requester = ${tid} AND recipient = ${uid})`;
      await sql`DELETE FROM messages
        WHERE (sender = ${uid} AND recipient = ${tid})
           OR (sender = ${tid} AND recipient = ${uid})`;
      return res.status(200).json({ ok: true, message: 'User blocked' });
    }

    if (action === 'unfriend') {
      await sql`DELETE FROM connections
        WHERE (requester = ${uid} AND recipient = ${tid})
           OR (requester = ${tid} AND recipient = ${uid})`;
      return res.status(200).json({ ok: true, message: 'Connection removed' });
    }

    if (action === 'report') {
      await sql`INSERT INTO reports (reporter, reported, reason)
                VALUES (${uid}, ${tid}, ${reason || ''})`;
      return res.status(200).json({ ok: true, message: 'Report submitted' });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (e) {
    return res.status(500).json({ error: 'Action failed: ' + e.message });
  }
}

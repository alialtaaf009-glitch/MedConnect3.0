import { sql, getUserId, readBody } from './_shared/util.js';

// GET  /api/messages                  -> list of conversations (people + last message)
// GET  /api/messages?with=USER_ID     -> full conversation with that user
// POST /api/messages  { to, body }    -> send a message
export default async function handler(req, res) {
  const uid = getUserId(req);
  if (!uid) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // ===================== GROUP CHAT =====================
    // All group routes are namespaced with ?scope=groups
    if (req.query.scope === 'groups') {
      if (req.method === 'GET') {
        const gid = req.query.group ? parseInt(req.query.group, 10) : null;
        if (gid) {
          // must be a member
          const mem = await sql`SELECT 1 FROM group_members WHERE group_id = ${gid} AND user_id = ${uid}`;
          if (!mem.length) return res.status(403).json({ error: 'Not a member of this group' });
          const msgs = await sql`
            SELECT gm.*, u.name AS sender_name, u.avatar AS sender_avatar
            FROM group_messages gm JOIN users u ON u.id = gm.sender
            WHERE gm.group_id = ${gid} ORDER BY gm.created_at ASC`;
          const members = await sql`
            SELECT u.id, u.name, u.avatar FROM group_members g JOIN users u ON u.id = g.user_id
            WHERE g.group_id = ${gid}`;
          const g = await sql`SELECT * FROM groups WHERE id = ${gid}`;
          return res.status(200).json({ messages: msgs, members, group: g[0] });
        }
        // list groups I'm in, with last message
        const groups = await sql`
          SELECT g.id, g.name, g.creator,
                 (SELECT body FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_body,
                 (SELECT created_at FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) AS last_at,
                 (SELECT COUNT(*) FROM group_members WHERE group_id = g.id)::int AS member_count
          FROM groups g
          JOIN group_members m ON m.group_id = g.id
          WHERE m.user_id = ${uid}
          ORDER BY last_at DESC NULLS LAST`;
        return res.status(200).json({ groups });
      }

      if (req.method === 'POST') {
        const body = readBody(req);
        const action = body.action;

        if (action === 'create') {
          const name = (body.name || '').trim();
          const memberIds = Array.isArray(body.memberIds) ? body.memberIds : [];
          if (!name) return res.status(400).json({ error: 'Group name required' });
          const g = await sql`INSERT INTO groups (name, creator) VALUES (${name}, ${uid}) RETURNING *`;
          const gid = g[0].id;
          await sql`INSERT INTO group_members (group_id, user_id) VALUES (${gid}, ${uid}) ON CONFLICT DO NOTHING`;
          for (const mid of memberIds) {
            const m = parseInt(mid, 10);
            if (m) await sql`INSERT INTO group_members (group_id, user_id) VALUES (${gid}, ${m}) ON CONFLICT DO NOTHING`;
          }
          return res.status(201).json({ group: g[0] });
        }

        if (action === 'send') {
          const gid = parseInt(body.groupId, 10);
          const text = (body.body || '').trim();
          if (!gid || !text) return res.status(400).json({ error: 'groupId and body required' });
          const mem = await sql`SELECT 1 FROM group_members WHERE group_id = ${gid} AND user_id = ${uid}`;
          if (!mem.length) return res.status(403).json({ error: 'Not a member' });
          const rows = await sql`INSERT INTO group_messages (group_id, sender, body) VALUES (${gid}, ${uid}, ${text}) RETURNING *`;
          return res.status(201).json({ message: rows[0] });
        }

        if (action === 'add_member') {
          const gid = parseInt(body.groupId, 10);
          const newId = parseInt(body.userId, 10);
          if (!gid || !newId) return res.status(400).json({ error: 'groupId and userId required' });
          const mem = await sql`SELECT 1 FROM group_members WHERE group_id = ${gid} AND user_id = ${uid}`;
          if (!mem.length) return res.status(403).json({ error: 'Only members can add people' });
          await sql`INSERT INTO group_members (group_id, user_id) VALUES (${gid}, ${newId}) ON CONFLICT DO NOTHING`;
          return res.status(200).json({ ok: true });
        }

        if (action === 'leave') {
          const gid = parseInt(body.groupId, 10);
          await sql`DELETE FROM group_members WHERE group_id = ${gid} AND user_id = ${uid}`;
          return res.status(200).json({ ok: true });
        }

        if (action === 'delete') {
          const gid = parseInt(body.groupId, 10);
          const g = await sql`SELECT creator FROM groups WHERE id = ${gid}`;
          if (!g.length || g[0].creator !== uid) return res.status(403).json({ error: 'Only the creator can delete the group' });
          await sql`DELETE FROM groups WHERE id = ${gid}`; // cascades to members + messages
          return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: 'Unknown group action' });
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ===================== DIRECT MESSAGES =====================
    if (req.method === 'GET') {
      const other = req.query.with ? parseInt(req.query.with, 10) : null;

      if (other) {
        // full conversation, oldest first
        const msgs = await sql`
          SELECT * FROM messages
          WHERE (sender = ${uid} AND recipient = ${other})
             OR (sender = ${other} AND recipient = ${uid})
          ORDER BY created_at ASC`;
        // include both users' avatars + the other person's study profile for the chat header
        const people = await sql`SELECT id, name, avatar, exam, country, timezone FROM users WHERE id = ${uid} OR id = ${other}`;
        const avatars = {};
        let peer = null;
        for (const p of people) {
          avatars[p.id] = p.avatar || '';
          if (p.id == other) peer = { exam: p.exam, country: p.country, timezone: p.timezone };
        }
        return res.status(200).json({ messages: msgs, avatars, peer });
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


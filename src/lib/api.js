// API client — talks to Netlify Functions at /api/* (same origin, no IP needed).
function token() { return localStorage.getItem('token'); }

async function req(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token();
  if (t) headers.Authorization = `Bearer ${t}`;
  const res = await fetch(`/api${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  register: (name, email, password) => req('/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => req('/login', { method: 'POST', body: { email, password } }),
  me: () => req('/me'),
  markStudy: () => req('/me', { method: 'POST', body: { action: 'mark_study' } }),
  updateProfile: (p) => req('/profile', { method: 'PUT', body: p }),
  publicProfile: (id) => req(`/profile?user=${id}`),
  deleteAccount: () => req('/profile', { method: 'DELETE' }),
  matches: () => req('/matches'),
  connections: () => req('/connections'),
  sendRequest: (recipientId) => req('/connections', { method: 'POST', body: { recipientId } }),
  respond: (id, action) => req(`/connections?id=${id}`, { method: 'PATCH', body: { action } }),
  conversations: () => req('/messages'),
  conversation: (withId) => req(`/messages?with=${withId}`),
  sendMessage: (to, body) => req('/messages', { method: 'POST', body: { to, body } }),
  createRoom: (slug) => req('/messages', { method: 'POST', body: { action: 'create_room', slug } }),
  qbankGet: () => req('/profile?qbank=1'),
  decksGet: () => req('/profile?decks=1'),
  deckGet: (id, dueOnly) => req(`/profile?deck=${id}${dueOnly ? '&due=1' : ''}`),
  deckCreate: (name, exam_tag) => req('/profile', { method: 'POST', body: { action: 'deck_create', name, exam_tag } }),
  deckRename: (deckId, name, exam_tag) => req('/profile', { method: 'POST', body: { action: 'deck_rename', deckId, name, exam_tag } }),
  deckDelete: (deckId) => req('/profile', { method: 'POST', body: { action: 'deck_delete', deckId } }),
  deckAddCard: (deckId, front, back) => req('/profile', { method: 'POST', body: { action: 'deck_add_card', deckId, front, back } }),
  deckDeleteCard: (cardId) => req('/profile', { method: 'POST', body: { action: 'deck_delete_card', cardId } }),
  deckRateCard: (cardId, rating) => req('/profile', { method: 'POST', body: { action: 'deck_rate_card', cardId, rating } }),
  qbankSave: (bank, topic, done, total, correct) => req('/profile', { method: 'POST', body: { action: 'save_progress', bank, topic, done, total, correct } }),
  qbankDeleteTopic: (bank, topic) => req('/profile', { method: 'POST', body: { action: 'delete_topic', bank, topic } }),
  qbankSetShare: (partnerId, bank, on) => req('/profile', { method: 'POST', body: { action: 'set_share', partnerId, bank, on } }),
  qbankCompare: (partnerId, bank) => req(`/profile?compare=${partnerId}&bank=${encodeURIComponent(bank)}`),
  unreadMessages: () => req('/messages?scope=unread'),
  markAllRead: () => req('/messages', { method: 'POST', body: { action: 'mark_all_read' } }),
  markReadOne: (other) => req('/messages', { method: 'POST', body: { action: 'mark_read_one', other } }),
  savePushSub: (sub) => req('/me', { method: 'POST', body: { action: 'save_sub', sub } }),
  deletePushSub: (endpoint) => req('/me', { method: 'POST', body: { action: 'delete_sub', endpoint } }),
  pushDebug: () => req('/me', { method: 'POST', body: { action: 'push_debug' } }),
  // group chats (folded into the messages function via ?scope=groups)
  groups: () => req('/messages?scope=groups'),
  group: (id) => req(`/messages?scope=groups&group=${id}`),
  createGroup: (name, memberIds) => req('/messages?scope=groups', { method: 'POST', body: { action: 'create', name, memberIds } }),
  sendGroupMessage: (groupId, body) => req('/messages?scope=groups', { method: 'POST', body: { action: 'send', groupId, body } }),
  addGroupMember: (groupId, userId) => req('/messages?scope=groups', { method: 'POST', body: { action: 'add_member', groupId, userId } }),
  leaveGroup: (groupId) => req('/messages?scope=groups', { method: 'POST', body: { action: 'leave', groupId } }),
  deleteGroup: (groupId) => req('/messages?scope=groups', { method: 'POST', body: { action: 'delete', groupId } }),
  deleteChat: (targetId) => req('/moderation', { method: 'POST', body: { action: 'delete_chat', targetId } }),
  blockUser: (targetId) => req('/moderation', { method: 'POST', body: { action: 'block', targetId } }),
  unfriendUser: (targetId) => req('/moderation', { method: 'POST', body: { action: 'unfriend', targetId } }),
  reportUser: (targetId, reason) => req('/moderation', { method: 'POST', body: { action: 'report', targetId, reason } }),
  getFavourites: () => req('/favourites'),
  toggleFavourite: (quoteId, action) => req('/favourites', { method: 'POST', body: { quoteId, action } }),
  getStats: () => req('/stats'),
  resetRequest: (email) => req('/reset', { method: 'POST', body: { action: 'request', email } }),
  resetConfirm: (token, password) => req('/reset', { method: 'POST', body: { action: 'confirm', token, password } }),
};

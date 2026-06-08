// API client — talks to serverless functions at /api/* (same origin, no IP needed).
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
  updateProfile: (p) => req('/profile', { method: 'PUT', body: p }),
  matches: () => req('/matches'),
  connections: () => req('/connections'),
  sendRequest: (recipientId) => req('/connections', { method: 'POST', body: { recipientId } }),
  respond: (id, action) => req(`/connections?id=${id}`, { method: 'PATCH', body: { action } }),
  conversations: () => req('/messages'),
  conversation: (withId) => req(`/messages?with=${withId}`),
  sendMessage: (to, body) => req('/messages', { method: 'POST', body: { to, body } }),
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

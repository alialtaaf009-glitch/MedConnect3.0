// Shared pieces for the chat screens (kept small so each file pastes safely)

export const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
    <path d="M3.4 20.4l17.8-7.6c.8-.35.8-1.25 0-1.6L3.4 3.6c-.66-.28-1.4.2-1.4.9v5.2c0 .5.37.93.87 1L14 12 2.87 13.3c-.5.07-.87.5-.87 1v5.2c0 .7.74 1.18 1.4.9z"/>
  </svg>
);

// minimal outline icons for menus (Instagram-style, like the OSCE locks)
const ico = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style: { flexShrink: 0 } };
export const IcoPlus  = () => <svg {...ico}><path d="M12 5v14M5 12h14" /></svg>;
export const IcoUsers = () => <svg {...ico}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="9" r="2.6" /><path d="M16 14.2c2.4.3 4.2 2.1 4.2 4.8" /></svg>;
export const IcoLeave = () => <svg {...ico}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
export const IcoTrash = () => <svg {...ico}><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>;
export const IcoBan   = () => <svg {...ico}><circle cx="12" cy="12" r="9" /><path d="M5.5 5.5l13 13" /></svg>;
export const IcoFlag  = () => <svg {...ico}><path d="M4 21V4" /><path d="M4 4h12l-2 4 2 4H4" /></svg>;

// turn a connection record into the "other person" {id, name, avatar}
export function otherPerson(c, myId) {
  const iAmRequester = c.requester == myId;
  return {
    id: iAmRequester ? c.recipient : c.requester,
    name: iAmRequester ? c.recipient_name : c.requester_name,
    avatar: iAmRequester ? c.recipient_avatar : c.requester_avatar,
  };
}

// "14:32"-style timestamp for message bubbles
export function fmtTime(ts) {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

// small stamp shown inside a bubble
export const Stamp = ({ ts, light }) => {
  const t = fmtTime(ts);
  if (!t) return null;
  return <div style={{ fontSize: 9.5, opacity: 0.65, textAlign: 'right', marginTop: 3, color: light ? '#e7f3ee' : 'var(--muted)' }}>{t}</div>;
};


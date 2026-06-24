import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { setLoading(false); return; }

    // Show cached user instantly — works offline and removes loading flash
    const cached = localStorage.getItem('mc_user');
    if (cached) { try { setUser(JSON.parse(cached)); } catch (_) {} }

    // If offline, skip the network call entirely — stay logged in with cached data
    if (!navigator.onLine) { setLoading(false); return; }

    api.me()
      .then((d) => { setUser(d.user); localStorage.setItem('mc_user', JSON.stringify(d.user)); })
      .catch((err) => {
        // Only log out if the SERVER explicitly rejected the token (401/403).
        // Network errors, timeouts, and 5xx errors should NOT log the user out.
        const msg = err?.message || '';
        const isAuthFailure = /\b(401|403)\b/.test(msg) ||
          msg.toLowerCase().includes('unauthorized') ||
          msg.toLowerCase().includes('forbidden');
        if (isAuthFailure) {
          localStorage.removeItem('token');
          localStorage.removeItem('mc_user');
          setUser(null);
        }
        // All other errors (network down, 500, timeout) → keep logged in with cached data
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = (token, user) => { localStorage.setItem('token', token); localStorage.setItem('mc_user', JSON.stringify(user)); setUser(user); };

  const value = {
    user, loading, setUser,
    login: async (e, p) => { const d = await api.login(e, p); persist(d.token, d.user); },
    googleLogin: async (cred) => { const d = await api.googleLogin(cred); persist(d.token, d.user); return d; },
    register: async (n, e, p) => { const d = await api.register(n, e, p); persist(d.token, d.user); },
    logout: () => { localStorage.removeItem('token'); localStorage.removeItem('mc_user'); setUser(null); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

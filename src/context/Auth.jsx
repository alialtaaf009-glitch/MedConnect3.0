import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { setLoading(false); return; }
    // Cache the last known user so offline opens don't feel cold
    const cached = localStorage.getItem('mc_user');
    if (cached) { try { setUser(JSON.parse(cached)); } catch (_) {} }
    api.me()
      .then((d) => { setUser(d.user); localStorage.setItem('mc_user', JSON.stringify(d.user)); })
      .catch((err) => {
        // Only log out if the server explicitly rejected the token (401/403).
        // A TypeError means no network — keep the user logged in with cached data.
        const isNetworkError = err instanceof TypeError || !navigator.onLine;
        if (!isNetworkError) { localStorage.removeItem('token'); localStorage.removeItem('mc_user'); setUser(null); }
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

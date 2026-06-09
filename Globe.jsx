import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { setLoading(false); return; }
    api.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const persist = (token, user) => { localStorage.setItem('token', token); setUser(user); };

  const value = {
    user, loading, setUser,
    login: async (e, p) => { const d = await api.login(e, p); persist(d.token, d.user); },
    register: async (n, e, p) => { const d = await api.register(n, e, p); persist(d.token, d.user); },
    logout: () => { localStorage.removeItem('token'); setUser(null); },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
export const useAuth = () => useContext(AuthCtx);

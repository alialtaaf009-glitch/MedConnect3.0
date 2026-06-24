import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mc_deep_focus';
const FocusLockCtx = createContext(null);

// Persists lock as { endTime, method } in localStorage so it survives app restarts.
// secsLeft is derived from endTime on every tick so it's always accurate.

export function FocusLockProvider({ children }) {
  const tickRef = useRef(null);

  // derive initial state from localStorage
  const getInitialLock = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const { endTime, method } = JSON.parse(raw);
      const secsLeft = Math.ceil((endTime - Date.now()) / 1000);
      if (secsLeft <= 0) { localStorage.removeItem(STORAGE_KEY); return null; }
      return { secsLeft, endTime, method };
    } catch { return null; }
  };

  const [lock, setLock] = useState(getInitialLock);

  // start a tick whenever lock becomes non-null
  useEffect(() => {
    if (!lock) { clearInterval(tickRef.current); return; }
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setLock((l) => {
        if (!l) { clearInterval(tickRef.current); return null; }
        const secsLeft = Math.ceil((l.endTime - Date.now()) / 1000);
        if (secsLeft <= 0) {
          clearInterval(tickRef.current);
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return { ...l, secsLeft };
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [!!lock]); // only re-run when lock flips between null / non-null

  const startLock = useCallback((totalSecs, method) => {
    const endTime = Date.now() + totalSecs * 1000;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime, method })); } catch {}
    setLock({ secsLeft: totalSecs, endTime, method });
  }, []);

  const endLock = useCallback(() => {
    clearInterval(tickRef.current);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setLock(null);
  }, []);

  return (
    <FocusLockCtx.Provider value={{ lock, startLock, endLock }}>
      {children}
    </FocusLockCtx.Provider>
  );
}

export const useFocusLock = () =>
  useContext(FocusLockCtx) || { lock: null, startLock: () => {}, endLock: () => {} };

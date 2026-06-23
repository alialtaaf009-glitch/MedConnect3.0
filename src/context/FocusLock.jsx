import { createContext, useContext, useState, useRef, useCallback } from 'react';

// Holds the deep-focus lock state at the app level so it survives route changes.
const FocusLockCtx = createContext(null);

export function FocusLockProvider({ children }) {
  const [lock, setLock] = useState(null); // null | { secsLeft, method }
  const tickRef = useRef(null);

  const startLock = useCallback((totalSecs, method) => {
    setLock({ secsLeft: totalSecs, method });
    tickRef.current = setInterval(() => {
      setLock((l) => {
        if (!l || l.secsLeft <= 1) { clearInterval(tickRef.current); return null; }
        return { ...l, secsLeft: l.secsLeft - 1 };
      });
    }, 1000);
  }, []);

  const endLock = useCallback(() => {
    clearInterval(tickRef.current);
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


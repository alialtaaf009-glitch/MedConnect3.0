import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

// Lets any screen/overlay register a "back action". When set, the top bar shows
// a back arrow (instead of the hamburger) that calls it. Clearing it restores
// the hamburger. This also intercepts the phone's actual hardware back button/gesture —
// not just the on-screen arrow — by inserting a placeholder history entry whenever a
// handler is registered, so the hardware back button has something safe to consume
// first, giving our own handler a chance to run instead of the browser just
// navigating away to whatever page happened to be previous in its history.
const BackCtx = createContext(null);

export function BackProvider({ children }) {
  const [handler, setHandler] = useState(null); // function | null
  const [immersive, setImmersive] = useState(false); // hide top bar + nav
  const handlerRef = useRef(null);
  handlerRef.current = handler;

  const registerBack = useCallback((fn) => {
    setHandler(() => fn);
    window.history.pushState({ medconnectBackGuard: true }, '', window.location.href);
  }, []);
  const clearBack = useCallback(() => setHandler(null), []);
  const enterImmersive = useCallback(() => setImmersive(true), []);
  const exitImmersive = useCallback(() => setImmersive(false), []);

  useEffect(() => {
    const onPopState = () => { if (handlerRef.current) handlerRef.current(); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <BackCtx.Provider value={{ backHandler: handler, registerBack, clearBack, immersive, enterImmersive, exitImmersive }}>
      {children}
    </BackCtx.Provider>
  );
}

export const useBack = () => useContext(BackCtx) || { backHandler: null, registerBack: () => {}, clearBack: () => {}, immersive: false, enterImmersive: () => {}, exitImmersive: () => {} };

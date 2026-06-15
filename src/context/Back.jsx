import { createContext, useContext, useState, useCallback } from 'react';

// Lets any screen/overlay register a "back action". When set, the top bar shows
// a back arrow (instead of the hamburger) that calls it. Clearing it restores
// the hamburger. This gives one consistent back control across the whole app.
const BackCtx = createContext(null);

export function BackProvider({ children }) {
  const [handler, setHandler] = useState(null); // function | null
  const [immersive, setImmersive] = useState(false); // hide top bar + nav

  const registerBack = useCallback((fn) => setHandler(() => fn), []);
  const clearBack = useCallback(() => setHandler(null), []);
  const enterImmersive = useCallback(() => setImmersive(true), []);
  const exitImmersive = useCallback(() => setImmersive(false), []);

  return (
    <BackCtx.Provider value={{ backHandler: handler, registerBack, clearBack, immersive, enterImmersive, exitImmersive }}>
      {children}
    </BackCtx.Provider>
  );
}

export const useBack = () => useContext(BackCtx) || { backHandler: null, registerBack: () => {}, clearBack: () => {}, immersive: false, enterImmersive: () => {}, exitImmersive: () => {} };

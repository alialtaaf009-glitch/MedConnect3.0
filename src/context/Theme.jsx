import { createContext, useContext, useEffect, useState } from 'react';

const ThemeCtx = createContext(null);

// the resting (no-bloom) system-bar colour per theme
const BAR = { light: '#1f4d3f', dark: '#1a3a30' };

// update the <meta name="theme-color"> tag — this colours the phone's
// status bar (above the top bar) and gesture/nav area (below the tab bar)
function setBarColor(color) {
  let m = document.querySelector('meta[name="theme-color"]');
  if (!m) { m = document.createElement('meta'); m.setAttribute('name', 'theme-color'); document.head.appendChild(m); }
  m.setAttribute('content', color);
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(localStorage.getItem('theme') || 'light');
  // when a circle blooms, it sets a temporary bar colour; null = use the theme default
  const [barOverride, setBarOverride] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('theme', mode);
  }, [mode]);

  // keep the system bars in sync with theme + any active bloom override
  useEffect(() => {
    setBarColor(barOverride || BAR[mode] || BAR.light);
  }, [mode, barOverride]);

  return (
    <ThemeCtx.Provider value={{
      mode,
      toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
      setBar: setBarOverride,
    }}>
      {children}
    </ThemeCtx.Provider>
  );
}
export const useTheme = () => useContext(ThemeCtx);

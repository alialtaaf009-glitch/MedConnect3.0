import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/Auth.jsx';
import { ThemeProvider } from './context/Theme.jsx';
import { TimerProvider } from './context/Timer.jsx';
import { BackProvider } from './context/Back.jsx';
import './styles/app.css';

requestAnimationFrame(() => requestAnimationFrame(() => {
  const splash = document.getElementById('app-splash');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 400);
  }
}));

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <BackProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </BackProvider>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

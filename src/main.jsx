import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/Auth.jsx';
import { ThemeProvider } from './context/Theme.jsx';
import { TimerProvider } from './context/Timer.jsx';
import './styles/app.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);


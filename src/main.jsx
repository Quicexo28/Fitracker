import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import SessionProvider from './context/SessionContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ActiveSessionProvider } from './context/ActiveSessionContext.jsx';
//import { UndoProvider } from './context/UndoContext.jsx';
//import GlobalUndoBar from './components/GlobalUndoBar.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PreferencesProvider>
            <SessionProvider>
              <ActiveSessionProvider>
                {/* REMOVIDO: <UndoProvider> */}
                  <App />
                  {/* REMOVIDO: <GlobalUndoBar /> */}
                {/* REMOVIDO: </UndoProvider> */}
              </ActiveSessionProvider>
            </SessionProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
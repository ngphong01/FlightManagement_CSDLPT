import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';
import { AuthProvider } from './context/AuthContext';
import { StaffAuthProvider } from './context/StaffAuthContext';

const rootElement = document.getElementById('app');
if (!rootElement) {
  throw new Error('Root element #app not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AuthProvider>
      <StaffAuthProvider>
        <App />
      </StaffAuthProvider>
    </AuthProvider>
  </React.StrictMode>
);



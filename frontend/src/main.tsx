import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';

export const authService = import.meta.env.VITE_AUTH_SERVICE ?? "http://localhost:5000";
export const restaurantService = import.meta.env.VITE_RESTAURANT_SERVICE ?? "http://localhost:5001";

// ✅ Google client ID moved to env variable — was hardcoded before
// Add VITE_GOOGLE_CLIENT_ID to your frontend/.env file
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppProvider>
        <App />
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider } from './context/AppContext.tsx';
import "leaflet/dist/leaflet.css";

export const authService = import.meta.env.VITE_AUTH_SERVICE ?? "http://localhost:5000";
export const restaurantService = import.meta.env.VITE_RESTAURANT_SERVICE ?? "http://localhost:5001";
export const utilsService ="http://localhost:5002";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
console.log("CLIENT ID:", googleClientId);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppProvider>
        <App />
      </AppProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
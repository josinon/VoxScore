import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './auth/AuthProvider';
import App from './app/App.tsx';
import { Toaster } from './app/components/ui/sonner';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster richColors position="top-center" />
    </AuthProvider>
  </BrowserRouter>,
);

import { Navigate, Route, Routes } from 'react-router';
import { RequireAdmin } from '../auth/RequireAdmin';
import { RequireAuth } from '../auth/RequireAuth';
import { AdminAppShell } from './AdminAppShell';
import { MegadanceVoterApp } from './MegadanceVoterApp';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import { HomeRedirect } from '../pages/HomeRedirect';
import { LoginPage } from '../pages/LoginPage';
import { OAuthCallbackPage } from '../pages/OAuthCallbackPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="/acesso-negado" element={<ForbiddenPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/votacao" element={<MegadanceVoterApp />} />
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<AdminAppShell />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

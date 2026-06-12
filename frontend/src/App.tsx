import { useEffect } from 'react';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { Layout } from './components/layout/Layout';
import { GuestLayout } from './components/layout/GuestLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { HomePage } from './pages/HomePage';
import { WelcomePage } from './pages/WelcomePage';
import { TreePage } from './pages/TreePage';
import { AlbumsPage } from './pages/AlbumsPage';
import { AlbumDetailPage } from './pages/AlbumDetailPage';
import { QuizPage } from './pages/QuizPage';
import { LoginPage } from './pages/LoginPage';
import { RequestAccessPage } from './pages/RequestAccessPage';
import { AdminPage } from './pages/AdminPage';
import { SecretSantaPage } from './pages/SecretSantaPage';
import { SecretSantaNewPage } from './pages/SecretSantaNewPage';
import { SecretSantaDetailPage } from './pages/SecretSantaDetailPage';
import { SecretSantaRevealPage } from './pages/SecretSantaRevealPage';
import { SecretSantaGuestPage } from './pages/SecretSantaGuestPage';
import { GuestHubPage } from './pages/GuestHubPage';
import { ProfilePage } from './pages/ProfilePage';
import { FamilyDirectoryPage } from './pages/FamilyDirectoryPage';
import { CalendarPage } from './pages/CalendarPage';
import { useAuthStore } from './stores/authStore';

function AuthInit({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInit>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<WelcomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="connexion" element={<Navigate to="/login" replace />} />
            <Route path="demande-acces" element={<RequestAccessPage />} />
          </Route>

          <Route element={<GuestLayout />}>
            <Route path="mes-invitations" element={<GuestHubPage />} />
            <Route path="secret-santa/invite/:token" element={<SecretSantaGuestPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="accueil" element={<HomePage />} />
              <Route path="tree" element={<TreePage />} />
              <Route path="albums" element={<AlbumsPage />} />
              <Route path="albums/:id" element={<AlbumDetailPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="secret-santa" element={<SecretSantaPage />} />
              <Route path="secret-santa/new" element={<SecretSantaNewPage />} />
              <Route path="secret-santa/:id" element={<SecretSantaDetailPage />} />
              <Route path="secret-santa/:id/reveal" element={<SecretSantaRevealPage />} />
              <Route path="famille" element={<FamilyDirectoryPage />} />
              <Route path="calendrier" element={<CalendarPage />} />
              <Route path="profil" element={<ProfilePage />} />
              <Route path="profil/:id" element={<ProfilePage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthInit>
    </BrowserRouter>
  );
}

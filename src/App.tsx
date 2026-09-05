import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AboutPage } from './pages/AboutPage';
import { ArchivePage } from './pages/ArchivePage';
import { HomePage } from './pages/HomePage';
import { InitiativesPage } from './pages/InitiativesPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TeamPage } from './pages/TeamPage';

/**
 * The two database-backed routes are split out so the Supabase SDK is not
 * downloaded by someone who only came to read about the contest.
 */
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const StaffPage = lazy(() =>
  import('./pages/StaffPage').then((module) => ({ default: module.StaffPage })),
);

function RouteFallback() {
  return (
    <section className="section">
      <div className="wrap">
        <p className="loading pixel">Loading…</p>
      </div>
    </section>
  );
}

export function App() {
  return (
    // BASE_URL keeps routing correct whether we are at /sfmo/ or a domain root.
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="register"
            element={
              <Suspense fallback={<RouteFallback />}>
                <RegisterPage />
              </Suspense>
            }
          />
          <Route path="about" element={<AboutPage />} />
          <Route path="initiatives" element={<InitiativesPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="team" element={<TeamPage />} />
          <Route
            path="staff"
            element={
              <Suspense fallback={<RouteFallback />}>
                <StaffPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

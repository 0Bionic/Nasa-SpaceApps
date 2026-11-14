import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CheckInPage } from '@/features/checkin/CheckInPage';
import { TrendsPage } from '@/features/trends/TrendsPage';
import { GuidancePage } from '@/features/guidance/GuidancePage';
import { RoutinesPage } from '@/features/routines/RoutinesPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { useAppStore } from '@/store/useAppStore';

export function App() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);
  const init = useAppStore((s) => s.init);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (ready && profile && !profile.onboarded) {
      setShowOnboarding(true);
    }
  }, [ready, profile]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl tracking-widest text-teal-glow">AetherHealth</p>
          <p className="mt-2 text-sm text-slate-400">Initializing local health vault…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="trends" element={<TrendsPage />} />
          <Route path="guidance" element={<GuidancePage />} />
          <Route path="routines" element={<RoutinesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

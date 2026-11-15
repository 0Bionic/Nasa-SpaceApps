import { useEffect, useState } from 'react';
import { BrowserRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { PacketModal } from '@/components/PacketModal';

// The hosted preview runs in a sandboxed frame without URL routing, so it uses an in-memory router.
const Router = import.meta.env.VITE_ARTIFACT ? MemoryRouter : BrowserRouter;
import { BrandMark, Layout } from './Layout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { CheckInPage } from '@/features/checkin/CheckInPage';
import { TrendsPage } from '@/features/trends/TrendsPage';
import { GuidancePage } from '@/features/guidance/GuidancePage';
import { RoutinesPage } from '@/features/routines/RoutinesPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { BeyondPage } from '@/features/beyond/BeyondPage';
import { ProtocolPage } from '@/features/protocol/ProtocolPage';
import { MonitorPage } from '@/features/monitor/MonitorPage';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { useAppStore } from '@/store/useAppStore';
import {
  remindersPreferred,
  scheduleInAppTick,
} from '@/features/routines/reminders';

/** Old /trends links (e.g. /trends?metric=hr) now land on the Analytics home page. */
function LegacyTrendsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/${search}`} replace />;
}

export function App() {
  const ready = useAppStore((s) => s.ready);
  const profile = useAppStore((s) => s.profile);
  const init = useAppStore((s) => s.init);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [initError, setInitError] = useState('');

  useEffect(() => {
    init().catch((e: unknown) => setInitError(e instanceof Error ? e.message : String(e)));
  }, [init]);

  useEffect(() => {
    if (ready && profile && !profile.onboarded) {
      setShowOnboarding(true);
    }
  }, [ready, profile]);

  useEffect(() => {
    if (ready && (profile?.remindersEnabled || remindersPreferred())) {
      scheduleInAppTick();
    }
  }, [ready, profile?.remindersEnabled]);

  if (initError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div role="alert">
          <BrandMark size={40} />
          <p className="mt-3 max-w-md text-sm text-dust">
            Local storage is unavailable in this browser, so health records cannot be loaded. Try a normal (non-private)
            window. ({initError})
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center text-center" role="status">
          <BrandMark size={40} />
          <p className="mt-3 text-sm text-dust">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <PacketModal />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<TrendsPage />} />
          <Route path="status" element={<DashboardPage />} />
          <Route path="checkin" element={<CheckInPage />} />
          <Route path="monitor" element={<MonitorPage />} />
          <Route path="trends" element={<LegacyTrendsRedirect />} />
          <Route path="guidance" element={<GuidancePage />} />
          <Route path="routines" element={<RoutinesPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="beyond" element={<BeyondPage />} />
          <Route path="protocol" element={<ProtocolPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

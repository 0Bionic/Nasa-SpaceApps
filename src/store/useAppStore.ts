import { create } from 'zustand';
import type { BodyRegionId, CheckInRecord, CrewProfile, UnlockedBadge } from '@/domain/types';
import {
  getActiveProfile,
  getLatestCheckIn,
  getRoutineCompletions,
  listCheckIns,
  listUnlockedBadges,
} from '@/data/repositories';

interface AppState {
  ready: boolean;
  profile: CrewProfile | null;
  latest: CheckInRecord | null;
  history: CheckInRecord[];
  badges: UnlockedBadge[];
  routineDoneIds: string[];
  selectedRegion: BodyRegionId | null;
  criticalBannerDismissed: boolean;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  setSelectedRegion: (id: BodyRegionId | null) => void;
  dismissCritical: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  profile: null,
  latest: null,
  history: [],
  badges: [],
  routineDoneIds: [],
  selectedRegion: null,
  criticalBannerDismissed: false,
  setSelectedRegion: (id) => set({ selectedRegion: id }),
  dismissCritical: () => set({ criticalBannerDismissed: true }),
  init: async () => {
    await get().refresh();
    set({ ready: true });
  },
  refresh: async () => {
    const profile = await getActiveProfile();
    const [latest, history, badges, routines] = await Promise.all([
      getLatestCheckIn(),
      listCheckIns(60),
      listUnlockedBadges(),
      getRoutineCompletions(profile.missionDay),
    ]);
    set({
      profile,
      latest: latest ?? null,
      history,
      badges,
      routineDoneIds: routines.map((r) => r.routineId),
      criticalBannerDismissed:
        latest?.overallSeverity === 'red' ? get().criticalBannerDismissed : false,
    });
  },
}));

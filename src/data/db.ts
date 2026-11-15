import Dexie, { type Table } from 'dexie';
import type {
  CheckInRecord,
  CrewProfile,
  RoutineCompletion,
  UnlockedBadge,
} from '@/domain/types';
import type { MonitorSession } from '@/domain/monitoring';

export class AetherDB extends Dexie {
  profiles!: Table<CrewProfile, string>;
  checkIns!: Table<CheckInRecord, string>;
  routines!: Table<RoutineCompletion, string>;
  badges!: Table<UnlockedBadge, string>;
  monitorSessions!: Table<MonitorSession, string>;

  constructor() {
    super('aetherhealth');
    this.version(1).stores({
      profiles: 'id, name',
      checkIns: 'id, profileId, timestamp',
      routines: 'id, profileId, [profileId+missionDay], [profileId+missionDay+routineId], routineId',
      badges: 'id, profileId, badgeId',
    });
    // v2: continuous-monitoring sessions (EVA, exercise, 24-h), stored for store-and-forward downlink.
    this.version(2).stores({
      monitorSessions: 'id, profileId, startedAt, mode',
    });
  }
}

export const db = new AetherDB();

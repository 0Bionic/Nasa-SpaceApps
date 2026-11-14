import Dexie, { type Table } from 'dexie';
import type {
  CheckInRecord,
  CrewProfile,
  RoutineCompletion,
  UnlockedBadge,
} from '@/domain/types';

export class AetherDB extends Dexie {
  profiles!: Table<CrewProfile, string>;
  checkIns!: Table<CheckInRecord, string>;
  routines!: Table<RoutineCompletion, string>;
  badges!: Table<UnlockedBadge, string>;

  constructor() {
    super('aetherhealth');
    this.version(1).stores({
      profiles: 'id, name',
      checkIns: 'id, profileId, timestamp',
      routines: 'id, profileId, [profileId+missionDay], [profileId+missionDay+routineId], routineId',
      badges: 'id, profileId, badgeId',
    });
  }
}

export const db = new AetherDB();

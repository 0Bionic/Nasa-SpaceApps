import { BADGES } from '@/domain/badges';
import { overallSeverity, triageCheckIn } from '@/domain/triage/engine';
import type {
  CheckInInput,
  CheckInRecord,
  CrewProfile,
  MissionEnvironment,
  RoutineCompletion,
  UnlockedBadge,
} from '@/domain/types';
import { normalizeCheckInInput } from '@/domain/types';
import { db } from './db';
import { ROUTINE_CATALOG } from './routines';
import { DEFAULT_PROFILE_ID, ensureSeeded } from './seed';

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function getActiveProfile(): Promise<CrewProfile> {
  await ensureSeeded();
  const profile = await db.profiles.get(DEFAULT_PROFILE_ID);
  if (!profile) throw new Error('Profile missing after seed');
  // Backfill study-guide fields for older local profiles
  if (typeof profile.remindersEnabled !== 'boolean') {
    const next = { ...profile, remindersEnabled: false };
    await db.profiles.put(next);
    return next;
  }
  return profile;
}

export async function updateProfile(
  patch: Partial<
    Pick<CrewProfile, 'name' | 'role' | 'missionDay' | 'environment' | 'onboarded' | 'remindersEnabled'>
  >,
): Promise<CrewProfile> {
  const profile = await getActiveProfile();
  const next: CrewProfile = {
    ...profile,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await db.profiles.put(next);
  return next;
}

export async function listCheckIns(limit = 90): Promise<CheckInRecord[]> {
  const profile = await getActiveProfile();
  const rows = await db.checkIns.where('profileId').equals(profile.id).toArray();
  return rows
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
    .slice(0, limit)
    .map((r) => ({
      ...normalizeCheckInInput(r),
      id: r.id,
      profileId: r.profileId,
      timestamp: r.timestamp,
      symptoms: {
        sansVisualChanges: !!r.symptoms?.sansVisualChanges,
        rash: !!r.symptoms?.rash,
        orthostaticDizziness: !!r.symptoms?.orthostaticDizziness,
      },
      notes: r.notes ?? '',
      regionDiscomfort: r.regionDiscomfort ?? {},
      photoDataUrl: r.photoDataUrl ?? '',
      overallSeverity: r.overallSeverity,
    }));
}

export async function getLatestCheckIn(): Promise<CheckInRecord | undefined> {
  const rows = await listCheckIns(1);
  return rows[0];
}

export async function saveCheckIn(input: CheckInInput): Promise<CheckInRecord> {
  const profile = await getActiveProfile();
  const normalized = normalizeCheckInInput(input);
  const results = triageCheckIn(normalized);
  const record: CheckInRecord = {
    id: uid('checkin'),
    profileId: profile.id,
    timestamp: new Date().toISOString(),
    ...normalized,
    notes: normalized.notes ?? '',
    symptoms: {
      sansVisualChanges: !!normalized.symptoms?.sansVisualChanges,
      rash: !!normalized.symptoms?.rash,
      orthostaticDizziness: !!normalized.symptoms?.orthostaticDizziness,
    },
    regionDiscomfort: normalized.regionDiscomfort ?? {},
    photoDataUrl: normalized.photoDataUrl ?? '',
    overallSeverity: overallSeverity(results),
  };

  let xpGain = 25;
  if (normalized.exerciseMin >= 45) xpGain += 15;
  if (normalized.sleepH >= 6.5) xpGain += 10;
  if (Object.keys(normalized.regionDiscomfort ?? {}).length) xpGain += 5;

  const newStreak = profile.streak + 1;
  const updated: CrewProfile = {
    ...profile,
    xp: profile.xp + xpGain,
    streak: newStreak,
    updatedAt: new Date().toISOString(),
  };

  const newBadges: UnlockedBadge[] = [];
  const existing = await db.badges.where('profileId').equals(profile.id).toArray();
  const have = new Set(existing.map((b) => b.badgeId));

  const maybeUnlock = (badgeId: string) => {
    if (have.has(badgeId)) return;
    newBadges.push({
      id: uid('badge'),
      profileId: profile.id,
      badgeId,
      unlockedAt: new Date().toISOString(),
    });
    have.add(badgeId);
  };

  maybeUnlock('first_checkin');
  if (newStreak >= 3) maybeUnlock('streak_3');
  if (newStreak >= 7) maybeUnlock('streak_7');
  if (normalized.exerciseMin >= 45) maybeUnlock('exercise_guardian');
  if (normalized.sleepH >= 6.5 && normalized.sleepH <= 9) maybeUnlock('sleep_steward');

  await db.transaction('rw', db.checkIns, db.profiles, db.badges, async () => {
    await db.checkIns.put(record);
    await db.profiles.put(updated);
    if (newBadges.length) await db.badges.bulkPut(newBadges);
  });

  return record;
}

export async function listUnlockedBadges(): Promise<UnlockedBadge[]> {
  const profile = await getActiveProfile();
  return db.badges.where('profileId').equals(profile.id).toArray();
}

export function badgeMeta(badgeId: string) {
  return BADGES.find((b) => b.id === badgeId);
}

export async function getRoutineCompletions(missionDay: number): Promise<RoutineCompletion[]> {
  const profile = await getActiveProfile();
  return db.routines.where('[profileId+missionDay]').equals([profile.id, missionDay]).toArray();
}

export async function toggleRoutine(routineId: string, missionDay: number): Promise<void> {
  const profile = await getActiveProfile();
  const existing = await db.routines
    .where('[profileId+missionDay+routineId]')
    .equals([profile.id, missionDay, routineId])
    .first();

  if (existing) {
    await db.routines.delete(existing.id);
    return;
  }

  await db.routines.put({
    id: uid('routine'),
    profileId: profile.id,
    routineId,
    missionDay,
    completedAt: new Date().toISOString(),
  });

  const all = await getRoutineCompletions(missionDay);
  if (all.length >= ROUTINE_CATALOG.length) {
    const badges = await listUnlockedBadges();
    if (!badges.some((b) => b.badgeId === 'routine_complete')) {
      await db.badges.put({
        id: uid('badge'),
        profileId: profile.id,
        badgeId: 'routine_complete',
        unlockedAt: new Date().toISOString(),
      });
      const p = await getActiveProfile();
      await db.profiles.put({ ...p, xp: p.xp + 20, updatedAt: new Date().toISOString() });
    }
  }
}

export async function setEnvironment(environment: MissionEnvironment): Promise<CrewProfile> {
  return updateProfile({ environment });
}

/** Mock wearable + habitat monitor sync */
/**
 * Wipe all local data (check-ins, profile, routines, badges, uplinks) so the
 * app reseeds the demo crew member on next load. Used by "Reset demo data".
 */
export async function resetDemoData(): Promise<void> {
  await db.delete();
  try {
    localStorage.removeItem('aetherhealth-uplinks');
  } catch {
    /* storage unavailable */
  }
}

export function mockSensorSync(): CheckInInput {
  return {
    hr: 68 + Math.floor(Math.random() * 8),
    bpSys: 116 + Math.floor(Math.random() * 10),
    bpDia: 72 + Math.floor(Math.random() * 8),
    spo2: 97 + Math.floor(Math.random() * 2),
    temp: Number((36.4 + Math.random() * 0.4).toFixed(1)),
    glucose: 90 + Math.floor(Math.random() * 25),
    sleepH: Number((6 + Math.random() * 2.5).toFixed(1)),
    mood: 5 + Math.floor(Math.random() * 4),
    // Exercise is logged from the ARED/cycle session, not a wake sensor; keep a plausible value.
    exerciseMin: 45 + Math.floor(Math.random() * 20),
    radiationMsv: Number((0.4 + Math.random() * 0.3).toFixed(2)),
    cabinCo2Ppm: Math.round(700 + Math.random() * 900),
    stress: 3 + Math.floor(Math.random() * 4),
    fatigue: 3 + Math.floor(Math.random() * 4),
    teamwork: 6 + Math.floor(Math.random() * 4),
    dizziness: Math.floor(Math.random() * 3),
    resistiveMin: 30 + Math.floor(Math.random() * 15),
    fluidL: Number((1.8 + Math.random() * 1.2).toFixed(1)),
    notes: 'Synced from mock wearable / cuff suite + cabin monitors.',
    symptoms: {
      sansVisualChanges: false,
      rash: false,
      orthostaticDizziness: false,
    },
    regionDiscomfort: {},
    photoDataUrl: '',
  };
}

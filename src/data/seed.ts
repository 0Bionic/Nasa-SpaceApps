import type { CheckInInput, CheckInRecord, CrewProfile, MissionEnvironment } from '@/domain/types';
import { overallSeverity, triageCheckIn } from '@/domain/triage/engine';
import { db } from './db';

const DEFAULT_PROFILE_ID = 'crew-demo-1';

function isoDaysAgo(daysAgo: number, hour = 7): string {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Generate 30 days of plausible history with a mild sleep/mood decline trend. */
function buildHistory(profileId: string): CheckInRecord[] {
  const records: CheckInRecord[] = [];
  for (let day = 29; day >= 0; day--) {
    const fatigue = (29 - day) / 29; // 0 → older, 1 → recent
    const input: CheckInInput = {
      hr: Math.round(62 + fatigue * 12 + (day % 3) * 2),
      bpSys: Math.round(118 + (day % 5) - 2),
      bpDia: Math.round(74 + (day % 4)),
      spo2: day === 2 ? 92 : day === 1 ? 95 : 98 - (day % 2 === 0 ? 0 : 1),
      temp: Number((36.5 + (day % 7 === 0 ? 0.4 : 0) + fatigue * 0.1).toFixed(1)),
      glucose: Math.round(95 + (day % 6) * 3),
      sleepH: Number(clamp(7.8 - fatigue * 2.2 - (day % 5 === 0 ? 0.8 : 0), 3.5, 9).toFixed(1)),
      mood: Math.round(clamp(8 - fatigue * 3 - (day % 9 === 0 ? 2 : 0), 2, 10)),
      exerciseMin: day % 4 === 0 ? 20 : day % 3 === 0 ? 35 : 55,
      notes: day === 1 ? 'Mild headache after EVA sim.' : '',
      symptoms: {
        sansVisualChanges: day === 5,
        rash: day === 8,
        orthostaticDizziness: day === 3 || day === 4,
      },
    };

    // Inject a yellow sleep day and a red SpO2 demo point near the end
    if (day === 0) {
      input.spo2 = 88;
      input.sleepH = 4.2;
      input.mood = 4;
      input.notes = 'Demo critical path: low SpO₂ after cabin drill.';
    }

    const results = triageCheckIn(input);
    records.push({
      id: `checkin-seed-${day}`,
      profileId,
      timestamp: isoDaysAgo(day),
      hr: input.hr,
      bpSys: input.bpSys,
      bpDia: input.bpDia,
      spo2: input.spo2,
      temp: input.temp,
      glucose: input.glucose,
      sleepH: input.sleepH,
      mood: input.mood,
      exerciseMin: input.exerciseMin,
      notes: input.notes ?? '',
      symptoms: {
        sansVisualChanges: !!input.symptoms?.sansVisualChanges,
        rash: !!input.symptoms?.rash,
        orthostaticDizziness: !!input.symptoms?.orthostaticDizziness,
      },
      overallSeverity: overallSeverity(results),
    });
  }
  return records;
}

export async function ensureSeeded(): Promise<CrewProfile> {
  const existing = await db.profiles.get(DEFAULT_PROFILE_ID);
  if (existing) return existing;

  const now = new Date().toISOString();
  const profile: CrewProfile = {
    id: DEFAULT_PROFILE_ID,
    name: 'Cmdr. Avery Chen',
    role: 'Crew Medical Officer',
    missionDay: 47,
    environment: 'surface_base' satisfies MissionEnvironment,
    xp: 420,
    streak: 6,
    onboarded: false,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', db.profiles, db.checkIns, db.badges, async () => {
    await db.profiles.put(profile);
    await db.checkIns.bulkPut(buildHistory(profile.id));
    await db.badges.put({
      id: 'badge-unlock-first',
      profileId: profile.id,
      badgeId: 'first_checkin',
      unlockedAt: isoDaysAgo(28),
    });
    await db.badges.put({
      id: 'badge-unlock-streak3',
      profileId: profile.id,
      badgeId: 'streak_3',
      unlockedAt: isoDaysAgo(3),
    });
  });

  return profile;
}

export { DEFAULT_PROFILE_ID };

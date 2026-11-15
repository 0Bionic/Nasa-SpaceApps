import type { MonitorSession } from '@/domain/monitoring';
import { db } from './db';
import { getActiveProfile } from './repositories';

export async function saveMonitorSession(session: Omit<MonitorSession, 'id' | 'profileId'>): Promise<MonitorSession> {
  const profile = await getActiveProfile();
  const record: MonitorSession = { ...session, id: `mon-${crypto.randomUUID().slice(0, 8)}`, profileId: profile.id };
  await db.monitorSessions.put(record);
  return record;
}

/** Newest first. */
export async function listMonitorSessions(limit = 20): Promise<MonitorSession[]> {
  const profile = await getActiveProfile();
  const all = await db.monitorSessions.where('profileId').equals(profile.id).toArray();
  return all.sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
}

export async function deleteMonitorSession(id: string): Promise<void> {
  await db.monitorSessions.delete(id);
}

/** Sessions recorded since the last ground packet (store-and-forward queue). */
export async function pendingDownlink(): Promise<MonitorSession[]> {
  return (await listMonitorSessions(100)).filter((s) => !s.downlinked);
}

export async function markDownlinked(ids: string[]): Promise<void> {
  await db.monitorSessions.where('id').anyOf(ids).modify({ downlinked: true });
}

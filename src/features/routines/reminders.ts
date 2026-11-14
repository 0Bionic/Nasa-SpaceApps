import { ROUTINE_CATALOG } from '@/data/routines';

const STORAGE_KEY = 'aetherhealth-reminders-enabled';

export function remindersPreferred(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function setRemindersPreferred(on: boolean) {
  localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
}

/** Request permission and schedule daily wake / midday / pre-sleep reminders when possible. */
export async function enableHealthReminders(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof Notification === 'undefined') return 'unsupported';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  setRemindersPreferred(true);
  scheduleInAppTick();
  return 'granted';
}

export function disableHealthReminders() {
  setRemindersPreferred(false);
  stopInAppTick();
}

/** Lightweight in-tab reminder when the app is open (PWA-friendly without a service-worker alarm API). */
let timer: number | null = null;
const lastFired: Record<string, string> = {};

function scheduleLabel(schedule: 'wake' | 'midday' | 'pre_sleep'): string {
  return (
    ROUTINE_CATALOG.find((r) => r.schedule === schedule)?.label ?? 'Health routine'
  );
}

function maybeNotify(schedule: 'wake' | 'midday' | 'pre_sleep', hour: number) {
  if (!remindersPreferred() || typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  const now = new Date();
  if (now.getHours() !== hour) return;
  const dayKey = `${schedule}-${now.toDateString()}`;
  if (lastFired[schedule] === dayKey) return;
  if (now.getMinutes() > 20) return;
  lastFired[schedule] = dayKey;
  new Notification('AetherHealth reminder', {
    body: `${scheduleLabel(schedule)} is due. Keep your health record current while Earth is delayed.`,
    tag: `aether-${schedule}`,
  });
}

export function scheduleInAppTick() {
  if (timer != null) return;
  const tick = () => {
    maybeNotify('wake', 7);
    maybeNotify('midday', 13);
    maybeNotify('pre_sleep', 21);
  };
  tick();
  timer = window.setInterval(tick, 60_000);
}

export function stopInAppTick() {
  if (timer != null) {
    window.clearInterval(timer);
    timer = null;
  }
}

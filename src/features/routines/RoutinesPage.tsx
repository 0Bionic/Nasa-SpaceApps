import { useState } from 'react';
import { ROUTINE_CATALOG } from '@/data/routines';
import { toggleRoutine, updateProfile } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';
import { BadgeShelf } from '@/features/gamification/BadgeShelf';
import { IconCheck } from '@/components/Icons';
import {
  disableHealthReminders,
  enableHealthReminders,
  remindersPreferred,
} from '@/features/routines/reminders';

const SLOTS = [
  { id: 'wake', label: 'After waking' },
  { id: 'midday', label: 'Midday' },
  { id: 'pre_sleep', label: 'Before sleep' },
] as const;

export function RoutinesPage() {
  const profile = useAppStore((s) => s.profile);
  const done = useAppStore((s) => s.routineDoneIds);
  const refresh = useAppStore((s) => s.refresh);
  const badges = useAppStore((s) => s.badges);
  const [reminderMsg, setReminderMsg] = useState('');

  if (!profile) return null;

  const onToggle = async (routineId: string) => {
    await toggleRoutine(routineId, profile.missionDay);
    await refresh();
  };

  const onReminders = async () => {
    if (remindersPreferred() || profile.remindersEnabled) {
      disableHealthReminders();
      await updateProfile({ remindersEnabled: false });
      await refresh();
      setReminderMsg('Reminders off.');
      return;
    }
    const result = await enableHealthReminders();
    if (result === 'granted') {
      await updateProfile({ remindersEnabled: true });
      await refresh();
      setReminderMsg('Reminders on — wake, midday, and pre-sleep while the app is open.');
    } else if (result === 'denied') {
      setReminderMsg('Notification permission denied. You can still use the checklist.');
    } else {
      setReminderMsg('Notifications are not supported in this browser.');
    }
  };

  const completed = done.length;
  const total = ROUTINE_CATALOG.length;
  const pct = total ? completed / total : 0;
  const R = 34;
  const C = 2 * Math.PI * R;

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 className="h-page">Routines</h1>
          <p className="lede mt-2">
            Countermeasure checklist for mission day {profile.missionDay}. Optional reminders fire while
            the app is open.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" className="btn-quiet" onClick={() => void onReminders()}>
              {remindersPreferred() || profile.remindersEnabled
                ? 'Disable reminders'
                : 'Enable health reminders'}
            </button>
            {reminderMsg && <p className="text-xs text-dust">{reminderMsg}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <svg width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
            <circle cx="42" cy="42" r={R} fill="none" stroke="rgb(var(--c-line))" strokeWidth="6" />
            <circle
              cx="42"
              cy="42"
              r={R}
              fill="none"
              stroke={pct === 1 ? 'rgb(var(--c-accent))' : 'rgb(var(--c-blue))'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              transform="rotate(-90 42 42)"
              className="transition-[stroke-dashoffset,stroke] duration-200"
            />
          </svg>
          <div>
            <p className="readout text-2xl text-star">
              {completed}
              <span className="text-dust">/{total}</span>
            </p>
            <p className="text-xs text-dust">done today</p>
            <p className="mt-1.5 text-xs text-faint">
              {profile.xp} XP, {profile.streak}-day streak
            </p>
          </div>
        </div>
      </header>

      <ol className="relative">
        {SLOTS.map((slot, si) => {
          const items = ROUTINE_CATALOG.filter((r) => r.schedule === slot.id);
          const slotDone = items.every((r) => done.includes(r.id));
          return (
            <li key={slot.id} className="relative grid grid-cols-[28px_1fr] gap-x-4 pb-8 last:pb-0">
              {si < SLOTS.length - 1 && (
                <span className="absolute left-[13px] top-7 bottom-0 w-px bg-rule" aria-hidden="true" />
              )}
              <span
                className={`relative mt-0.5 flex h-[27px] w-[27px] items-center justify-center rounded-full border transition-colors ${
                  slotDone ? 'border-sev-green bg-sev-green/15 text-sev-green' : 'border-rule-strong bg-void text-faint'
                }`}
                aria-hidden="true"
              >
                {slotDone ? <IconCheck width={14} height={14} strokeWidth={2.2} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <div>
                <h2 className="text-[0.9375rem] font-semibold text-star">{slot.label}</h2>
                <ul className="mt-3 space-y-2">
                  {items.map((routine) => {
                    const isDone = done.includes(routine.id);
                    return (
                      <li key={routine.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={isDone}
                          onClick={() => onToggle(routine.id)}
                          className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
                            isDone ? 'border-rule bg-hull/50' : 'border-rule bg-hull hover:border-rule-strong'
                          }`}
                        >
                          <span
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200 ${
                              isDone ? 'scale-100 border-sev-green bg-sev-green text-void' : 'border-rule-strong'
                            }`}
                          >
                            {isDone && <IconCheck width={14} height={14} strokeWidth={2.4} />}
                          </span>
                          <span>
                            <span className={`block text-sm font-semibold transition-colors ${isDone ? 'text-dust line-through decoration-faint' : 'text-star'}`}>
                              {routine.label}
                            </span>
                            <span className="mt-0.5 block text-sm text-dust">{routine.description}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <BadgeShelf badges={badges} />
    </div>
  );
}

import { ROUTINE_CATALOG } from '@/data/routines';
import { toggleRoutine } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';
import { BadgeShelf } from '@/features/gamification/BadgeShelf';

export function RoutinesPage() {
  const profile = useAppStore((s) => s.profile);
  const done = useAppStore((s) => s.routineDoneIds);
  const refresh = useAppStore((s) => s.refresh);
  const badges = useAppStore((s) => s.badges);

  if (!profile) return null;

  const scheduleOrder = ['wake', 'midday', 'pre_sleep'] as const;
  const labels = { wake: 'Wake', midday: 'Midday', pre_sleep: 'Pre-sleep' };

  const onToggle = async (routineId: string) => {
    await toggleRoutine(routineId, profile.missionDay);
    await refresh();
  };

  const completed = done.length;
  const total = ROUTINE_CATALOG.length;

  return (
    <div className="animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Mission routines</h1>
        <p className="mt-1 text-sm text-slate-400">
          Context-aware checklist for mission day {profile.missionDay}. Completing tasks earns XP and badges.
        </p>
      </div>

      <div className="panel p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-slate-300">
            {completed}/{total} complete today
          </span>
          <span className="text-teal-soft">{profile.xp} XP · {profile.streak}d streak</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-teal-glow transition-all duration-500"
            style={{ width: `${(completed / total) * 100}%` }}
          />
        </div>
      </div>

      {scheduleOrder.map((slot) => (
        <section key={slot} className="space-y-2">
          <h2 className="font-display text-xs tracking-[0.2em] text-slate-400">
            {labels[slot].toUpperCase()}
          </h2>
          {ROUTINE_CATALOG.filter((r) => r.schedule === slot).map((routine) => {
            const isDone = done.includes(routine.id);
            return (
              <button
                key={routine.id}
                type="button"
                onClick={() => onToggle(routine.id)}
                className={`panel flex w-full items-start gap-4 p-4 text-left transition ${
                  isDone ? 'border-teal-glow/40 bg-teal-glow/10' : 'hover:border-white/20'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs ${
                    isDone
                      ? 'border-teal-glow bg-teal-glow text-space-950'
                      : 'border-white/20 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <span>
                  <span className="block font-semibold text-slate-100">{routine.label}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{routine.description}</span>
                </span>
              </button>
            );
          })}
        </section>
      ))}

      <BadgeShelf badges={badges} />
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import type { MissionEnvironment } from '@/domain/types';
import { updateProfile } from '@/data/repositories';
import { downloadGroundPacket } from '@/data/exportPacket';
import { useAppStore } from '@/store/useAppStore';
import { BadgeShelf } from '@/features/gamification/BadgeShelf';
import { IconCheck, IconExport } from '@/components/Icons';
import { EARTH_DELAY } from '@/components/vitals';

const ENVIRONMENTS: { id: MissionEnvironment; label: string; blurb: string }[] = [
  { id: 'station', label: 'Orbital station', blurb: 'A habitat in low Earth orbit' },
  { id: 'spacecraft', label: 'Transit vehicle', blurb: 'A capsule or ship between worlds' },
  { id: 'surface_base', label: 'Surface base', blurb: 'A lunar or planetary habitat' },
  { id: 'rover', label: 'Surface rover', blurb: 'A pressurized mobility cabin' },
];

export function ProfilePage() {
  const profile = useAppStore((s) => s.profile);
  const badges = useAppStore((s) => s.badges);
  const refresh = useAppStore((s) => s.refresh);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [missionDay, setMissionDay] = useState(1);
  const [environment, setEnvironment] = useState<MissionEnvironment>('station');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setRole(profile.role);
    setMissionDay(profile.missionDay);
    setEnvironment(profile.environment);
  }, [profile]);

  if (!profile) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await updateProfile({ name, role, missionDay, environment });
    await refresh();
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <div className="space-y-12">
      <header>
        <h1 className="h-page">Crew profile</h1>
        <p className="lede mt-2">
          Habitat sets the Earth delay shown in the sidebar. Reminder toggle lives under Routines.
        </p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-5">
          <div>
            <label className="field-label" htmlFor="name">
              Name
            </label>
            <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="field-label" htmlFor="role">
              Role
            </label>
            <input id="role" className="field" value={role} onChange={(e) => setRole(e.target.value)} required />
          </div>
          <div>
            <label className="field-label" htmlFor="day">
              Mission day
            </label>
            <input
              id="day"
              type="number"
              min={1}
              className="field readout max-w-[160px]"
              value={missionDay}
              onChange={(e) => setMissionDay(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <fieldset>
          <legend className="field-label">Habitat</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENVIRONMENTS.map((env) => {
              const on = environment === env.id;
              return (
                <label
                  key={env.id}
                  className={`relative flex cursor-pointer flex-col rounded-lg border px-4 py-3.5 transition-colors ${
                    on ? 'border-limb/70 bg-deck' : 'border-rule bg-hull hover:border-rule-strong'
                  }`}
                >
                  <input
                    type="radio"
                    name="environment"
                    value={env.id}
                    checked={on}
                    onChange={() => setEnvironment(env.id)}
                    className="peer sr-only"
                  />
                  <span className="pointer-events-none absolute inset-0 rounded-lg peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-limb" />
                  <span className="text-sm font-semibold text-star">{env.label}</span>
                  <span className="mt-0.5 text-xs text-dust">{env.blurb}</span>
                  <span className="mt-3 text-xs text-faint">
                    Earth delay <span className="readout text-dust">{EARTH_DELAY[env.id].value}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button type="submit" className="btn-primary">
              Save profile
            </button>
            <button type="button" className="btn-quiet" onClick={() => downloadGroundPacket()}>
              <IconExport width={16} height={16} />
              Export ground packet
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-sev-green" role="status">
                <IconCheck width={16} height={16} />
                Saved
              </span>
            )}
          </div>
          <p className="mt-4 text-xs text-faint">
            Health reminders:{' '}
            <span className="text-dust">
              {profile.remindersEnabled ? 'enabled' : 'off'}
            </span>
            . Toggle them on the Routines page.
          </p>
        </fieldset>
      </form>

      <BadgeShelf badges={badges} />
    </div>
  );
}

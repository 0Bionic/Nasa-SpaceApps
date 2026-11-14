import { useEffect, useState, type FormEvent } from 'react';
import type { MissionEnvironment } from '@/domain/types';
import { updateProfile } from '@/data/repositories';
import { downloadGroundPacket } from '@/data/exportPacket';
import { useAppStore } from '@/store/useAppStore';
import { BadgeShelf } from '@/features/gamification/BadgeShelf';

const ENVIRONMENTS: { id: MissionEnvironment; label: string; blurb: string }[] = [
  { id: 'spacecraft', label: 'Spacecraft', blurb: 'Transit vehicle / capsule' },
  { id: 'station', label: 'Space station', blurb: 'Orbital habitat (ISS-like)' },
  { id: 'rover', label: 'Rover', blurb: 'Surface mobility cabin' },
  { id: 'surface_base', label: 'Surface base', blurb: 'Lunar or planetary habitat' },
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
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-up mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Crew profile</h1>
        <p className="mt-1 text-sm text-slate-400">
          Environment adjusts reminder framing and mission narrative for multi-habitat ops.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-4 p-5">
        <div>
          <label className="label" htmlFor="name">
            Astronaut name
          </label>
          <input
            id="name"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="role">
            Role
          </label>
          <input
            id="role"
            className="input-field"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="day">
            Mission day
          </label>
          <input
            id="day"
            type="number"
            min={1}
            className="input-field"
            value={missionDay}
            onChange={(e) => setMissionDay(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <p className="label">Environment</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ENVIRONMENTS.map((env) => (
              <button
                key={env.id}
                type="button"
                onClick={() => setEnvironment(env.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  environment === env.id
                    ? 'border-teal-glow bg-teal-glow/15'
                    : 'border-white/10 bg-space-950/40 hover:border-white/25'
                }`}
              >
                <span className="block font-semibold text-slate-100">{env.label}</span>
                <span className="text-xs text-slate-400">{env.blurb}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            Save profile
          </button>
          <button type="button" className="btn-ghost" onClick={() => downloadGroundPacket()}>
            Export FHIR-lite packet
          </button>
          {saved && <span className="self-center text-sm text-teal-soft">Saved</span>}
        </div>
      </form>

      <BadgeShelf badges={badges} />
    </div>
  );
}

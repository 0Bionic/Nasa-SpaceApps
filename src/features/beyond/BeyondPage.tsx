import { Link } from 'react-router-dom';
import { useAudience } from '@/app/audience';
import { SOURCES } from '@/domain/evidence';
import { INDICATORS } from '@/domain/indicators';
import type { HealthIndicatorId } from '@/domain/types';

interface UseCase {
  title: string;
  who: string;
  parallel: string;
  uses: HealthIndicatorId[];
  features: string[];
}

/**
 * Who else benefits. Grounded in the CSA's case that space health research
 * improves life on Earth, and NASA's use of ground-based analogs.
 */
const USE_CASES: UseCase[] = [
  {
    title: 'Remote and Northern communities',
    who: 'Fly-in communities where a clinician may be hours or days away and connectivity is unreliable.',
    parallel: 'Same problem as distance from Earth: no real-time doctor, delayed evacuation, decisions made locally.',
    uses: ['spo2', 'temp', 'bp_sys', 'glucose'],
    features: ['Works fully offline', 'Tiered actions for a local health worker', 'Clinic packet for the next telehealth visit'],
  },
  {
    title: 'Older adults living at home',
    who: 'Seniors managing balance, bone and heart health between appointments.',
    parallel: 'The CSA notes that changes seen in astronauts resemble accelerated aging and the effects of a sedentary life.',
    uses: ['dizziness', 'resistive_min', 'bp_sys', 'fluid_l'],
    features: ['Early-warning trends before a fall or crisis', 'Plain-language explanations', 'Large readouts in light mode'],
  },
  {
    title: 'Isolated crews on Earth',
    who: 'Antarctic stations, submarines, offshore platforms and polar expeditions.',
    parallel: 'NASA studies these ground-based analogs because they share isolation, confinement and a closed environment.',
    uses: ['sleep_h', 'mood', 'teamwork', 'cabin_co2'],
    features: ['Crew board for the medic', 'Sleep, mood and teamwork tracking', 'Habitat air quality'],
  },
  {
    title: 'People with chronic conditions',
    who: 'Type-2 diabetes and cardiovascular disease, where daily readings guide self-care.',
    parallel: 'The CSA lists osteoporosis, cardiovascular disorders and Type-2 diabetes among conditions space research informs.',
    uses: ['glucose', 'bp_sys', 'hr', 'exercise_min'],
    features: ['Source-backed thresholds (ADA, ACC/AHA)', '“Why this color” explanations', 'Trend history for the care team'],
  },
];

export function BeyondPage() {
  const audience = useAudience((s) => s.audience);
  const setAudience = useAudience((s) => s.setAudience);
  const csa = SOURCES['csa-science'];
  const nasa = SOURCES['nasa-hazards'];

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-limb">Beyond the mission</p>
        <h1 className="h-page">Built for Mars, useful on Earth</h1>
        <p className="lede">
          Astronauts far from Earth and people far from a clinic face the same problem: no doctor in the room and decisions that
          can&rsquo;t wait. The Canadian Space Agency studies astronaut health partly to improve quality of life on Earth. AetherHealth&rsquo;s
          offline triage carries over directly.
        </p>
      </header>

      <section aria-labelledby="earth-mode" className="surface flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="max-w-[60ch]">
          <h2 id="earth-mode" className="h-section">
            Earth mode
          </h2>
          <p className="mt-1 text-sm text-dust">
            Rewords the app for clinic and home use (Ground → Remote clinician, CMO → Health worker, Ground Packet → Clinic Packet).
            Thresholds and logic stay exactly the same.
          </p>
        </div>
        <div className="seg" role="group" aria-label="Audience">
          <button type="button" className="seg-item" aria-pressed={audience === 'mission'} onClick={() => setAudience('mission')}>
            Space mission
          </button>
          <button type="button" className="seg-item" aria-pressed={audience === 'earth'} onClick={() => setAudience('earth')}>
            Earth clinic
          </button>
        </div>
      </section>

      <section aria-labelledby="use-cases" className="space-y-4">
        <h2 id="use-cases" className="h-section">
          Who else it helps
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {USE_CASES.map((u) => (
            <article key={u.title} className="surface space-y-3 p-5">
              <h3 className="text-base font-semibold text-star">{u.title}</h3>
              <p className="text-sm text-dust">{u.who}</p>
              <p className="border-l-2 border-limb/60 pl-3 text-sm text-star">{u.parallel}</p>
              <div>
                <p className="text-xs font-medium text-dust">Readings it relies on</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {u.uses.map((id) => (
                    <li key={id}>
                      <Link
                        to={`/?metric=${id}`}
                        className="inline-block rounded-md border border-rule px-2 py-0.5 text-xs text-star hover:border-limb/60"
                      >
                        {INDICATORS[id].label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-dust">
                {u.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="transfer" className="grid gap-4 md:grid-cols-3">
        <h2 id="transfer" className="sr-only">
          Why it transfers
        </h2>
        {[
          ['Offline first', 'Runs on a phone or tablet with no network, then syncs a packet when a connection appears.'],
          ['Tiered escalation', 'Self-care, then a local health worker, then a remote clinician: the same ladder as Self → CMO → Ground.'],
          ['Explainable', 'Every alert shows its threshold and source, so a non-specialist can trust and act on it.'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-rule p-5">
            <h3 className="font-semibold text-star">{t}</h3>
            <p className="mt-1.5 text-sm text-dust">{d}</p>
          </div>
        ))}
      </section>

      <p className="text-xs text-faint">
        Sources:{' '}
        <a href={csa.url} target="_blank" rel="noreferrer" className="text-limb hover:underline">
          {csa.org}, {csa.title}
        </a>{' '}
        ·{' '}
        <a href={nasa.url} target="_blank" rel="noreferrer" className="text-limb hover:underline">
          {nasa.org}, {nasa.title}
        </a>
        . AetherHealth is a demonstration, not a certified medical device.
      </p>
    </div>
  );
}

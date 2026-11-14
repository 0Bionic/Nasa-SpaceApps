import { GUIDANCE_LIBRARY } from '@/domain/countermeasures';
import { HAZARD_LIST } from '@/domain/hazards';
import { INDICATOR_LIST } from '@/domain/indicators';
import { downloadGroundPacket } from '@/data/exportPacket';

const TIER_LABEL: Record<number, string> = {
  1: 'Self-care',
  2: 'Crew Medical Officer',
  3: 'Ground escalation',
};

export function GuidancePage() {
  return (
    <div className="animate-fade-up space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">Guidance library</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">
            Plain-language countermeasures mapped to the five hazards of human spaceflight. Do not assume prior medical expertise — follow Tier 1 first, escalate when severity rises.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => downloadGroundPacket()}>
          Export ground packet
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDANCE_LIBRARY.map((action) => (
          <article key={action.id} className="panel p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-teal-glow/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-soft">
                Tier {action.tier} · {TIER_LABEL[action.tier]}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500">
                {action.category}
              </span>
            </div>
            <h2 className="font-semibold text-slate-100">{action.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{action.description}</p>
          </article>
        ))}
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg text-white">Why exams are needed</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {INDICATOR_LIST.map((ind) => (
            <article key={ind.id} className="panel p-4">
              <h3 className="font-semibold text-teal-soft">
                {ind.label}{' '}
                <span className="text-xs font-normal text-slate-500">({ind.unit})</span>
              </h3>
              <p className="mt-1 text-sm text-slate-300">{ind.whyNeeded}</p>
              <p className="mt-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">How: </span>
                {ind.howToMeasure}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display mb-3 text-lg text-white">Five hazards primer</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {HAZARD_LIST.map((h) => (
            <article key={h.id} className="panel p-4">
              <h3 className="font-display text-sm tracking-wide text-teal-glow">{h.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{h.description}</p>
              <p className="mt-2 text-xs text-slate-500">{h.clinicalImpact}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import { useState } from 'react';
import { GUIDANCE_LIBRARY } from '@/domain/countermeasures';
import { HAZARD_LIST } from '@/domain/hazards';
import { INDICATOR_LIST } from '@/domain/indicators';
import { BASIS_LABEL, EVIDENCE, NASA_RISKS, SOURCE_LIST, indicatorsForRisk, type RiskGroup } from '@/domain/evidence';
import { INDICATORS } from '@/domain/indicators';
import { bandRangeText } from '@/domain/triage/engine';
import { downloadGroundPacket } from '@/data/exportPacket';
import { MedicalDisclaimer } from '@/components/Disclaimer';
import { useTerm } from '@/app/audience';
import { IconChevron, IconExport } from '@/components/Icons';

export function GuidancePage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const term = useTerm();
  const TIERS = [
    { tier: 1, name: 'Self', when: 'First response for caution / warning readings.' },
    { tier: 2, name: term('tier2'), when: term('tier2When') },
    { tier: 3, name: term('tier3'), when: term('tier3When') },
  ] as const;

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page">Guidance</h1>
          <p className="lede mt-2">
            Tier 1 self-care, Tier 2 {term('tier2')}, Tier 3 {term('tier3').toLowerCase()}. Escalate when a reading stays out of range.
          </p>
        </div>
        <button type="button" className="btn-quiet" onClick={() => downloadGroundPacket()}>
          <IconExport width={16} height={16} />
          {term('exportPacket')}
        </button>
      </header>

      <MedicalDisclaimer />

      <section aria-labelledby="ladder">
        <h2 id="ladder" className="h-section">
          Escalation ladder
        </h2>
        <ol className="mt-4 grid items-start gap-4 lg:grid-cols-3">
          {TIERS.map(({ tier, name, when }) => {
            const items = GUIDANCE_LIBRARY.filter((a) => a.tier === tier);
            return (
              <li key={tier} className="surface flex flex-col">
                <div className="flex items-start gap-3 border-b border-rule px-4 py-4">
                  <span
                    className={`readout flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                      tier === 3 ? 'border-nasa-red/60 text-alert' : 'border-rule-strong text-star'
                    }`}
                  >
                    {tier}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-star">{name}</h3>
                    <p className="mt-0.5 text-xs leading-snug text-dust">{when}</p>
                  </div>
                </div>
                <ul className="divide-y divide-rule">
                  {items.map((a) => (
                    <li key={a.id} className="px-4 py-3">
                      <p className="text-sm font-semibold text-star">{a.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-dust">{a.description}</p>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </section>

      <section aria-labelledby="why" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <h2 id="why" className="h-section">
            Why each reading matters
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-dust">
            Every reading is tied to a spaceflight risk. Open one to see why it is measured and how to take
            it without special training.
          </p>
        </div>
        <ul className="divide-y divide-rule border-y border-rule">
          {INDICATOR_LIST.map((ind) => {
            const open = openId === ind.id;
            return (
              <li key={ind.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : ind.id)}
                  className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                >
                  <span className="text-lg font-medium text-star">
                    {ind.label}
                    <span className="ml-2 text-xs font-normal text-faint">{ind.unit}</span>
                  </span>
                  <IconChevron
                    width={16}
                    height={16}
                    className={`text-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                  />
                </button>
                {open && (
                  <div className="grid gap-3 pb-4 sm:grid-cols-2">
                    <p className="text-sm text-dust">{ind.whyNeeded}</p>
                    <p className="text-sm text-dust">
                      <span className="font-medium text-star">How to measure. </span>
                      {ind.howToMeasure}
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="hazards">
        <h2 id="hazards" className="h-section">
          The five hazards of human spaceflight
        </h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded border border-rule bg-rule md:grid-cols-2 xl:grid-cols-5">
          {HAZARD_LIST.map((h) => (
            <article key={h.id} className="bg-hull p-4">
              <h3 className="text-sm font-semibold text-star">{h.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dust">{h.description}</p>
              <p className="mt-3 border-t border-rule pt-3 text-xs leading-relaxed text-faint">
                {h.clinicalImpact}
              </p>
            </article>
          ))}
        </div>
      </section>

      <RiskCoverage />

      <SourcesAndMethod />
    </div>
  );
}

/** Every threshold, its evidence level, the NASA risk it monitors, and the sources behind it. */
function SourcesAndMethod() {
  return (
    <section aria-labelledby="sources" className="space-y-6">
      <div>
        <h2 id="sources" className="h-section">
          Sources & method
        </h2>
        <p className="lede mt-2">
          Each threshold is labelled by how strong its basis is: a clinical guideline, measured spaceflight data, or an app
          heuristic that still needs expert review. AetherHealth is a decision aid, not a diagnosis.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-rule">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-rule text-xs text-dust">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Indicator</th>
              <th scope="col" className="px-4 py-3 font-medium">Nominal range</th>
              <th scope="col" className="px-4 py-3 font-medium">Basis</th>
              <th scope="col" className="px-4 py-3 font-medium">NASA HRP risk monitored</th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_LIST.map((ind) => {
              const ev = EVIDENCE[ind.id];
              const green = ind.bands.find((b) => b.severity === 'green');
              return (
                <tr key={ind.id} className="border-b border-rule last:border-0 align-top">
                  <th scope="row" className="px-4 py-3 font-medium text-star">{ind.label}</th>
                  <td className="px-4 py-3 font-mono text-xs text-dust">{green ? bandRangeText(ind.id, green) : '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-xs ${
                        ev.basis === 'heuristic' ? 'border-sev-amber/50 text-sev-amber' : 'border-limb/50 text-limb'
                      }`}
                    >
                      {BASIS_LABEL[ev.basis]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-dust">{ev.risks.length ? ev.risks.join(' · ') : 'Hostile/Closed Environments hazard'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <h3 className="text-sm font-semibold text-star">References</h3>
          <ol className="mt-3 space-y-3 text-sm">
            {SOURCE_LIST.map((s, i) => (
              <li key={s.id} className="flex gap-3">
                <span className="font-mono text-xs text-faint">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="text-dust">{s.org}. </span>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-limb hover:underline">
                      {s.title}
                    </a>
                  ) : (
                    <span className="font-medium text-star">{s.title}</span>
                  )}
                  <span className="block text-xs text-faint">{s.note}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="surface h-fit p-5 text-sm">
          <h3 className="font-semibold text-star">Limits of this tool</h3>
          <ul className="mt-3 list-disc space-y-2 pl-4 text-dust">
            <li>Thresholds are for adults at rest and are not personalised to an astronaut’s own baseline.</li>
            <li>Mood, stress and fatigue use simple 1–10 self-reports, not validated clinical instruments.</li>
            <li>Mission radiation is estimated from logged daily doses, not read from a dosimeter.</li>
            <li>App heuristics (marked in amber) need flight-surgeon review before operational use.</li>
            <li>Readings are rounded to the precision they are recorded at, so every value lands in exactly one band.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Every NASA HRP risk and what in AetherHealth watches it, including honest gaps. */
function RiskCoverage() {
  const rows = NASA_RISKS.map((r) => {
    const inds = indicatorsForRisk(r.name);
    const covered = inds.length > 0 || (r.flags?.length ?? 0) > 0;
    return { ...r, inds, covered };
  });
  const covered = rows.filter((r) => r.covered).length;
  const groups: RiskGroup[] = ['Human physiology', 'Behavioral performance', 'Space radiation'];
  return (
    <section aria-labelledby="coverage" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="coverage" className="h-section">
            NASA risk coverage
          </h2>
          <p className="lede mt-2">
            The {NASA_RISKS.length} health risks NASA&rsquo;s Human Research Program tracks, and which readings watch each one.
          </p>
        </div>
        <p className="font-display text-2xl font-medium">
          {covered}
          <span className="text-base text-dust"> / {NASA_RISKS.length} monitored</span>
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((g) => (
          <div key={g} className="surface p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-dust">{g}</h3>
            <ul className="mt-3 space-y-3">
              {rows
                .filter((r) => r.group === g)
                .map((r) => (
                  <li key={r.name} className="text-sm">
                    <p className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.covered ? 'bg-sev-green' : 'bg-faint'}`}
                      />
                      <span className="font-medium text-star">{r.name.replace(/^Risk of /, '')}</span>
                      <span className="sr-only">{r.covered ? ' — monitored' : ' — not monitored'}</span>
                    </p>
                    <p className="ml-4 mt-0.5 text-xs text-dust">
                      {r.covered
                        ? [...r.inds.map((id) => INDICATORS[id].label), ...(r.flags ?? []).map((f) => `“${f}” flag`)].join(' · ')
                        : r.gap}
                    </p>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-faint">
        Source: NASA HRP, Risks of Human Spaceflight. Grey risks need data a self check-in cannot provide (suit, vehicle or microbial
        sensors); they are listed so the gap is visible.
      </p>
    </section>
  );
}

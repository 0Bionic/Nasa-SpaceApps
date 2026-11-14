import { useState } from 'react';
import { GUIDANCE_LIBRARY } from '@/domain/countermeasures';
import { HAZARD_LIST } from '@/domain/hazards';
import { INDICATOR_LIST } from '@/domain/indicators';
import { downloadGroundPacket } from '@/data/exportPacket';
import { IconChevron, IconExport } from '@/components/Icons';

const TIERS = [
  { tier: 1, name: 'Do it yourself', when: 'Start here for any caution or warning reading.' },
  { tier: 2, name: 'With the crew medical officer', when: 'When a reading stays out of range or gets worse.' },
  { tier: 3, name: 'Escalate to ground', when: 'For critical readings. Send a packet at the next comm window.' },
] as const;

export function GuidancePage() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page">Guidance</h1>
          <p className="lede mt-2">
            What to do, in plain language. Work up the ladder: try the first step yourself, and escalate
            only when a reading stays out of range.
          </p>
        </div>
        <button type="button" className="btn-quiet" onClick={() => downloadGroundPacket()}>
          <IconExport width={16} height={16} />
          Export ground packet
        </button>
      </header>

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
                      tier === 3 ? 'border-sev-red/60 text-[#FFB3B5]' : 'border-rule-strong text-star'
                    }`}
                  >
                    {tier}
                  </span>
                  <div>
                    <h3 className="text-[0.9375rem] font-semibold text-star">{name}</h3>
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
                  <span className="text-[0.9375rem] font-medium text-star">
                    {ind.label}
                    <span className="ml-2 text-xs font-normal text-faint">{ind.unit}</span>
                  </span>
                  <IconChevron
                    width={16}
                    height={16}
                    className={`text-faint transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
                  />
                </button>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${
                    open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-3 pb-4 sm:grid-cols-2">
                      <p className="text-sm leading-relaxed text-dust">{ind.whyNeeded}</p>
                      <p className="text-sm leading-relaxed text-dust">
                        <span className="font-semibold text-star">How to measure. </span>
                        {ind.howToMeasure}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="hazards">
        <h2 id="hazards" className="h-section">
          The five hazards of human spaceflight
        </h2>
        <div className="mt-4 grid gap-px overflow-hidden rounded-[10px] border border-rule bg-rule md:grid-cols-2 xl:grid-cols-5">
          {HAZARD_LIST.map((h) => (
            <article key={h.id} className="bg-hull p-4">
              <h3 className="w-wide text-[0.9375rem] font-semibold text-star">{h.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dust">{h.description}</p>
              <p className="mt-3 border-t border-rule pt-3 text-xs leading-relaxed text-faint">
                {h.clinicalImpact}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

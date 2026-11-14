import { useEffect, useRef } from 'react';
import { updateProfile } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';
import { BrandMark } from '@/app/Layout';

const STEPS = [
  { title: 'Check in each day', body: 'Log your vitals, or fill them from your wearable sensors.' },
  { title: 'Read the body map', body: 'Each region shows its status. Select one to see the readings behind it.' },
  { title: 'Act on what you see', body: 'Follow the steps for each reading. Send a packet to the ground when one turns critical.' },
];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const refresh = useAppStore((s) => s.refresh);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const finish = async () => {
    await updateProfile({ onboarded: true });
    await refresh();
    onDone();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#050A14]/80 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <div className="animate-rise w-full max-w-[520px] overflow-hidden rounded-xl border border-rule-strong bg-hull shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* Earth limb: the horizon you are leaving behind */}
        <div className="relative h-28 overflow-hidden bg-void" aria-hidden="true">
          <div
            className="absolute left-1/2 top-[52px] h-[900px] w-[900px] -translate-x-1/2 rounded-full"
            style={{
              background: 'radial-gradient(circle at 50% 0%, #12305C 0%, #0A1322 22%)',
              boxShadow: '0 -2px 0 0 #7FB2FF, 0 -10px 40px 0 rgba(127,178,255,0.35)',
            }}
          />
          <div className="absolute left-5 top-5">
            <BrandMark size={30} />
          </div>
        </div>
        <div className="p-6 sm:p-7">
          <h2 id="onb-title" className="w-wide text-2xl font-semibold leading-tight text-star">
            Your health, checked on board
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-dust">
            Far from Earth, help can be minutes away. AetherHealth turns your daily readings into a clear
            status and tells you what to do next, with no connection needed.
          </p>
          <ol className="mt-6 space-y-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="readout flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-rule-strong text-xs text-star">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-star">{s.title}</span>
                  <span className="block text-sm text-dust">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
          <button ref={buttonRef} type="button" className="btn-primary mt-7 w-full" onClick={finish}>
            Open my status
          </button>
        </div>
      </div>
    </div>
  );
}

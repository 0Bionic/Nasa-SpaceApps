import { useEffect, useRef } from 'react';
import { updateProfile } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';

const STEPS = [
  {
    title: 'Daily check-in',
    body: 'Enter vitals, sleep, mood, stress, cabin CO₂, radiation, and any body discomfort.',
  },
  {
    title: 'Review status',
    body: 'The body map and colour codes show which readings need attention.',
  },
  {
    title: 'Follow guidance',
    body: 'Use the tiered actions offline. Escalate amber/red findings to your CMO or ground.',
  },
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
    >
      <div className="w-full max-w-md border border-rule-strong bg-hull p-5 sm:p-6">
        <h2 id="onb-title" className="text-xl font-semibold text-star">
          AetherHealth
        </h2>
        <p className="mt-2 text-sm text-dust">
          On-device health logging for delayed-comms missions. Decision support only — not a diagnosis.
        </p>
        <ol className="mt-5 space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-3 text-sm">
              <span className="readout w-5 shrink-0 text-faint">{i + 1}.</span>
              <span>
                <span className="font-medium text-star">{s.title}</span>
                <span className="mt-0.5 block text-dust">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
        <button ref={buttonRef} type="button" className="btn-primary mt-6 w-full" onClick={finish}>
          Continue
        </button>
      </div>
    </div>
  );
}

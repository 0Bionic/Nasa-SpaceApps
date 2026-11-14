import { updateProfile } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const refresh = useAppStore((s) => s.refresh);

  const finish = async () => {
    await updateProfile({ onboarded: true });
    await refresh();
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-space-950/90 p-4 backdrop-blur-md">
      <div className="panel animate-fade-up max-w-lg p-8 shadow-glow">
        <p className="font-display text-3xl tracking-[0.1em] text-teal-glow">AetherHealth</p>
        <p className="mt-3 text-slate-300">
          Long-duration crews must assess their own health when Earth is minutes — or hours — away.
          AetherHealth gathers indicators, color-codes risk, explains spaceflight hazards, and guides
          Tier 1–3 actions offline.
        </p>
        <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-slate-400">
          <li>Complete a daily check-in (or sync mock sensors).</li>
          <li>Inspect the body map — tap regions for localized status.</li>
          <li>Follow guidance; export a ground packet when severity is high.</li>
        </ol>
        <button type="button" className="btn-primary mt-6 w-full" onClick={finish}>
          Begin mission health watch
        </button>
      </div>
    </div>
  );
}

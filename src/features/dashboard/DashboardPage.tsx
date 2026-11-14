import { Link } from 'react-router-dom';
import { triageCheckIn } from '@/domain/triage/engine';
import { useAppStore } from '@/store/useAppStore';
import { BodyMap } from '@/features/bodymap/BodyMap';
import { RegionDetail } from '@/features/bodymap/RegionDetail';
import { AlertCard } from '@/components/AlertCard';
import { SeverityBadge } from '@/components/SeverityBadge';
import { downloadGroundPacket } from '@/data/exportPacket';

export function DashboardPage() {
  const latest = useAppStore((s) => s.latest);
  const profile = useAppStore((s) => s.profile);
  const selected = useAppStore((s) => s.selectedRegion);
  const setSelected = useAppStore((s) => s.setSelectedRegion);
  const criticalDismissed = useAppStore((s) => s.criticalBannerDismissed);
  const dismissCritical = useAppStore((s) => s.dismissCritical);

  const alerts = latest
    ? triageCheckIn(latest).filter((r) => r.severity !== 'green')
    : [];

  return (
    <div className="space-y-6 animate-fade-up">
      {latest?.overallSeverity === 'red' && !criticalDismissed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-status-red/50 bg-status-red/15 px-4 py-3 animate-pulse-critical">
          <div>
            <p className="font-display text-sm tracking-wide text-status-red">
              Critical health threshold breached
            </p>
            <p className="text-sm text-slate-200">
              Review Tier 2–3 actions and prepare a ground surgeon packet.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={() => downloadGroundPacket()}>
              Export ground packet
            </button>
            <button type="button" className="btn-ghost" onClick={dismissCritical}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white sm:text-3xl">
            Mission health status
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Color-coded body map tied to NASA HRP hazards — assess, understand, and act without waiting on Earth.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/checkin" className="btn-primary">
            New check-in
          </Link>
          <Link to="/routines" className="btn-ghost">
            Routines
          </Link>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <BodyMap checkIn={latest} selected={selected} onSelect={setSelected} />
        </div>
        <div className="lg:col-span-2">
          {selected ? (
            <RegionDetail
              regionId={selected}
              checkIn={latest}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="panel h-full space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-white">Latest triage</h2>
                {latest && <SeverityBadge severity={latest.overallSeverity} />}
              </div>
              {!latest && (
                <p className="text-sm text-slate-400">No check-ins yet. Start a daily check-in.</p>
              )}
              {latest && (
                <>
                  <p className="text-xs text-slate-500">
                    {new Date(latest.timestamp).toLocaleString()} · {profile?.name}
                  </p>
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {alerts.length === 0 ? (
                      <p className="text-sm text-status-green">
                        All indicators in green band. Maintain routines and exercise countermeasures.
                      </p>
                    ) : (
                      alerts.map((a) => <AlertCard key={a.indicatorId} result={a} />)
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

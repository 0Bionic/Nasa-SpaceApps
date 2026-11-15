import { useEffect } from 'react';
import { summarizeSpaceWeather, useSpaceWeather } from '@/data/spaceWeather';
import { NIcon } from './neon';

function ago(t: number) {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** Live NASA DONKI space weather, cached for offline use. */
export function SpaceWeatherCard() {
  const { data, status, error, refresh } = useSpaceWeather();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const s = data ? summarizeSpaceWeather(data) : null;

  return (
    <section aria-labelledby="space-weather" className="n-card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <NIcon name="signal" className="text-n-neon" />
        <h2 id="space-weather" className="text-lg font-medium">
          Space weather
        </h2>
        <span className="n-pill">NASA DONKI · live</span>
        <span className="ml-auto text-xs text-n-muted">
          {data ? `Last synced ${ago(data.syncedAt)}` : status === 'loading' ? 'Syncing…' : 'Not synced yet'}
        </span>
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={status === 'loading'}
          className="rounded-lg border border-n-line px-2.5 py-1 text-xs hover:border-n-neon/60 disabled:opacity-50"
        >
          {status === 'loading' ? 'Syncing…' : 'Sync now'}
        </button>
      </div>

      {s ? (
        <>
          {s.alert && (
            <p role="status" className="rounded-[10px] border border-n-amber/50 bg-n-amber/10 px-3 py-2 text-sm">
              <span className="font-medium">
                {s.alert === 'sep' ? 'Solar energetic particle event in the last 3 days. ' : 'X-class flare in the last 3 days. '}
              </span>
              Confirm the storm-shelter plan, limit EVA, and log any dose increase.
            </p>
          )}
          <dl className="grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-n-muted">Solar flares, last {data!.rangeDays} days</dt>
              <dd className="font-display text-2xl font-medium">{s.flareCount}</dd>
            </div>
            <div>
              <dt className="text-xs text-n-muted">Strongest flare</dt>
              <dd className="font-display text-2xl font-medium">
                {s.strongest ? s.strongest.classType : '—'}
                {s.strongest && <span className="ml-2 text-xs font-normal text-n-muted">{day(s.strongest.peakTime)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-n-muted">Particle events (SEP)</dt>
              <dd className="font-display text-2xl font-medium">
                {s.sepCount}
                {s.latestSep && <span className="ml-2 text-xs font-normal text-n-muted">latest {day(s.latestSep.eventTime)}</span>}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-n-muted">
          {status === 'loading' ? 'Contacting NASA DONKI…' : 'Connect once to download the latest solar flares and particle events; they stay available offline.'}
        </p>
      )}

      {status === 'error' && <p className="text-xs text-n-muted">{error}</p>}
      <p className="text-xs leading-relaxed text-n-muted">
        Solar particle events can raise crew dose sharply (NASA limit: 250 mSv per event); flares often come first. Source: NASA
        CCMC DONKI via api.nasa.gov. Space weather is measured near Earth and in the heliosphere, so treat it as an early warning,
        not your habitat&rsquo;s dose.
      </p>
    </section>
  );
}

import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { INDICATORS } from '@/domain/indicators';
import { overallSeverity, severityFor, triageCheckIn } from '@/domain/triage/engine';
import type { CheckInInput, HealthIndicatorId, SymptomFlags } from '@/domain/types';
import { mockSensorSync, saveCheckIn } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';
import { BandScale } from '@/components/BandScale';
import { SeverityGlyph } from '@/components/SeverityBadge';
import { IconCheck, IconSensor } from '@/components/Icons';
import { INDICATOR_FIELD, SEVERITY_COLOR, SEVERITY_LABEL } from '@/components/vitals';

const defaults: CheckInInput = {
  hr: 72,
  bpSys: 118,
  bpDia: 76,
  spo2: 98,
  temp: 36.6,
  glucose: 100,
  sleepH: 7,
  mood: 7,
  exerciseMin: 45,
  notes: '',
  symptoms: { sansVisualChanges: false, rash: false, orthostaticDizziness: false },
};

const GROUPS: { title: string; note: string; ids: HealthIndicatorId[] }[] = [
  {
    title: 'Vitals',
    note: 'Measure seated, after a few minutes of rest.',
    ids: ['hr', 'bp_sys', 'bp_dia', 'spo2', 'temp', 'glucose'],
  },
  {
    title: 'Recovery',
    note: 'Since your last check-in.',
    ids: ['sleep_h', 'mood', 'exercise_min'],
  },
];

const STEP: Partial<Record<HealthIndicatorId, number>> = { temp: 0.1, sleep_h: 0.1 };
const LIMITS: Partial<Record<HealthIndicatorId, [number, number]>> = { mood: [1, 10], spo2: [50, 100] };

const SYMPTOMS: { key: keyof SymptomFlags; label: string; hint: string }[] = [
  { key: 'sansVisualChanges', label: 'Changes in vision', hint: 'Blurring, a shadow, or trouble focusing near' },
  { key: 'rash', label: 'Skin rash', hint: 'New redness, itching, or irritation' },
  { key: 'orthostaticDizziness', label: 'Dizzy on standing', hint: 'Light-headed when you change posture' },
];

export function CheckInPage() {
  const [form, setForm] = useState<CheckInInput>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [synced, setSynced] = useState(false);
  const refresh = useAppStore((s) => s.refresh);
  const navigate = useNavigate();

  const preview = useMemo(() => overallSeverity(triageCheckIn(form)), [form]);

  const setNum = (id: HealthIndicatorId, value: number) => {
    setForm((f) => ({ ...f, [INDICATOR_FIELD[id]]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await saveCheckIn(form);
      await refresh();
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error
          ? `Check-in not saved: ${err.message}. Your entries are still here; try again.`
          : 'Check-in not saved. Your entries are still here; try again.',
      );
      setSaving(false);
    }
  };

  const syncSensors = () => {
    setForm(mockSensorSync());
    setSynced(true);
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[880px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-page">Daily check-in</h1>
          <p className="lede mt-2">
            Each scale shows the safe band. The marker moves as you type, so you can see where a
            reading lands before you save.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-quiet" onClick={syncSensors}>
            <IconSensor width={16} height={16} />
            Fill from sensors
          </button>
          <button
            type="button"
            className="btn text-dust hover:text-star"
            onClick={() => {
              setForm(defaults);
              setSynced(false);
            }}
          >
            Reset
          </button>
        </div>
      </header>

      {synced && (
        <p className="mt-4 animate-rise text-sm text-dust" role="status">
          Filled from the simulated wearable. Check each value before saving.
        </p>
      )}

      {GROUPS.map((group) => (
        <fieldset key={group.title} className="mt-8">
          <legend className="flex w-full items-baseline justify-between">
            <span className="h-section">{group.title}</span>
          </legend>
          <p className="mt-0.5 text-sm text-faint">{group.note}</p>
          <div className="mt-3 divide-y divide-rule overflow-hidden rounded-[10px] border border-rule bg-hull">
            {group.ids.map((id) => (
              <InstrumentRow
                key={id}
                id={id}
                value={form[INDICATOR_FIELD[id]] as number}
                onChange={(v) => setNum(id, v)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <fieldset className="mt-8">
        <legend className="h-section">Anything else today?</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {SYMPTOMS.map(({ key, label, hint }) => {
            const on = !!form.symptoms?.[key];
            return (
              <label
                key={key}
                className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-3 transition-colors ${
                  on ? 'border-sev-amber/60 bg-sev-amber/10' : 'border-rule bg-hull hover:border-rule-strong'
                }`}
              >
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, symptoms: { ...f.symptoms, [key]: e.target.checked } }))
                  }
                />
                <span
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-limb ${
                    on ? 'border-sev-amber bg-sev-amber text-void' : 'border-rule-strong'
                  }`}
                  aria-hidden="true"
                >
                  {on && <IconCheck width={14} height={14} strokeWidth={2.2} />}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-star">{label}</span>
                  <span className="block text-xs text-dust">{hint}</span>
                </span>
              </label>
            );
          })}
        </div>

        <label className="field-label mt-5" htmlFor="notes">
          Notes for the flight surgeon
        </label>
        <textarea
          id="notes"
          className="field min-h-[96px] resize-y"
          placeholder="What you noticed: when it started, what makes it better or worse."
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
      </fieldset>

      {error && (
        <p className="mt-4 rounded-md border border-sev-red/40 bg-sev-red/10 px-3 py-2 text-sm text-[#FFB3B5]" role="alert">
          {error}
        </p>
      )}

      {/* Save bar with live status preview */}
      <div className="sticky bottom-[76px] z-20 mt-8 lg:bottom-4">
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-rule-strong bg-deck/95 px-4 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur">
          <p className="flex min-w-0 items-center gap-2 text-sm leading-snug text-dust" aria-live="polite">
            <SeverityGlyph severity={preview} size={10} />
            <span className="first-letter:uppercase">
              <span className="hidden sm:inline">This check-in </span>will read{' '}
              <span className="font-semibold" style={{ color: SEVERITY_COLOR[preview] }}>
                {SEVERITY_LABEL[preview].toLowerCase()}
              </span>
            </span>
          </p>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving check-in…' : 'Save check-in'}
          </button>
        </div>
      </div>
    </form>
  );
}

function InstrumentRow({
  id,
  value,
  onChange,
}: {
  id: HealthIndicatorId;
  value: number;
  onChange: (v: number) => void;
}) {
  const def = INDICATORS[id];
  const valid = Number.isFinite(value);
  const sev = valid ? severityFor(id, value) : 'green';
  const inputId = `in-${id}`;
  const hintId = `hint-${id}`;
  const [min, max] = LIMITS[id] ?? [0, 999];

  return (
    <div className="grid gap-x-6 gap-y-2 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_132px_minmax(0,1.1fr)] sm:items-center">
      <div>
        <label htmlFor={inputId} className="text-sm font-semibold text-star">
          {def.label}
        </label>
        <p id={hintId} className="mt-0.5 text-xs leading-snug text-faint">
          {def.howToMeasure}
        </p>
      </div>

      <div className="relative">
        <input
          id={inputId}
          aria-describedby={hintId}
          className="field readout pr-14 text-right text-lg"
          type="number"
          inputMode="decimal"
          step={STEP[id] ?? 1}
          min={min}
          max={max}
          value={valid ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))}
          required
          style={{ color: sev === 'green' ? undefined : SEVERITY_COLOR[sev] }}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint">
          {def.unit}
        </span>
      </div>

      <div>
        <BandScale id={id} value={valid ? value : null} severity={sev} height={6} />
        <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: sev === 'green' ? '#8D9DB5' : SEVERITY_COLOR[sev] }}>
          <SeverityGlyph severity={sev} size={8} />
          {SEVERITY_LABEL[sev]}
        </p>
      </div>
    </div>
  );
}

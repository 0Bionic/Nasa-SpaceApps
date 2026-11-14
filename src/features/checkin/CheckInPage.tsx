import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { INDICATORS } from '@/domain/indicators';
import type { CheckInInput } from '@/domain/types';
import { mockSensorSync, saveCheckIn } from '@/data/repositories';
import { useAppStore } from '@/store/useAppStore';

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
  symptoms: {
    sansVisualChanges: false,
    rash: false,
    orthostaticDizziness: false,
  },
};

export function CheckInPage() {
  const [form, setForm] = useState<CheckInInput>(defaults);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const refresh = useAppStore((s) => s.refresh);
  const navigate = useNavigate();

  const setNum = (key: keyof CheckInInput, value: number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await saveCheckIn(form);
      await refresh();
      setMessage('Check-in saved. Triage updated.');
      navigate('/');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-white">Daily check-in</h1>
        <p className="mt-1 text-sm text-slate-400">
          Enter vitals manually or sync mock wearables. Every field includes why it matters in spaceflight.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setForm(mockSensorSync())}
        >
          Sync mock sensors
        </button>
        <button type="button" className="btn-ghost" onClick={() => setForm(defaults)}>
          Reset defaults
        </button>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={INDICATORS.hr.label}
            unit={INDICATORS.hr.unit}
            hint={INDICATORS.hr.howToMeasure}
            value={form.hr}
            onChange={(v) => setNum('hr', v)}
          />
          <Field
            label={INDICATORS.bp_sys.label}
            unit={INDICATORS.bp_sys.unit}
            hint={INDICATORS.bp_sys.howToMeasure}
            value={form.bpSys}
            onChange={(v) => setNum('bpSys', v)}
          />
          <Field
            label={INDICATORS.bp_dia.label}
            unit={INDICATORS.bp_dia.unit}
            hint={INDICATORS.bp_dia.howToMeasure}
            value={form.bpDia}
            onChange={(v) => setNum('bpDia', v)}
          />
          <Field
            label={INDICATORS.spo2.label}
            unit={INDICATORS.spo2.unit}
            hint={INDICATORS.spo2.howToMeasure}
            value={form.spo2}
            onChange={(v) => setNum('spo2', v)}
            step={1}
          />
          <Field
            label={INDICATORS.temp.label}
            unit={INDICATORS.temp.unit}
            hint={INDICATORS.temp.howToMeasure}
            value={form.temp}
            onChange={(v) => setNum('temp', v)}
            step={0.1}
          />
          <Field
            label={INDICATORS.glucose.label}
            unit={INDICATORS.glucose.unit}
            hint={INDICATORS.glucose.howToMeasure}
            value={form.glucose}
            onChange={(v) => setNum('glucose', v)}
          />
          <Field
            label={INDICATORS.sleep_h.label}
            unit={INDICATORS.sleep_h.unit}
            hint={INDICATORS.sleep_h.howToMeasure}
            value={form.sleepH}
            onChange={(v) => setNum('sleepH', v)}
            step={0.1}
          />
          <Field
            label={INDICATORS.mood.label}
            unit={INDICATORS.mood.unit}
            hint={INDICATORS.mood.howToMeasure}
            value={form.mood}
            onChange={(v) => setNum('mood', v)}
            min={1}
            max={10}
          />
          <Field
            label={INDICATORS.exercise_min.label}
            unit={INDICATORS.exercise_min.unit}
            hint={INDICATORS.exercise_min.howToMeasure}
            value={form.exerciseMin}
            onChange={(v) => setNum('exerciseMin', v)}
          />
        </div>

        <div>
          <label className="label">Symptom flags</label>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            {(
              [
                ['sansVisualChanges', 'SANS / visual changes'],
                ['rash', 'Skin rash'],
                ['orthostaticDizziness', 'Orthostatic dizziness'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!form.symptoms?.[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      symptoms: { ...f.symptoms, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="notes">
            Notes / camera observation
          </label>
          <textarea
            id="notes"
            className="input-field min-h-[88px]"
            placeholder="Optional: describe rash photo, ultrasound note, or mood context…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <p className="mt-1 text-xs text-slate-500">
            Camera capture stub: attach observations as text notes for this MVP demo.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save & triage'}
          </button>
          {message && <p className="text-sm text-teal-soft">{message}</p>}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  unit,
  hint,
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  label: string;
  unit: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="label">
        {label} <span className="normal-case tracking-normal text-slate-500">({unit})</span>
      </label>
      <input
        className="input-field"
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        required
      />
      <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p>
    </div>
  );
}

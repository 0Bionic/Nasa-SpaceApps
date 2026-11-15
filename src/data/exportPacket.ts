import { triageCheckIn } from '@/domain/triage/engine';
import type { CheckInRecord, CrewProfile } from '@/domain/types';
import { encryptText } from './crypto';
import { getActiveProfile, listCheckIns } from './repositories';
import { useUplinks } from './uplink';
import { markDownlinked, pendingDownlink } from './monitorRepo';
import { downsample, type MonitorSession } from '@/domain/monitoring';

/** FHIR-lite / demo ground packet for flight surgeons */
export async function buildGroundPacket() {
  const profile: CrewProfile = await getActiveProfile();
  const checkIns = await listCheckIns(14);
  const latest = checkIns[0];

  const observations = checkIns.flatMap((c) => vitalsToObservations(c));
  const sessions = await pendingDownlink();

  const bundle = {
    resourceType: 'Bundle',
    type: 'collection',
    timestamp: new Date().toISOString(),
    meta: {
      tag: [{ system: 'aetherhealth', code: 'ground-packet', display: 'Flight surgeon uplink' }],
    },
    entry: [
      {
        resource: {
          resourceType: 'Patient',
          id: profile.id,
          name: [{ text: profile.name }],
          extension: [
            { url: 'missionDay', valueInteger: profile.missionDay },
            { url: 'environment', valueString: profile.environment },
            { url: 'role', valueString: profile.role },
          ],
        },
      },
      ...observations.map((o) => ({ resource: o })),
      ...sessions.map((m) => ({ resource: sessionToObservation(m) })),
      latest
        ? {
            resource: {
              resourceType: 'Flag',
              id: `flag-${latest.id}`,
              status: 'active',
              code: { text: `Overall severity: ${latest.overallSeverity}` },
              subject: { reference: `Patient/${profile.id}` },
              extension: [
                {
                  url: 'triage',
                  valueString: JSON.stringify(
                    triageCheckIn(latest).map((t) => ({
                      indicator: t.indicatorId,
                      severity: t.severity,
                      summary: t.summary,
                    })),
                  ),
                },
                {
                  url: 'symptoms',
                  valueString: JSON.stringify(latest.symptoms ?? {}),
                },
                {
                  url: 'regionDiscomfort',
                  valueString: JSON.stringify(latest.regionDiscomfort ?? {}),
                },
                latest.photoDataUrl
                  ? {
                      url: 'clinicalPhotoAttached',
                      valueBoolean: true,
                    }
                  : null,
              ].filter(Boolean),
            },
          }
        : null,
    ].filter(Boolean),
  };

  const sealedNotes = latest?.notes
    ? await encryptText(latest.notes)
    : '';

  return {
    ...bundle,
    aetherMeta: {
      encryption: 'Notes field sealed with AES-GCM using a demo passphrase (not production key management)',
      sealedNotes,
    },
  };
}

/**
 * A recorded monitoring session (EVA, exercise or 24 h), sent once and then marked
 * downlinked: the store-and-forward model CSA Bio-Monitor uses. Samples are thinned
 * to one per minute-equivalent to keep the packet small.
 */
function sessionToObservation(m: MonitorSession) {
  return {
    resourceType: 'Observation',
    id: m.id,
    status: 'final',
    code: { text: `continuous-monitoring-${m.mode}` },
    effectivePeriod: { start: m.startedAt, end: m.endedAt },
    subject: { reference: `Patient/${m.profileId}` },
    extension: [
      { url: 'durationSeconds', valueInteger: m.durationS },
      { url: 'worstSeverity', valueString: m.worstSeverity },
      { url: 'stats', valueString: JSON.stringify(m.stats) },
      { url: 'events', valueString: JSON.stringify(m.events) },
      {
        url: 'samples',
        valueString: JSON.stringify(
          downsample(m.samples, 240).map((s) => [s.t, s.hr, s.spo2, s.quality, s.activity]),
        ),
      },
    ],
  };
}

function vitalsToObservations(c: CheckInRecord) {
  const pairs: [string, number, string][] = [
    ['heart-rate', c.hr, '/min'],
    ['systolic-bp', c.bpSys, 'mm[Hg]'],
    ['diastolic-bp', c.bpDia, 'mm[Hg]'],
    ['spo2', c.spo2, '%'],
    ['body-temperature', c.temp, 'Cel'],
    ['glucose', c.glucose, 'mg/dL'],
    ['sleep-hours', c.sleepH, 'h'],
    ['mood', c.mood, '{score}'],
    ['radiation-dose', c.radiationMsv ?? 0, 'mSv/d'],
    ['cabin-co2', c.cabinCo2Ppm ?? 0, 'ppm'],
    ['stress', c.stress ?? 0, '{score}'],
    ['fatigue', c.fatigue ?? 0, '{score}'],
    ['crew-cohesion', c.teamwork ?? 0, '{score}'],
    ['dizziness', c.dizziness ?? 0, '{score}'],
    ['resistive-exercise-min', c.resistiveMin ?? 0, 'min'],
    ['fluid-intake', c.fluidL ?? 0, 'L'],
    ['exercise-min', c.exerciseMin, 'min'],
  ];

  return pairs.map(([code, value, unit]) => ({
    resourceType: 'Observation',
    id: `${c.id}-${code}`,
    status: 'final',
    code: { text: code },
    effectiveDateTime: c.timestamp,
    valueQuantity: { value, unit },
    subject: { reference: `Patient/${c.profileId}` },
  }));
}

export async function downloadGroundPacket() {
  const packet = await buildGroundPacket();
  const sent = packet.entry
    .map((e) => (e as { resource?: { id?: string; code?: { text?: string } } }).resource)
    .filter((r) => r?.code?.text?.startsWith('continuous-monitoring-'))
    .map((r) => r!.id!);
  if (sent.length) {
    await markDownlinked(sent);
    window.dispatchEvent(new CustomEvent('aether:downlinked'));
  }
  // Queue a simulated uplink so the crew sees transit time and earliest reply.
  useUplinks.getState().enqueue((await getActiveProfile()).environment);
  if (import.meta.env.VITE_ARTIFACT) {
    // The sandboxed preview blocks downloads: show the packet with a Copy button instead.
    window.dispatchEvent(new CustomEvent('aether:packet', { detail: JSON.stringify(packet, null, 2) }));
    return;
  }
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aetherhealth-ground-packet-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

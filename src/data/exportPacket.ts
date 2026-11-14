import { triageCheckIn } from '@/domain/triage/engine';
import type { CheckInRecord, CrewProfile } from '@/domain/types';
import { encryptText } from './crypto';
import { getActiveProfile, listCheckIns } from './repositories';

/** FHIR-lite / demo ground packet for flight surgeons */
export async function buildGroundPacket() {
  const profile: CrewProfile = await getActiveProfile();
  const checkIns = await listCheckIns(14);
  const latest = checkIns[0];

  const observations = checkIns.flatMap((c) => vitalsToObservations(c));

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
              ],
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
      encryption: 'AES-GCM notes field (demo passphrase)',
      sealedNotes,
    },
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
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `aetherhealth-ground-packet-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Decision-support tool — not a medical diagnosis. */
export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[0.6875rem] leading-snug text-faint">
        Not a diagnosis. Escalate amber/red readings or worsening symptoms to CMO / flight surgeon.
      </p>
    );
  }

  return (
    <aside
      className="border border-rule bg-deck px-3 py-2.5 text-sm text-dust"
      role="note"
      aria-label="Medical disclaimer"
    >
      <p className="font-medium text-star">Not a diagnosis</p>
      <p className="mt-1 leading-normal">
        This app organises readings and suggests next steps. It does not replace your CMO, flight
        surgeon, or clinical care.
      </p>
    </aside>
  );
}

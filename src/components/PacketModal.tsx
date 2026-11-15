import { useEffect, useRef, useState } from 'react';

/**
 * Shows the ground packet with a Copy button when the browser cannot download files
 * (the hosted, sandboxed preview build). Opened by an `aether:packet` window event.
 */
export function PacketModal() {
  const [json, setJson] = useState('');
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onReady = (e: Event) => {
      setJson((e as CustomEvent<string>).detail);
      setCopied(false);
    };
    window.addEventListener('aether:packet', onReady);
    return () => window.removeEventListener('aether:packet', onReady);
  }, []);

  useEffect(() => {
    if (!json) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setJson('');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [json]);

  if (!json) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="packet-title">
      <div className="surface flex max-h-[85vh] w-full max-w-2xl flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3">
          <div>
            <h2 id="packet-title" className="text-base font-semibold text-star">
              Ground packet ready for uplink
            </h2>
            <p className="text-xs text-dust">FHIR-style bundle of the last 14 check-ins. Copy it to send at the next comm window.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={copy}>
              {copied ? 'Copied' : 'Copy packet'}
            </button>
            <button ref={closeRef} type="button" className="btn-quiet" onClick={() => setJson('')}>
              Close
            </button>
          </div>
        </div>
        <pre className="overflow-auto p-4 text-xs leading-relaxed text-dust">{json}</pre>
      </div>
    </div>
  );
}

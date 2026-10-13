'use client';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';

export function InquiryFormShell({ children, brand = 'karuu', className = '' }: { children: ReactNode; brand?: 'karuu' | 'jkj-plus'; className?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState('');
  const request = useRef({ fingerprint: '', key: '' });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    data.set('brand', brand);
    data.set('privacyConsent', data.get('privacyConsent') ? 'true' : 'false');
    const signature = JSON.stringify(Array.from(data.entries()));
    if (request.current.fingerprint !== signature) request.current = { fingerprint: signature, key: crypto.randomUUID() };
    data.set('inquiryKey', request.current.key);
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', body: data, headers: { 'Idempotency-Key': request.current.key } });
      const result = await response.json();
      if (!response.ok || result.status !== 'received' || typeof result.reference !== 'string') {
        throw new Error(result.message || result.error?.message || (typeof result.error === 'string' ? result.error : '') || 'We could not save your request. Please try again.');
      }
      setReceipt(result.reference);
    } catch (problem) { setError(problem instanceof Error ? problem.message : 'We could not save your request. Please try again.'); }
    finally { setBusy(false); }
  }
  if (receipt) return <div className="c-form-success" role="status"><h3 className="text-lg font-bold">Your request has been recorded.</h3><p className="mt-3">Reference: <strong>{receipt}</strong></p><p className="mt-2 text-sm">Keep this reference when following up about your {brand === 'jkj-plus' ? 'JKJ-Plus' : 'KARUU'} project.</p></div>;
  return <form onSubmit={submit} className={className} aria-busy={busy}>
    <div aria-hidden="true" hidden><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <fieldset disabled={busy} className="min-w-0 space-y-6">{children}</fieldset>
    {busy && <p role="status" className="text-sm">Saving your request…</p>}
    {error && <div className="c-form-error" role="alert">{error}<p className="mt-2">Your request has not been confirmed. {brand === 'karuu' ? <><a className="underline" href="mailto:john@karuu.net">Email KARUU</a> for help; this opens a draft for you to send.</> : <>The JKJ-Plus project contact must be available before a brief can be submitted here. Please try again when the collaboration service opens.</>}</p></div>}
  </form>;
}

'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Upload } from 'lucide-react';
import { commerceRequest } from './commerce-client';
import styles from './store.module.css';

type UploadAsset = { id: string; title: string; format: string; language: string; contentSha256?: string };
type UploadResult = { uploaded: true; id: string; sha256: string; bytes: number; deliveryVerified: true; recovered?: boolean };
type Props = {
  assets: UploadAsset[];
  selectedAssetId?: string;
  disabled?: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onUploaded: (assetId: string) => Promise<void>;
};

const MAX_FILE_BYTES = 90 * 1024 * 1024;

export function AdminFileUpload({ assets, selectedAssetId, disabled = false, onUploadingChange, onUploaded }: Props) {
  const [assetId, setAssetId] = useState(selectedAssetId || '');
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);

  useEffect(() => {
    if (selectedAssetId) setAssetId(selectedAssetId);
  }, [selectedAssetId]);

  function chooseFile(nextFile: File | null) {
    setError('');
    setResult(null);
    if (nextFile && (nextFile.size === 0 || nextFile.size > MAX_FILE_BYTES)) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setError(nextFile.size === 0 ? 'Choose a non-empty file.' : 'This file exceeds 90 MiB. It requires the controlled multipart upload path; no upload was made.');
      return;
    }
    setFile(nextFile);
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || uploadingRef.current) return;
    setError('');
    setResult(null);
    if (!assets.some((asset) => asset.id === assetId)) { setError('Select an existing private asset record.'); return; }
    if (!file || file.size === 0 || file.size > MAX_FILE_BYTES) { setError('Choose a non-empty file of at most 90 MiB.'); return; }
    const editionHash = assets.find((asset) => asset.id === assetId)?.contentSha256 || '';
    if (file.size > 32 * 1024 * 1024 && !/^[a-f0-9]{64}$/.test(editionHash)) { setError('Save the actual edition SHA-256 in this asset record before uploading a file above 32 MiB.'); return; }
    if (reason.trim().length < 10) { setError('Enter a reason of at least 10 characters.'); return; }

    uploadingRef.current = true;
    setUploading(true);
    onUploadingChange(true);
    try {
      const uploaded = await commerceRequest<UploadResult>(`/api/admin/assets/${encodeURIComponent(assetId)}/file`, {
        method: 'POST',
        headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-KARUU-Reason': encodeURIComponent(reason.trim()), 'X-KARUU-File-Bytes': String(file.size), ...(editionHash ? { 'X-KARUU-Expected-Sha256': editionHash } : {}) },
        body: file,
      });
      if (uploaded.uploaded !== true || uploaded.id !== assetId || uploaded.deliveryVerified !== true || uploaded.bytes !== file.size || !/^[a-f0-9]{64}$/i.test(uploaded.sha256)) {
        throw new Error('The server did not return a complete verified upload receipt. Refresh the asset record before retrying.');
      }
      setResult(uploaded);
      setFile(null);
      setReason('');
      if (fileInput.current) fileInput.current.value = '';
      await onUploaded(uploaded.id);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'The private file could not be uploaded.');
    } finally {
      uploadingRef.current = false;
      setUploading(false);
      onUploadingChange(false);
    }
  }

  const locked = disabled || uploading;
  const registeredHash = assets.find((asset) => asset.id === assetId)?.contentSha256 || '';
  return <section className={`${styles.panel} mt-6`} aria-labelledby="private-file-upload-title">
    <h2 id="private-file-upload-title">Upload a private file</h2>
    <p className={`${styles.muted} mb-5`}>Choose an existing asset and its exact edition file. Uploads go to private media storage; the server checks the file digest and updates delivery verification. Distribution rights and sale status require their separate checks.</p>
    {assets.length === 0 ? <p className={`${styles.notice} mb-5`}>Create a private asset record first. An unavailable asset service must be configured before uploading.</p> : null}
    <form onSubmit={upload} aria-busy={uploading}>
      <label className={styles.field}>
        <span id="private-file-asset-label" className={styles.label}>Existing asset</span>
        <select className={styles.select} aria-labelledby="private-file-asset-label" required value={assetId} disabled={locked || assets.length === 0} onChange={(event) => { setAssetId(event.target.value); setError(''); setResult(null); }}>
          <option value="">Select a private asset</option>
          {assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.title || asset.id} · {asset.format.toUpperCase()} · {asset.language} · {asset.id}</option>)}
        </select>
      </label>
      {registeredHash ? <p className={`${styles.mono} mb-4`}>Registered edition SHA-256: {registeredHash}</p> : null}
      <label className={styles.field}>
        <span id="private-file-edition-label" className={styles.label}>Edition file</span>
        <input ref={fileInput} type="file" required className={styles.input} disabled={locked || assets.length === 0} aria-labelledby="private-file-edition-label" aria-describedby="private-file-limit" onChange={(event) => chooseFile(event.target.files?.[0] || null)} />
        <span id="private-file-limit" className={`${styles.hint} block`}>Maximum 90 MiB. Files above 32 MiB require the actual edition SHA-256 saved in the asset record first. Existing private objects are verified, never overwritten.</span>
      </label>
      {file ? <p className={`${styles.compact} mb-4`}>{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MiB</p> : null}
      <label className={styles.field}>
        <span id="private-file-reason-label" className={styles.label}>Reason for this upload</span>
        <input className={styles.input} aria-labelledby="private-file-reason-label" aria-describedby="private-file-reason-hint" required minLength={10} maxLength={1000} disabled={locked || assets.length === 0} value={reason} onChange={(event) => { setReason(event.target.value); setError(''); }} />
        <span id="private-file-reason-hint" className={`${styles.hint} block`}>At least 10 characters. Included in the operation audit.</span>
      </label>
      {error ? <p className={`${styles.notice} ${styles.error} mb-4`} role="alert">{error}</p> : null}
      {result ? <div className={`${styles.notice} ${styles.success} mb-4`} role="status"><p>{result.recovered ? 'Existing private object verified and recovered' : 'Private upload verified'} for {result.id}: {result.bytes.toLocaleString()} bytes.</p><p className={styles.mono}>SHA-256: {result.sha256}</p><p>Distribution rights and sale status have not changed.</p></div> : null}
      <button type="submit" className={styles.button} disabled={locked || assets.length === 0 || !file || !assets.some((asset) => asset.id === assetId) || reason.trim().length < 10}><Upload size={16} aria-hidden="true" />{uploading ? 'Uploading and verifying…' : 'Upload private file'}</button>
    </form>
  </section>;
}

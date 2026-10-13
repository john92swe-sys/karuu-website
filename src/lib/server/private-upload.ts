import { createHash } from 'node:crypto';
import type { User } from './auth';
import type { Asset } from './commerce';
import { fail, identifier, text } from './core';
import { audit, transaction } from './db';
import { privateBucket, PrivateBucket } from './private-media';

const maxBytes = 32 * 1024 * 1024;
const contentTypes: Record<string, string> = {
  epub: 'application/epub+zip', pdf: 'application/pdf', mp3: 'audio/mpeg',
  m4a: 'audio/mp4', flac: 'audio/flac', zip: 'application/zip',
};

async function fileBytes(request: Request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (!Number.isSafeInteger(length) || length < 0 || length > maxBytes)
    fail(413, 'file_too_large', 'Use a non-empty file up to 32 MiB.');
  if (!request.body) fail(400, 'empty_file', 'Choose a non-empty file.');
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        fail(413, 'file_too_large', 'Use a file up to 32 MiB. Larger audio needs the controlled multipart upload path.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!total) fail(400, 'empty_file', 'Choose a non-empty file.');
  return Buffer.concat(chunks, total);
}

export async function uploadPrivateAsset(user: User, assetId: string, request: Request, suppliedStore?: PrivateBucket) {
  if (user.role !== 'admin' || !user.brands.includes('karuu')) fail(403, 'brand_denied', 'KARUU administrator access is required.');
  const id = identifier(assetId);
  let reason: string;
  try { reason = text(decodeURIComponent(request.headers.get('x-karuu-reason') || ''), 1000); }
  catch { return fail(400, 'reason_required', 'Provide an operation reason of at least 10 characters.'); }
  if (reason.length < 10) fail(400, 'reason_required', 'Provide an operation reason of at least 10 characters.');
  if (process.env.KARUU_PRIVATE_MEDIA_PROVIDER !== 'r2') fail(503, 'upload_not_configured', 'Private file upload requires the configured KARUU R2 storage binding.');
  const store = suppliedStore || await privateBucket();
  if (!store?.put) fail(503, 'upload_not_configured', 'The private R2 upload binding is not configured.');
  const bytes = await fileBytes(request);
  const digest = createHash('sha256').update(bytes).digest('hex');
  return transaction(async client => {
    const asset = (await client.query<Asset>('SELECT * FROM commerce_assets WHERE id=$1 FOR UPDATE', [id])).rows[0];
    if (!asset) fail(404, 'asset_not_found', 'Create the asset record before uploading its file.');
    if (!asset.object_key || !contentTypes[asset.format]) fail(400, 'invalid_asset', 'Configure a supported format and private object key.');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`karuu-private-object:${asset.object_key}`]);
    const collision = await client.query('SELECT id FROM commerce_assets WHERE object_key=$1 AND id<>$2 LIMIT 1', [asset.object_key, id]);
    if (collision.rows.length) fail(409, 'object_key_in_use', 'Another edition uses this private object key. Choose an unused key before uploading.');
    const committed = (await client.query('SELECT id FROM commerce_orders WHERE snapshot @> $1::jsonb LIMIT 1', [JSON.stringify([{ components: [{ assetId: id }] }])])).rows.length > 0;
    if ((asset.content_sha256 && asset.content_sha256 !== digest) || (committed && !asset.content_sha256))
      fail(409, 'edition_immutable', 'This file differs from the configured edition. Create a new asset ID for a different file.');
    // An audit failure must happen before any object write. Rights/publication are untouched.
    await audit(client, user.id, 'private_file_upload', id, reason, { sha256: digest, bytes: bytes.length, editionVersion: asset.edition_version });
    const saved = await store.put!(asset.object_key, bytes, { sha256: digest, httpMetadata: { contentType: contentTypes[asset.format] } });
    if (!saved?.checksums?.sha256 || Buffer.from(saved.checksums.sha256).toString('hex') !== digest)
      fail(503, 'upload_unconfirmed', 'The stored file checksum could not be verified. Delivery has not been enabled.');
    await client.query('UPDATE commerce_assets SET content_sha256=$2,delivery_verified=true,updated_at=now() WHERE id=$1', [id, digest]);
    return { uploaded: true, id, sha256: digest, bytes: bytes.length, deliveryVerified: true };
  });
}

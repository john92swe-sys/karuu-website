import { createHash } from 'node:crypto';
import type { User } from './auth';
import type { Asset } from './commerce';
import { fail, identifier, text, uuid } from './core';
import { audit, DbClient, transaction } from './db';
import { confirmPrivateR2Object, confirmsPrivateObject, privateBucket, PrivateBucket } from './private-media';

const bufferedBytes = 32 * 1024 * 1024;
export const maxPrivateUploadBytes = 90 * 1024 * 1024;
const contentTypes: Record<string, string> = {
  epub: 'application/epub+zip', pdf: 'application/pdf', mp3: 'audio/mpeg',
  m4a: 'audio/mp4', flac: 'audio/flac', zip: 'application/zip',
};

function declaredSize(request: Request) {
  const parsed = (name: string) => {
    const header = request.headers.get(name);
    if (header === null) return null;
    if (!/^\d+$/.test(header)) fail(400, 'file_size_invalid', 'Provide the exact file size in bytes.');
    const size = Number(header);
    if (!Number.isSafeInteger(size) || size > maxPrivateUploadBytes) fail(413, 'file_too_large', 'Use a file up to 90 MiB. Larger files require the controlled multipart path.');
    if (!size) fail(400, 'empty_file', 'Choose a non-empty file.');
    return size;
  };
  const declared = parsed('x-karuu-file-bytes'), length = parsed('content-length');
  if (declared !== null && length !== null && declared !== length) fail(400, 'file_size_mismatch', 'The declared file size differs from the request length.');
  return declared ?? length;
}

async function fileBytes(request: Request, expectedSize: number | null) {
  if (!request.body) fail(400, 'empty_file', 'Choose a non-empty file.');
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > bufferedBytes) {
        await reader.cancel();
        fail(413, 'file_too_large', 'Files above 32 MiB require their exact byte length and a registered edition SHA-256.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!total) fail(400, 'empty_file', 'Choose a non-empty file.');
  if (expectedSize !== null && expectedSize !== total) fail(400, 'file_size_mismatch', 'The received file length differs from the declared size.');
  return Buffer.concat(chunks, total);
}

async function lockedAsset(client: DbClient, user: User, id: string) {
  // Transaction-scoped ordinary table locking also covers new keys without an
  // object_key UNIQUE constraint. Hyperdrive does not support advisory locks.
  await client.query('LOCK TABLE commerce_assets IN SHARE ROW EXCLUSIVE MODE');
  const actor = (await client.query<{ role: string; brands: string[]; verified_at: unknown }>('SELECT role,brands,verified_at FROM commerce_users WHERE id=$1 FOR SHARE', [user.id])).rows[0];
  if (!actor?.verified_at || actor.role !== 'admin' || !actor.brands.includes('karuu')) fail(403, 'brand_denied', 'Current verified KARUU administrator access is required.');
  const asset = (await client.query<Asset>('SELECT * FROM commerce_assets WHERE id=$1 FOR UPDATE', [id])).rows[0];
  if (!asset) fail(404, 'asset_not_found', 'Create the asset record before uploading its file.');
  if (!asset.object_key || !contentTypes[asset.format]) fail(400, 'invalid_asset', 'Configure a supported format and private object key.');
  const collision = await client.query('SELECT id FROM commerce_assets WHERE object_key=$1 AND id<>$2 LIMIT 1', [asset.object_key, id]);
  if (collision.rows.length) fail(409, 'object_key_in_use', 'Another edition uses this private object key. Choose an unused key before uploading.');
  const committed = (await client.query('SELECT id FROM commerce_orders WHERE snapshot @> $1::jsonb LIMIT 1', [JSON.stringify([{ components: [{ assetId: id }] }])])).rows.length > 0;
  if (committed && !asset.content_sha256) fail(409, 'edition_immutable', 'A quoted edition requires its original verified digest. Reconcile it before uploading.');
  return asset;
}

function sameEdition(before: Asset, after: Asset, digest: string) {
  return before.work_slug === after.work_slug && before.format === after.format && before.language === after.language &&
    before.edition_version === after.edition_version && before.object_key === after.object_key &&
    (before.content_sha256 === after.content_sha256 || (!before.content_sha256 && after.content_sha256 === digest));
}

async function streamedPut(store: PrivateBucket, key: string, request: Request, size: number, digest: string, contentType: string) {
  const Constructor = (globalThis as unknown as { FixedLengthStream?: new (length: number) => { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> } }).FixedLengthStream;
  if (!Constructor) fail(503, 'upload_stream_unavailable', 'Large private uploads require the configured Workers streaming runtime.');
  const fixed = new Constructor(size), controller = new AbortController();
  const pump = request.body!.pipeTo(fixed.writable, { signal: controller.signal });
  // A body error can precede the storage response. Always observe both promises.
  void pump.catch(() => {});
  try {
    const saved = await store.put!(key, fixed.readable, { sha256: digest, onlyIf: new Headers({ 'If-None-Match': '*' }), httpMetadata: { contentType } });
    if (!saved) {
      controller.abort();
      await pump.catch(() => {});
      return null;
    }
    await pump;
    return saved;
  } catch {
    controller.abort();
    await pump.catch(() => {});
    fail(503, 'upload_unconfirmed', 'The complete stream, length and SHA-256 were not confirmed. Delivery has not been enabled.');
  }
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
  const declared = declaredSize(request), large = declared !== null && declared > bufferedBytes;
  const requestedDigest = request.headers.get('x-karuu-expected-sha256');
  if (requestedDigest !== null && !/^[a-f0-9]{64}$/.test(requestedDigest)) fail(400, 'file_digest_required', 'Provide the registered edition SHA-256.');
  if (!request.body) fail(400, 'empty_file', 'Choose a non-empty file.');
  const bytes = large ? null : await fileBytes(request, declared), size = bytes?.length ?? declared!;
  const computed = bytes ? createHash('sha256').update(bytes).digest('hex') : null, operationId = uuid();
  const before = await transaction(async client => {
    const asset = await lockedAsset(client, user, id);
    if (requestedDigest && requestedDigest !== asset.content_sha256) fail(409, 'edition_changed', 'The registered edition digest changed. Refresh the asset before uploading.');
    if (large && !asset.content_sha256) fail(400, 'file_digest_required', 'Register the actual edition SHA-256 before uploading a file above 32 MiB.');
    if (computed && asset.content_sha256 && computed !== asset.content_sha256) fail(409, 'edition_immutable', 'This file differs from the configured edition. Create a new asset ID for a different file.');
    await audit(client, user.id, 'private_file_upload_started', id, reason, { operationId, sha256: computed ?? asset.content_sha256, bytes: size, objectKey: asset.object_key, editionVersion: asset.edition_version });
    return asset;
  });
  const digest = computed ?? before.content_sha256!;
  let recovered = false;
  const existing = await store.head(before.object_key);
  if (existing) {
    if (!confirmsPrivateObject(existing, digest, size)) fail(409, 'private_object_exists', 'This key already contains another or unverified object. It has not been overwritten. Use an unused private key for a storage repair.');
    recovered = true;
    if (large) await request.body.cancel().catch(() => {});
  } else {
    const saved = bytes
      ? await store.put(before.object_key, bytes, { sha256: digest, onlyIf: new Headers({ 'If-None-Match': '*' }), httpMetadata: { contentType: contentTypes[before.format] } })
      : await streamedPut(store, before.object_key, request, size, digest, contentTypes[before.format]);
    if (saved && !confirmsPrivateObject(saved, digest, size)) fail(503, 'upload_unconfirmed', 'The stored file checksum or complete byte length could not be verified. Delivery has not been enabled.');
    if (!saved) {
      if (!confirmsPrivateObject(await store.head(before.object_key), digest, size)) fail(409, 'private_object_exists', 'Another object won this key. It has not been overwritten.');
      recovered = true;
    }
  }
  // Native R2 proof, not custom metadata or a client assertion. Outside the SQL transaction.
  await confirmPrivateR2Object(store, before.object_key, digest, size);
  return transaction(async client => {
    const asset = await lockedAsset(client, user, id);
    if (!sameEdition(before, asset, digest)) fail(409, 'edition_changed', 'The edition or private key changed during upload. The object remains private and delivery was not confirmed.');
    await audit(client, user.id, 'private_file_upload', id, reason, { operationId, sha256: digest, bytes: size, editionVersion: asset.edition_version, recovered });
    await client.query('UPDATE commerce_assets SET content_sha256=$2,delivery_verified=true,updated_at=now() WHERE id=$1', [id, digest]);
    return { uploaded: true, id, sha256: digest, bytes: size, deliveryVerified: true, recovered };
  });
}

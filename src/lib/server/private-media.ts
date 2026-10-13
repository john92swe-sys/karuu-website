import { cloudflareEnvironment } from './cloudflare';
import { fail } from './core';

type StoredObject = {
  size: number;
  etag: string;
  httpEtag: string;
  checksums?: { sha256?: ArrayBuffer };
  httpMetadata?: { contentType?: string };
  body?: ReadableStream<Uint8Array>;
};
export type PrivateBucket = {
  head(key: string): Promise<StoredObject | null>;
  get(key: string, options?: {
    onlyIf?: { etagMatches: string };
    range?: { offset: number; length: number };
  }): Promise<StoredObject | null>;
  put?(key: string, value: ArrayBuffer | ArrayBufferView, options?: {
    sha256: string;
    httpMetadata: { contentType: string };
  }): Promise<StoredObject | null>;
};

export async function privateBucket(): Promise<PrivateBucket | null> {
  const environment = await cloudflareEnvironment();
  const value = environment?.KARUU_PRIVATE_MEDIA as Partial<PrivateBucket> | undefined;
  return value && typeof value.head === 'function' && typeof value.get === 'function'
    ? value as PrivateBucket : null;
}

export async function privateMediaConfigured() {
  if ((process.env.KARUU_DELIVERY_SIGNING_SECRET?.length ?? 0) < 32) return false;
  if (process.env.KARUU_PRIVATE_MEDIA_PROVIDER === 'r2') return Boolean(await privateBucket());
  if (process.env.KARUU_PRIVATE_MEDIA_PROVIDER && process.env.KARUU_PRIVATE_MEDIA_PROVIDER !== 'relay') return false;
  return Boolean(process.env.KARUU_PRIVATE_MEDIA_ORIGIN?.startsWith('https://') && process.env.KARUU_PRIVATE_MEDIA_TOKEN);
}

export function byteRange(header: string | null, size: number) {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(size) || size <= 0)
    fail(416, 'invalid_range', 'Only a satisfiable single byte range is supported.');
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) fail(416, 'invalid_range', 'The requested byte range is invalid.');
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }
  const offset = Number(match[1]);
  const end = match[2] ? Number(match[2]) : size - 1;
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(end) || offset >= size || end < offset)
    fail(416, 'invalid_range', 'The requested byte range is outside this file.');
  return { offset, length: Math.min(end, size - 1) - offset + 1 };
}

// Called only after the account, signed grant and current entitlement have been checked.
export async function readPrivateR2(
  store: PrivateBucket,
  key: string,
  expectedSha256: string,
  rangeHeader: string | null,
) {
  const metadata = await store.head(key);
  const digest = metadata?.checksums?.sha256;
  if (!metadata || !digest || Buffer.from(digest).toString('hex') !== expectedSha256)
    fail(503, 'file_integrity_unconfirmed', 'The verified edition is temporarily unavailable. Your purchase remains recorded.');
  const range = byteRange(rangeHeader, metadata.size);
  const object = await store.get(key, {
    onlyIf: { etagMatches: metadata.etag },
    ...(range ? { range } : {}),
  });
  // Conditional read prevents a replacement between HEAD and GET from serving different bytes.
  if (!object?.body) fail(503, 'file_temporarily_unavailable', 'The file changed or is temporarily unavailable. Please create a fresh access link.');
  const headers = new Headers({
    'Content-Type': metadata.httpMetadata?.contentType || 'application/octet-stream',
    'Content-Length': String(range ? range.length : metadata.size),
    'Accept-Ranges': 'bytes',
  });
  if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`);
  return new Response(object.body, { status: range ? 206 : 200, headers });
}

export async function readPrivateObject(key: string, sha256: string, range: string | null) {
  if (process.env.KARUU_PRIVATE_MEDIA_PROVIDER === 'r2') {
    const store = await privateBucket();
    if (!store) fail(503, 'delivery_not_configured', 'The private R2 binding is not configured.');
    return readPrivateR2(store, key, sha256, range);
  }
  const origin = new URL(process.env.KARUU_PRIVATE_MEDIA_ORIGIN!);
  const objectUrl = new URL(`/objects/${key.split('/').map(encodeURIComponent).join('/')}`, origin);
  const headers: Record<string, string> = { Authorization: `Bearer ${process.env.KARUU_PRIVATE_MEDIA_TOKEN}` };
  if (range) {
    if (!/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) fail(416, 'invalid_range', 'Only a single byte range is supported.');
    headers.Range = range;
  }
  const response = await fetch(objectUrl, { headers, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (![200, 206].includes(response.status)) fail(503, 'file_temporarily_unavailable', 'The file service is temporarily unavailable. Your purchase remains recorded.');
  return response;
}

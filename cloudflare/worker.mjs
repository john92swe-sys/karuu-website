import openNextWorker from '../.open-next/worker.js';

// Preserve OpenNext's Durable Object exports and generated fetch handler.
export * from '../.open-next/worker.js';

const JOB_URL = 'https://karuu.internal/api/internal/notifications';
const INQUIRY_URL = 'https://karuu-c-review-20261013.john92swe.workers.dev/api/inquiries';

function inquiryFailure(status) {
  return Response.json({ error: 'We could not confirm your request. Please keep your details and try again.', code: 'inquiry_unconfirmed' }, { status, headers: { 'Cache-Control': 'no-store' } });
}
async function forwardInquiry(request, env) {
  if (request.headers.get('Origin') !== env.KARUU_SITE_ORIGIN) return inquiryFailure(403);
  const service = env?.KARUU_INQUIRY_SERVICE;
  if (typeof service?.fetch !== 'function') return inquiryFailure(503);
  if (Number(request.headers.get('Content-Length') || 0) > 20000) return inquiryFailure(413);
  try {
    // Only inquiry bytes reach the existing sender; no browser cookies or credentials.
    const reader = request.body?.getReader(), chunks = [];
    let length = 0;
    if (reader) for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 20000) { await reader.cancel(); return inquiryFailure(413); }
      chunks.push(chunk.value);
    }
    const body = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    const headers = new Headers({ Origin: new URL(INQUIRY_URL).origin });
    for (const name of ['Content-Type', 'Idempotency-Key']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const response = await service.fetch(new Request(INQUIRY_URL, {
      method: 'POST', headers, body, redirect: 'manual', signal: AbortSignal.timeout(20000),
    }));
    if (!response.headers.get('Content-Type')?.includes('application/json') || (response.status !== 201 && !(response.status >= 400 && response.status < 500))) return inquiryFailure(503);
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch { return inquiryFailure(503); }
}

async function runNotificationJob(env) {
  const secret = env?.KARUU_NOTIFICATION_JOB_SECRET;
  const service = env?.WORKER_SELF_REFERENCE;
  if (typeof service?.fetch !== 'function' || typeof secret !== 'string' || !/^[\x21-\x7E]{32,256}$/.test(secret)) {
    throw new Error('notification_schedule_not_configured');
  }
  try {
    // Use the private self binding only: no request-controlled or configured origin.
    // A single call leaves claiming, brand routing and safe retries to the existing job.
    const response = await service.fetch(new Request(JOB_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(5 * 60 * 1000),
    }));
    if (response.status !== 200) throw new Error('Job rejected');
    const result = await response.json();
    const valid = ['processed', 'providerAccepted', 'failed', 'needsReview'].every(key => Number.isSafeInteger(result?.[key]) && result[key] >= 0);
    if (!valid || result.processed > 10 || result.providerAccepted + result.failed !== result.processed || result.needsReview > result.failed) throw new Error('Invalid job result');
    if (result.failed || result.needsReview) throw new Error('Job needs review');
  } catch {
    // Cron Past Events receives a failure without response bodies, secrets or recipients.
    throw new Error('notification_job_failed');
  }
}

const worker = {
  ...openNextWorker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (env?.KARUU_DEPLOYMENT_ENV === 'production' && url.hostname === 'karuu.net') {
      url.protocol = 'https:'; url.host = 'www.karuu.net';
      return Response.redirect(url.toString(), 308);
    }
    if (env?.KARUU_DEPLOYMENT_ENV === 'production' && url.pathname === '/api/inquiries' && request.method === 'POST') {
      return forwardInquiry(request, env);
    }
    return openNextWorker.fetch(request, env, ctx);
  },
  async scheduled(_controller, env, ctx) {
    if (env?.KARUU_NOTIFICATIONS_SCHEDULED_ENABLED !== 'true') return;
    const task = runNotificationJob(env);
    ctx.waitUntil(task);
    await task;
  },
};
export default worker;

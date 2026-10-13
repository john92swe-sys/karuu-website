import openNextWorker from '../.open-next/worker.js';

// Preserve OpenNext's Durable Object exports and generated fetch handler.
export * from '../.open-next/worker.js';

const JOB_URL = 'https://karuu.internal/api/internal/notifications';

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
  async scheduled(_controller, env, ctx) {
    if (env?.KARUU_NOTIFICATIONS_SCHEDULED_ENABLED !== 'true') return;
    const task = runNotificationJob(env);
    ctx.waitUntil(task);
    await task;
  },
};
export default worker;

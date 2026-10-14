import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { reviewCloudflarePackagingEnv } from './lib/review-cloudflare-packaging-env.mjs';

const target = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
const closed = ['KARUU_PAYMENTS_ENABLED', 'KARUU_LIVE_COMMERCE_APPROVED',
  'KARUU_TAX_CONFIG_APPROVED', 'KARUU_DISTRIBUTION_APPROVED', 'KARUU_LEGAL_APPROVED'];
if (target.name !== 'karuu-c-review-20261013' || target.routes?.length ||
    target.vars?.KARUU_DEPLOYMENT_ENV !== 'preview' ||
    closed.some(name => target.vars?.[name] !== 'false')) {
  throw new Error('Review upload requires its isolated name, no production routes, noindex and closed commerce gates.');
}
if (!existsSync('.open-next/worker.js')) throw new Error('Build and verify the Cloudflare artifact first.');
const result = spawnSync(process.execPath, [
  'node_modules/@opennextjs/cloudflare/dist/cli/index.js', 'deploy',
], { stdio: 'inherit', env: reviewCloudflarePackagingEnv(target) });
if (result.error) throw result.error;
process.exit(result.status ?? 1);

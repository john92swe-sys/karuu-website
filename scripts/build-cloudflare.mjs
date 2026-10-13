import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// The checked-in target is an isolated review Worker, never the production name.
const target = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
if (target.name !== 'karuu-c-review-20261013' || target.routes?.length) {
  throw new Error('This command packages only the reviewed, isolated Worker without production routes.');
}
const result = spawnSync(process.execPath, [
  'node_modules/@opennextjs/cloudflare/dist/cli/index.js', 'build',
], {
  stdio: 'inherit',
  env: { ...process.env, KARUU_DEPLOYMENT_ENV: 'preview', WRANGLER_SEND_METRICS: 'false' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);

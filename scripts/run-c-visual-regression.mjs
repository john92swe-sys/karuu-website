import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const moduleDirectory = process.env.PLAYWRIGHT_MODULE || dirname(require.resolve('playwright/package.json'));
const result = spawnSync(process.execPath, [join(moduleDirectory, 'cli.js'), 'test', '--config', 'playwright.c.config.mjs', ...process.argv.slice(2)], { stdio: 'inherit', shell: false });
if (result.error) throw result.error;
process.exit(result.status ?? 1);

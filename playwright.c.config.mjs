import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { defineConfig } = require(process.env.PLAYWRIGHT_MODULE ? path.join(process.env.PLAYWRIGHT_MODULE, 'test.js') : 'playwright/test');

export default defineConfig({
  testDir: './scripts',
  testMatch: 'qa-c-visual-regression.spec.mjs',
  outputDir: './work/c-visual-regression-results',
  snapshotPathTemplate: '{testDir}/../docs/design-reference/visual-baselines/{arg}{ext}',
  workers: 1,
  timeout: 45000,
  reporter: [['list'], ['json', { outputFile: './work/c-visual-regression.json' }]],
  use: {
    baseURL: process.env.KARUU_QA_URL || 'http://localhost:3097',
    browserName: 'chromium',
    launchOptions: { channel: 'msedge' },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  },
});

import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.KARUU_QA_URL || 'http://127.0.0.1:3095';
const output = process.env.KARUU_QA_OUTPUT || path.resolve('work/c-qa');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const report = { checkedAt: new Date().toISOString(), commit: execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(), environment:'Local preview; Edge headless simulated viewports; no physical phone; no live payments', browser: browser.version(), viewports: [], routes: [], flows: [], errors: [] };
const context = await browser.newContext();
const page = await context.newPage();
page.on('pageerror', error => report.errors.push(error.message));
try {
  for (const width of [320,360,390,768,1280,1440]) {
    await page.setViewportSize({width,height:960});
    const response = await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    assert.equal(await page.locator('h1').count(),1);
    await assert.doesNotReject(() => page.getByRole('link',{name:'Explore products',exact:true}).waitFor());
    await page.getByRole('link',{name:'Explore creations',exact:true}).waitFor();
    const overflow = await page.evaluate(() => ({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(overflow.document<=width+1 && overflow.body<=width+1,`Homepage overflow at ${width}`);
    await page.screenshot({path:path.join(output,`home-${width}.png`),fullPage:true});
    report.viewports.push({width,overflow,result:'passed'});
    if(width===390) {
      await page.getByRole('button',{name:'Open menu'}).click();
      await page.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Digital creations'}).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('button',{name:'Open menu'}).getAttribute('aria-expanded'),'false');
      report.flows.push('390px mobile menu opens, shows both businesses and closes by Escape');
    }
  }
  const routes=['/physical','/physical/jkj-plus','/products','/products/kr01-0001','/oem-odm','/manufacturing','/quality-certifications','/sustainability','/about','/contact','/creations','/creations/the-key-returned-at-low-tide','/creations/the-last-room-on-the-register','/account','/bag','/member-benefits','/admin','/search?q=low+tide','/privacy','/terms'];
  for(const route of routes) {
    await page.setViewportSize({width:390,height:960});
    const response=await page.goto(base+route,{waitUntil:'networkidle'});
    assert.equal(response.status(),200,route);
    assert.ok(await page.locator('h1').count()>=1,`${route} missing page heading`);
    const overflow=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
    assert.ok(overflow.document<=391&&overflow.body<=391,`${route} overflows mobile`);
    report.routes.push({route,status:response.status(),overflow,result:'passed'});
    if(['/creations','/creations/the-key-returned-at-low-tide','/contact','/account','/admin'].includes(route)) await page.screenshot({path:path.join(output,route.replaceAll('/','_').replaceAll('?','_')+'-390.png'),fullPage:true});
  }
  await page.goto(base+'/search?q=low+tide',{waitUntil:'networkidle'});
  assert.ok((await page.locator('main').innerText()).includes('The Key Returned at Low Tide'));
  report.flows.push('Company search finds real digital title');
  await page.goto(base+'/creations?category=music',{waitUntil:'networkidle'});
  assert.ok((await page.locator('main').innerText()).includes('Kitchen Floor Gravity'));
  assert.ok(!(await page.locator('main').innerText()).includes('The Last Room on the Register'));
  report.flows.push('Music filter shows actual music and excludes book cards');
  await page.goto(base+'/creations',{waitUntil:'networkidle'});
  await page.getByRole('searchbox').fill('no-such-karuu-title-918');
  await page.getByRole('heading',{name:'No matching creations'}).waitFor();
  report.flows.push('Catalogue search has accurate empty state');
  const config=await context.request.get(base+'/api/commerce/status');
  report.serviceConfig={status:config.status(),body:await config.json()};
  await page.goto(base+'/contact',{waitUntil:'networkidle'});
  await page.getByLabel('Company Name').fill('KARUU isolated browser QA');
  await page.getByLabel('Contact Name').fill('Test Operator');
  await page.getByLabel('Business Email').fill('qa@example.invalid');
  await page.getByLabel('Country',{exact:false}).fill('Sweden');
  await page.getByLabel('Business Type').selectOption('Other');
  await page.getByLabel('Message',{exact:false}).fill('Isolated preview validation; do not notify customers.');
  await page.locator('input[name="privacyConsent"]').check();
  await page.getByRole('button',{name:'Submit collection brief'}).click();
  await page.getByRole('alert').waitFor();
  assert.ok(!(await page.locator('main').innerText()).includes('Your request has been recorded.'));
  report.flows.push('Unconfigured persistent inquiry service gives failure with no false receipt');
  assert.equal(report.errors.length,0,'Browser runtime errors');
  report.result='passed';
} catch(error) { report.result='failed'; report.failure=error.stack; throw error; }
finally { await writeFile(path.join(output,'browser-verification.json'),JSON.stringify(report,null,2)); await browser.close(); console.log(JSON.stringify({result:report.result,viewports:report.viewports.length,routes:report.routes.length,flows:report.flows.length,errors:report.errors,failure:report.failure},null,2)); }

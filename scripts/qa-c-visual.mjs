import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base=process.env.KARUU_QA_URL || 'http://localhost:3095';
const phase=process.env.KARUU_QA_PHASE || 'after';
const output=process.env.KARUU_QA_OUTPUT || path.resolve('work/c-visual-'+phase);
const url=new URL(base);
if(!(['localhost','127.0.0.1'].includes(url.hostname)||url.hostname==='karuu-c-review-20261013.john92swe.workers.dev')) throw new Error('Only local and isolated review origins are allowed.');
const viewports=[{width:1440,height:1000},{width:1920,height:1080},{width:390,height:844},{width:430,height:932},{width:360,height:844}];
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const report={phase,checkedUtc:new Date().toISOString(),base,builtSource:process.env.KARUU_QA_BUILT_SOURCE||null,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),workingTree:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),browser:browser.version(),environment:'Actual Edge headless browser, CSS viewports; not a physical phone. No fixture, payment, mail or data-changing request.',viewports:[],errors:[],result:'running'};
try {
 for(const viewport of viewports){
  const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce',isMobile:viewport.width<700,hasTouch:viewport.width<700});
  const page=await context.newPage();
  page.on('pageerror',e=>report.errors.push({viewport,error:e.message}));
  const response=await page.goto(base,{waitUntil:'networkidle',timeout:60000});
  assert.equal(response.status(),200,'Homepage response');
  await page.locator('h1').waitFor();
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('h1').scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,0));
  const observation=await page.evaluate(()=>{
   const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
   return {viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,pageHeight:document.documentElement.scrollHeight,hero:rect('.hc-hero')||rect('.c-hero'),physical:rect('.hc-physical'),digital:rect('.hc-digital'),heroBackground:document.querySelector('.hc-hero-scene')?getComputedStyle(document.querySelector('.hc-hero-scene')).backgroundImage:null,images:Array.from(document.images).map(i=>({src:i.getAttribute('src'),complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})),emptyLinks:Array.from(document.querySelectorAll('main a')).filter(a=>!a.getAttribute('href')||a.getAttribute('href')==='#').map(a=>a.textContent)};
  });
  assert.deepEqual(observation.viewport,viewport,'Requested viewport must actually apply');
  assert.ok(observation.scrollWidth<=viewport.width&&observation.bodyWidth<=viewport.width,'No whole-page horizontal overflow');
  assert.equal(observation.emptyLinks.length,0,'No placeholder anchors');
  if(phase!=='before'){
    assert.ok(observation.heroBackground.includes(viewport.width<700?'c-lakeside-hero-mobile.webp':'c-lakeside-hero-desktop.webp'),'Separate intended hero scene');
    assert.ok(observation.physical&&observation.digital,'Both image businesses must exist');
    assert.ok(observation.images.every(i=>i.complete&&i.naturalWidth>0),'All visible and full-page images must load');
    const backgroundResponse=await context.request.get(base+'/images/lifestyle/'+(viewport.width<700?'c-lakeside-hero-mobile.webp':'c-lakeside-hero-desktop.webp'));
    assert.equal(backgroundResponse.status(),200,'Hero scene file must be served');
    const physical=observation.physical,digital=observation.digital;
    assert.ok(viewport.width<700 ? digital.y>physical.y : Math.abs(digital.y-physical.y)<2,'Business sections must reflow for mobile');
  }
  const prefix='home-'+viewport.width+'x'+viewport.height;
  await page.screenshot({path:path.join(output,prefix+'-first.png'),fullPage:false});
  await page.screenshot({path:path.join(output,prefix+'-full.png'),fullPage:true});
  report.viewports.push({...viewport,...observation,result:'passed',first:prefix+'-first.png',full:prefix+'-full.png'});
  await context.close();
 }
 assert.equal(report.errors.length,0,'No page runtime errors');
 report.result='passed';
} catch(error){report.result='failed';report.failure=error.stack;throw error}
finally {await writeFile(path.join(output,'visual-browser-verification.json'),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify({phase,result:report.result,viewports:report.viewports.length,errors:report.errors,failure:report.failure}));}

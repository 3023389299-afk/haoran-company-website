import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const routes=['','en/','products/','en/products/','products/smd-power/','products/smd-power/hr-integrated/','en/products/smd-power/hr-integrated/','contact/','en/contact/','about/','factory/','applications/','applications/automotive/','news/','news/inductor-selection-l-dcr-current/','quality/','privacy/'];
const results=[],errors=[];
await fs.mkdir('reports/screenshots',{recursive:true});
for(const width of [390,1440]){
 console.log(`Checking ${width}px viewport`);
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const pages=await Promise.all([context.newPage(),context.newPage()]);
  pages.forEach(page => page.setDefaultTimeout(90000));
 pages[1].on('pageerror',e=>errors.push(e.message));
 for(const route of routes){
  console.log(`  ${route||'/'} `);
  const snapshots=[];
  for(let i=0;i<2;i++){
   const p=pages[i];await p.goto(`http://127.0.0.1:${4173+i}/haoran-company-website/${route}`,{waitUntil:'load'});
   await p.evaluate(async()=>{document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('is-visible'));});
   snapshots.push(await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,boxes:[...document.querySelectorAll('main > *, .global-header,.global-footer, h1,h2,h3,main img')].map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,x:r.x,y:r.y,w:r.width,h:r.height}})})));
  }
  const changes=snapshots[0].boxes.flatMap((b,j)=>{const a=snapshots[1].boxes[j];return !a||['x','y','w','h'].some(k=>Math.abs(a[k]-b[k])>2)?[{index:j,before:b,after:a}]:[]});
  results.push({route,width,overflowBefore:snapshots[0].overflow,overflowAfter:snapshots[1].overflow,changes});
 }
 // Navigation and search paths in both languages; no external form submission.
 for(const lang of ['','en/']){
  const p=pages[1];await p.goto(`http://127.0.0.1:4174/haoran-company-website/${lang}products/`,{waitUntil:'load'});
  if(width===390){await p.locator('.menu-toggle').click();assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await p.locator('.menu-toggle').getAttribute('aria-expanded'),'false');}
  await p.locator('[data-product-search-input]').fill('HR0630');
  assert.equal(await p.locator('[data-product-search-card]:not([hidden])').count(),1);
  await p.locator('[data-product-search-card]:not([hidden]) [data-search-detail]').click();await p.waitForLoadState('load');
  assert.equal(await p.locator('.is-selected[data-model]').getAttribute('data-model'),'HR0630');
  const inquiry=p.locator('[data-product-inquiry]').first();const target=await inquiry.getAttribute('href');assert(target.includes('model=HR0630'));
  await p.goto(target.startsWith('http')?target:`http://127.0.0.1:4174${target}`,{waitUntil:'load'});
  assert.equal(await p.locator('[data-inquiry-model]').inputValue(),'HR0630');
  assert(await p.locator('form[data-inquiry-language]').evaluate(f=>!f.checkValidity()));
  const family=p.locator('[data-inquiry-family]');assert((await family.inputValue()).length>0);
  // Browser events exercise the validation/honeypot path without sending data.
  await p.evaluate(()=>{const form=document.querySelector('form[data-inquiry-language]');window.__prevented=false;form.reportValidity=()=>true;form.querySelector('[name="_honey"]').value='bot';const ev=new Event('submit',{cancelable:true});form.dispatchEvent(ev);window.__prevented=ev.defaultPrevented;});
  assert.equal(await p.evaluate(()=>window.__prevented),true);
 }
 await context.close();
}
await browser.close();
await fs.writeFile('reports/browser.json',JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({comparisons:results.length,changed:results.filter(r=>r.changes.length).map(r=>({route:r.route,width:r.width,count:r.changes.length})),newOverflow:results.filter(r=>r.overflowAfter&&!r.overflowBefore),errors}));
assert.equal(errors.length,0);

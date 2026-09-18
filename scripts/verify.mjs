import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { load } from 'cheerio';
const pages=[];
async function collectPages(dir='') {
  for (const ent of await fs.readdir(dir||'.',{withFileTypes:true})) {
    if (['.git','node_modules','dist','src','reports'].includes(ent.name)) continue;
    const rel=dir?`${dir}/${ent.name}`:ent.name;
    if(ent.isDirectory())await collectPages(rel);
    else if(ent.name.endsWith('.html'))pages.push(rel);
  }
}
await collectPages();
const issues=[];
function signature($){
 const attrs=(selector,keys)=>$(selector).toArray().map(el=>keys.map(key=>$(el).attr(key)??null));
 return {
  title:$('title').map((_,e)=>$(e).text()).get(),
  metadata:attrs('meta',['name','property','content','http-equiv']),
  seoLinks:attrs('link[rel="canonical"],link[rel="alternate"]',['rel','href','hreflang']),
  links:attrs('a',['href']),
  forms:attrs('form',['action','method','data-inquiry-language']),
  inputs:attrs('input,select,textarea,option,button',['name','type','value','required','data-family','data-models','data-group','data-request']),
  headings:$('h1,h2,h3,h4,h5,h6').toArray().map(e=>[e.tagName,$(e).text()]),
  text:$('body').text().replace(/\s+/g,' ').trim(),
  ids:attrs('[id]',['id']).filter(([id])=>!/^B:/.test(id)),
  images:attrs('img',['alt']),
 };
}
for(const file of pages){
 const before=load(await fs.readFile(file,'utf8')),after=load(await fs.readFile('dist/'+file,'utf8'));
 assert.deepEqual(signature(after),signature(before),`Content or functionality changed: ${file}`);
 after('img').each((_,el)=>{assert(after(el).attr('width')&&after(el).attr('height'),`${file} image size missing`);assert(after(el).attr('loading'));});
 for(const el of after('[src],link[rel="stylesheet"]')){
  const url=after(el).attr('src')||after(el).attr('href');
  if(url?.startsWith('/haoran-company-website/'))await fs.access('dist/'+url.slice('/haoran-company-website/'.length).split('?')[0]);
 }
 const hs=after('h1,h2,h3,h4,h5,h6').toArray().map(e=>Number(e.tagName.slice(1)));
 if(hs.filter(x=>x===1).length!==1&&hs.length)issues.push({file,issue:'Existing h1 count',count:hs.filter(x=>x===1).length});
 for(let i=1;i<hs.length;i++)if(hs[i]>hs[i-1]+1){issues.push({file,issue:'Existing heading level skip',from:hs[i-1],to:hs[i]});break;}
}
await fs.writeFile('reports/seo-audit.json',JSON.stringify(issues,null,2));
console.log(`PASS: ${pages.length} routes preserve text, headings, metadata, navigation, form fields and contact links. Image dimensions and output resources verified. Existing heading findings: ${issues.length}.`);

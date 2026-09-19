import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { load } from 'cheerio';
import postcss from 'postcss';
import cssnano from 'cssnano';
import { build } from 'esbuild';
const root = process.cwd(), out = path.join(root, 'dist'), base = '/haoran-company-website/';
const read = p => fs.readFile(path.join(root, p), 'utf8');
const write = async (p, data) => { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, data); };
const hash = b => crypto.createHash('sha256').update(b).digest('hex').slice(0,12);
await fs.rm(out, { recursive: true, force: true });
await fs.mkdir(path.join(out, 'assets'), { recursive: true });
const report = { images: [], pages: [], css: {}, js: {} };
for (const name of ['downloads','certificates','robots.txt','sitemap.xml','.nojekyll']) {
  await fs.cp(path.join(root,name),path.join(out,name),{recursive:true});
}
const imageFiles = [];
async function walk(dir) {
  for (const ent of await fs.readdir(dir, {withFileTypes:true})) {
    const p = path.join(dir,ent.name);
    if (ent.isDirectory()) await walk(p);
    else if (/\.(png|jpe?g|webp)$/i.test(p)) imageFiles.push(p);
  }
}
await walk(path.join(root,'images'));
for (const name of await fs.readdir(root)) if (/\.(png|jpe?g|webp)$/i.test(name)) imageFiles.push(path.join(root,name));
const images = {};
for (const file of imageFiles) {
  const rel=path.relative(root,file), input=await fs.readFile(file), meta=await sharp(input).metadata();
  const name=rel.replace(/\.[^.]+$/,'').replaceAll(path.sep,'-');
  const widths=[...new Set([480,960,1440,meta.width].filter(w=>w<=meta.width))].sort((a,b)=>a-b);
  const variants=[];
  for(const width of widths){
    const data=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:84,effort:6}).toBuffer();
    const url=`assets/images/${name}-${width}-${hash(data)}.webp`;
    await write(path.join(out,url),data); variants.push({width,url:base+url,bytes:data.length});
  }
  // Keep every original URL working, including existing social and download links.
  let fallback = await (meta.format==='jpeg' ? sharp(input).jpeg({quality:90,mozjpeg:true}) : meta.format==='png' ? sharp(input).png({compressionLevel:9}) : sharp(input).webp({quality:90,effort:6})).toBuffer();
  if(fallback.length>=input.length)fallback=input;
  await write(path.join(out,rel),fallback);
  const full=variants.at(-1);
  images[base+rel]={width:meta.width,height:meta.height,src:full.url,srcset:variants.map(v=>`${v.url} ${v.width}w`).join(', ')};
  report.images.push({path:rel,width:meta.width,height:meta.height,originalBytes:input.length,webpBytes:full.bytes,fallbackBytes:fallback.length,variants});
}
let css='';
const imports=(await read('src/styles/index.css')).matchAll(/@import "\.\/(.*?)";/g);
for(const [,name] of imports)css+=await read('src/styles/'+name)+'\n';
for(const [url,img] of Object.entries(images))css=css.split(url).join(img.src);
// Do not reorder or merge selector blocks: the existing cascade is intentional.
const processed=await postcss([cssnano({preset:['default',{mergeRules:false,reduceIdents:false,discardUnused:false,cssDeclarationSorter:false,normalizeUrl:false}]})]).process(css,{from:undefined});
const cssName=`assets/site-${hash(processed.css)}.css`;
await write(path.join(out,cssName),processed.css);
report.css={sourceBytes:Buffer.byteLength(css),outputBytes:Buffer.byteLength(processed.css),url:base+cssName};
const bundle=await build({entryPoints:{main:'src/scripts/main.js',contact:'src/scripts/contact.js'},bundle:true,splitting:true,format:'esm',target:['es2020'],minify:true,outdir:path.join(out,'assets/js'),entryNames:'[name]-[hash]',chunkNames:'[name]-[hash]',metafile:true});
const entry={};
for(const [file,details] of Object.entries(bundle.metafile.outputs)){
  if(details.entryPoint)entry[details.entryPoint]=base+path.relative(out,path.resolve(file));
  report.js[path.basename(file)]=details.bytes;
}
const pages=[];
async function collectPages(dir='') {
  for (const ent of await fs.readdir(path.join(root,dir), {withFileTypes:true})) {
    if (['.git','node_modules','dist','src','reports'].includes(ent.name)) continue;
    const rel=path.join(dir,ent.name);
    if (ent.isDirectory()) await collectPages(rel);
    else if (ent.name.endsWith('.html')) pages.push(rel);
  }
}
await collectPages();
const components={
  zh:{header:await read('src/components/header-shared-1.html'),footer:await read('src/components/footer-1.html')},
  en:{header:await read('src/components/header-shared-2.html'),footer:await read('src/components/footer-2.html')},
};
for(const file of pages){
  let html=await read(file);
  const lang=file.startsWith(`en${path.sep}`)?'en':'zh';
  const activeNav=html.match(/<a href="([^"]+)" aria-current="page">/)?.[1];
  if(/<header class="global-header">/.test(html)){
    let header=components[lang].header;
    if(activeNav)header=header.replace(`href="${activeNav}"`,`href="${activeNav}" aria-current="page"`);
    html=html.replace(/<header class="global-header">.*?<\/header>/s,header);
  }
  if(/<footer class="global-footer">/.test(html))html=html.replace(/<footer class="global-footer">.*?<\/footer>/s,components[lang].footer);
  const $=load(html,{decodeEntities:false});
  // Framework transport placed SEO tags in the body on some exported pages.
  $('body title,body meta,body link[rel="canonical"],body link[rel="alternate"]').appendTo('head');
  const counterpart=lang==='en'?file.slice(3):`en/${file}`;
  if(pages.includes(counterpart)){
    $('.language-switch').attr('href',base+counterpart.replace(/index\.html$/,''));
  }
  $('link[rel="stylesheet"]').each((_,el)=>{if(($(el).attr('href')||'').includes('/style.css'))$(el).attr('href',base+cssName)});
  $('script[src]').each((_,el)=>{if(($(el).attr('src')||'').includes('/static.js'))$(el).attr('src',entry['src/scripts/main.js'])});
  if($('form[data-inquiry-language]').length)$('head').append(`<script type="module" src="${entry['src/scripts/contact.js']}"></script>`);
  $('img').each((_,el)=>{
    const img=$(el),info=images[img.attr('src')];if(!info)return;
    img.attr({src:info.src,width:String(info.width),height:String(info.height),decoding:'async'});
    if(info.width>480)img.attr({srcset:info.srcset,sizes:img.closest('.global-brand-mark').length?'52px':'100vw'});
    const critical=img.closest('.home-banner-media,.page-hero,.product-detail-hero,.global-header').length>0;
    img.attr('loading',critical?'eager':'lazy');
    if(img.closest('.home-banner-media').length)img.attr('fetchpriority','high');
    // Empty alt on linked decorative/redundant images is intentional and accessible.
    if(img.attr('alt')===undefined)img.attr('alt',img.closest('figure,article,a').find('h2,h3,figcaption').first().text().trim()||'');
  });
  $('[data-slide-image]').each((_,el)=>{
    const control=$(el),info=images[control.attr('data-slide-image')];if(!info)return;
    control.attr({'data-slide-image':info.src,'data-slide-srcset':info.srcset,'data-slide-width':String(info.width),'data-slide-height':String(info.height)});
  });
  // Remove only empty framework transport placeholders, never content or metadata.
  $('template[id^="B:"]').each((_,el)=>{if(!$(el).html())$(el).remove()});
  $('div[hidden]').each((_,el)=>{if(!$(el).text().trim()&&!$(el).children().length)$(el).remove()});
  await write(path.join(out,file),$.html());report.pages.push(file);
}
await fs.mkdir('reports',{recursive:true});
await fs.writeFile('reports/build.json',JSON.stringify(report,null,2));
console.log(`Built ${report.pages.length} pages, ${report.images.length} images. CSS ${report.css.sourceBytes} -> ${report.css.outputBytes} bytes.`);

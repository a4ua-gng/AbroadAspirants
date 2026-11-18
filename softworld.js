import { cities } from './lib/destinations.js';
import { galleries } from './lib/galleries.js';
import { programs, documents, answers } from './content.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const asset = path => '/assets/' + path;
const storage = {
  get(key, fallback) { try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;} },
  set(key, value) {try {localStorage.setItem(key, JSON.stringify(value));} catch {} }
};
function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}
function image(src, alt, className='') {
  const img = document.createElement('img');
  img.src = src; img.alt = alt; img.className=className; img.loading='lazy'; img.decoding='async';
  return img;
}
function setText(selector, text) { const node=$(selector); if(node)node.textContent=text ?? ''; }
function truncate(text, limit=158) {
  const value=String(text || '').trim();
  return value.length>limit?value.slice(0,limit).replace(/\s+\S*$/,'')+'…':value;
}
const photoRoot='/assets/cities/';
const cityUrl=city=>photoRoot+city.id+'.webp';
let currentCity=cities[0];
const scrollLine=$('#scroll-line');
let scrollPending=false;
function updateScroll() {
  scrollPending=false;
  const amount=document.documentElement.scrollHeight-innerHeight;
  scrollLine.style.transform='scaleX('+(amount>0?Math.min(1,Math.max(0,scrollY/amount)):0)+')';
}
addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}}, {passive:true});
addEventListener('resize',updateScroll);
updateScroll();

const nav=$('#nav-links'), menu=$('#menu-toggle');
function toggleMenu(open){
  nav.classList.toggle('open',open);
  menu.setAttribute('aria-expanded',String(open));
  menu.setAttribute('aria-label',open?'Close menu':'Open menu');
}
menu.addEventListener('click',()=>toggleMenu(menu.getAttribute('aria-expanded')!=='true'));
nav.addEventListener('click',e=>{if(e.target.closest('a'))toggleMenu(false);});
document.addEventListener('keydown',e=>{if(e.key==='Escape') {toggleMenu(false); closeLightbox();}});

const cityGrid=$('#city-grid');
cities.forEach((city,i)=>{
  const card=el('button','city-card');
  card.type='button';card.dataset.city=city.id;card.setAttribute('aria-pressed',String(i===0));
  card.append(image(cityUrl(city),city.name+' travel destination'));
  const code=el('span','city-card-index','0'+(i+1)+' / EXPLORE');
  const arrow=el('span','city-arrow','↗');arrow.setAttribute('aria-hidden','true');
  const details=el('div','city-card-content');
  details.append(el('small','',city.country.toUpperCase()),el('h3','',city.name));
  card.append(code,arrow,details);
  card.addEventListener('click',()=>{showCity(city);$('#city-spotlight').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'center'});});
  cityGrid.append(card);
});
function showCity(city) {
  currentCity=city;
  $$('.city-card').forEach(card=>card.setAttribute('aria-pressed',String(card.dataset.city===city.id)));
  const src=cityUrl(city);
  const pic=$('#spotlight-image');pic.src=src;pic.alt=city.name+', '+city.country+' city view';
  setText('#spotlight-title',city.name+', '+city.country);
  setText('#spotlight-description',city.intro);
  setText('#spotlight-first',city.first);
  setText('#spotlight-life',city.life);
  const mini=$('#photo-mini');mini.replaceChildren();
  const collection=galleries[city.id]??[];
  const items=[{src,label:'City view · '+city.name,credit:'Destination photograph',url:city.photoCredit?.url || '#'},...collection];
  for(const item of items){
    const a=document.createElement('a');a.href=item.url||'#';a.target='_blank';a.rel='noopener noreferrer';a.title=item.credit||item.label;
    a.append(image(item.src.startsWith('/')?item.src:item.src,item.label));
    a.append(el('span','',truncate(item.label,48)));mini.append(a);
  }
}
showCity(currentCity);
$('#next-city').addEventListener('click',()=>showCity(cities[(cities.indexOf(currentCity)+1)%cities.length]));

const programCatalog=[];
const urls=new Set();
const normalize = item=>({
  id:item.id, name:item.name, tag:item.tag, copy:item.copy, url:item.url,
  cat:String(item.cat||''), level:item.level||'', symbol:item.symbol||'✦', country:item.country||''
});
for(const p of programs){if(!urls.has(p.url)){programCatalog.push(normalize(p));urls.add(p.url);}}
for(const city of cities) {
  for(const [i,op] of city.opportunities.entries()){
    if(urls.has(op.url))continue;
    urls.add(op.url);
    const type=String(op.type||'').toLowerCase();
    const cat=/scholarship|funding/.test(type)?'scholarship':/stem|science|research|engineering/.test(type)?'stem':'education';
    programCatalog.push(normalize({
      id:city.id+'-'+i,
      name:op.title,tag:city.country+' / '+op.type,copy:op.detail,url:op.url,
      cat,level:op.level,symbol:city.code,country:city.name
    }));
  }
}
for(const p of programCatalog) {
  if(!p.country) {
    const text=p.tag.toLowerCase();
    p.country=cities.find(c=>text.includes(c.country.toLowerCase())||text.includes(c.name.toLowerCase()))?.name || '';
  }
}
const existingSaved=storage.get('aa-soft-saved',[]);
const saved=new Set(Array.isArray(existingSaved)?existingSaved:[]);
let filter='all', showAmount=9;
const search=$('#program-search'), countrySelect=$('#program-country'), levelSelect=$('#program-level');
for(const city of cities)countrySelect.add(new Option(city.name,city.name));
const allLevels=[...new Set(programCatalog.map(x=>x.level).filter(Boolean))].sort();
allLevels.forEach(level=>levelSelect.add(new Option(level,level)));
const programGrid=$('#program-grid');
function setFilter(next) {
  filter=next;showAmount=9;
  $$('[data-program-filter]').forEach(btn=>{const active=btn.dataset.programFilter===next;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
  renderPrograms();
}
$$('[data-program-filter]').forEach(btn=>btn.addEventListener('click',()=>setFilter(btn.dataset.programFilter)));
search.addEventListener('input',()=>{showAmount=9;renderPrograms();});
countrySelect.addEventListener('change',()=>{showAmount=9;renderPrograms();});
levelSelect.addEventListener('change',()=>{showAmount=9;renderPrograms();});
$$('[data-jump-filter]').forEach(link=>link.addEventListener('click',()=>setFilter(link.dataset.jumpFilter)));
function saveProgram(id) {
  if(saved.has(id))saved.delete(id);else saved.add(id);
  storage.set('aa-soft-saved',[...saved]);renderPrograms();
}
function renderPrograms() {
  const q=search.value.toLowerCase().trim();
  const country=countrySelect.value,level=levelSelect.value;
  const matched=programCatalog.filter(p=>{
    const matchesCat=filter==='all'||(filter==='saved'&&saved.has(p.id))||p.cat.split(' ').includes(filter);
    const matchesCountry=country==='all'||p.country===country||p.tag.toLowerCase().includes(country.toLowerCase());
    const matchesLevel=level==='all'||p.level===level;
    return matchesCat&&matchesCountry&&matchesLevel&&(!q||(p.name+' '+p.tag+' '+p.copy+' '+p.country).toLowerCase().includes(q));
  });
  programGrid.replaceChildren();
  setText('#saved-count',saved.size);
  setText('#program-count',matched.length+' opportunity'+(matched.length===1?'':'ies').replace('opportunityies','opportunities')+' found');
  const visible=matched.slice(0,showAmount);
  if(!visible.length)programGrid.append(el('p','fineprint','No matching opportunities. Try clearing a filter or search.'));
  for(const p of visible) {
    const card=el('article','program-card');
    const head=el('div','program-card-head');
    head.append(el('span','program-code',p.symbol.slice(0,5)));
    const save=el('button','program-save',saved.has(p.id)?'♥':'♡');save.type='button';save.title=saved.has(p.id)?'Remove saved program':'Save this program';save.setAttribute('aria-label',save.title);save.setAttribute('aria-pressed',String(saved.has(p.id)));save.addEventListener('click',()=>saveProgram(p.id));head.append(save);
    card.append(head,el('div','program-meta',p.tag),el('h3','',p.name),el('p','',truncate(p.copy,190)));
    const end=el('div','program-end');end.append(el('span','',p.level||p.country||'Official program'));
    const link=el('a','','Official website ↗');link.href=p.url;link.target='_blank';link.rel='noopener noreferrer';end.append(link);
    card.append(end);programGrid.append(card);
  }
  const more=$('#show-programs');more.hidden=matched.length<=showAmount;
  if(!more.hidden)more.firstChild.textContent='See '+Math.min(9,matched.length-showAmount)+' more opportunities ';
}
$('#show-programs').addEventListener('click',()=>{showAmount+=9;renderPrograms();});
renderPrograms();

const atlasPhotos=[];
for(const city of cities) {
  atlasPhotos.push({
    id:'city-'+city.id,cat:'city',src:cityUrl(city),title:city.name+', '+city.country,
    credit:city.photoCredit?.label||'Destination photography',
    url:city.photoCredit?.url||'#'
  });
  const gallery=galleries[city.id]??[];
  for(const [i,scene] of gallery.entries())atlasPhotos.push({
    id:'campus-'+city.id+'-'+i,cat:/campus/i.test(scene.label)?'campus':'city',src:scene.src,
    title:scene.label,credit:scene.credit,url:scene.url
  });
}
// 120 different deterministic, internet-sourced photography slots.
// Picsum images are illustrative inspiration; only the destination photos identify a real city.
const themes=['discovery','possibility','journey','curiosity','light','horizon','dream','wonder'];
for(let i=1;i<=120;i++){
  const seed='abroad-world-atlas-'+String(i).padStart(3,'0')+'-'+themes[i%themes.length];
  atlasPhotos.push({
    id:'inspire-'+i,cat:'inspiration',
    src:'https://picsum.photos/seed/'+seed+'/720/960',
    large:'https://picsum.photos/seed/'+seed+'/1280/1600',
    title:'Inspiration '+String(i).padStart(3,'0'),
    credit:'Illustrative travel and lifestyle photography via Lorem Picsum / Unsplash',
    url:'https://picsum.photos/',
  });
}
setText('#atlas-total',atlasPhotos.length);
const atlasGrid=$('#atlas-grid');
let atlasFilter='all',atlasVisible=20;
function filteredPhotos(){return atlasFilter==='all'?atlasPhotos:atlasPhotos.filter(p=>p.cat===atlasFilter);}
function renderAtlas(){
  const photos=filteredPhotos();atlasGrid.replaceChildren();
  for(const photo of photos.slice(0,atlasVisible)){
    const btn=el('button','atlas-tile');btn.type='button';btn.setAttribute('aria-label','Open photo: '+photo.title);
    const img=image(photo.src,photo.title);img.width=480;img.height=560;
    img.addEventListener('error',()=>{if(img.dataset.fallback)return;img.dataset.fallback='1';img.src=cityUrl(cities[(photos.indexOf(photo))%cities.length]);});
    const meta=el('div','atlas-tile-info');meta.append(el('strong','',photo.title),el('span','','↗'));
    btn.append(img,meta);btn.addEventListener('click',()=>openLightbox(photo));atlasGrid.append(btn);
  }
  const more=$('#more-photos');
  more.hidden=atlasVisible>=photos.length;
  setText('#atlas-progress','Showing '+Math.min(atlasVisible,photos.length)+' of '+photos.length+' photos');
}
$$('[data-atlas-filter]').forEach(btn=>btn.addEventListener('click',()=>{
  atlasFilter=btn.dataset.atlasFilter;atlasVisible=20;
  $$('[data-atlas-filter]').forEach(other=>{const active=other===btn;other.classList.toggle('is-active',active);other.setAttribute('aria-pressed',String(active));});
  renderAtlas();
}));
$('#more-photos').addEventListener('click',()=>{atlasVisible+=20;renderAtlas();});
renderAtlas();
const lightbox=$('#lightbox'),lightboxImage=$('#lightbox-image');
let lightboxReturn=null;
function openLightbox(photo) {
  lightboxReturn=document.activeElement;lightbox.hidden=false;
  lightboxImage.src=photo.large||photo.src;lightboxImage.alt=photo.title;
  setText('#lightbox-title',photo.title);
  const credit=$('#lightbox-credit');credit.href=photo.url||'#';credit.textContent='Source: '+truncate(photo.credit,72)+' ↗';
  $('#lightbox-close').focus();
}
function closeLightbox() {
  if(lightbox.hidden)return;
  lightbox.hidden=true;lightboxImage.removeAttribute('src');
  if(lightboxReturn?.focus)lightboxReturn.focus();
}
$('#lightbox-close').addEventListener('click',closeLightbox);
$('#lightbox-backdrop').addEventListener('click',closeLightbox);

let selectedDoc=documents[0];
const toolkitTabs=$('#toolkit-tabs');
documents.forEach((doc,i)=>{
  const btn=el('button','',doc.short||doc.title);btn.type='button';btn.role='tab';btn.id='doc-tab-'+doc.id;btn.setAttribute('aria-controls','toolkit-document');
  btn.setAttribute('aria-selected',String(i===0));
  btn.addEventListener('click',()=>showDocument(doc));
  toolkitTabs.append(btn);
});
function showDocument(doc) {
  selectedDoc=doc;setText('#document-title',doc.title);
  setText('#document-desc',doc.desc);
  setText('#document-text',doc.text);
  setText('#document-status','Customize this example with truthful details.');
  Array.from(toolkitTabs.children).forEach(btn=>btn.setAttribute('aria-selected',String(btn.id==='doc-tab-'+doc.id)));
}
showDocument(selectedDoc);
$('#copy-template').addEventListener('click',async()=>{
  try {await navigator.clipboard.writeText(selectedDoc.text);setText('#document-status','Copied. Make it your own!');}
  catch {setText('#document-status','Select and copy the text above.');}
});
$('#download-template').addEventListener('click',()=>{
  const blob=new Blob([selectedDoc.title+'\n\n'+selectedDoc.text],{type:'text/plain;charset=utf-8'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=selectedDoc.id+'-abroad-aspirants.txt';link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  setText('#document-status','Template download started.');
});

const advisorMessages=$('#advisor-messages'),advisorInput=$('#advisor-input');
function addBubble(message,who='bot'){
  const b=el('div','advisor-bubble '+who,message);
  advisorMessages.append(b);advisorMessages.scrollTop=advisorMessages.scrollHeight;return b;
}
function quickGuide(q) {
  const text=q.toLowerCase();
  if(/lor|recommend|teacher|reference/.test(text))return answers.lor+' \n\nSee the application toolkit for a sample.';
  if(/sop|statement|personal|essay|motivation/.test(text))return answers.sop+'\n\nUse the SOP framework in the toolkit.';
  if(/interview/.test(text))return answers.interview;
  if(/resume|cv/.test(text))return answers.cv;
  if(/scholarship|funding|mext|financial/.test(text))return answers.scholarship;
  if(/deadline|eligib|apply|application/.test(text))return 'Start with the opportunity page and check the official organizer for your citizenship, age, study level, current dates, and documents. Save the relevant programs and build your own application checklist.';
  return 'A good first step is to explore destinations and choose one official opportunity that matches your interests. Check its current eligibility and documents. If you want peer experiences, join our WhatsApp community. You can also ask me about scholarships, LORs, SOPs, CVs, and interviews.';
}
let busy=false;
async function askAdvisor(question) {
  const q=String(question||'').trim();
  if(!q||busy)return;
  busy=true;addBubble(q,'you');
  const placeholder=addBubble('Thinking through your question…');
  const controller=new AbortController();const abort=setTimeout(()=>controller.abort(),12000);
  try{
    const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({city:currentCity.id,messages:[{role:'user',content:q}]}),signal:controller.signal});
    if(!response.ok)throw Error('Guide fallback');
    const result=(await response.text()).trim();
    if(!result)throw Error('Empty reply');
    placeholder.textContent=result.slice(0,6500);
  }catch{
    placeholder.textContent=quickGuide(q);
  }finally{clearTimeout(abort);busy=false;advisorMessages.scrollTop=advisorMessages.scrollHeight;}
}
$('#advisor-form').addEventListener('submit',e=>{e.preventDefault();const q=advisorInput.value;advisorInput.value='';askAdvisor(q);});
$$('[data-prompt]').forEach(btn=>btn.addEventListener('click',()=>askAdvisor(btn.dataset.prompt)));

if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('reduced-motion');

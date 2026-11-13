import {cities} from './lib/destinations.js';
import {galleries} from './lib/galleries.js';

export function setupJourney({flight,motionEnabled}) {
 const $=s=>document.querySelector(s);
 let paused=false, last=-1, chosen=flight.current();
 const search=$('#city-search');
 function updateSearch() {
  const q=search.value.trim().toLowerCase(); let count=0;
  [...$('#city-buttons').children].forEach((button,i)=>{button.hidden=!(cities[i].name+' '+cities[i].country).toLowerCase().includes(q);if(!button.hidden)count++;});
  $('#no-cities').hidden=Boolean(count);
 }
 search.addEventListener('input',updateSearch);
 search.addEventListener('keydown',e=>{if(e.key==='Enter'){const button=[...$('#city-buttons').children].find(b=>!b.hidden);button?.click();}});
 const tour=$('#tour-toggle');
 $('#globe-scene').addEventListener('pointerdown',()=>{flight.takeControl();status();});
 function status(){const manual=flight.manual();tour.textContent=paused||manual?'Resume tour':'Pause tour';tour.setAttribute('aria-pressed',String(paused||manual));$('#tour-status').textContent=manual?'Your destination is selected. Resume the tour whenever you like.':paused?'Tour paused. Pick any destination.':'Scroll to explore. Choose a city to take control.';}
 tour.addEventListener('click',()=>{if(flight.manual()||paused){flight.resume();paused=false;last=-1;}else paused=true;status();});
 function render(city) {
  chosen=city;status();
  $('#share-status').textContent='';
  const gallery=$('#scene-gallery');gallery.replaceChildren();
  const scenes=[{src:'/assets/cities/'+city.id+'.webp',label:city.landmark,credit:city.photoCredit.label,url:city.photoCredit.url},...(galleries[city.id]??[])];
  for(const scene of scenes){
   const figure=document.createElement('figure');const image=document.createElement('img');
   image.src=scene.src;image.alt=scene.label;image.loading='lazy';image.decoding='async';image.width=900;image.height=600;
   const caption=document.createElement('figcaption');const title=document.createElement('strong');title.textContent=scene.label;
   const link=document.createElement('a');link.href=scene.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=scene.credit;
   caption.append(title,link);figure.append(image,caption);gallery.append(figure);
  }
  [...$('#city-opportunities').children].forEach((card,i)=>{
   const button=document.createElement('button');button.type='button';button.className='city-save';
   // Catalog IDs are resolved by URL, including entries shared with the main board.
   button.dataset.url=city.opportunities[i].url;
   button.addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('aa-toggle-url',{detail:button.dataset.url}));syncSaves();});
   card.append(button);
  });syncSaves();
 }
 function syncSaves(){document.querySelectorAll('.city-save').forEach(button=>{
  const selected=window.aaSavedURL?.(button.dataset.url)??false;
  button.textContent=selected?'Saved to shortlist ✓':'Save to shortlist +';button.setAttribute('aria-pressed',String(selected));
 });}
 window.addEventListener('aa-city',e=>render(e.detail));
 window.addEventListener('aa-saves-rendered',syncSaves);
 $('#share-city').addEventListener('click',async()=>{
  const url=location.origin+'/city/'+chosen.id;
  try{if(navigator.share)await navigator.share({title:'Study in '+chosen.name+' · Abroad Aspirants',url});else await navigator.clipboard.writeText(url);$('#share-status').textContent='Guide link shared or copied.';}
  catch{ $('#share-status').textContent=url; }
 });
 $('#next-city').addEventListener('click',()=>flight.choose(cities[(cities.indexOf(chosen)+1)%cities.length].id));
 let pending=false;
 function scroll(){
  pending=false;
  const bounds=$('#home').getBoundingClientRect();
  const progress=Math.max(0,Math.min(.999,scrollY/Math.max(1,$('#destinations').offsetTop)));
  if(motionEnabled()&&!paused&&!flight.manual()&&bounds.bottom>0){
   const index=Math.floor(progress*cities.length);if(index!==last){last=index;flight.tour(cities[index].id);}
  }
  const guide=$('.flight-guide');const p=scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight);
  guide.style.opacity=scrollY>500?'1':'0';
  guide.style.transform='translateX('+((Math.sin(p*Math.PI*8)+1)*.5*(innerWidth-85))+'px) rotate('+(Math.cos(p*Math.PI*8)*35)+'deg)';
 }
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(scroll);}},{passive:true});
 render(chosen);scroll();
}

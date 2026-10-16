import './style.css';
import {REGIONS, PHASES, emptyFilters, filterProjects, commissioningLabel} from './catalog.js';
const app=document.querySelector('#app');
let projects=[], filters=emptyFilters(), asOf='';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const header=()=>'<header><a class="brand" href="#/">Библиотека проектов ГЧП</a><span>Волго-Вятский банк</span></header>';
const footer=()=>'<footer>Библиотека проектов ГЧП <span>Волго-Вятский банк</span></footer>';
const badge=p=>`<span class="badge ${p.phase==='Инвестиционная'?'investment':''}">${esc(p.phase)} фаза</span>`;
const photo=(p,detail=false)=>p.photo?`<img class="project-photo ${detail?'detail-photo':''}" src="${esc(p.photo)}" alt="${esc(p.name)}" ${detail?'':'loading="lazy"'}>`:`<div class="photo-placeholder ${detail?'detail-photo':''}"><span aria-hidden="true">▧</span>Фото пока нет</div>`;
const select=(label,key,values,all)=>`<label>${label}<select id="filter-${key}" name="${key}"><option value="">${all}</option>${values.map(v=>`<option value="${esc(v)}" ${filters[key]===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>`;
const card=p=>`<article class="project-card"><a class="card-link" href="#/project/${encodeURIComponent(p.id)}">${photo(p)}<div class="card-content">${badge(p)}<h2>${esc(p.name)}</h2><p class="region">${esc(p.region)}</p><dl><div><dt>Отрасль</dt><dd>${esc(p.industry)}</dd></div><div><dt>Инвестор</dt><dd>${esc(p.investor)}</dd></div></dl><span class="card-action">Подробнее о проекте <span aria-hidden="true">↗</span></span></div></a></article>`;
function renderCatalog(){
 const selected=filterProjects(projects,filters);
 app.innerHTML=`${header()}<main><section class="intro"><p class="eyebrow">ОПЫТ РЕАЛИЗАЦИИ · ВВБ</p><h1 tabindex="-1">Проекты, которые<br>меняют нашу территорию</h1><p class="intro-text">Проекты ГЧП с участием Сбербанка: от инвестиций до эксплуатации.</p><p class="snapshot">Данные по состоянию на ${esc(asOf)}</p></section><form class="filters" aria-label="Фильтры проектов">${select('Регион','region',REGIONS,'Все регионы')}${select('Отрасль','industry',[...new Set(projects.map(p=>p.industry))],'Все отрасли')}${select('Фаза реализации','phase',PHASES,'Все фазы')}<button class="reset" type="reset">Сбросить фильтры</button></form><section aria-label="Каталог проектов"><div class="results-heading"><h2>Каталог проектов</h2><p role="status" aria-live="polite">Найдено проектов: <strong>${selected.length}</strong></p></div>${selected.length?`<div class="project-grid">${selected.map(card).join('')}</div>`:'<div class="empty"><h3>Проекты не найдены</h3><p>Попробуйте изменить условия отбора.</p><button id="empty-reset" class="primary">Сбросить фильтры</button></div>'}</section></main>${footer()}`;
 document.querySelector('.filters').addEventListener('change',e=>{const k=e.target.name;if(!(k in filters))return;filters[k]=e.target.value;renderCatalog();document.querySelector(`#filter-${k}`).focus();});
 const reset=()=>{filters=emptyFilters();renderCatalog();document.querySelector('#filter-region').focus();};
 document.querySelector('.filters').addEventListener('reset',e=>{e.preventDefault();reset();});
 document.querySelector('#empty-reset')?.addEventListener('click',reset);
}
function renderProject(id){
 const p=projects.find(p=>p.id===id);
 if(!p){app.innerHTML=`${header()}<main><a class="back" href="#/">← К каталогу</a><h1 tabindex="-1">Проект не найден</h1><p>Проверьте адрес или выберите проект в каталоге.</p></main>${footer()}`;return;}
 const fields=[['Регион',p.region],['Отрасль',p.industry],['Инвестор',p.investor],['Фаза реализации',p.phase],[commissioningLabel(p),p.commissioning||'Уточняется'],['Объём инвестиций',p.investment||'Уточняется']];
 app.innerHTML=`${header()}<main class="project-detail"><a class="back" href="#/">← К каталогу</a><p class="snapshot">Данные по состоянию на ${esc(asOf)}</p>${badge(p)}<h1 tabindex="-1">${esc(p.name)}</h1><div class="detail-layout">${photo(p,true)}<dl class="project-fields">${fields.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div></main>${footer()}`;
}
function route(){const hash=location.hash||'#/';if(hash==='#/'||hash==='#')renderCatalog();else{let id='';try{if(hash.startsWith('#/project/'))id=decodeURIComponent(hash.slice(10));}catch{}renderProject(id);}window.scrollTo(0,0);}
async function start(){try{const response=await fetch(`${import.meta.env.BASE_URL}local-data/projects.json`);if(!response.ok)throw Error();const data=await response.json();projects=data.projects;asOf=data.asOf;route();window.addEventListener('hashchange',()=>{route();document.querySelector('h1')?.focus();});}catch{app.innerHTML=`${header()}<main><h1>Данные пока не подключены</h1><p>Для просмотра каталога добавьте локальный набор данных по инструкции в README.</p></main>${footer()}`;}}
start();

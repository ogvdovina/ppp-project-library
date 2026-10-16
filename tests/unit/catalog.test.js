import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { REGIONS, PHASES, emptyFilters, filterProjects, commissioningLabel } from '../../src/catalog.js';
const fixtures = [
  {id:'a',region:'A',industry:'Образование',phase:'Инвестиционная'},
  {id:'b',region:'A',industry:'Медицина',phase:'Эксплуатационная'},
  {id:'c',region:'B',industry:'Образование',phase:'Эксплуатационная'},
  {id:'d',region:'A',industry:'Образование',phase:'Эксплуатационная'}
];
const ids = filters => filterProjects(fixtures,filters).map(p=>p.id);
describe('Фильтры на искусственных записях',()=>{
  it.each([
    [{},['a','b','c','d']],
    [{region:'A'},['a','b','d']],
    [{industry:'Медицина'},['b']],
    [{phase:'Инвестиционная'},['a']],
    [{region:'A',industry:'Образование',phase:'Эксплуатационная'},['d']],
    [{region:'B',industry:'Медицина'},[]],
    [{region:'unknown'},[]]
  ])('применяет условия %j',(filters,expected)=>expect(ids(filters)).toEqual(expected));
  it('сброс независим от предыдущего состояния и не меняет источник',()=>{
    const original=structuredClone(fixtures), filters=emptyFilters();
    filters.region='A';
    expect(ids(filters)).toHaveLength(3);
    expect(ids(emptyFilters())).toHaveLength(4);
    expect(emptyFilters()).toEqual({region:'',industry:'',phase:''});
    expect(fixtures).toEqual(original);
    expect(filterProjects([])).toEqual([]);
  });
  it('имеет все девять согласованных территорий и обе фазы',()=>{
    expect(REGIONS).toHaveLength(9);
    expect(new Set(REGIONS)).toEqual(new Set(['Нижегородская область','Республика Татарстан','Пермский край','Владимирская область','Кировская область','Чувашская Республика','Удмуртская Республика','Республика Мордовия','Республика Марий Эл']));
    expect(PHASES).toEqual(['Инвестиционная','Эксплуатационная']);
    expect(commissioningLabel({phase:'Инвестиционная'})).toBe('Плановый ввод в эксплуатацию');
    expect(commissioningLabel({phase:'Эксплуатационная'})).toBe('Фактический ввод в эксплуатацию');
  });
});
// Рабочие записи читаются при запуске и не копируются в tracked фикстуры.
const data=JSON.parse(readFileSync(new URL('../../public/local-data/projects.json',import.meta.url),'utf8'));
describe('Локальный согласованный набор',()=>{
  it('имеет срез 13.02.2026, 29 уникальных записей и распределение фаз 27/2',()=>{
    expect(data.asOf).toBe('13.02.2026');
    expect(data.projects).toHaveLength(29);
    expect(new Set(data.projects.map(p=>p.id)).size).toBe(29);
    expect(filterProjects(data.projects,{phase:'Эксплуатационная'})).toHaveLength(27);
    expect(filterProjects(data.projects,{phase:'Инвестиционная'})).toHaveLength(2);
  });
  it('имеет обязательные поля, объединённого инвестора, без подмены инвестиций и планового ввода',()=>{
    for(const p of data.projects){
      for(const key of ['id','name','region','industry','investor','phase','commissioning','investment']){
        expect(typeof p[key]).toBe('string'); expect(p[key].trim().length).toBeGreaterThan(0);
      }
      expect(REGIONS).toContain(p.region); expect(p.industry).toBe('Образование');
      expect(p.investor).toContain(' / '); expect(p.investment).toBe('Уточняется');
      if(p.phase==='Инвестиционная') expect(p.commissioning).toBe('Уточняется');
      else expect(p.commissioning).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    }
  });
  it('имеет три уникальные существующие локальные фотографии и 26 заглушек',()=>{
    const photos=data.projects.filter(p=>p.photo);
    expect(photos).toHaveLength(3); expect(new Set(photos.map(p=>p.photo)).size).toBe(3);
    expect(data.projects.filter(p=>p.photo===null)).toHaveLength(26);
    for(const {photo} of photos){expect(photo.startsWith('/local-data/')).toBe(true);expect(existsSync(resolve('public',photo.slice(1)))).toBe(true);}
  });
});

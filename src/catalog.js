export const REGIONS = ['Нижегородская область','Республика Татарстан','Пермский край','Владимирская область','Кировская область','Чувашская Республика','Удмуртская Республика','Республика Мордовия','Республика Марий Эл'];
export const PHASES = ['Инвестиционная','Эксплуатационная'];
export function emptyFilters() { return {region:'',industry:'',phase:''}; }
export function filterProjects(projects, filters = {}) { return projects.filter(p => ['region','industry','phase'].every(k => !filters[k] || p[k] === filters[k])); }
export function commissioningLabel(p) { return p.phase === 'Эксплуатационная' ? 'Фактический ввод в эксплуатацию' : 'Плановый ввод в эксплуатацию'; }

import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const {projects}=JSON.parse(readFileSync(new URL('../../public/local-data/projects.json',import.meta.url),'utf8'));
const cards=page=>page.locator('article.project-card');
const field=(page,label)=>page.locator('.project-fields > div').filter({has:page.getByText(label,{exact:true})}).locator('dd');
test.beforeEach(async({page})=>{page.__errors=[];page.on('pageerror',e=>page.__errors.push(e.message));});
test.afterEach(async({page})=>expect(page.__errors).toEqual([]));
test('Каталог, совместный отбор, пустая выборка и сброс',async({page})=>{
  await page.goto('/');
  await expect(page).toHaveTitle('Библиотека проектов ГЧП');
  await expect(cards(page)).toHaveCount(29);
  await expect(page.getByRole('status')).toHaveText('Найдено проектов: 29');
  await expect(page.getByText('Данные по состоянию на 13.02.2026')).toBeVisible();
  await expect(page.getByLabel('Регион').locator('option')).toHaveCount(10);
  const sample=projects.find(p=>p.phase==='Эксплуатационная');
  await page.getByLabel('Регион').selectOption(sample.region);
  await page.getByLabel('Отрасль').selectOption('Образование');
  await page.getByLabel('Фаза реализации').selectOption('Эксплуатационная');
  const expected=projects.filter(p=>p.region===sample.region&&p.industry==='Образование'&&p.phase==='Эксплуатационная');
  await expect(cards(page)).toHaveCount(expected.length);
  await expect(cards(page).locator('h2')).toHaveText(expected.map(p=>p.name));
  const options=await page.getByLabel('Регион').locator('option').evaluateAll(nodes=>nodes.map(n=>n.value));
  const absent=options.find(region=>region&&!projects.some(p=>p.region===region));
  expect(absent).toBeTruthy();
  await page.getByLabel('Регион').selectOption(absent);
  await expect(cards(page)).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Проекты не найдены'})).toBeVisible();
  await page.locator('.empty').getByRole('button',{name:'Сбросить фильтры'}).click();
  await expect(cards(page)).toHaveCount(29);
  for(const label of ['Регион','Отрасль','Фаза реализации'])await expect(page.getByLabel(label)).toHaveValue('');
});
test('Фото, согласованные поля, возврат с фильтрами и reload прямой ссылки',async({page})=>{
  const p=projects.find(p=>p.photo);
  await page.goto('/');
  await page.getByLabel('Регион').selectOption(p.region);
  await page.getByLabel('Отрасль').selectOption(p.industry);
  await page.getByLabel('Фаза реализации').selectOption(p.phase);
  await cards(page).filter({has:page.getByRole('heading',{name:p.name,exact:true})}).getByRole('link').click();
  await expect(page).toHaveURL(new RegExp(`/#/project/${p.id}$`));
  await expect(page.getByRole('heading',{level:1})).toHaveText(p.name);
  for(const [label,value] of [['Регион',p.region],['Отрасль',p.industry],['Инвестор',p.investor],['Фаза реализации',p.phase],['Фактический ввод в эксплуатацию',p.commissioning],['Объём инвестиций','Уточняется']])await expect(field(page,label)).toHaveText(value);
  const image=page.getByRole('img',{name:p.name,exact:true});
  await expect(image).toHaveAttribute('src',p.photo);
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  await page.getByRole('link',{name:'← К каталогу'}).click();
  await expect(page.getByLabel('Регион')).toHaveValue(p.region);
  await expect(page.getByLabel('Отрасль')).toHaveValue(p.industry);
  await expect(page.getByLabel('Фаза реализации')).toHaveValue(p.phase);
  await page.goto(`/#/project/${p.id}`);await page.reload();
  await expect(page.getByRole('heading',{level:1})).toHaveText(p.name);
});
test('Инвестиционная фаза, неизвестные адреса, отсутствие фото и значений',async({page})=>{
  const p=projects.find(p=>p.phase==='Инвестиционная'&&!p.photo);
  await page.goto(`/#/project/${p.id}`);
  await expect(page.getByText('Фото пока нет')).toBeVisible();
  await expect(field(page,'Плановый ввод в эксплуатацию')).toHaveText('Уточняется');
  await expect(field(page,'Объём инвестиций')).toHaveText('Уточняется');
  await expect(page.locator('.badge')).toHaveText('Инвестиционная фаза');
  for(const hash of ['#/project/not-a-real-project','#/project/%E0%A4%A','#/wrong-route']){
    await page.goto(`/${hash}`);
    await expect(page.getByRole('heading',{name:'Проект не найден'})).toBeVisible();
    await expect(page.getByRole('link',{name:'← К каталогу'})).toBeVisible();
  }
});
for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){
  test(`Экран ${viewport.width}: клавиатура и снимки QA`,async({page})=>{
    await page.setViewportSize(viewport);await page.goto('/');await expect(cards(page)).toHaveCount(29);
    await page.keyboard.press('Tab');await expect(page.locator('header .brand')).toBeFocused();
    for(const label of ['Регион','Отрасль','Фаза реализации']){await page.keyboard.press('Tab');await expect(page.getByLabel(label)).toBeFocused();}
    await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Сбросить фильтры'})).toBeFocused();
    await page.keyboard.press('Enter');await expect(page.getByLabel('Регион')).toBeFocused();
    for(let i=0;i<4;i++)await page.keyboard.press('Tab');
    await expect(cards(page).first().getByRole('link')).toBeFocused();await page.keyboard.press('Enter');
    await expect(page.locator('main h1')).toHaveText(projects[0].name);await expect(page.locator('main h1')).toBeFocused();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    mkdirSync('reports/001-project-catalog/01/screenshots',{recursive:true});
    await page.screenshot({path:`reports/001-project-catalog/01/screenshots/detail-${viewport.width}.png`,fullPage:true});
    await page.getByRole('link',{name:'← К каталогу'}).click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`reports/001-project-catalog/01/screenshots/catalog-${viewport.width}.png`,fullPage:true});
  });
}
test('Отсутствующий локальный набор объясняется пользователю',async({page})=>{
  await page.route('**/local-data/projects.json',route=>route.fulfill({status:404,body:''}));await page.goto('/');
  await expect(page.getByRole('heading',{name:'Данные пока не подключены'})).toBeVisible();await expect(cards(page)).toHaveCount(0);
});

import { test, expect } from '@playwright/test';

test('Каркас загружается без ошибок JavaScript и без данных проектов', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  await expect(page).toHaveTitle('Библиотека проектов ГЧП');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Библиотека проектов ГЧП');
  await expect(page.getByRole('heading', { name: 'Каркас сайта готов' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Волго-Вятский банк', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'reports/000-scaffold/scaffold.png', fullPage: true });
});

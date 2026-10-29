import { test, expect } from '@playwright/test';
import { openDemo } from './helpers';

test('switching language updates header, toolbar, sidebar and bottom bar without a reload', async ({ page }) => {
	await openDemo(page, 'light');
	await expect(page.locator('#clear')).toContainText('Close demo database');
	await expect(page.locator('#zoomInBtn')).toContainText('zoom in');

	await page.click('#languageMenuBtn');
	await page.click('#lang-sv');

	await expect(page.locator('#clear')).toContainText('Stäng demodatabasen');
	await expect(page.locator('#zoomInBtn')).toContainText('zooma in');
	await expect(page.locator('#showHierarchy')).toContainText('Hierarki');
	await expect(page.locator('.sb-data-selector')).toContainText('Databas');
	await expect(page.locator('.artic-bundle-outer')).toContainText('Yttranden');
	expect(await page.evaluate(() => document.documentElement.lang)).toBe('sv');

	await page.click('#languageMenuBtn', { timeout: 5000 });
	await page.click('#lang-en', { timeout: 5000 });
	await expect(page.locator('#clear')).toContainText('Close demo database');
});

test('?lang=sv is honoured without persisting', async ({ page }) => {
	await page.goto('/?lang=sv');
	await expect(page.locator('h1')).toHaveText('Välkommen till Artic');
	expect(await page.evaluate(() => localStorage.getItem('artic-lang'))).toBeNull();
});

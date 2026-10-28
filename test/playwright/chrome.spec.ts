import { test, expect } from '@playwright/test';

test.describe('chrome levels (start view)', () => {
	test('full: header with logo, footer in the start view', async ({ page }) => {
		await page.goto('/?chrome=full');
		await expect(page.locator('.sb-header .sb-logo')).toBeVisible();
		await expect(page.locator('.sb-footer')).toBeVisible();
	});

	test('embedded: header without logo, no footer', async ({ page }) => {
		await page.goto('/?chrome=embedded');
		await expect(page.locator('.sb-header')).toBeVisible();
		await expect(page.locator('.sb-header .sb-logo')).toHaveCount(0);
		await expect(page.locator('.sb-footer')).toHaveCount(0);
		await expect(page.locator('#aboutBtn')).toBeVisible();
	});

	test('toolbar: no header; data selector and menu live in the toolbar', async ({ page }) => {
		await page.goto('/?chrome=toolbar');
		await expect(page.locator('.sb-header')).toHaveCount(0);
		await expect(page.locator('.sb-toolbar .sb-data-selector')).toBeVisible();
		await expect(page.locator('.sb-toolbar #aboutBtn')).toBeVisible();
	});
});

test('theme and language menus work from the header', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	await page.click('#themeMenuBtn');
	await page.click('#theme-dark');
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
	await page.click('#languageMenuBtn');
	await page.click('#lang-sv');
	await expect(page.locator('h1')).toHaveText('Välkommen till Artic');
	expect(await page.evaluate(() => document.documentElement.lang)).toBe('sv');
});

test('start view uses Jost for the headline and the serif body face', async ({ page }) => {
	await page.goto('/');
	const h1 = await page.locator('.sb-start h1').evaluate((e) => getComputedStyle(e).fontWeight);
	const p = await page.locator('.sb-start p.sb-prose').first().evaluate((e) => getComputedStyle(e).fontFamily);
	expect(h1).toBe('300');
	expect(p).toContain('Noto Serif');
});

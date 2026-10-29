import { test, expect } from '@playwright/test';
import { openDemo } from './helpers';

test('canvases redraw when the OS theme flips, without a reload', async ({ page }) => {
	await openDemo(page, 'light');
	await page.waitForTimeout(2500);
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');
	const light = await page.screenshot();

	await page.emulateMedia({ colorScheme: 'dark' });
	await page.waitForTimeout(1500);
	expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
	const dark = await page.screenshot();

	expect(Buffer.compare(light, dark)).not.toBe(0);
});

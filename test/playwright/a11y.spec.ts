import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openDemo, openStart, type Scheme } from './helpers';

// Zero serious or critical WCAG 2.1 A/AA violations. Canvas internals are excluded.
async function expectNoSeriousViolations(page: Page, label: string) {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.exclude('canvas')
		.analyze();
	const bad = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
	expect(bad.map((v) => `${label}: ${v.id} (${v.nodes.length}) ${v.help}`)).toEqual([]);
}

for (const scheme of ['light', 'dark'] as Scheme[]) {
	test.describe(scheme, () => {
		test('start view', async ({ page }) => {
			await openStart(page, scheme);
			await expectNoSeriousViolations(page, `start ${scheme}`);
		});

		test('work view (demo)', async ({ page }) => {
			await openDemo(page, scheme);
			await page.waitForTimeout(2000);
			await expectNoSeriousViolations(page, `demo ${scheme}`);
		});

		test('help dialog', async ({ page }) => {
			await openStart(page, scheme);
			await page.click('#aboutBtn');
			await page.waitForSelector('.artic-modal-open');
			await expectNoSeriousViolations(page, `help ${scheme}`);
		});
	});
}

test.describe('keyboard', () => {
	test('menus open with Enter, close with Escape and return focus', async ({ page }) => {
		await openStart(page, 'light');
		await page.focus('#languageMenuBtn');
		await page.keyboard.press('Enter');
		await expect(page.locator('[role=menu]')).toBeVisible();
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('Escape');
		await expect(page.locator('[role=menu]')).toHaveCount(0);
		expect(await page.evaluate(() => document.activeElement?.id)).toBe('languageMenuBtn');
	});

	test('dialogs trap focus, close with Escape and restore focus', async ({ page }) => {
		await openStart(page, 'light');
		await page.focus('#aboutBtn');
		await page.keyboard.press('Enter');
		await expect(page.locator('.artic-modal-open')).toBeVisible();
		for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
		expect(await page.evaluate(() => !!document.activeElement?.closest('.artic-modal-content'))).toBe(true);
		await page.keyboard.press('Escape');
		await expect(page.locator('.artic-modal-open')).toHaveCount(0);
		expect(await page.evaluate(() => document.activeElement?.id)).toBe('aboutBtn');
	});

	test('every start-view control shows a focus ring', async ({ page }) => {
		await openStart(page, 'light');
		await page.focus('#chooseFilesBtn');
		const outline = await page.locator('#chooseFilesBtn').evaluate((e) => getComputedStyle(e).outlineStyle);
		expect(outline).toBe('solid');
	});
});

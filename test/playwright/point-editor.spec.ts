import { test, expect } from '@playwright/test';
import { openLocalFiles } from './helpers';

test('point label editor is wide enough and inside its level', async ({ page }) => {
	await openLocalFiles(page, 'light');
	const canvas = page.locator('canvas.artic-level-canvas-markup').nth(1); // Tone (EVENT)
	const box = (await canvas.boundingBox())!;
	for (let x = 20; x < box.width; x += 40) {
		await page.mouse.dblclick(box.x + x, box.y + box.height / 2);
		if (await page.locator('textarea.artic-label-edit').count()) break;
	}
	const ta = page.locator('textarea.artic-label-edit');
	await expect(ta).toHaveCount(1);
	const r = (await ta.boundingBox())!;
	expect(r.width).toBeGreaterThanOrEqual(60);
	expect(r.y).toBeGreaterThanOrEqual(box.y - 1);
	expect(r.y + r.height).toBeLessThanOrEqual(box.y + box.height + 3);
});

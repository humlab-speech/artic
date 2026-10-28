import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { openStart, openDemo, openLocalFiles, openUrlMode, openWs, type Scheme } from './helpers';

// Capture mode (VISUAL_CAPTURE=1) writes PNGs to __captures__/<phase>/ without asserting.
// Assertions are switched on in Task 8.2.
const capture = !!process.env.VISUAL_CAPTURE;
const phase = process.env.VISUAL_PHASE || 'baseline';

const scenarios: Record<string, (p: import('@playwright/test').Page, s: Scheme) => Promise<void>> = {
	start: openStart,
	demo: openDemo,
	local: openLocalFiles,
	url: openUrlMode,
	ws: openWs,
};

for (const scheme of ['light', 'dark'] as Scheme[]) {
	for (const [name, open] of Object.entries(scenarios)) {
		test(`${name} (${scheme})`, async ({ page }) => {
			test.skip(name === 'ws' && !process.env.ARTIC_WS, 'set ARTIC_WS=1 with the example WS server running');
			// Open item: in headless Chromium the uploaded files reach the file input (change fires with
			// both files) but the app never switches to local mode and shows no error. Cause not identified.
			test.fixme(name === 'local', 'local-file upload does not complete in headless Chromium');
			await open(page, scheme);
			// Canvases render after the loading overlay clears
			if (name !== 'start') await page.waitForTimeout(2500);
			if (capture) {
				const dir = `test/playwright/__captures__/${phase}`;
				mkdirSync(dir, { recursive: true });
				await page.screenshot({ path: `${dir}/${name}-${scheme}.png` });
			} else {
				await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, { maxDiffPixelRatio: 0.01 });
			}
		});
	}
}

test('IPA renders from the bundled Noto Sans subset', async ({ page }) => {
	await openStart(page, 'light');
	const ok = await page.evaluate(async () => {
		await document.fonts.load('400 1rem "Artic Noto Sans"', 'ʃ̩ ŋ̊ ɛ̃ t͡s');
		return document.fonts.check('1rem "Artic Noto Sans"', 'ʃ̩ ŋ̊ ɛ̃ t͡s');
	});
	expect(ok).toBe(true);
});

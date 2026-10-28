import { test, expect, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { openStart, openDemo, openLocalFiles, openUrlMode, openWs, type Scheme, type Query } from './helpers';

// Visual regression. With VISUAL_CAPTURE=1 the PNGs are written to __captures__/<phase>/
// without asserting. Otherwise each screenshot is compared with its committed baseline
// (test/playwright/visual.spec.ts-snapshots/, one set per platform):
//   update baselines:  npx playwright test visual.spec.ts --update-snapshots
const capture = !!process.env.VISUAL_CAPTURE;
const phase = process.env.VISUAL_PHASE || 'baseline';

type Open = (p: Page, s: Scheme, q?: Query) => Promise<void>;
interface Scenario { name: string; open: Open; query?: Query; schemes?: Scheme[]; settle?: number }

const both: Scheme[] = ['light', 'dark'];
const scenarios: Scenario[] = [
	// start, local, demo, url and server, light and dark
	{ name: 'start', open: openStart },
	{ name: 'demo', open: openDemo, settle: 3000 },
	{ name: 'local', open: openLocalFiles, settle: 3000 },
	{ name: 'url', open: openUrlMode, settle: 3000 },
	{ name: 'ws', open: openWs, settle: 3000 },
	// Swedish (start and work views)
	{ name: 'start-sv', open: openStart, query: '?lang=sv' },
	{ name: 'demo-sv', open: openDemo, query: '?lang=sv', schemes: ['light'], settle: 3000 },
	// chrome levels (work view, light)
	{ name: 'demo-chrome-embedded', open: openDemo, query: '?chrome=embedded', schemes: ['light'], settle: 3000 },
	{ name: 'demo-chrome-toolbar', open: openDemo, query: '?chrome=toolbar', schemes: ['light'], settle: 3000 },
	{ name: 'start-chrome-toolbar', open: openStart, query: '?chrome=toolbar', schemes: ['light'] },
];

for (const sc of scenarios) {
	for (const scheme of sc.schemes ?? both) {
		test(`${sc.name} (${scheme})`, async ({ page }) => {
			test.skip(sc.name === 'ws' && !process.env.ARTIC_WS, 'set ARTIC_WS=1 with the example WS server running');
			// Open item: in headless Chromium the uploaded files reach the file input (change fires with
			// both files) but the app never switches to local mode and shows no error. Cause not identified.
			test.fixme(sc.name === 'local', 'local-file upload does not complete in headless Chromium');
			await sc.open(page, scheme, sc.query);
			if (sc.settle) await page.waitForTimeout(sc.settle); // canvases render after the loading overlay clears
			const file = `${sc.name}-${scheme}.png`;
			if (capture) {
				const dir = `test/playwright/__captures__/${phase}`;
				mkdirSync(dir, { recursive: true });
				await page.screenshot({ path: `${dir}/${file}` });
			} else {
				await expect(page).toHaveScreenshot(file, { maxDiffPixelRatio: 0.01 });
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

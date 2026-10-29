import { test, expect } from '@playwright/test';
import { openWs } from './helpers';

// Needs the example server: `cd exampleServers && node nodeEmuProtocolWsServer.js` and ARTIC_WS=1.
test.skip(!process.env.ARTIC_WS, 'set ARTIC_WS=1 with the example WS server running');

test('server mode: the first bundle loads from the example server', async ({ page }) => {
	// Same on master (a2a36042): the page throws "ReferenceError: level is not defined" and stays on
	// "Loading bundle list..." with the example server, so this is not caused by the redesign.
	test.fixme(true, 'example WS flow stalls on master too (ReferenceError: level is not defined)');
	await openWs(page, 'light');
	await expect(page.locator('.sb-data-selector .sb-count')).toContainText('of', { timeout: 20_000 });
	await expect(page.locator('#bundleListSideBarOpen')).not.toContainText('–', { timeout: 20_000 });
});

test('server mode: Save in the header, no structure editing or export', async ({ page }) => {
	await openWs(page, 'light');
	await page.waitForTimeout(3000);
	await expect(page.locator('.sb-data-selector')).toContainText('Save');
	await expect(page.locator('#downloadTextgrid')).toHaveCount(0);
	await expect(page.locator('.sb-toolbar')).not.toContainText('Segment level');
	await expect(page.locator('.sb-toolbar')).not.toContainText('Rename level');
	await expect(page.locator('.sb-data-selector')).not.toContainText('Local mode');
});

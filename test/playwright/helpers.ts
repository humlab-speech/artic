import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export type Scheme = 'light' | 'dark';

/** Optional query string such as `?lang=sv` or `?chrome=embedded`. */
export type Query = string;

const port = () => process.env.ARTIC_PORT || '9000';

export async function openStart(page: Page, scheme: Scheme, query: Query = '') {
	await page.emulateMedia({ colorScheme: scheme });
	await page.goto('/' + query);
	await page.waitForLoadState('networkidle');
}

/** Demo database via the start view's demo menu. */
export async function openDemo(page: Page, scheme: Scheme, query: Query = '', index = 0) {
	await openStart(page, scheme, query);
	await page.click('#demoDB');
	await page.click(`#demo${index}`);
	await page.waitForSelector('.sb-toolbar', { timeout: 30_000 });
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

export async function openLocalFiles(page: Page, scheme: Scheme, query: Query = '') {
	await openStart(page, scheme, query);
	// annotJSON is paired with the audio by base name, so it is uploaded as msajc003.json
	await page.setInputFiles('input[type=file]', [
		{ name: 'msajc003.wav', mimeType: 'audio/wav', buffer: readFileSync('iframe-demo/msajc003.wav') },
		{ name: 'msajc003.json', mimeType: 'application/json', buffer: readFileSync('iframe-demo/msajc003_annot.json') },
	]);
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

export async function openUrlMode(page: Page, scheme: Scheme, query: Query = '') {
	await page.emulateMedia({ colorScheme: scheme });
	const base = `http://localhost:${port()}/demoDBs/ae`;
	const extra = query ? '&' + query.replace(/^\?/, '') : '';
	await page.goto(`/?audioGetUrl=${base}/msajc003.wav&labelGetUrl=${base}/msajc003_annot.json&labelType=annotJSON${extra}`);
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

/** Needs `node exampleServers/nodeEmuProtocolWsServer.js` running; enabled with ARTIC_WS=1. */
export async function openWs(page: Page, scheme: Scheme, query: Query = '') {
	await page.emulateMedia({ colorScheme: scheme });
	await page.goto('/?autoConnect=true' + query.replace(/^\?/, '&'));
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

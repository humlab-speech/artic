import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

export type Scheme = 'light' | 'dark';

export async function openStart(page: Page, scheme: Scheme) {
	await page.emulateMedia({ colorScheme: scheme });
	await page.goto('/');
	await page.waitForLoadState('networkidle');
}

/** Demo database via the open-demo dropdown (re-point at the start view's menu after Task 6.6). */
export async function openDemo(page: Page, scheme: Scheme, index = 0) {
	await openStart(page, scheme);
	await page.click('#demoDB');
	await page.click(`#demo${index}`);
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

export async function openLocalFiles(page: Page, scheme: Scheme) {
	await openStart(page, scheme);
	// annotJSON is paired with the audio by base name, so it is uploaded as msajc003.json
	await page.setInputFiles('input[type=file]', [
		{ name: 'msajc003.wav', mimeType: 'audio/wav', buffer: readFileSync('iframe-demo/msajc003.wav') },
		{ name: 'msajc003.json', mimeType: 'application/json', buffer: readFileSync('iframe-demo/msajc003_annot.json') },
	]);
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

export async function openUrlMode(page: Page, scheme: Scheme) {
	await page.emulateMedia({ colorScheme: scheme });
	const base = `http://localhost:${process.env.ARTIC_PORT || '9000'}/demoDBs/ae`;
	await page.goto(`/?audioGetUrl=${base}/msajc003.wav&labelGetUrl=${base}/msajc003_annot.json&labelType=annotJSON`);
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

/** Needs `node exampleServers/nodeEmuProtocolWsServer.js` running; enabled with ARTIC_WS=1. */
export async function openWs(page: Page, scheme: Scheme) {
	await page.emulateMedia({ colorScheme: scheme });
	await page.goto('/?autoConnect=true');
	await page.waitForSelector('canvas', { timeout: 30_000 });
	await page.waitForLoadState('networkidle');
}

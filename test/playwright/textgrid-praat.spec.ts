import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openLocalFiles } from './helpers';

const PRAAT = process.env.PRAAT || '/Applications/Praat.app/Contents/MacOS/Praat';

const SCRIPT = `form Check
  text file
endform
Read from file: file$
n = Get number of tiers
writeInfoLine: "tiers=", n
for i to n
  name$ = Get tier name: i
  appendInfoLine: "tier ", i, " ", name$
endfor
`;

test('exported TextGrid is plain text and opens in Praat', async ({ page }) => {
	test.skip(!existsSync(PRAAT), 'Praat not installed');
	await openLocalFiles(page, 'light');
	await page.getByRole('button', { name: /export/i }).click();
	await page.locator('#downloadTextgrid').click();
	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: /^download$/i }).click(),
	]);
	const dir = mkdtempSync(join(tmpdir(), 'artic-tg-'));
	const file = join(dir, 'out.TextGrid');
	await download.saveAs(file);
	const text = readFileSync(file, 'utf8');
	expect(text.startsWith('File type = "ooTextFile"')).toBe(true);
	const script = join(dir, 'check.praat');
	writeFileSync(script, SCRIPT);
	const out = execFileSync(PRAAT, ['--run', script, file], { encoding: 'utf8' });
	expect(out).toContain('tiers=2');
});

#!/usr/bin/env node
// Token lint guard: no colour literals, font-family literals or px font sizes
// outside src/core/theme. Report-only (exit 0) until Task 6.12, then --strict.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const strict = process.argv.includes('--strict');
const allow = JSON.parse(readFileSync(join(root, 'scripts/lint-tokens.allow.json'), 'utf8'));
const skipDirs = ['src/core/theme/', 'src/demoDBs/', 'src/configFiles/', 'src/schemaFiles/', 'src/dist/', 'src/assets/', 'src/fonts/', 'src/core/workers/spectro-drawing.worker.js'];
const exts = /\.(scss|css|svelte|ts|js)$/;
const rules = [
	['hex colour', /#[0-9a-fA-F]{3,8}\b(?![\w-])/],
	['rgb/hsl', /\b(?:rgba?|hsla?)\(/],
	['font-family literal', /font-family:[ \t]*(?![ \t]|var\()/],
	['px font size', /font-size:\s*[0-9.]+px/],
];

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walk(p);
		else if (exts.test(name)) yield p;
	}
}

let count = 0;
for (const file of walk(join(root, 'src'))) {
	const rel = relative(root, file);
	if (skipDirs.some((d) => rel.startsWith(d)) || allow.files?.includes(rel)) continue;
	readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
		for (const [name, re] of rules) {
			if (re.test(line) && !allow.lines?.some((a) => rel === a.file && line.includes(a.contains))) {
				count++;
				if (process.argv.includes('--verbose')) console.log(`${rel}:${i + 1}: ${name}: ${line.trim()}`);
			}
		}
	});
}
console.log(`lint:tokens ${strict ? '(strict)' : '(report)'}: ${count} violation(s)${count && !process.argv.includes('--verbose') ? ' (use --verbose)' : ''}`);
process.exit(strict && count ? 1 : 0);

// Emit dist/artic-manifest.json after `vite build`.
//
// Consumers (reindeer) use this to pin a build, verify it, and feature-gate
// operations such as review playlists. Keep `features` in sync with what the
// app actually supports.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

if (!existsSync(path.join(dist, 'index.html'))) {
	console.error('dist/index.html not found - run `npm run build:svelte` first.');
	process.exit(1);
}

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
let gitSha = 'unknown';
try {
	gitSha = execSync('git rev-parse --short HEAD', { cwd: root }).toString().trim();
} catch {
	// Building outside a git checkout is fine; the manifest just lacks a sha.
}

const manifest = {
	name: 'artic',
	version: pkg.version,
	gitSha,
	builtAt: new Date().toISOString(),
	protocol: { name: 'EMU-webApp-websocket-protocol', version: '0.0.2' },
	features: ['bundleList', 'timeAnchors', 'generatorTracks', 'fromIndexTracks', 'dataSourceModes', 'theming', 'i18n', 'chromeLevels']
};

const out = path.join(dist, 'artic-manifest.json');
writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');
console.log('wrote', path.relative(root, out));

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { execSync } from 'child_process';

function getGitSha(): string {
	try { return execSync('git rev-parse --short HEAD').toString().trim(); }
	catch { return 'unknown'; }
}

export default defineConfig({
	define: {
		__BUILD_TIME__: JSON.stringify(new Date().toISOString()),
		__GIT_SHA__: JSON.stringify(getGitSha()),
	},
	plugins: [svelte()],
	resolve: {
		alias: {
			'@core': path.resolve(__dirname, 'src/core'),
		}
	},
	server: {
		port: 9000,
	},
	build: {
		outDir: 'dist',
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('d3-selection') || id.includes('d3-zoom') || id.includes('d3-interpolate') || id.includes('d3-transition') || id.includes('d3-dispatch') || id.includes('d3-timer') || id.includes('d3-color') || id.includes('d3-ease')) {
						return 'd3';
					}
				},
			},
		},
	},
});

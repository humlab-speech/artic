import { defineConfig } from '@playwright/test';

const port = process.env.ARTIC_PORT || '9000';

export default defineConfig({
	testDir: 'test/playwright',
	testMatch: '**/*.spec.ts',
	timeout: 60_000,
	use: {
		baseURL: `http://localhost:${port}`,
		viewport: { width: 1440, height: 900 },
	},
	webServer: {
		command: `npm run dev -- --port ${port} --strictPort`,
		url: `http://localhost:${port}`,
		reuseExistingServer: true,
	},
});

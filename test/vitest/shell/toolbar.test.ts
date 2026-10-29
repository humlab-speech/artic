import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/svelte';
import { setLanguage } from '../../../src/core/util/i18n';
import { shell, setup } from './shell-mock';

vi.mock('../../../src/svelte-app/stores/services', async () => (await import('./shell-mock')).servicesFactory());

import Toolbar from '../../../src/svelte-app/components/shell/Toolbar.svelte';

const all = { showHierarchy: true, search: true, specSettings: true, clear: true, openDemoDB: true, connect: true };
const names = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((b) => b.textContent?.trim());

beforeEach(() => { setLanguage('en', false); });

describe('Toolbar per data source', () => {
	it('local: structure editing and rename, close files; no demo or connect', () => {
		setup('local', all);
		const { container } = render(Toolbar);
		const n = names(container);
		expect(n).toEqual(expect.arrayContaining(['Segment level', 'Event level', 'Rename level', 'Hierarchy', 'Search', 'Settings', 'Close files']));
		expect(n).not.toContain('Open demo');
		expect(n).not.toContain('Connect to server');
	});

	it.each(['demo', 'server', 'url'] as const)('%s: never shows add/rename level', (src) => {
		setup(src, all);
		const n = names(render(Toolbar).container);
		expect(n).not.toContain('Segment level');
		expect(n).not.toContain('Event level');
		expect(n).not.toContain('Rename level');
	});

	it('uses the close label of the source', () => {
		setup('demo', all);
		expect(names(render(Toolbar).container)).toContain('Close demo database');
	});

	it('open demo and connect live in the start view, not the toolbar; keeps the legacy ids', () => {
		setup('none', all);
		const { container } = render(Toolbar);
		expect(container.querySelector('#demoDB')).toBeNull();
		expect(container.querySelector('#connectBtn')).toBeNull();
		expect(container.querySelector('#showHierarchy')).not.toBeNull();
		expect(container.querySelector('#spectSettingsBtn')).not.toBeNull();
		expect(container.querySelector('#clear')).not.toBeNull();
	});

	it('hides what activeButtons does not enable', () => {
		setup('demo', { clear: true });
		const n = names(render(Toolbar).container);
		expect(n).toEqual(['Close demo database']);
	});

	it('labels follow the language', () => {
		setLanguage('sv', false);
		setup('local', all);
		expect(names(render(Toolbar).container)).toContain('Stäng filerna');
	});
});

describe('Toolbar chrome levels', () => {
	it('chrome="toolbar" hosts the data selector and the menu (no header)', () => {
		setup('demo', all);
		const { container } = render(Toolbar, { chrome: 'toolbar' });
		expect(container.querySelector('#aboutBtn')).not.toBeNull();
		expect(container.querySelector('.sb-data-selector')).not.toBeNull();
	});
	it('full and embedded leave them to the header', () => {
		setup('demo', all);
		const { container } = render(Toolbar, { chrome: 'embedded' });
		expect(container.querySelector('#aboutBtn')).toBeNull();
		expect(container.querySelector('.sb-data-selector')).toBeNull();
	});
});

describe('shell mock sanity', () => {
	it('is isolated between tests', () => { expect(shell.calls).toEqual([]); });
});

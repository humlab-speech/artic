import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { setLanguage } from '../../../src/core/util/i18n';
import { shell, setup } from './shell-mock';

vi.mock('../../../src/svelte-app/stores/services', async () => (await import('./shell-mock')).servicesFactory());

import DataSelector from '../../../src/svelte-app/components/shell/DataSelector.svelte';

const b = (name: string) => ({ name, session: 'S' });
const names = (c: HTMLElement) => Array.from(c.querySelectorAll('button')).map((x) => x.textContent?.trim());

function withBundles(n: number, curIdx = 0) {
	shell.bundles = Array.from({ length: n }, (_, i) => b('b' + i));
	shell.cur = shell.bundles[curIdx];
}

beforeEach(() => { setLanguage('en', false); });

describe('DataSelector', () => {
	it('start view: "No database" and a disabled bundle field with disabled navigation', () => {
		setup('none');
		const { container, queryByText, getByLabelText } = render(DataSelector);
		expect(queryByText('No database')).not.toBeNull();
		expect(queryByText('No bundle selected')).not.toBeNull();
		expect((container.querySelector('#bundleListSideBarOpen') as HTMLButtonElement).disabled).toBe(true);
		expect((getByLabelText('Next bundle') as HTMLButtonElement).disabled).toBe(true);
		expect(names(container)).not.toContain('Save');
	});

	it('the database is never a button', () => {
		setup('server', { openMenu: true, saveBundle: true });
		withBundles(3);
		const { getByText } = render(DataSelector);
		expect(getByText('srv-db').closest('button')).toBeNull();
	});

	it('server with saveBundle: Save, no export, no local badge', () => {
		setup('server', { openMenu: true, saveBundle: true });
		withBundles(3);
		const { container } = render(DataSelector);
		expect(names(container)).toContain('Save');
		expect(container.querySelector('#downloadTextgrid')).toBeNull();
		expect(container.textContent).not.toContain('Local mode');
	});

	it('server without saveBundle: neither Save nor Export', () => {
		setup('server', { openMenu: true, saveBundle: false });
		withBundles(3);
		const n = names(render(DataSelector).container);
		expect(n).not.toContain('Save');
		expect(n).not.toContain('Export');
	});

	it('local: badge and Export menu, no Save', () => {
		setup('local', { openMenu: true });
		withBundles(1);
		const { container } = render(DataSelector);
		expect(container.textContent).toContain('Local mode');
		expect(names(container)).toContain('Export');
		expect(names(container)).not.toContain('Save');
	});

	it('demo: no Save, no Export', () => {
		setup('demo', { openMenu: true, saveBundle: true });
		withBundles(2);
		const n = names(render(DataSelector).container);
		expect(n).not.toContain('Save');
		expect(n).not.toContain('Export');
	});

	it('unsaved dot has an accessible name', () => {
		setup('server', { openMenu: true, saveBundle: true });
		withBundles(2);
		shell.dirty = 1;
		const { getByRole } = render(DataSelector);
		expect(getByRole('img', { name: 'Unsaved changes' })).toBeTruthy();
	});

	it('navigation is disabled at the ends and switches bundle otherwise', async () => {
		setup('server', { openMenu: true, saveBundle: true });
		withBundles(3, 0);
		const { getByLabelText, container } = render(DataSelector);
		expect((getByLabelText('First bundle') as HTMLButtonElement).disabled).toBe(true);
		expect((getByLabelText('Previous bundle') as HTMLButtonElement).disabled).toBe(true);
		expect((getByLabelText('Next bundle') as HTMLButtonElement).disabled).toBe(false);
		await fireEvent.click(getByLabelText('Next bundle'));
		expect(shell.calls).toContain('load:b1');
		expect(container.textContent).toContain('1 of 3');
	});

	it('the bundle field toggles the sidebar and keeps its id', async () => {
		setup('server', { openMenu: true });
		withBundles(2);
		const { container } = render(DataSelector);
		await fireEvent.click(container.querySelector('#bundleListSideBarOpen')!);
		expect(shell.calls).toContain('toggleSidebar');
	});
});

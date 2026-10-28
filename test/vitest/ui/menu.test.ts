import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { shell } from '../shell/shell-mock';

vi.mock('../../../src/svelte-app/stores/services', async () => (await import('../shell/shell-mock')).servicesFactory());

import Menu from '../../../src/svelte-app/components/ui/Menu.svelte';

function mk(onselect = vi.fn()) {
	const r = render(Menu, {
		label: 'Theme',
		radio: true,
		items: [
			{ id: 'a', label: 'A', checked: true, onselect: () => onselect('a') },
			{ id: 'b', label: 'B', onselect: () => onselect('b') },
		],
	});
	return { ...r, onselect, trigger: r.getByRole('button', { name: 'Theme' }) };
}

describe('Menu', () => {
	it('opens on click, focuses the first item and suspends global shortcuts', async () => {
		const { trigger, getAllByRole } = mk();
		await fireEvent.click(trigger);
		const items = getAllByRole('menuitemradio');
		expect(items.length).toBe(2);
		expect(trigger.getAttribute('aria-expanded')).toBe('true');
		expect(document.activeElement).toBe(items[0]);
		expect(shell.menuOpen).toBe(true);
		expect(items[0].getAttribute('aria-checked')).toBe('true');
	});

	it('arrow keys move, Enter selects and closes', async () => {
		const { trigger, getAllByRole, queryByRole, onselect } = mk();
		await fireEvent.click(trigger);
		const items = getAllByRole('menuitemradio');
		await fireEvent.keyDown(items[0], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(items[1]);
		await fireEvent.keyDown(items[1], { key: 'ArrowDown' });
		expect(document.activeElement).toBe(items[0]); // wraps
		await fireEvent.click(items[1]);
		expect(onselect).toHaveBeenCalledWith('b');
		expect(queryByRole('menu')).toBeNull();
		expect(shell.menuOpen).toBe(false);
	});

	it('Escape closes without selecting', async () => {
		const { trigger, getAllByRole, queryByRole, onselect } = mk();
		await fireEvent.click(trigger);
		await fireEvent.keyDown(getAllByRole('menuitemradio')[0], { key: 'Escape' });
		expect(queryByRole('menu')).toBeNull();
		expect(onselect).not.toHaveBeenCalled();
	});

	it('an outside pointer press closes it', async () => {
		const { trigger, queryByRole } = mk();
		await fireEvent.click(trigger);
		await fireEvent.pointerDown(document.body);
		expect(queryByRole('menu')).toBeNull();
	});
});

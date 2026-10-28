import { describe, it, expect } from 'vitest';
import { HandleGlobalKeyStrokes } from '../../../src/core/services/handleglobalkeystrokes.service';

function make(menuOpen = false) {
	const s: any = new HandleGlobalKeyStrokes();
	s.ViewStateService = { menuOpen };
	return s as { isSuspended(code: number, e: any): boolean };
}
const target = (html: string) => {
	document.body.innerHTML = html;
	return document.body.firstElementChild!.querySelector('[data-t]') ?? document.body.firstElementChild!;
};

describe('global shortcut suspension', () => {
	it('everything is suspended while a menu is open', () => {
		expect(make(true).isSuspended(83, { target: document.body })).toBe(true);
	});

	it.each([13, 32])('key %i on a focused button is left to the button', (code) => {
		expect(make().isSuspended(code, { target: target('<div><button data-t>x</button></div>') })).toBe(true);
	});

	it('Enter on a menu item is left to the menu', () => {
		expect(make().isSuspended(13, { target: target('<div role="menu"><span role="menuitem" data-t>x</span></div>') })).toBe(true);
	});

	it('Enter in the label editor is not suspended (it commits the edit)', () => {
		expect(make().isSuspended(13, { target: target('<div><textarea class="artic-label-edit" data-t></textarea></div>') })).toBe(false);
	});

	it('other keys on a button still reach the annotation shortcuts', () => {
		expect(make().isSuspended(83, { target: target('<div><button data-t>x</button></div>') })).toBe(false);
	});

	it('plain canvas focus is not suspended', () => {
		expect(make().isSuspended(13, { target: target('<div><canvas data-t></canvas></div>') })).toBe(false);
	});
});

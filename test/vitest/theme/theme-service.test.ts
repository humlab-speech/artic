import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThemeService } from '../../../src/core/services/theme.service';
import { ConfigProviderService } from '../../../src/core/services/config-provider.service';

let darkOs = false;
let mqlListener: (() => void) | null = null;

function stubMatchMedia() {
	window.matchMedia = vi.fn((query: string) => ({
		get matches() { return darkOs; },
		media: query,
		addEventListener: (_: string, fn: () => void) => { mqlListener = fn; },
		removeEventListener: () => { mqlListener = null; },
	})) as any;
}

const theme = () => document.documentElement.dataset.theme;

beforeEach(() => {
	darkOs = false;
	mqlListener = null;
	delete document.documentElement.dataset.theme;
	localStorage.clear();
	stubMatchMedia();
});

describe('ThemeService', () => {
	it('defaults to system and follows OS changes', () => {
		const s = new ThemeService();
		s.init('');
		expect(s.preference).toBe('system');
		expect(theme()).toBe('light');
		darkOs = true;
		mqlListener?.();
		expect(theme()).toBe('dark');
	});

	it('a stored choice wins over the OS', () => {
		localStorage.setItem('artic-theme', 'light');
		darkOs = true;
		const s = new ThemeService();
		s.init('');
		expect(s.preference).toBe('light');
		expect(theme()).toBe('light');
	});

	it("setPreference('system') removes the key; others persist", () => {
		const s = new ThemeService();
		s.init('');
		s.setPreference('dark');
		expect(localStorage.getItem('artic-theme')).toBe('dark');
		expect(theme()).toBe('dark');
		s.setPreference('system');
		expect(localStorage.getItem('artic-theme')).toBeNull();
	});

	it('?theme= applies without persisting', () => {
		const s = new ThemeService();
		s.init('?theme=dark');
		expect(theme()).toBe('dark');
		expect(localStorage.getItem('artic-theme')).toBeNull();
	});

	it('falls back to system when storage throws', () => {
		const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
		const s = new ThemeService();
		s.init('');
		expect(s.preference).toBe('system');
		spy.mockRestore();
	});

	it('notifies listeners and supports unsubscribe', () => {
		const s = new ThemeService();
		s.init('');
		const fn = vi.fn();
		const off = s.onChange(fn);
		s.setPreference('dark');
		expect(fn).toHaveBeenCalledWith('dark');
		off();
		s.setPreference('light');
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('ConfigProviderService theme delegates still work', () => {
		const c = new ConfigProviderService();
		c.setTheme('dark');
		expect(c.getTheme()).toBe('dark');
	});
});

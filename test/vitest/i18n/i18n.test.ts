import { describe, it, expect, beforeEach, vi } from 'vitest';
import en from '../../../src/i18n/en.json';
import sv from '../../../src/i18n/sv.json';
import { t, setLanguage, getLanguage, detectLanguage, onLanguageChange } from '../../../src/core/util/i18n';

function keys(obj: Record<string, any>, prefix = ''): string[] {
	return Object.entries(obj).flatMap(([k, v]) =>
		typeof v === 'object' ? keys(v, prefix + k + '.') : [prefix + k]);
}

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
const get = (obj: any, key: string) => key.split('.').reduce((o, p) => o[p], obj) as string;

beforeEach(() => {
	localStorage.clear();
	setLanguage('en', false);
});

describe('dictionaries', () => {
	it('en and sv have the same keys', () => {
		expect(keys(sv).sort()).toEqual(keys(en).sort());
	});
	it('en and sv use the same {placeholders}', () => {
		for (const k of keys(en)) expect(placeholders(get(sv, k)), k).toBe(placeholders(get(en, k)));
	});
});

describe('t()', () => {
	it('interpolates params and leaves unknown ones', () => {
		expect(t('dataSelector.count', { n: 2, m: 7 })).toBe('2 of 7');
		expect(t('dataSelector.count', { n: 2 })).toBe('2 of {m}');
	});
	it('translates after setLanguage', () => {
		setLanguage('sv', false);
		expect(t('toolbar.search')).toBe('Sök');
	});
	it('falls back to the key itself when missing', () => {
		expect(t('no.such.key')).toBe('no.such.key');
	});
	it('treats a namespace (non-leaf) as missing', () => {
		expect(t('toolbar')).toBe('toolbar');
	});
});

describe('setLanguage', () => {
	it('updates <html lang>, persists only when asked, and notifies', () => {
		const fn = vi.fn();
		const off = onLanguageChange(fn);
		setLanguage('sv', false);
		expect(document.documentElement.lang).toBe('sv');
		expect(localStorage.getItem('artic-lang')).toBeNull();
		setLanguage('en');
		expect(localStorage.getItem('artic-lang')).toBe('en');
		expect(getLanguage()).toBe('en');
		expect(fn).toHaveBeenCalledTimes(2);
		off();
	});
});

describe('detectLanguage', () => {
	it('?lang= wins and is not persisted', () => {
		localStorage.setItem('artic-lang', 'en');
		expect(detectLanguage('?lang=sv')).toBe('sv');
		expect(localStorage.getItem('artic-lang')).toBe('en');
	});
	it('uses storage, then navigator.language', () => {
		localStorage.setItem('artic-lang', 'sv');
		expect(detectLanguage('')).toBe('sv');
		localStorage.clear();
		vi.spyOn(navigator, 'language', 'get').mockReturnValue('sv-SE');
		expect(detectLanguage('')).toBe('sv');
		vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
		expect(detectLanguage('')).toBe('en');
	});
	it('ignores unsupported ?lang=', () => {
		vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
		expect(detectLanguage('?lang=fr')).toBe('en');
	});
});

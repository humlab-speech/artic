/**
 * Framework-agnostic translations (sv/en), usable from core services.
 * Components use tr() from svelte-app/stores/i18n.svelte.ts so they re-render
 * on language change; services call t() and rely on invalidate().
 */
import en from '../../i18n/en.json';
import sv from '../../i18n/sv.json';
import { safeGetItem, safeSetItem } from './safe-storage';

export type Language = 'sv' | 'en';
export const languages: Language[] = ['sv', 'en'];

const KEY = 'artic-lang';
const dictionaries: Record<Language, Record<string, any>> = { en, sv };
const isLang = (v: unknown): v is Language => v === 'sv' || v === 'en';

/** main.ts switches warnOnMissing on in dev (no import.meta here: this module is also loaded by Jest). */
export const options = { warnOnMissing: false };

let current: Language = 'en';
const listeners = new Set<(l: Language) => void>();

function lookup(dict: Record<string, any>, key: string): string | undefined {
	let node: any = dict;
	for (const part of key.split('.')) {
		if (node == null || typeof node !== 'object') return undefined;
		node = node[part];
	}
	return typeof node === 'string' ? node : undefined;
}

/** Translate `key` in the current language; falls back to en, then to the key itself. */
export function t(key: string, params?: Record<string, string | number>): string {
	let s = lookup(dictionaries[current], key) ?? lookup(dictionaries.en, key);
	if (s === undefined) {
		if (options.warnOnMissing) console.warn(`[i18n] missing key: ${key}`);
		return key;
	}
	if (params) s = s.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
	return s;
}

export function getLanguage(): Language { return current; }

export function setLanguage(lang: Language, persist = true): void {
	current = lang;
	if (typeof document !== 'undefined') document.documentElement.lang = lang;
	if (persist) safeSetItem(KEY, lang);
	listeners.forEach((fn) => fn(lang));
}

export function onLanguageChange(fn: (l: Language) => void): () => void {
	listeners.add(fn);
	return () => { listeners.delete(fn); };
}

/** URL ?lang= (not persisted) > storage > navigator.language ('sv*' => sv) > en. */
export function detectLanguage(
	search: string = typeof window !== 'undefined' ? window.location.search : '',
): Language {
	const fromUrl = new URLSearchParams(search).get('lang');
	if (isLang(fromUrl)) return fromUrl;
	const stored = safeGetItem(KEY);
	if (isLang(stored)) return stored;
	const nav = typeof navigator !== 'undefined' ? navigator.language : '';
	return nav.toLowerCase().startsWith('sv') ? 'sv' : 'en';
}

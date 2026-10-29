import { safeGetItem, safeSetItem, safeRemoveItem } from '../util/safe-storage';
import { metaThemeColor, type ThemeName } from '../theme/tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const KEY = 'artic-theme'; // same key as before; absent => 'system'

const isPref = (v: unknown): v is ThemePreference => v === 'system' || v === 'light' || v === 'dark';

export class ThemeService {
	private pref: ThemePreference = 'system';
	private mql: MediaQueryList | null = null;
	private listeners = new Set<(t: ThemeName) => void>();
	private onMql = () => { if (this.pref === 'system') this.apply(); };

	/** Precedence: URL ?theme= (not persisted) > storage > 'system'. */
	init(search: string = typeof window !== 'undefined' ? window.location.search : '') {
		const fromUrl = new URLSearchParams(search).get('theme');
		const stored = safeGetItem(KEY);
		this.pref = isPref(fromUrl) ? fromUrl : isPref(stored) && stored !== 'system' ? stored : 'system';
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			this.mql?.removeEventListener?.('change', this.onMql);
			this.mql = window.matchMedia('(prefers-color-scheme: dark)');
			this.mql.addEventListener?.('change', this.onMql);
		}
		this.apply();
	}

	get preference(): ThemePreference { return this.pref; }

	get resolved(): ThemeName {
		if (this.pref !== 'system') return this.pref;
		const mql = this.mql ?? (typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null);
		return mql?.matches ? 'dark' : 'light';
	}

	setPreference(p: ThemePreference) {
		this.pref = p;
		if (p === 'system') safeRemoveItem(KEY); else safeSetItem(KEY, p);
		this.apply();
	}

	onChange(fn: (t: ThemeName) => void): () => void {
		this.listeners.add(fn);
		return () => { this.listeners.delete(fn); };
	}

	private apply() {
		const t = this.resolved;
		if (typeof document !== 'undefined') {
			document.documentElement.dataset.theme = t;
			document.querySelector('meta[name="theme-color"]')?.setAttribute('content', metaThemeColor[t]);
		}
		this.listeners.forEach((fn) => fn(t));
	}
}

export const themeService = new ThemeService();

import { beforeEach } from 'vitest';

// Newer Node ships an experimental global localStorage that shadows jsdom's and
// is undefined without --localstorage-file. Provide a plain in-memory Storage.
class MemStorage {
	private m = new Map<string, string>();
	get length() { return this.m.size; }
	key(i: number) { return [...this.m.keys()][i] ?? null; }
	getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
	setItem(k: string, v: string) { this.m.set(k, String(v)); }
	removeItem(k: string) { this.m.delete(k); }
	clear() { this.m.clear(); }
}
Object.defineProperty(globalThis, 'Storage', { value: MemStorage, configurable: true, writable: true });
Object.defineProperty(globalThis, 'localStorage', { value: new MemStorage(), configurable: true, writable: true });

beforeEach(() => {
	localStorage.clear();
});

if (typeof window !== 'undefined' && !window.matchMedia) {
	window.matchMedia = ((query: string) => ({
		matches: false, media: query, onchange: null,
		addEventListener() {}, removeEventListener() {},
		addListener() {}, removeListener() {}, dispatchEvent: () => false,
	})) as any;
}

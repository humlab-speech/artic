/** Resolves when the UI/data fonts are ready, or after the timeout (canvas must never wait forever). */
export function ensureFontsLoaded(timeoutMs = 1500): Promise<void> {
	if (typeof document === 'undefined' || !document.fonts?.load) return Promise.resolve();
	const loaded = Promise.all([
		document.fonts.load('400 1rem "Artic Noto Sans"', 'ʃ̩'),
		document.fonts.load('600 1rem "Artic Noto Sans"'),
		document.fonts.load('500 1rem "Jost Variable"'),
	]).then(() => undefined);
	const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
	return Promise.race([loaded, timeout]).catch(() => undefined);
}

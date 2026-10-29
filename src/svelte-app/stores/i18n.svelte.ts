import { t, onLanguageChange, getLanguage, type Language } from '../../core/util/i18n';

// Reading `tick` inside tr() subscribes the calling component/derived to language changes.
let tick = $state(0);
onLanguageChange(() => { tick++; });

export function tr(key: string, params?: Record<string, string | number>): string {
	void tick;
	return t(key, params);
}

export function currentLanguage(): Language {
	void tick;
	return getLanguage();
}

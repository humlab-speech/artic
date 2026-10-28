import { it, expect } from 'vitest';
import { tr, currentLanguage } from '../../../src/svelte-app/stores/i18n.svelte';
import { setLanguage } from '../../../src/core/util/i18n';

it('tr() follows the current language', () => {
	setLanguage('sv', false);
	expect(tr('toolbar.settings')).toBe('Inställningar');
	expect(currentLanguage()).toBe('sv');
	setLanguage('en', false);
	expect(tr('toolbar.settings')).toBe('Settings');
});

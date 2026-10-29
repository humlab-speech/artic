import { themeService, type ThemePreference } from '../../core/services/theme.service';
import type { ThemeName } from '../../core/theme/tokens';

// Reading `tick` makes callers reactive to preference and OS changes.
let tick = $state(0);
themeService.onChange(() => { tick++; });

export function currentTheme(): ThemeName {
	void tick;
	return themeService.resolved;
}

export function themePreference(): ThemePreference {
	void tick;
	return themeService.preference;
}

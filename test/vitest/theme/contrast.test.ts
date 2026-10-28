import { describe, it, expect } from 'vitest';
import { semantic, canvas, type ThemeName } from '../../../src/core/theme/tokens';
import { contrastRatio } from '../../../src/core/theme/contrast';

type Pair = [fg: string, bg: string, min: number];

function textPairs(t: ThemeName): [string, Pair][] {
	const s = semantic[t];
	return [
		['text on surface', [s.text, s.surface, 4.5]],
		['text on surface-2', [s.text, s.surface2, 4.5]],
		['text on surface-3', [s.text, s.surface3, 4.5]],
		['text-muted on surface', [s.textMuted, s.surface, 4.5]],
		['text-muted on surface-2', [s.textMuted, s.surface2, 4.5]],
		['on-fill on brand-strong', [s.onFill, s.brandStrong, 4.5]],
		['interactive-text on surface-2', [s.interactiveText, s.surface2, 4.5]],
		['danger-text on surface-2', [s.dangerText, s.surface2, 4.5]],
		['success-text on surface-2', [s.successText, s.surface2, 4.5]],
		['on-warning on warning-tint', [s.onWarning, s.warningTint, 4.5]],
		['text on interactive-tint', [s.text, s.interactiveTint, 4.5]],
		['text on danger-tint', [s.text, s.dangerTint, 4.5]],
		['canvas text on bg', [canvas[t].text, canvas[t].bg, 4.5]],
		['canvas signal on bg', [canvas[t].signal, canvas[t].bg, 4.5]],
	];
}

function uiPairs(t: ThemeName): [string, Pair][] {
	const s = semantic[t];
	return [
		['border-control on surface', [s.borderControl, s.surface, 3]],
		['border-control on surface-2', [s.borderControl, s.surface2, 3]],
		['interactive on surface', [s.interactive, s.surface, 3]],
		['brand on surface', [s.brand, s.surface, 3]],
		['canvas boundary on bg', [canvas[t].boundary, canvas[t].bg, 3]],
	];
}

describe.each(['light', 'dark'] as const)('contrast (%s)', (theme) => {
	it.each(textPairs(theme))('text: %s >= 4.5', (_n, [fg, bg, min]) => {
		expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
	});
	it.each(uiPairs(theme))('ui: %s >= 3', (_n, [fg, bg, min]) => {
		expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
	});
});

describe('known WCAG values', () => {
	it('black on white is 21', () => expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5));
});

import { describe, it, expect, afterEach } from 'vitest';
import { getCanvasStyle, resetCanvasStyleCache } from '../../../src/core/theme/canvas-style';
import { themeService } from '../../../src/core/services/theme.service';
import { canvas } from '../../../src/core/theme/tokens';

afterEach(() => {
	resetCanvasStyleCache();
	document.documentElement.style.fontSize = '';
	themeService.setPreference('system');
});

describe('getCanvasStyle', () => {
	it('returns the palette of the resolved theme', () => {
		themeService.setPreference('dark');
		expect(getCanvasStyle().color).toBe(canvas.dark);
		themeService.setPreference('light');
		expect(getCanvasStyle().color).toBe(canvas.light);
	});

	it('scales px with the root font size', () => {
		document.documentElement.style.fontSize = '20px';
		resetCanvasStyleCache();
		const cs = getCanvasStyle();
		expect(cs.px(1)).toBe(20);
		expect(cs.size.sm).toBe(Math.round(0.875 * 20));
	});

	it('builds font strings from the data family', () => {
		const cs = getCanvasStyle();
		expect(cs.font.data(13, 600)).toMatch(/^600 13px .*Artic Noto Sans/);
	});
});

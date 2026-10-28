import { themeService } from '../services/theme.service';
import { canvas, typography, type ThemeName } from './tokens';

const ROOT_TTL_MS = 250;

function buildStyle(theme: ThemeName, root: number) {
	const px = (rem: number) => Math.round(rem * root);
	return {
		theme,
		color: canvas[theme],
		px,
		size: { xs: px(typography.size.xs), sm: px(typography.size.sm), md: px(typography.size.md) },
		family: { data: typography.fontData, ui: typography.fontUi },
		font: {
			data: (sizePx: number, weight = 400) => `${weight} ${sizePx}px ${typography.fontData}`,
			ui: (sizePx: number, weight = 500) => `${weight} ${sizePx}px ${typography.fontUi}`,
		},
	};
}

let cached: { theme: ThemeName; root: number; at: number; style: ReturnType<typeof buildStyle> } | null = null;

/** For tests: forget the cached root font size. */
export function resetCanvasStyleCache() { cached = null; }

/**
 * Resolved palette, font strings and px sizes for canvas renderers.
 * Call it at the point of use in every draw; never hold colours across draws,
 * the theme and the browser text size can change between frames. The root font
 * size is read from the DOM at most every 250 ms (draws call this many times).
 */
export function getCanvasStyle() {
	const theme = themeService.resolved;
	const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
	if (cached && cached.theme === theme && now - cached.at < ROOT_TTL_MS) return cached.style;
	const root = typeof document !== 'undefined'
		? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
		: 16;
	cached = { theme, root, at: now, style: buildStyle(theme, root) };
	return cached.style;
}

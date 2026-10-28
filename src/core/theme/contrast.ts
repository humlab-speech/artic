/** WCAG 2.1 relative luminance and contrast helpers (hex colours only). */
export function relativeLuminance(hex: string): number {
	const m = /^#([0-9a-f]{6})$/i.exec(hex);
	if (!m) throw new Error(`relativeLuminance: expected #RRGGBB, got ${hex}`);
	const [r, g, b] = [0, 2, 4].map((i) => {
		const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
	const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

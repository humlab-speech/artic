import { semantic, canvas, typography, space, radius, layout, zIndex, type SemanticColors, type CanvasColors } from './tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const rem = (n: number) => `${n}rem`;

function semanticVars(c: SemanticColors): string[] {
	return Object.entries(c).map(([k, v]) => `--sb-${kebab(k)}: ${v};`);
}

function canvasVars(c: CanvasColors): string[] {
	const out: string[] = [];
	for (const [k, v] of Object.entries(c)) {
		if (typeof v === 'string') out.push(`--sb-canvas-${kebab(k)}: ${v};`);
	}
	return out;
}

function staticVars(): string[] {
	return [
		`--sb-font-ui: ${typography.fontUi};`,
		`--sb-font-data: ${typography.fontData};`,
		`--sb-font-body: ${typography.fontBody};`,
		`--sb-font-code: ${typography.fontCode};`,
		`--sb-noto-scale: ${typography.notoScale};`,
		...Object.entries(typography.size).map(([k, v]) => `--sb-size-${k}: ${rem(v)};`),
		...Object.entries(typography.weight).map(([k, v]) => `--sb-weight-${k}: ${v};`),
		...Object.entries(space).map(([k, v]) => `--sb-space-${k}: ${rem(v)};`),
		...Object.entries(radius).map(([k, v]) => `--sb-radius-${k}: ${rem(v)};`),
		...Object.entries(layout).map(([k, v]) => `--sb-${kebab(k)}: ${rem(v)};`),
		...Object.entries(zIndex).map(([k, v]) => `--sb-z-${k}: ${v};`),
	];
}

export function tokensToCss(): string {
	const block = (sel: string, lines: string[]) => `${sel} {\n\t${lines.join('\n\t')}\n}`;
	return [
		block(':root', [...semanticVars(semantic.light), ...canvasVars(canvas.light), ...staticVars()]),
		block(':root[data-theme="dark"]', [...semanticVars(semantic.dark), ...canvasVars(canvas.dark)]),
	].join('\n');
}

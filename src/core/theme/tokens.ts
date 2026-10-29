/**
 * Single source of truth for colours, typography, spacing and canvas palettes.
 * Serialised to CSS custom properties by css.ts; canvas code reads it directly.
 * Components use semantic tokens only, never the profile colours.
 */
export type ThemeName = 'light' | 'dark';

/** Språkbanken profile colours. */
export const profile = {
	orange: '#F0581A', // graphics, next step in a workflow
	blue: '#1E989F',   // interactive elements, help
	red: '#D42225',    // results that block the workflow, destructive actions
	yellow: '#F6C200', // results that change the workflow; never text on white
	green: '#5AA018',  // success
} as const;

export interface SemanticColors {
	surface: string; surface2: string; surface3: string;
	border: string; borderControl: string;
	text: string; textMuted: string; onFill: string;
	brand: string; brandStrong: string; brandTint: string;
	interactive: string; interactiveText: string; interactiveTint: string;
	danger: string; dangerText: string; dangerTint: string;
	warning: string; warningTint: string; onWarning: string;
	success: string; successText: string; successTint: string;
	focusRing: string; overlay: string;
}

export interface CanvasColors {
	bg: string; signal: string; zeroLine: string; text: string; textMuted: string; accentText: string;
	boundary: string; boundaryMuted: string; tierBg: string; tierActive: string;
	selectionFill: string; selectionEdge: string; segmentSelected: string; hoverFill: string;
	cursor: string; playedFill: string; error: string; warning: string;
	contours: readonly string[];
	hierarchy: { node: string; nodeStroke: string; nodeSelected: string; link: string; linkSelected: string; collapsed: string };
}

export const semantic: Record<ThemeName, SemanticColors> = {
	light: {
		surface: '#FFFFFF', surface2: '#F2F2F2', surface3: '#E6E6E6',
		border: '#D9D9D9', borderControl: '#808080',
		text: '#1E1E1E', textMuted: '#666666', onFill: '#FFFFFF',
		brand: profile.orange, brandStrong: profile.orange, brandTint: '#FCDED1',
		interactive: profile.blue, interactiveText: profile.blue, interactiveTint: '#D2EAEC',
		danger: profile.red, dangerText: profile.red, dangerTint: '#F6D3D3',
		warning: profile.yellow, warningTint: '#FDF3CC', onWarning: '#1E1E1E',
		success: profile.green, successText: profile.green, successTint: '#DEECD1',
		focusRing: profile.blue, overlay: 'rgba(30,30,30,0.45)',
	},
	dark: {
		surface: '#1E1E1E', surface2: '#262626', surface3: '#333333',
		border: '#3D3D3D', borderControl: '#7A7A7A',
		text: '#F2F2F2', textMuted: '#A6A6A6', onFill: '#FFFFFF',
		brand: profile.orange, brandStrong: profile.orange, brandTint: '#482A1D',
		interactive: profile.blue, interactiveText: profile.blue, interactiveTint: '#1E3638',
		danger: profile.red, dangerText: profile.red, dangerTint: '#421F1F',
		warning: profile.yellow, warningTint: '#493F18', onWarning: '#F2F2F2',
		success: profile.green, successText: profile.green, successTint: '#2A381D',
		focusRing: profile.blue, overlay: 'rgba(0,0,0,0.6)',
	},
};

export const canvas: Record<ThemeName, CanvasColors> = {
	light: {
		bg: '#FFFFFF', signal: '#3A3A3A', zeroLine: '#BDBDBD', text: '#1E1E1E', textMuted: '#666666', accentText: '#1E989F',
		boundary: '#8C8C8C', boundaryMuted: '#BDBDBD', tierBg: '#FAFAFA', tierActive: 'rgba(30,152,159,0.08)',
		selectionFill: 'rgba(30,152,159,0.16)', selectionEdge: '#1E989F', segmentSelected: 'rgba(30,152,159,0.24)',
		hoverFill: '#D2EAEC', cursor: '#F0581A', playedFill: 'rgba(240,88,26,0.12)',
		error: '#D42225', warning: '#F6C200',
		contours: ['#1E989F', '#5AA018', '#F6C200', '#D42225', '#F0581A', '#666666'],
		hierarchy: { node: '#FFFFFF', nodeStroke: '#666666', nodeSelected: '#1E989F', link: '#8C8C8C', linkSelected: '#1E989F', collapsed: '#F0581A' },
	},
	dark: {
		bg: '#141414', signal: '#CFCFCF', zeroLine: '#4D4D4D', text: '#F2F2F2', textMuted: '#A6A6A6', accentText: '#1E989F',
		boundary: '#6E6E6E', boundaryMuted: '#4D4D4D', tierBg: '#1A1A1A', tierActive: 'rgba(30,152,159,0.14)',
		selectionFill: 'rgba(30,152,159,0.28)', selectionEdge: '#1E989F', segmentSelected: 'rgba(30,152,159,0.36)',
		hoverFill: '#1E3638', cursor: '#F0581A', playedFill: 'rgba(240,88,26,0.18)',
		error: '#D42225', warning: '#F6C200',
		contours: ['#1E989F', '#5AA018', '#F6C200', '#D42225', '#F0581A', '#A6A6A6'],
		hierarchy: { node: '#262626', nodeStroke: '#A6A6A6', nodeSelected: '#1E989F', link: '#6E6E6E', linkSelected: '#1E989F', collapsed: '#F0581A' },
	},
};

export const typography = {
	fontUi: '"Jost Variable", Jost, system-ui, sans-serif',
	fontData: '"Artic Noto Sans", "Noto Sans", system-ui, sans-serif',
	fontBody: '"Noto Serif", Georgia, serif',
	fontCode: 'ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
	notoScale: 0.875, // decision 7 (profile: 0.8; measured x-height ratio Jost/Noto: 0.86)
	size: { xs: 0.75, sm: 0.875, md: 1, lg: 1.25, xl: 1.5, xxl: 2 }, // rem
	weight: { light: 300, regular: 400, medium: 500, semibold: 600 },
} as const;

/** Browser chrome colour (<meta name="theme-color">), matches `surface`. */
export const metaThemeColor: Record<ThemeName, string> = { light: '#FFFFFF', dark: '#1E1E1E' };

export const space ={ 1: 0.25, 2: 0.5, 3: 0.75, 4: 1, 5: 1.5, 6: 2 } as const; // rem
export const radius = { sm: 0.25, md: 0.375, lg: 0.5, pill: 1 } as const; // rem
export const layout = { headerHeight: 4, toolbarHeight: 2.9, sidebarWidth: 15, railWidth: 2.75 } as const; // rem
export const zIndex = { canvas: 1, chrome: 5, sidebar: 20, menu: 50, toast: 90, modal: 100 } as const;
export const motion = { period: 400 } as const; // ms

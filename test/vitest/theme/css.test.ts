import { describe, it, expect } from 'vitest';
import { tokensToCss } from '../../../src/core/theme/css';
import { semantic } from '../../../src/core/theme/tokens';

const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

describe('tokensToCss', () => {
	const css = tokensToCss();
	const [light, dark] = css.split(':root[data-theme="dark"]');

	it('emits every semantic key in both theme blocks', () => {
		for (const k of Object.keys(semantic.light)) {
			expect(light).toContain(`--sb-${kebab(k)}:`);
			expect(dark).toContain(`--sb-${kebab(k)}:`);
		}
	});
	it('light is the :root default, dark overrides', () => {
		expect(light).toContain(`--sb-surface: ${semantic.light.surface};`);
		expect(dark).toContain(`--sb-surface: ${semantic.dark.surface};`);
	});
	it('emits typography in rem and no legacy aliases', () => {
		expect(light).toContain('--sb-size-sm: 0.875rem;');
		expect(light).not.toContain('--bg-primary');
	});
});

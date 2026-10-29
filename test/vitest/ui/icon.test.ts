import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Icon from '../../../src/svelte-app/components/ui/Icon.svelte';
import { icons } from '../../../src/svelte-app/components/ui/icons';

describe('Icon', () => {
	it('without a label is hidden from assistive tech', () => {
		const { container } = render(Icon, { icon: icons.save });
		const svg = container.querySelector('svg')!;
		expect(svg.getAttribute('aria-hidden')).toBe('true');
		expect(svg.getAttribute('role')).toBeNull();
	});

	it('with a label is an image with an accessible name', () => {
		const { getByRole } = render(Icon, { icon: icons.save, label: 'Save' });
		const svg = getByRole('img');
		expect(svg.getAttribute('aria-label')).toBe('Save');
		expect(svg.getAttribute('aria-hidden')).toBeNull();
	});

	it('takes viewBox and path from the definition', () => {
		const [w, h, , , path] = icons.save.icon;
		const { container } = render(Icon, { icon: icons.save });
		expect(container.querySelector('svg')!.getAttribute('viewBox')).toBe(`0 0 ${w} ${h}`);
		expect(container.querySelector('path')!.getAttribute('d')).toBe(Array.isArray(path) ? path.join(' ') : path);
	});
});

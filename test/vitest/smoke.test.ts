import { it, expect } from 'vitest';

it('vitest runs in jsdom', () => {
	expect(typeof document).toBe('object');
});

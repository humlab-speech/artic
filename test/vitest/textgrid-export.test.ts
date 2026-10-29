// @vitest-environment node
import { describe, it, expect } from 'vitest';
// @ts-ignore plain JS worker module
import { TextGridParserWorker } from '../../src/core/workers/textgrid-parser.worker.js';

function build(levels: any[], len: number, sr: number): string {
	const g: any = { postMessage() {} };
	new (TextGridParserWorker as any)(function () {}).workerInit(g);
	return g.toTextGrid(levels, len, sr);
}

describe('toTextGrid (Praat-valid output)', () => {
	const levels = [
		{ name: 'a"b', type: 'SEGMENT', items: [
			{ sampleStart: 0, sampleDur: 999, labels: [{ value: 'x"y' }] },
			{ sampleStart: 1000, sampleDur: 1999, labels: [{ value: 's' }] } ] },
		{ name: 'pt', type: 'EVENT', items: [{ samplePoint: 1500, labels: [{ value: 'p' }] }] }
	];
	const tg = build(levels, 44100 * 3, 44100);

	it('uses 1-based item indices', () => {
		expect(tg).toContain('item [1]:');
		expect(tg).toContain('item [2]:');
		expect(tg).not.toContain('item [0]:');
	});
	it('escapes double quotes by doubling', () => {
		expect(tg).toContain('name = "a""b"');
		expect(tg).toContain('text = "x""y"');
	});
	it('tiles intervals contiguously', () => {
		const xmin = [...tg.matchAll(/xmin = (\S+)/g)].map(m => m[1]);
		const xmax = [...tg.matchAll(/xmax = (\S+)/g)].map(m => m[1]);
		// order: grid, tier1, interval1, interval2, tier2
		expect(xmax[2]).toBe(xmin[3]);
	});
});

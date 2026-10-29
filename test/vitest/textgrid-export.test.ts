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
	it('skips ITEM levels and sizes the grid by exported tiers', () => {
		const out = build([{ name: 'h', type: 'ITEM', items: [{ id: 1, labels: [{ value: 'x' }] }] }, ...levels], 44100, 44100);
		expect(out).toContain('size = 2');
		expect(out).not.toContain('name = "h"');
	});
	it('tiles intervals contiguously', () => {
		const xmin = [...tg.matchAll(/xmin = (\S+)/g)].map(m => m[1]);
		const xmax = [...tg.matchAll(/xmax = (\S+)/g)].map(m => m[1]);
		// order: grid, tier1, interval1, interval2, tier2
		expect(xmax[2]).toBe(xmin[3]);
	});
});

describe('TextGrid round trip', () => {
	it('re-imports exported labels and boundaries within one sample', () => {
		const sr = 44100;
		const levels = [{ name: 'w', type: 'SEGMENT', items: [
			{ sampleStart: 0, sampleDur: 999, labels: [{ value: 'a' }] },
			{ sampleStart: 1000, sampleDur: 1999, labels: [{ value: 'b' }] } ] },
			{ name: 'p', type: 'EVENT', items: [{ samplePoint: 1500, labels: [{ value: 'x' }] }] }];
		const tg = build(levels, sr * 3, sr);
		const g: any = { postMessage() {} };
		new (TextGridParserWorker as any)(function () {}).workerInit(g);
		const res = g.toJSO(tg, 'f.wav', 'f', sr);
		const seg = res.levels.find((l: any) => l.name === 'w');
		expect(seg.items.map((i: any) => i.labels[0].value)).toEqual(['a', 'b']);
		expect(Math.abs(seg.items[1].sampleStart - 1000)).toBeLessThanOrEqual(1);
		const pt = res.levels.find((l: any) => l.name === 'p');
		expect(Math.abs(pt.items[0].samplePoint - 1500)).toBeLessThanOrEqual(1);
	});
});

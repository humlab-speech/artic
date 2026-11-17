import { readFileSync } from 'fs';
import path from 'path';
import tv4 from 'tv4';

// The schema ValidationService checks every GETBUNDLE reply against. The bundle
// level tolerates fields this client does not use (VISP's annotation-server adds
// annotationVersion); everything inside stays strict. When the root was strict,
// that one added field made every bundle fail to open.
const schemaDir = path.resolve(__dirname, '../../src/schemaFiles');
const load = (name: string) => JSON.parse(readFileSync(path.join(schemaDir, name), 'utf8'));

const bundleSchema = load('bundleSchema.json');
tv4.addSchema('annotationFileSchema.json', load('annotationFileSchema.json'));

const annotation = { name: 'b1', annotates: 'b1.wav', sampleRate: 16000, levels: [], links: [] };
const bundle = {
	annotation,
	mediaFile: { data: 'https://example.org/file/b1.wav', encoding: 'GETURL' },
	ssffFiles: [],
};
const valid = (data: unknown) => tv4.validate(data, bundleSchema);

describe('bundleSchema', () => {
	it('accepts a plain bundle', () => {
		expect(valid(bundle)).toBe(true);
	});

	it('ignores fields a server adds to the bundle (annotationVersion)', () => {
		expect(valid({ ...bundle, annotationVersion: 'abc123' })).toBe(true);
	});

	it('still refuses unknown fields inside the annotation, media and SSFF parts', () => {
		expect(valid({ ...bundle, annotation: { ...annotation, extra: 1 } })).toBe(false);
		expect(valid({
			...bundle,
			annotation: { ...annotation, levels: [{ name: 'L', type: 'SEGMENT', items: [], extra: 1 }] },
		})).toBe(false);
		expect(valid({ ...bundle, mediaFile: { ...bundle.mediaFile, extra: 1 } })).toBe(false);
		expect(valid({
			...bundle,
			ssffFiles: [{ encoding: 'BASE64', data: '', fileExtension: 'fms', extra: 1 }],
		})).toBe(false);
	});

	it('still requires the annotation', () => {
		expect(valid({ ssffFiles: [] })).toBe(false);
	});
});

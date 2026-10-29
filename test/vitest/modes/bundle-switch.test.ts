import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
	canSave: false,
	dirty: 0,
	loadBundle: vi.fn(() => Promise.resolve('loaded')),
	open: vi.fn(),
	reset: vi.fn(),
	cur: { session: 's', name: 'cur' },
}));

vi.mock('../../../src/svelte-app/stores/services', () => ({
	dataSourceService: { get capabilities() { return { canSave: mocks.canSave }; } },
	dbObjLoadSaveService: { loadBundle: mocks.loadBundle },
	historyService: { get movesAwayFromLastSave() { return mocks.dirty; }, resetToInitState: mocks.reset },
	loadedMetaDataService: { getCurBndl: () => mocks.cur },
	modalService: { open: mocks.open },
}));

import { requestBundleSwitch } from '../../../src/svelte-app/components/shell/bundle-switch';

const next = { session: 's', name: 'next' };

beforeEach(() => {
	vi.clearAllMocks();
	mocks.canSave = false;
	mocks.dirty = 0;
});

describe('requestBundleSwitch', () => {
	it('clean: loads without any dialog', async () => {
		await requestBundleSwitch(next);
		expect(mocks.open).not.toHaveBeenCalled();
		expect(mocks.loadBundle).toHaveBeenCalledWith(next);
	});

	it('dirty with save: delegates to the service (which shows its own single dialog)', async () => {
		mocks.dirty = 2; mocks.canSave = true;
		await requestBundleSwitch(next);
		expect(mocks.open).not.toHaveBeenCalled();
		expect(mocks.loadBundle).toHaveBeenCalledWith(next);
	});

	it('dirty without save: one discard-only dialog; discard loads', async () => {
		mocks.dirty = 2;
		mocks.open.mockResolvedValue('discardChanges');
		await requestBundleSwitch(next);
		expect(mocks.open).toHaveBeenCalledTimes(1);
		expect(mocks.reset).toHaveBeenCalled();
		expect(mocks.loadBundle).toHaveBeenCalledWith(next);
	});

	it('dirty without save: cancel keeps the current bundle', async () => {
		mocks.dirty = 2;
		mocks.open.mockResolvedValue(undefined);
		await requestBundleSwitch(next);
		expect(mocks.loadBundle).not.toHaveBeenCalled();
	});
});

import { describe, it, expect } from 'vitest';
import { DataSourceService } from '../../../src/core/services/data-source.service';

function make(saveBundle = true) {
	const s = new DataSourceService();
	s.initDeps({ ConfigProviderService: { vals: { activeButtons: { saveBundle } } } });
	return s;
}

describe('DataSourceService capabilities', () => {
	it('none shows start view only', () => {
		expect(make().capabilities).toMatchObject({
			showStartView: true, canSave: false, canExport: false, canEditStructure: false, canRenameLevel: false,
		});
	});
	it('local: export + structure + rename, no save', () => {
		const s = make(); s.set('local');
		expect(s.capabilities).toMatchObject({
			showStartView: false, canSave: false, canExport: true, canEditStructure: true, canRenameLevel: true,
			closeLabelKey: 'toolbar.closeFiles',
		});
	});
	it('demo: nothing editable', () => {
		const s = make(); s.set('demo');
		expect(s.capabilities).toMatchObject({
			canSave: false, canExport: false, canEditStructure: false, closeLabelKey: 'toolbar.closeDemo',
		});
	});
	it.each(['server', 'url'] as const)('%s: save follows activeButtons.saveBundle', (src) => {
		const on = make(true); on.set(src);
		const off = make(false); off.set(src);
		expect(on.capabilities).toMatchObject({
			canSave: true, canExport: false, canEditStructure: false, canRenameLevel: false,
			closeLabelKey: 'toolbar.closeAndDisconnect',
		});
		expect(off.capabilities.canSave).toBe(false);
	});
	it('database is never choosable; reset returns to none', () => {
		const s = make(); s.set('server');
		expect(s.capabilities.canChooseDatabase).toBe(false);
		s.set('none');
		expect(s.capabilities.showStartView).toBe(true);
	});
});

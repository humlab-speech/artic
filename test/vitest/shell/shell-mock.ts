import { vi } from 'vitest';
import { DataSourceService, type DataSource } from '../../../src/core/services/data-source.service';

/** Shared mutable state behind the mocked stores/services module. */
export const shell = {
	source: 'none' as string,
	activeButtons: {} as Record<string, boolean>,
	dirty: 0,
	bundles: [] as any[],
	cur: {} as any,
	demoName: '',
	user: '',
	menuOpen: false,
	calls: [] as string[],
};

const cfg = { get vals() { return { activeButtons: shell.activeButtons, demoDBs: ['ae', 'ema'] }; }, curDbConfig: { name: 'srv-db' }, devMode: false };
const ds = new DataSourceService();
ds.initDeps({ ConfigProviderService: cfg });

export function setup(source: DataSource, activeButtons: Record<string, boolean> = {}) {
	ds.set(source);
	shell.source = source;
	shell.activeButtons = activeButtons;
	shell.dirty = 0;
	shell.bundles = [];
	shell.cur = {};
	shell.user = '';
	shell.calls = [];
}

/** Factory for vi.mock('.../stores/services'). */
export function servicesFactory() {
	const dataSourceService = ds;
	const stub = (name: string) => new Proxy({}, { get: (_t, p) => (...a: any[]) => { shell.calls.push(`${name}.${String(p)}`); return true; } });
	return {
		dataSourceService,
		configProviderService: cfg,
		viewStateService: {
			get menuOpen() { return shell.menuOpen; }, set menuOpen(v: boolean) { shell.menuOpen = v; },
			bundleListSideBarDisabled: false,
			getPermission: () => true,
			toggleBundleListSideBar: () => shell.calls.push('toggleSidebar'),
		},
		historyService: { get movesAwayFromLastSave() { return shell.dirty; } },
		loadedMetaDataService: {
			getCurBndl: () => shell.cur,
			getBundleList: () => shell.bundles,
			getDemoDbName: () => shell.demoName,
			get currentUser() { return shell.user; },
		},
		dbObjLoadSaveService: { saveBundle: () => shell.calls.push('save'), loadBundle: (b: any) => shell.calls.push('load:' + b.name) },
		modalService: stub('modal'),
		dragnDropService: stub('dragDrop'),
		levelService: stub('level'),
		dataService: { data: { levels: [] }, getData: () => ({}) },
		textGridParserService: stub('textGrid'),
		ioHandlerService: stub('io'),
		appStateService: stub('appState'),
		validationService: stub('validation'),
		hierarchyLayoutService: stub('hierarchy'),
	};
}

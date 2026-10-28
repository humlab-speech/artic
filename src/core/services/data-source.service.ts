/**
 * Provenance of the loaded data (where it came from) and the UI capabilities
 * derived from it. comMode keeps meaning transport; this means provenance.
 */
export type DataSource = 'none' | 'local' | 'demo' | 'server' | 'url';

export interface Capabilities {
	showStartView: boolean;
	canSave: boolean;
	canExport: boolean;
	canEditStructure: boolean;
	canRenameLevel: boolean;
	canChooseDatabase: false;
	closeLabelKey: 'toolbar.closeFiles' | 'toolbar.closeDemo' | 'toolbar.closeAndDisconnect';
}

export class DataSourceService {
	source: DataSource = 'none';
	ConfigProviderService!: any;

	initDeps(deps: { ConfigProviderService: any }) { Object.assign(this, deps); }

	set(source: DataSource) { this.source = source; }

	get capabilities(): Capabilities {
		const s = this.source;
		const online = s === 'server' || s === 'url';
		const local = s === 'local';
		return {
			showStartView: s === 'none',
			canSave: online && !!this.ConfigProviderService?.vals?.activeButtons?.saveBundle,
			canExport: local,
			canEditStructure: local,
			canRenameLevel: local,
			canChooseDatabase: false,
			closeLabelKey: local ? 'toolbar.closeFiles' : s === 'demo' ? 'toolbar.closeDemo' : 'toolbar.closeAndDisconnect',
		};
	}
}

export const dataSourceService = new DataSourceService();

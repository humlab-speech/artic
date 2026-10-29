import { dataSourceService, dbObjLoadSaveService, historyService, loadedMetaDataService, modalService } from '../../stores/services';

/**
 * Single entry point for switching bundle. With unsaved changes exactly one
 * dialog is shown: DbObjLoadSaveService shows it itself when Save is possible,
 * otherwise a discard-only variant is shown here.
 */
export function requestBundleSwitch(bndl: any): Promise<any> | undefined {
	const dirty = historyService.movesAwayFromLastSave !== 0;
	const cur = loadedMetaDataService.getCurBndl();
	if (!dirty || bndl === cur || dataSourceService.capabilities.canSave) {
		return dbObjLoadSaveService.loadBundle(bndl);
	}
	return modalService.open('views/saveChanges.html', cur.session + ':' + cur.name).then((res: string) => {
		if (res === 'discardChanges') {
			historyService.resetToInitState();
			return dbObjLoadSaveService.loadBundle(bndl);
		}
	});
}

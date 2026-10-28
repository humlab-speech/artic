import { t } from '../../../core/util/i18n';
import { invalidate } from '../../stores/app-state.svelte';
import {
	configProviderService,
	viewStateService,
	dbObjLoadSaveService,
	modalService,
	historyService,
	levelService,
	dataService,
	dataSourceService,
	textGridParserService,
	loadedMetaDataService,
	ioHandlerService,
	appStateService,
	validationService,
	hierarchyLayoutService,
} from '../../stores/services';
import { eventBus } from '../../../core/util/event-bus';

function insertLevel(type: 'SEGMENT' | 'EVENT') {
	const length = dataService.data.levels?.length ?? 0;
	const newName = 'levelNr' + length;
	const level = { items: [], name: newName, type };
	if (viewStateService.getCurAttrDef(newName) === undefined) {
		viewStateService.setCurLevelAttrDefs([{ name: newName, type: 'EVENT', attributeDefinitions: { name: newName, type: 'string' } }]);
	}
	levelService.insertLevel(level, length, viewStateService.curPerspectiveIdx);
	historyService.addObjToUndoStack({ type: 'ANNOT', action: 'INSERTLEVEL', level, id: length, curPerspectiveIdx: viewStateService.curPerspectiveIdx });
	viewStateService.selectLevel(false, configProviderService.vals.perspectives[viewStateService.curPerspectiveIdx].levelCanvases.order, levelService);
}

export function addLevelSeg() {
	if (!viewStateService.getPermission('addLevelSegBtnClick')) return;
	insertLevel('SEGMENT');
}

export function addLevelEvent() {
	if (!viewStateService.getPermission('addLevelPointBtnClick')) return;
	insertLevel('EVENT');
}

export function renameSelLevel() {
	if (!viewStateService.getPermission('renameSelLevelBtnClick')) return;
	if (viewStateService.getcurClickLevelName() !== undefined) {
		modalService.open('views/renameLevel.html', viewStateService.getcurClickLevelName());
	} else {
		modalService.open('views/error.html', t('msg.renameNoLevel'));
	}
}

export function downloadTextGrid() {
	if (!viewStateService.getPermission('downloadTextGridBtnClick')) return;
	textGridParserService.asyncToTextGrid().then((parseMess: string) => {
		parseMess = parseMess.replace(/\t/g, '    ');
		modalService.open('views/export.html', loadedMetaDataService.getCurBndl().name + '.TextGrid', parseMess);
	});
}

export function downloadAnnotation() {
	if (!viewStateService.getPermission('downloadAnnotationBtnClick')) return;
	if (validationService.validateJSO('articConfigSchema', dataService.getData())) {
		modalService.open('views/export.html', loadedMetaDataService.getCurBndl().name + '_annot.json', JSON.stringify(dataService.getData(), null, 2));
	}
}

export function openSettings() {
	if (viewStateService.getPermission('spectSettingsChange')) {
		modalService.open('views/settingsModal.html');
	}
}

export function saveBundle() {
	dbObjLoadSaveService.saveBundle();
}

export function openInfo() {
	if (viewStateService.getPermission('aboutBtnClick')) {
		modalService.open('views/help.html');
	}
}

export function showHierarchy() {
	if (!viewStateService.hierarchyState.isShown()) {
		// Initialize path if empty (before modal opens)
		if (!viewStateService.hierarchyState.path || viewStateService.hierarchyState.path.length === 0) {
			const pathInfo = hierarchyLayoutService.findAllNonPartialPaths();
			if (pathInfo?.possible?.[0]) {
				viewStateService.hierarchyState.path = pathInfo.possible[0];
				viewStateService.hierarchyState.curPathIdx = 0;
			}
		}
		viewStateService.hierarchyState.toggleHierarchy();
		modalService.open('views/showHierarchyModal.html');
	}
}

export function openSearch() {
	if (viewStateService.getPermission('searchBtnClick')) {
		modalService.open('views/searchAnnot.html');
	}
}

/** Close files / demo / connection after a confirmation; used by the toolbar and the logo. */
export function closeAll() {
	let modalText: string;
	if (historyService.movesAwayFromLastSave !== 0 && dataSourceService.source !== 'demo') {
		modalText = t('msg.closeUnsaved');
	} else {
		modalText = t('msg.closeClean');
	}
	modalService.open('views/confirmModal.html', modalText, undefined, undefined, { variant: 'danger' }).then((res: any) => {
		if (res) { appStateService.resetToInitState(); invalidate(); }
	});
}

export function openDemoDb(name: string) {
	if (!viewStateService.getPermission('openDemoBtnDBclick')) return;
	dataSourceService.set('demo');
	configProviderService.vals.activeButtons.openDemoDB = false;
	loadedMetaDataService.setDemoDbName(name);
	viewStateService.showDropZone = false;
	viewStateService.somethingInProgress = true;
	viewStateService.setState('loadingSaving');
	configProviderService.vals.main.comMode = 'DEMO';
	viewStateService.somethingInProgressTxt = t('progress.dbConfig');
	invalidate();
	ioHandlerService.getDBconfigFile(name).then((res: any) => {
		viewStateService.curPerspectiveIdx = 0;
		configProviderService.setVals(res.data.EMUwebAppConfig);
		const validRes = validationService.validateJSO('articConfigSchema', configProviderService.vals);
		if (validRes === true) {
			configProviderService.curDbConfig = res.data;
			viewStateService.setCurLevelAttrDefs(configProviderService.curDbConfig.levelDefinitions);
			const validRes2 = validationService.validateJSO('DBconfigFileSchema', configProviderService.curDbConfig);
			if (validRes2 === true) {
				viewStateService.somethingInProgressTxt = t('progress.bundleList');
				invalidate();
				ioHandlerService.getBundleList(name).then((bRes: any) => {
					loadedMetaDataService.setBundleList(bRes.data);
					configProviderService.vals.activeButtons.clear = true;
					configProviderService.vals.activeButtons.specSettings = true;
					invalidate();
					const bndl = loadedMetaDataService.getBundleList()[0];
					dbObjLoadSaveService.loadBundle(bndl);
				});
			} else {
				modalService.open('views/error.html', t('msg.dbConfigInvalid') + JSON.stringify(validRes2, null, 4)).then(() => appStateService.resetToInitState());
			}
		} else {
			modalService.open('views/error.html', t('msg.configInvalid') + JSON.stringify(validRes, null, 4)).then(() => appStateService.resetToInitState());
		}
		invalidate();
	}, (err: any) => {
		modalService.open('views/error.html', t('msg.dbConfigLoad') + name + ': ' + err.data).then(() => appStateService.resetToInitState());
	});
}

export function connect() {
	if (!viewStateService.getPermission('connectBtnClick')) return;
	modalService.open('views/connectModal.html').then((url: string) => {
		if (!url) return;
		viewStateService.somethingInProgressTxt = t('progress.connecting');
		viewStateService.somethingInProgress = true;
		viewStateService.url = url;
		ioHandlerService.WebSocketHandlerService.initConnect(url).then((message: any) => {
			if (message.type === 'error') {
				modalService.open('views/error.html', t('msg.noWs') + url).then(() => appStateService.resetToInitState());
			} else {
				eventBus.emit('connectedToWSserver', { session: null, reload: null });
			}
		}, (errMess: any) => {
			modalService.open('views/error.html', t('msg.noWs') + JSON.stringify(errMess, null, 4)).then(() => appStateService.resetToInitState());
		});
	});
}

<script lang="ts">
	import { t } from '../core/util/i18n';
	import AppHeader from './components/shell/AppHeader.svelte';
	import Toolbar from './components/shell/Toolbar.svelte';
	import StartView from './components/shell/StartView.svelte';
	import BottomMenu from './components/BottomMenu.svelte';
	import ProgressBar from './components/ProgressBar.svelte';
	import BundleListSidebar from './components/BundleListSidebar.svelte';
	import HistoryActionPopup from './components/HistoryActionPopup.svelte';
	// DropZone is now rendered inside BundleListSidebar
	import Modal from './components/Modal.svelte';
	import LargeTextFieldInput from './components/LargeTextFieldInput.svelte';
	import ToastNotification from './components/ToastNotification.svelte';
	import PerspectivesSidebar from './components/PerspectivesSidebar.svelte';
	import NewVersionHint from './components/NewVersionHint.svelte';
	import SignalArea from './components/SignalArea.svelte';
	import TwoDimPanel from './components/TwoDimPanel.svelte';
	import {
		initServices,
		viewStateService,
		configProviderService,
		loadedMetaDataService,
		validationService,
		ioHandlerService,
		appStateService,
		modalService,
		historyService,
		levelService,
		soundHandlerService,
		wavParserService,
		dataService,
		dbObjLoadSaveService,
		appcacheHandlerService,
		browserDetectorService,
		handleGlobalKeystrokesService,
		hierarchyLayoutService,
		dataSourceService,
	} from './stores/services';
	import { tr } from './stores/i18n.svelte';
	import { getTick, invalidate } from './stores/app-state.svelte';
	import { eventBus } from '../core/util/event-bus';
	import { safeGetItem, safeSetItem } from '../core/util/safe-storage';
	import { motion } from '../core/theme/tokens';

	// Initialize all core services (wires up dependencies)
	initServices();

	// Parse URL params
	const params = new URLSearchParams(window.location.search);
	if (params.get('audioGetUrl') && params.get('labelGetUrl') && params.get('labelType')) {
		if (!configProviderService.validateGetUrl(params.get('audioGetUrl')!) ||
			!configProviderService.validateGetUrl(params.get('labelGetUrl')!)) {
			console.error('Invalid URL parameters: audioGetUrl and labelGetUrl must use http(s) protocol');
		} else {
			configProviderService.embeddedVals.audioGetUrl = params.get('audioGetUrl')!;
			configProviderService.embeddedVals.labelGetUrl = params.get('labelGetUrl')!;
			configProviderService.embeddedVals.labelType = params.get('labelType')!;
			configProviderService.embeddedVals.fromUrlParams = true;
		}
	}
	if (params.has('disableBundleListSidebar')) {
		viewStateService.bundleListSideBarDisabled = true;
	}
	if (params.get('dev') === 'true') {
		configProviderService.devMode = true;
	}

	// Check for new version
	appcacheHandlerService.checkForNewVersion();

	// Load default config + embedded files
	loadDefaultConfig();

	// Bind global keys
	handleGlobalKeystrokesService.bindGlobalKeys();

	// Event bus listeners
	eventBus.on('connectionDisrupted').subscribe(() => {
		appStateService.resetToInitState();
	});
	eventBus.on('resetToInitState').subscribe(() => {
		loadDefaultConfig();
	});
	eventBus.on('connectedToWSserver').subscribe((data: any) => {
		handleConnectedToWSserver(data);
	});
	eventBus.on('reloadToInitState').subscribe((data: any) => {
		loadDefaultConfig();
		viewStateService.url = data.url;
		viewStateService.somethingInProgressTxt = t('progress.connecting');
		viewStateService.somethingInProgress = true;
		ioHandlerService.WebSocketHandlerService.initConnect(data.url).then((message: any) => {
			if (message.type === 'error') {
				modalService.open('views/error.html', t('msg.noWs') + data.url).then(() => {
					appStateService.resetToInitState();
				});
			} else {
				handleConnectedToWSserver(data);
			}
		}, (errMess: any) => {
			modalService.open('views/error.html', t('msg.noWs') + JSON.stringify(errMess, null, 4)).then(() => {
				appStateService.resetToInitState();
			});
		});
	});

	// Window resize
	function onResize() {
		levelService.deleteEditArea();
		viewStateService.setWindowWidth(window.outerWidth);
		if (viewStateService.hierarchyState.isShown()) {
			++viewStateService.hierarchyState.resize;
		}
	}

	// Prevent navigation away with unsaved changes
	function onBeforeUnload(): string | undefined {
		if (configProviderService.embeddedVals.audioGetUrl === '' &&
			loadedMetaDataService.getBundleList().length > 0 &&
			!configProviderService.vals.main.autoConnect &&
			historyService.movesAwayFromLastSave > 0) {
			return 'Do you really wish to leave/reload Artic? All unsaved changes will be lost...';
		}
		return undefined;
	}

	// --- Core init logic ported from artic.component.ts ---

	function loadDefaultConfig() {
		console.log('[artic] loadDefaultConfig called');
		viewStateService.somethingInProgress = true;
		viewStateService.somethingInProgressTxt = t('progress.schemas');
		invalidate();
		validationService.loadSchemas().then((replies: any) => {
			console.log('[artic] schemas loaded:', replies.length);
			validationService.setSchemas(replies);
			ioHandlerService.httpGetDefaultConfig().then((response: any) => {
				console.log('[artic] config loaded');
				viewStateService.somethingInProgressTxt = t('progress.validatingConfig');
				const validRes = validationService.validateJSO('articConfigSchema', response.data);
				if (validRes === true) {
					configProviderService.setVals(response.data);
					Object.assign(configProviderService.initDbConfig, JSON.parse(JSON.stringify(configProviderService.vals)));
					handleDefaultConfigLoaded();
					loadFilesForEmbeddedApp();
					checkIfToShowWelcomeModal();
					viewStateService.somethingInProgress = false;
					invalidate();
				} else {
					modalService.open('views/error.html', t('msg.schemaCheck') + JSON.stringify(validRes, null, 4)).then(() => {
						appStateService.resetToInitState();
						invalidate();
					});
					invalidate();
				}
			}, (response: any) => {
				modalService.open('views/error.html', t('msg.noDefaultConfig') + response.status).then(() => {
					appStateService.resetToInitState();
					invalidate();
				});
				invalidate();
			});
		}, (errMess: any) => {
			modalService.open('views/error.html', t('msg.schemaLoad') + JSON.stringify(errMess, null, 4)).then(() => {
				appStateService.resetToInitState();
				invalidate();
			});
			invalidate();
		});
	}

	function handleDefaultConfigLoaded() {
		if (!viewStateService.getBundleListSideBarOpen()) {
			viewStateService.toggleBundleListSideBar(motion.period);
		}
		const searchParams = new URLSearchParams(window.location.search);
		if (configProviderService.vals.main.autoConnect || searchParams.get('autoConnect') === 'true') {
			const serverUrl = searchParams.get('serverUrl') ?? configProviderService.vals.main.serverUrl;
			if (searchParams.get('serverUrl')) {
				configProviderService.vals.main.serverUrl = serverUrl;
			}
			if (searchParams.get('comMode') !== 'GITLAB') {
				ioHandlerService.WebSocketHandlerService.initConnect(serverUrl).then((message: any) => {
					if (message.type === 'error') {
						modalService.open('views/error.html', t('msg.noWs') + serverUrl).then(() => {
							appStateService.resetToInitState();
						});
					} else {
						handleConnectedToWSserver({ session: null, reload: null });
					}
				}, (errMess: any) => {
					modalService.open('views/error.html', t('msg.noWs') + JSON.stringify(errMess, null, 4)).then(() => {
						appStateService.resetToInitState();
					});
				});
			} else {
				configProviderService.vals.main.comMode = 'GITLAB';
				handleConnectedToWSserver({ session: null, reload: null });
			}
		}
		viewStateService.setspectroSettings(
			configProviderService.vals.spectrogramSettings.windowSizeInSecs,
			configProviderService.vals.spectrogramSettings.rangeFrom,
			configProviderService.vals.spectrogramSettings.rangeTo,
			configProviderService.vals.spectrogramSettings.dynamicRange,
			configProviderService.vals.spectrogramSettings.window,
			configProviderService.vals.spectrogramSettings.drawHeatMapColors,
			configProviderService.vals.spectrogramSettings.preEmphasisFilterFactor,
			configProviderService.vals.spectrogramSettings.heatMapColorAnchors,
			configProviderService.vals.spectrogramSettings.invert,
		);
		viewStateService.setTransitionTime(motion.period);
	}

	function handleConnectedToWSserver(data: any) {
		const session = data.session;
		const reload = data.reload;
		dataSourceService.set('server');
		viewStateService.showDropZone = false;
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.get('comMode') !== 'GITLAB') {
			configProviderService.vals.main.comMode = 'WS';
		}
		configProviderService.vals.activeButtons.openDemoDB = false;
		viewStateService.somethingInProgress = true;
		viewStateService.somethingInProgressTxt = t('progress.protocol');
		ioHandlerService.getProtocol().then((res: any) => {
			if (res.protocol === 'EMU-webApp-websocket-protocol' && res.version === '0.0.2') {
				viewStateService.somethingInProgressTxt = t('progress.userMgmt');
				ioHandlerService.getDoUserManagement().then((doUsrData: any) => {
					if (doUsrData === 'NO') {
						innerHandleConnectedToWSserver({ session, reload });
					} else {
						modalService.open('views/loginModal.html').then((res: any) => {
							if (res) {
								innerHandleConnectedToWSserver({ session, reload });
							} else {
								appStateService.resetToInitState();
							}
						});
					}
				});
			} else {
				modalService.open('views/error.html',
					t('msg.protocolMismatch') + res.protocol + '" v' + res.version
				).then(() => {
					appStateService.resetToInitState();
				});
			}
		});
	}

	function innerHandleConnectedToWSserver(data: any) {
		const session = data.session;
		const reload = data.reload;
		viewStateService.somethingInProgressTxt = t('progress.dbConfig');
		ioHandlerService.getDBconfigFile().then((dbData: any) => {
			viewStateService.curPerspectiveIdx = 0;
			configProviderService.setVals(dbData.EMUwebAppConfig);
			const validRes = validationService.validateJSO('articConfigSchema', configProviderService.vals);
			if (validRes === true) {
				configProviderService.curDbConfig = dbData;
				viewStateService.setCurLevelAttrDefs(configProviderService.curDbConfig.levelDefinitions);
				viewStateService.setspectroSettings(
					configProviderService.vals.spectrogramSettings.windowSizeInSecs,
					configProviderService.vals.spectrogramSettings.rangeFrom,
					configProviderService.vals.spectrogramSettings.rangeTo,
					configProviderService.vals.spectrogramSettings.dynamicRange,
					configProviderService.vals.spectrogramSettings.window,
					configProviderService.vals.spectrogramSettings.drawHeatMapColors,
					configProviderService.vals.spectrogramSettings.preEmphasisFilterFactor,
					configProviderService.vals.spectrogramSettings.heatMapColorAnchors,
					configProviderService.vals.spectrogramSettings.invert,
				);
				viewStateService.setHierarchySettings(hierarchyLayoutService.findAllNonPartialPaths().possible[0]);
				const validRes2 = validationService.validateJSO('DBconfigFileSchema', dbData);
				if (validRes2 === true) {
					viewStateService.somethingInProgressTxt = t('progress.bundleList');
					ioHandlerService.getBundleList().then((bdata: any) => {
						loadedMetaDataService.setBundleList(bdata);
						configProviderService.vals.activeButtons.clear = true;
						configProviderService.vals.activeButtons.specSettings = true;
						const firstSession = session ?? loadedMetaDataService.getBundleList()[0];
						dbObjLoadSaveService.loadBundle(firstSession);
						if (reload) {
							loadedMetaDataService.openCollapseSession(session.session);
						}
					});
				} else {
					modalService.open('views/error.html', t('msg.dbConfigInvalid') + JSON.stringify(validRes2, null, 4)).then(() => {
						appStateService.resetToInitState();
					});
				}
			} else {
				modalService.open('views/error.html', t('msg.configInvalid') + JSON.stringify(validRes, null, 4)).then(() => {
					appStateService.resetToInitState();
				});
			}
		});
	}

	function loadFilesForEmbeddedApp() {
		const searchParams = new URLSearchParams(window.location.search);
		const audioGetUrl = searchParams.get('audioGetUrl');
		const bndlJsonGetUrl = searchParams.get('bndlJsonGetUrl');
		if (!audioGetUrl && !bndlJsonGetUrl) return;
		dataSourceService.set('url');

		if (audioGetUrl) {
			if (!configProviderService.validateGetUrl(audioGetUrl)) {
				modalService.open('views/error.html', t('msg.badAudioUrl'));
				return;
			}
			configProviderService.embeddedVals.audioGetUrl = audioGetUrl;
			configProviderService.vals.activeButtons.openDemoDB = false;
			ioHandlerService.httpGetPath(audioGetUrl, 'arraybuffer').then((data: any) => {
				handleEmbeddedAudioLoaded(data, searchParams);
			}, (errMess: any) => {
				modalService.open('views/error.html', t('msg.noAudio') + audioGetUrl + t('msg.errorSep') + JSON.stringify(errMess, null, 4));
			});
		} else if (bndlJsonGetUrl) {
			ioHandlerService.httpGetPath(bndlJsonGetUrl, 'application/json').then((data: any) => {
				handleEmbeddedAudioLoaded(data, searchParams);
			}, (errMess: any) => {
				modalService.open('views/error.html', t('msg.noBundleJson') + JSON.stringify(errMess, null, 4));
			});
		}
	}

	function handleEmbeddedAudioLoaded(data: any, searchParams: URLSearchParams) {
		viewStateService.showDropZone = false;
		const audioUrl = configProviderService.embeddedVals.audioGetUrl;
		loadedMetaDataService.setCurBndlName(audioUrl.substring(audioUrl.lastIndexOf('/') + 1, audioUrl.lastIndexOf('.')));

		if (viewStateService.getBundleListSideBarOpen() && searchParams.get('saveToWindowParent') !== 'true') {
			viewStateService.toggleBundleListSideBar(motion.period);
		}

		viewStateService.somethingInProgressTxt = t('progress.dbConfig');
		const DBconfigGetUrl = searchParams.get('DBconfigGetUrl') || 'configFiles/embedded_articConfig.json';

		ioHandlerService.httpGetPath(DBconfigGetUrl).then((resp: any) => {
			viewStateService.curPerspectiveIdx = 0;
			configProviderService.setVals(resp.data.EMUwebAppConfig);
			const validRes = validationService.validateJSO('articConfigSchema', configProviderService.vals);
			if (validRes !== true) {
				modalService.open('views/error.html', t('msg.configInvalid') + JSON.stringify(validRes, null, 4));
				return;
			}
			if (configProviderService.embeddedVals.fromUrlParams) {
				configProviderService.vals.main.catchMouseForKeyBinding = false;
			}
			configProviderService.curDbConfig = resp.data;
			const validRes2 = validationService.validateJSO('DBconfigFileSchema', configProviderService.curDbConfig);
			if (validRes2 !== true) {
				modalService.open('views/error.html', t('msg.dbConfigInvalid') + JSON.stringify(validRes2, null, 4));
				return;
			}
			if (searchParams.get('saveToWindowParent') === 'true') {
				configProviderService.vals.activeButtons.saveBundle = true;
			}
			const bndlList = [{ session: 'File(s)', name: 'from URL parameters' }];
			loadedMetaDataService.setBundleList(bndlList);
			loadedMetaDataService.setCurBndl(bndlList[0]);

			viewStateService.somethingInProgress = true;
			viewStateService.somethingInProgressTxt = t('progress.parsingAudio');

			const audioGetUrl = searchParams.get('audioGetUrl');
			if (audioGetUrl) {
				wavParserService.parseAudioBuf(data.data).then((result: any) => {
					viewStateService.curViewPort.sS = 0;
					viewStateService.curViewPort.eS = result.audioBuffer.length;
					viewStateService.resetSelect();
					soundHandlerService.audioBuffer = result.audioBuffer;
					soundHandlerService.playbackBuffer = result.playbackBuffer;

					const labelGetUrl = searchParams.get('labelGetUrl');
					if (labelGetUrl) {
						const respType = 'text';
						ioHandlerService.httpGetPath(labelGetUrl, respType).then((data2: any) => {
							viewStateService.somethingInProgressTxt = t('progress.parsingFile', { type: configProviderService.embeddedVals.labelType });
							ioHandlerService.parseLabelFile(data2.data, labelGetUrl, 'embeddedTextGrid', configProviderService.embeddedVals.labelType).then(async (annot: any) => {
								dataService.setData(annot);
								if (!searchParams.get('DBconfigGetUrl')) {
									await generateLevelDefsFromAnnotation(annot);
								}
								viewStateService.setCurLevelAttrDefs(configProviderService.curDbConfig.levelDefinitions);
								viewStateService.somethingInProgressTxt = t('progress.done');
								viewStateService.somethingInProgress = false;
								viewStateService.setState('labeling');
								invalidate();
							});
						});
					} else {
						configProviderService.vals.activeButtons.downloadAnnotation = false;
						configProviderService.vals.activeButtons.downloadTextGrid = false;
						configProviderService.vals.activeButtons.search = false;
						viewStateService.somethingInProgressTxt = t('progress.done');
						viewStateService.somethingInProgress = false;
						viewStateService.setState('labeling');
						invalidate();
					}
				});
			} else {
				const bndlJsonGetUrl = searchParams.get('bndlJsonGetUrl');
				if (bndlJsonGetUrl) {
					dbObjLoadSaveService.loadBundle({ name: 'fromURLparams' }, bndlJsonGetUrl);
				}
			}
		}, (errMess: any) => {
			modalService.open('views/error.html', t('msg.noEmbeddedConfig') + errMess);
		});
	}

	async function generateLevelDefsFromAnnotation(annot: any) {
		const levelDefs: any[] = [];
		const lNamesWithTime: string[] = [];
		for (const l of annot.levels) {
			const attrDefs = l.items[0].labels.map((lab: any) => ({ name: lab.name, type: 'string' }));
			const ld = { name: l.name, type: l.type, attributeDefinitions: attrDefs };
			levelDefs.push(ld);
			if (l.type !== 'ITEM') lNamesWithTime.push(l.name);
		}
		configProviderService.curDbConfig.levelDefinitions = levelDefs;
		viewStateService.setCurLevelAttrDefs(levelDefs);
		configProviderService.vals.perspectives[viewStateService.curPerspectiveIdx].levelCanvases.order = lNamesWithTime;
		invalidate();
		// Hierarchy worker — dynamic import to keep bundle size down
		const { HierarchyWorker } = await import('../core/workers/hierarchy.worker');
		const hierarchyWorker = await new (HierarchyWorker as any)();
		const linkDefs = await hierarchyWorker.guessLinkDefinitions(annot);
		configProviderService.curDbConfig.linkDefinitions = linkDefs;
		configProviderService.vals.activeButtons.showHierarchy = true;
		invalidate();
	}

	function checkIfToShowWelcomeModal() {
		const curVal = safeGetItem('haveShownWelcomeModal');
		const searchParams = new URLSearchParams(window.location.search);
		if (!browserDetectorService.isBrowser.PhantomJS() && curVal === null && typeof searchParams.get('viewer_pane') !== 'undefined') {
			safeSetItem('haveShownWelcomeModal', 'true');
			// Show about hint briefly (3 seconds)
			setTimeout(() => {
				// hint auto-hides
			}, 3000);
		}
	}

	// Reactive bridge
	let somethingInProgress = $derived(getTick() >= 0 && viewStateService.somethingInProgress);
	let somethingInProgressTxt = $derived(getTick() >= 0 ? viewStateService.somethingInProgressTxt : '');
	let curBndlName = $derived(getTick() >= 0 ? loadedMetaDataService.getCurBndlName() : '');
	let chrome = $derived(getTick() >= 0 ? configProviderService.getChrome() : 'full');
	let showStartView = $derived(getTick() >= 0 && dataSourceService.capabilities.showStartView);
</script>

<svelte:window on:resize={onResize} on:beforeunload={onBeforeUnload} />

<div class="artic">
<AppHeader {chrome} />
<div class="artic-main" id="MainCtrl"
	onmouseenter={() => viewStateService.mouseInEmuWebApp = true}
	onmouseleave={() => viewStateService.mouseInEmuWebApp = false}
	role="application"
>
	<Modal />
	<LargeTextFieldInput />
	<ToastNotification />
	<NewVersionHint />
	<BundleListSidebar />

	<div class="artic-window" id="mainWindow">
		<ProgressBar
			open={somethingInProgress}
			txt={somethingInProgressTxt}
		/>

		<div class="printTitle">{tr('print.title', { name: curBndlName })}</div>

		{#if !showStartView || chrome === 'toolbar'}<Toolbar {chrome} />{/if}

		<div class="artic-canvas">
			{#if showStartView}
				<StartView showFooter={chrome === 'full'} />
			{/if}
			<HistoryActionPopup />
			<SignalArea />
			<TwoDimPanel />
		</div>

		{#if !showStartView}<BottomMenu />{/if}
	</div>

	<PerspectivesSidebar />
</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
	}

	.printTitle {
		display: none;
	}

	@media print {
		.printTitle {
			display: block;
			font-size: var(--sb-size-lg);
			font-weight: bold;
			padding: 8px;
		}
	}
</style>

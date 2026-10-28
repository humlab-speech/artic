import { t } from '../util/i18n';
import { WavRangeReq } from '../workers/wavrangereq.worker';
import { httpGet } from '../util/http-get';

export class DbObjLoadSaveService {
	// Dependencies — set via initDeps()
	DataService!: any;
	ViewStateService!: any;
	HistoryService!: any;
	LoadedMetaDataService!: any;
	SsffDataService!: any;
	IoHandlerService!: any;
	BinaryDataManipHelperService!: any;
	WavParserService!: any;
	SoundHandlerService!: any;
	SsffParserService!: any;
	ValidationService!: any;
	LevelService!: any;
	ModalService!: any;
	ConfigProviderService!: any;
	AppStateService!: any;
	StandardFuncsService!: any;

	initDeps(deps: {
		DataService: any;
		ViewStateService: any;
		HistoryService: any;
		LoadedMetaDataService: any;
		SsffDataService: any;
		IoHandlerService: any;
		BinaryDataManipHelperService: any;
		WavParserService: any;
		SoundHandlerService: any;
		SsffParserService: any;
		ValidationService: any;
		LevelService: any;
		ModalService: any;
		ConfigProviderService: any;
		AppStateService: any;
		StandardFuncsService: any;
	}) {
		Object.assign(this, deps);
	}

	private innerLoadBundle(bndl, bundleData, arrBuff): Promise<void> {
		this.ViewStateService.somethingInProgressTxt = t('progress.parsingAudio');

		return this.WavParserService.parseAudioBuf(arrBuff).then((result) => {
			var audioBuffer = result.audioBuffer;
			this.ViewStateService.curViewPort.sS = 0;
			this.ViewStateService.curViewPort.eS = audioBuffer.length;
			if(bndl.timeAnchors !== undefined && bndl.timeAnchors.length > 0){
				this.ViewStateService.curViewPort.selectS = bndl.timeAnchors[0].sample_start;
				this.ViewStateService.curViewPort.selectE = bndl.timeAnchors[0].sample_end;
			}else {
				this.ViewStateService.resetSelect();
			}
			this.ViewStateService.curTimeAnchorIdx = -1;
			this.ViewStateService.curClickSegments = [];
			this.ViewStateService.curClickLevelName = undefined;
			this.ViewStateService.curClickLevelType = undefined;

			this.SoundHandlerService.audioBuffer = audioBuffer;
			this.SoundHandlerService.playbackBuffer = result.playbackBuffer;
			var promises = [];
			bundleData.ssffFiles.forEach((file) => {
				if(file.encoding === 'GETURL'){
					file.data = this.IoHandlerService.httpGetPath(file.data, 'arraybuffer');
					promises.push(file.data);
					file.encoding = 'ARRAYBUFFER';
				}
			})
			if(promises.length === 0){
				promises.push(Promise.resolve());
			}

			return Promise.all(promises).then((res) => {
				for(var i = 0; i < res.length; i++){
					if(res[i] !== undefined){
						bundleData.ssffFiles[i].data = res[i];
					}
				}
				this.ViewStateService.somethingInProgressTxt = t('progress.parsingSsff');
				return this.SsffParserService.asyncParseSsffArr(bundleData.ssffFiles).then((ssffJso) => {
					this.SsffDataService.data = ssffJso.data;
					this.DataService.setData(bundleData.annotation);
					this.LoadedMetaDataService.setCurBndl(bndl);
					this.ViewStateService.selectLevel(false, this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order, this.LevelService);
					this.ViewStateService.setState('labeling');

					this.ViewStateService.somethingInProgress = false;
					this.ViewStateService.somethingInProgressTxt = t('progress.done');
				}, (errMess) => {
					this.ModalService.open('views/error.html', t('msg.ssffParse') + errMess.status.message).then(() => {
						this.AppStateService.resetToInitState();
					});
				});
			}, (errMess) => {
				this.ModalService.open('views/error.html', t('msg.ssffFetch') + JSON.stringify(errMess)).then(() => {
					this.AppStateService.resetToInitState();
				});
			});
		}, (errMess) => {
			this.ModalService.open('views/error.html', t('msg.audioDecode') + errMess.status.message).then(() => {
				this.AppStateService.resetToInitState();
			});
		});
	}

	private async loadBundleWithStreaming(bndl, bundleData): Promise<void> {
		var audioUrl = bundleData.mediaFile.data;
		this.ViewStateService.somethingInProgressTxt = t('progress.probing');

		try {
			var rangeReq = new WavRangeReq();
			await rangeReq.setURL(audioUrl);
			var fileInfo = await rangeReq.getWavFileInfo();
			var totalSamples = fileInfo.lastSampleBlockIdx + 1;
			var sampleRate = fileInfo.headerInfos.SampleRate;
			var chunkDuration = this.ConfigProviderService.vals.main.streamingChunkDurationSeconds || 30;
			var chunkSamples = sampleRate * chunkDuration;

			var firstChunkEnd = Math.min(chunkSamples - 1, fileInfo.lastSampleBlockIdx);
			this.ViewStateService.somethingInProgressTxt = t('progress.chunk1');
			var firstRange = await rangeReq.getRange(0, firstChunkEnd);

			var firstResult = await this.WavParserService.parseWavAudioBuf(firstRange.buffer);
			var audioBuffer = firstResult.audioBuffer;

			this.ViewStateService.curViewPort.sS = 0;
			this.ViewStateService.curViewPort.eS = totalSamples;
			if(bndl.timeAnchors !== undefined && bndl.timeAnchors.length > 0){
				this.ViewStateService.curViewPort.selectS = bndl.timeAnchors[0].sample_start;
				this.ViewStateService.curViewPort.selectE = bndl.timeAnchors[0].sample_end;
			}else {
				this.ViewStateService.resetSelect();
			}
			this.ViewStateService.curTimeAnchorIdx = -1;
			this.ViewStateService.curClickSegments = [];
			this.ViewStateService.curClickLevelName = undefined;
			this.ViewStateService.curClickLevelType = undefined;

			this.SoundHandlerService.audioBuffer = audioBuffer;
			this.SoundHandlerService.playbackBuffer = firstResult.playbackBuffer;

			if(firstChunkEnd < fileInfo.lastSampleBlockIdx){
				this.loadRemainingChunks(rangeReq, fileInfo, firstChunkEnd + 1, chunkSamples, audioBuffer);
			}

			var promises = [];
			bundleData.ssffFiles.forEach((file) => {
				if(file.encoding === 'GETURL'){
					file.data = this.IoHandlerService.httpGetPath(file.data, 'arraybuffer');
					promises.push(file.data);
					file.encoding = 'ARRAYBUFFER';
				}
			});
			if(promises.length === 0){
				promises.push(Promise.resolve());
			}

			var res = await Promise.all(promises);
			for(var i = 0; i < res.length; i++){
				if(res[i] !== undefined){
					bundleData.ssffFiles[i].data = res[i];
				}
			}
			this.ViewStateService.somethingInProgressTxt = t('progress.parsingSsff');
			var ssffJso = await this.SsffParserService.asyncParseSsffArr(bundleData.ssffFiles);
			this.SsffDataService.data = ssffJso.data;
			this.DataService.setData(bundleData.annotation);
			this.LoadedMetaDataService.setCurBndl(bndl);
			this.ViewStateService.selectLevel(false, this.ConfigProviderService.vals.perspectives[this.ViewStateService.curPerspectiveIdx].levelCanvases.order, this.LevelService);
			this.ViewStateService.setState('labeling');
			this.ViewStateService.somethingInProgress = false;
			this.ViewStateService.somethingInProgressTxt = t('progress.done');
		} catch(err) {
			var errMsg = err && err.status ? err.status.message : (err && err.message ? err.message : JSON.stringify(err));
			this.ModalService.open('views/error.html', t('msg.audioStream') + errMsg).then(() => {
				this.AppStateService.resetToInitState();
			});
		}
	}

	private async loadRemainingChunks(rangeReq, fileInfo, startSample, chunkSamples, existingBuffer) {
		var totalSamples = fileInfo.lastSampleBlockIdx + 1;
		var chunkIdx = 1;
		var totalChunks = Math.ceil((totalSamples - startSample) / chunkSamples) + 1;

		for(var s = startSample; s <= fileInfo.lastSampleBlockIdx; s += chunkSamples){
			chunkIdx++;
			var endSample = Math.min(s + chunkSamples - 1, fileInfo.lastSampleBlockIdx);
			this.ViewStateService.somethingInProgressTxt = t('progress.audioChunk', { n: chunkIdx, m: totalChunks });

			try {
				var range = await rangeReq.getRange(s, endSample);
				var result = await this.WavParserService.parseWavAudioBuf(range.buffer);
				var chunkBuffer = result.audioBuffer;

				var merged = this.mergeAudioBuffers(existingBuffer, chunkBuffer, s);
				this.SoundHandlerService.audioBuffer = merged;
				this.SoundHandlerService.playbackBuffer = null;
				existingBuffer = merged;
			} catch(err) {
				console.error('Error loading audio chunk at sample ' + s + ':', err);
				break;
			}
		}
		this.ViewStateService.somethingInProgressTxt = t('progress.done');
		this.ViewStateService.somethingInProgress = false;
	}

	private mergeAudioBuffers(existing, chunk, insertAtSample) {
		var totalLength = Math.max(existing.length, insertAtSample + chunk.length);
		var numChannels = existing.numberOfChannels;
		var ctx = new OfflineAudioContext(numChannels, totalLength, existing.sampleRate);
		var merged = ctx.createBuffer(numChannels, totalLength, existing.sampleRate);

		for(var ch = 0; ch < numChannels; ch++){
			var mergedData = merged.getChannelData(ch);
			var existingData = existing.getChannelData(ch);
			mergedData.set(existingData, 0);
			if(ch < chunk.numberOfChannels){
				var chunkData = chunk.getChannelData(ch);
				mergedData.set(chunkData, insertAtSample);
			}
		}
		return merged;
	}

	///////////////////
	// public api

	public loadBundle(bndl, url) {
		this.ViewStateService.setcurClickItem(null);
		if ((this.HistoryService.movesAwayFromLastSave !== 0 && this.ConfigProviderService.vals.main.comMode !== 'DEMO' && this.ConfigProviderService.vals.activeButtons.saveBundle)) {
			var curBndl = this.LoadedMetaDataService.getCurBndl();
			if (bndl !== curBndl) {
				return this.ModalService.open('views/saveChanges.html', curBndl.session + ':' + curBndl.name).then((messModal) => {
					if (messModal === 'saveChanges') {
						return this.saveBundle().then(() => {
							return this.loadBundle(bndl, "");
						});
					} else if (messModal === 'discardChanges') {
						this.HistoryService.resetToInitState();
						return this.loadBundle(bndl, "");
					}
				});
			}
			return Promise.resolve();
		} else {
			if (bndl !== this.LoadedMetaDataService.getCurBndl()) {
				this.HistoryService.resetToInitState();
				this.ViewStateService.hierarchyState.reset();
				this.LevelService.deleteEditArea();
				this.ViewStateService.setEditing(false);
				this.ViewStateService.setState('loadingSaving');

				this.ViewStateService.somethingInProgress = true;
				this.ViewStateService.somethingInProgressTxt = t('progress.loadingBundle') + bndl.name;
				this.SsffDataService.data = [];
				let promise;
				if(!url){
					promise = this.IoHandlerService.getBundle(bndl.name, bndl.session, this.LoadedMetaDataService.getDemoDbName());
				}else{
					promise = httpGet(url);
				}
				return promise.then(async (bundleData) => {
					if (bundleData.status === 200) {
						bundleData = bundleData.data;
					}

					var validRes = this.ValidationService.validateJSO('bundleSchema', bundleData);

					if (validRes === true) {

						var arrBuff;

						if(bundleData.mediaFile.encoding === 'BASE64'){
							arrBuff = this.BinaryDataManipHelperService.base64ToArrayBuffer(bundleData.mediaFile.data);
							return this.innerLoadBundle(bndl, bundleData, arrBuff);
						}else if(bundleData.mediaFile.encoding === 'GETURL'){
							if(this.ConfigProviderService.vals.main.streamingEnabled){
								return this.loadBundleWithStreaming(bndl, bundleData);
							}
							return this.IoHandlerService.httpGetPath(bundleData.mediaFile.data, 'arraybuffer').then((res) => {
								if(res.status === 200){
									res = res.data;
								}
								return this.innerLoadBundle(bndl, bundleData, res);
							}, (errMess) => {
								this.ModalService.open('views/error.html', t('msg.audioFetch') + JSON.stringify(errMess)).then(() => {
									this.AppStateService.resetToInitState();
								});
							});
						}
					} else {
						this.ModalService.open('views/error.html', t('msg.annotInvalid') + JSON.stringify(validRes, null, 4)).then(() => {
							this.AppStateService.resetToInitState();
						});
					}


				}, (errMess) => {
					if (errMess.data) {
						this.ModalService.open('views/error.html', t('msg.bundleLoad') + errMess.data).then(() => {
							this.AppStateService.resetToInitState();
						});
					} else {
						this.ModalService.open('views/error.html', t('msg.bundleLoad') + errMess.status.message).then(() => {
							this.AppStateService.resetToInitState();
						});
					}
				});
			}
			return Promise.resolve();
		}
	};


	public saveBundle() {
		if (this.ViewStateService.getPermission('saveBndlBtnClick')) {
			this.ViewStateService.somethingInProgress = true;
			this.ViewStateService.setState('loadingSaving');
			var bundleData = {} as any;
			this.ViewStateService.somethingInProgressTxt = t('progress.creatingJson');
			bundleData.ssffFiles = [];
			const ssffPromises = this.SsffDataService.data.map((ssffFile) =>
				this.SsffParserService.asyncJso2ssff(ssffFile).then((messParser) => {
					bundleData.ssffFiles.push({
						'fileExtension': ssffFile.fileExtension,
						'encoding': 'BASE64',
						'data': this.BinaryDataManipHelperService.arrayBufferToBase64(messParser.data)
					});
				})
			);
			if (ssffPromises.length > 0) {
				return Promise.all(ssffPromises).then(() => {
					return this.getAnnotationAndSaveBndl(bundleData);
				}, (errMess) => {
					this.ModalService.open('views/error.html', t('msg.ssffConvert') + (errMess.status ? errMess.status.message : errMess));
					return Promise.reject(errMess);
				});
			} else {
				return this.getAnnotationAndSaveBndl(bundleData);
			}
		} else {
			console.info('Action: menuBundleSaveBtnClick not allowed!');
		}

	};


	public getAnnotationAndSaveBndl(bundleData): Promise<void> {

		this.ViewStateService.somethingInProgressTxt = t('progress.validatingAnnot');

		var validRes = this.ValidationService.validateJSO('annotationFileSchema', this.DataService.getData());
		if (validRes !== true) {
			console.warn('PROBLEM: trying to save bundle but bundle is invalid. traverseAndClean() will be called.');
			console.error (validRes);
		}

		this.StandardFuncsService.traverseAndClean(this.DataService.getData());

		bundleData.annotation = this.DataService.getData();

		bundleData.mediaFile = {'encoding': 'BASE64', 'data': ''};

		var curBndl = this.LoadedMetaDataService.getCurBndl();

		if (typeof curBndl.session !== 'undefined') {
			bundleData.session = curBndl.session;
		}
		if (typeof curBndl.finishedEditing !== 'undefined') {
			bundleData.finishedEditing = curBndl.finishedEditing;
		}
		if (typeof curBndl.comment !== 'undefined') {
			bundleData.comment = curBndl.comment;
		}

		this.ViewStateService.somethingInProgressTxt = t('progress.validatingBundle');
		validRes = this.ValidationService.validateJSO('bundleSchema', bundleData);

		if (validRes !== true) {
			console.error('GRAVE PROBLEM: trying to save bundle but bundle is invalid. traverseAndClean() HAS ALREADY BEEN CALLED.');
			console.error(validRes);

			return this.ModalService.open('views/error.html', t('msg.bundleCorrupt') + JSON.stringify(validRes, null, 4)).then(() => {
				this.ViewStateService.somethingInProgressTxt = '';
				this.ViewStateService.somethingInProgress = false;
				this.ViewStateService.setState('labeling');
				return Promise.reject('Bundle validation failed');
			});
		} else {
			this.ViewStateService.somethingInProgressTxt = t('progress.saving');
			return this.IoHandlerService.saveBundle(bundleData).then(() => {
				this.ViewStateService.somethingInProgressTxt = t('progress.done');
				this.ViewStateService.somethingInProgress = false;
				this.HistoryService.movesAwayFromLastSave = 0;
				this.ViewStateService.setState('labeling');
			}, (errMess) => {
				this.ModalService.open('views/error.html', t('msg.bundleSave') + errMess.status.message).then(() => {
					this.AppStateService.resetToInitState();
				});
				return Promise.reject(errMess);
			});
		}
	};

}

export const dbObjLoadSaveService = new DbObjLoadSaveService();

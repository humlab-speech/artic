<script lang="ts">
	import { tr } from '../stores/i18n.svelte';
	import Button from './ui/Button.svelte';
	import { icons } from './ui/icons';
	import { getConfigTick } from '../stores/app-state.svelte';
	import { viewStateService, soundHandlerService, mathHelperService, hierarchyLayoutService, configProviderService, standardFuncsService, dataService, modalService } from '../stores/services';
	import { safeGetItem, safeSetItem } from '../../core/util/safe-storage';

	const windowOptions = Object.keys(viewStateService.getWindowFunctions());
	const pathInfo = hierarchyLayoutService.findAllNonPartialPaths();

	// Local editable copy of spectro settings
	let modalVals = $state({
		rangeFrom: viewStateService.spectroSettings.rangeFrom,
		rangeTo: viewStateService.spectroSettings.rangeTo,
		dynamicRange: viewStateService.spectroSettings.dynamicRange,
		windowSizeInSecs: viewStateService.spectroSettings.windowSizeInSecs,
		window: viewStateService.spectroSettings.window,
		drawHeatMapColors: viewStateService.spectroSettings.drawHeatMapColors,
		preEmphasisFilterFactor: viewStateService.spectroSettings.preEmphasisFilterFactor,
		heatMapColorAnchors: viewStateService.spectroSettings.heatMapColorAnchors,
		_fftN: 512,
		_windowSizeInSamples: (soundHandlerService.audioBuffer?.sampleRate ?? 0) * viewStateService.spectroSettings.windowSizeInSecs,
		invert: viewStateService.spectroSettings.invert,
	});

	let selWindowName = $state(windowOptions[viewStateService.spectroSettings.window - 1] || windowOptions[0]);
	let errorID = $state<boolean[]>([]);
	let upperBoundary = $state('');

	let osciChannel = $state(viewStateService.osciSettings.curChannel);
	let osciAvailableChannels = $derived(
		typeof soundHandlerService.audioBuffer?.numberOfChannels === 'number'
			? Array.from(Array(soundHandlerService.audioBuffer.numberOfChannels).keys())
			: []
	);

	let hierarchySettings = $state({
		paths: {
			possible: pathInfo.possible,
			possibleAsStr: pathInfo.possibleAsStr,
			selected: pathInfo.possibleAsStr[viewStateService.hierarchyState.curPathIdx] || pathInfo.possibleAsStr[0] || '',
			curVisAttributeDefs: {} as Record<string, string>,
		},
		showHierarchyPathCanvas: safeGetItem('showHierarchyPathCanvas') === 'true',
	});

	let levelCanvasesFontScalingFactor = $state(
		Number(safeGetItem('levelCanvasesFontScalingFactor')) || 100
	);

	function getSelHierarchyPathIdx() {
		return hierarchySettings.paths.possibleAsStr.indexOf(hierarchySettings.paths.selected);
	}

	function getCurVisAttributes() {
		hierarchySettings.paths.curVisAttributeDefs = {};
		const idx = getSelHierarchyPathIdx();
		if (typeof hierarchySettings.paths.possible[idx] !== 'undefined') {
			const curLevelNames = [...hierarchySettings.paths.possible[idx]].reverse();
			curLevelNames.forEach(ln => {
				hierarchySettings.paths.curVisAttributeDefs[ln] = viewStateService.getCurAttrDef(ln);
			});
		}
	}

	getCurVisAttributes();

	function calcWindowSizeVals() {
		modalVals._windowSizeInSamples = (soundHandlerService.audioBuffer?.sampleRate ?? 0) * modalVals.windowSizeInSecs;
		const fftN = mathHelperService.calcClosestPowerOf2Gt(modalVals._windowSizeInSamples);
		modalVals._fftN = fftN < 512 ? 512 : fftN;
	}

	function checkSpectroSettings() {
		const sr = soundHandlerService.audioBuffer?.sampleRate ?? 0;
		const hca = modalVals.heatMapColorAnchors;
		const allInts = [[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]
			.every(([i,j]) => hca[i][j] % 1 === 0);
		errorID[8] = !allInts;
		errorID[7] = isNaN(modalVals.preEmphasisFilterFactor * sr);
		errorID[6] = isNaN(sr * modalVals.windowSizeInSecs);
		errorID[5] = modalVals.dynamicRange % 1 !== 0;
		errorID[4] = modalVals.rangeFrom % 1 !== 0;
		errorID[3] = modalVals.rangeTo % 1 !== 0;
		errorID[2] = modalVals.rangeFrom < 0;
		upperBoundary = String(dataService.getData()?.sampleRate ? dataService.getData().sampleRate / 2 : '');
		errorID[1] = upperBoundary ? modalVals.rangeTo > Number(upperBoundary) : false;
	}

	function cssError(id: number, id2?: number) {
		return (errorID[id] || (id2 !== undefined && errorID[id2])) ? 'sb-field-invalid' : '';
	}

	function saveSettings() {
		checkSpectroSettings();
		if (errorID.some(e => e === true)) return;

		viewStateService.setspectroSettings(
			modalVals.windowSizeInSecs,
			modalVals.rangeFrom,
			modalVals.rangeTo,
			modalVals.dynamicRange,
			selWindowName,
			modalVals.drawHeatMapColors,
			modalVals.preEmphasisFilterFactor,
			modalVals.heatMapColorAnchors,
			modalVals.invert,
			true,
		);
		viewStateService.setOsciSettings(osciChannel);

		const pathIdx = getSelHierarchyPathIdx();
		viewStateService.hierarchyState.path = hierarchySettings.paths.possible[pathIdx];
		viewStateService.hierarchyState.curPathIdx = pathIdx;

		Object.keys(hierarchySettings.paths.curVisAttributeDefs).forEach(levelName => {
			const attrDef = hierarchySettings.paths.curVisAttributeDefs[levelName];
			viewStateService.setCurAttrDef(
				levelName,
				attrDef,
				configProviderService.getAttrDefsNames(levelName).indexOf(attrDef),
			);
		});

		safeSetItem('showHierarchyPathCanvas', String(hierarchySettings.showHierarchyPathCanvas));
		safeSetItem('levelCanvasesFontScalingFactor', String(levelCanvasesFontScalingFactor));

		modalService.close();
	}

	function reset() {
		errorID = [];
		const ss = viewStateService.spectroSettings;
		const sr = soundHandlerService.audioBuffer?.sampleRate ?? 0;
		modalVals = {
			rangeFrom: ss.rangeFrom,
			rangeTo: ss.rangeTo,
			dynamicRange: ss.dynamicRange,
			windowSizeInSecs: ss.windowSizeInSecs,
			window: ss.window,
			drawHeatMapColors: ss.drawHeatMapColors,
			preEmphasisFilterFactor: ss.preEmphasisFilterFactor,
			heatMapColorAnchors: ss.heatMapColorAnchors,
			_fftN: 512,
			_windowSizeInSamples: sr * ss.windowSizeInSecs,
			invert: ss.invert,
		};
		modalService.close();
	}

	function onFocus() { viewStateService.setEditing(true); viewStateService.setcursorInTextField(true); }
	function onBlur() { viewStateService.setEditing(false); viewStateService.setcursorInTextField(false); }

	const hasHierarchy = $derived(getConfigTick() >= 0 && configProviderService.curDbConfig?.linkDefinitions?.length > 0);

	const sampleRate = $derived(soundHandlerService.audioBuffer?.sampleRate ?? 0);
	const nyquist = $derived(sampleRate / 2);
	const anchorCss = (i: number) => viewStateService.getColorOfAnchor(modalVals.heatMapColorAnchors, i)['background-color'];
	const gradientCss = $derived(`linear-gradient(to right, ${anchorCss(0)}, ${anchorCss(1)}, ${anchorCss(2)})`);
</script>

<div class="artic-modal-body sb-settings">
	{#if hasHierarchy}
	<section class="sb-set-section">
		<h2>{tr('settings.hierarchy')}</h2>
		<p class="sb-set-intro">{tr('settings.hierarchyIntro')}</p>
		<div class="sb-set-row">
			<label for="set-pathcanvas">{tr('settings.showPathCanvas')}<small>{tr('settings.hintPathCanvas')}</small></label>
			<div class="sb-set-control"><input id="set-pathcanvas" type="checkbox" bind:checked={hierarchySettings.showHierarchyPathCanvas} /></div>
		</div>
		<div class="sb-set-row">
			<label for="set-path">{tr('settings.visiblePath')}<small>{tr('settings.hintPath')}</small></label>
			<div class="sb-set-control">
				<select id="set-path" bind:value={hierarchySettings.paths.selected} onchange={getCurVisAttributes}>
					{#each hierarchySettings.paths.possibleAsStr as pathStr}
						<option value={pathStr}>{pathStr}</option>
					{/each}
				</select>
			</div>
		</div>
		<div class="sb-set-row">
			<span class="sb-set-label">{tr('settings.visibleAttrDefs')}<small>{tr('settings.hintAttrDefs')}</small></span>
			<div class="sb-set-control sb-set-stack">
				{#each [...(hierarchySettings.paths.possible[getSelHierarchyPathIdx()] || [])].reverse() as levelName}
					<div class="sb-set-inline">
						<label for="set-attr-{levelName}" class="sb-data">{levelName}</label>
						<select id="set-attr-{levelName}" bind:value={hierarchySettings.paths.curVisAttributeDefs[levelName]}>
							{#each configProviderService.getAttrDefsNames(levelName) || [] as attrDef}
								<option value={attrDef}>{attrDef}</option>
							{/each}
						</select>
					</div>
				{/each}
			</div>
		</div>
	</section>
	{/if}

	<section class="sb-set-section">
		<h2>{tr('settings.levelCanvas')}</h2>
		<div class="sb-set-row">
			<label for="set-font">{tr('settings.fontScaling')}<small>{tr('settings.hintFontScaling')}</small></label>
			<div class="sb-set-control">
				<input id="set-font" type="range" bind:value={levelCanvasesFontScalingFactor} min="1" max="200" />
				<output class="sb-set-unit sb-data" for="set-font">{levelCanvasesFontScalingFactor}%</output>
			</div>
		</div>
	</section>

	<section class="sb-set-section">
		<h2>{tr('settings.osci')}</h2>
		<div class="sb-set-row">
			<label for="set-channel">{tr('settings.channel')}<small>{tr('settings.hintChannel', { n: osciAvailableChannels.length })}</small></label>
			<div class="sb-set-control">
				<select id="set-channel" bind:value={osciChannel}>
					{#each osciAvailableChannels as ch}
						<option value={ch}>{ch}</option>
					{/each}
				</select>
			</div>
		</div>
	</section>

	<section class="sb-set-section">
		<h2>{tr('settings.spec')}</h2>
		<p class="sb-set-intro">{sampleRate ? tr('settings.specIntro', { sr: sampleRate, ny: nyquist }) : tr('settings.specIntroNone')}</p>

		<div class="sb-set-row">
			<span class="sb-set-label" id="set-range-l">{tr('settings.viewRange')}<small>{tr('settings.hintRange', { ny: nyquist || '–' })}</small></span>
			<div class="sb-set-control" role="group" aria-labelledby="set-range-l">
				<div class="sb-set-inline">
					<label for="set-from">{tr('settings.from')}</label>
					<input id="set-from" type="text" inputmode="numeric" class={cssError(2, 4)} bind:value={modalVals.rangeFrom} onkeyup={checkSpectroSettings} onfocus={onFocus} onblur={onBlur} />
					<label for="set-to">{tr('settings.to')}</label>
					<input id="set-to" type="text" inputmode="numeric" class={cssError(1, 3)} bind:value={modalVals.rangeTo} onkeyup={checkSpectroSettings} onfocus={onFocus} onblur={onBlur} />
					<span class="sb-set-unit">Hz</span>
				</div>
				{#if errorID[1]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errUpper', { n: upperBoundary })}</p>{/if}
				{#if errorID[2]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errPositiveInt')}</p>{/if}
				{#if errorID[3]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errIntTo')}</p>{/if}
				{#if errorID[4]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errIntFrom')}</p>{/if}
			</div>
		</div>

		<div class="sb-set-row">
			<label for="set-window">{tr('settings.windowSize')}<small>{tr('settings.hintWindowSize')}</small></label>
			<div class="sb-set-control sb-set-stack">
				<div class="sb-set-inline">
					<input id="set-window" type="text" inputmode="decimal" class={cssError(6)} bind:value={modalVals.windowSizeInSecs} onkeyup={() => { calcWindowSizeVals(); checkSpectroSettings(); }} onfocus={onFocus} onblur={onBlur} />
					<span class="sb-set-unit">s</span>
				</div>
				<p class="sb-set-result sb-data">{tr('settings.windowInfo', { n: modalVals._windowSizeInSamples, fft: modalVals._fftN })}</p>
				{#if errorID[6]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errFloat')}</p>{/if}
			</div>
		</div>

		<div class="sb-set-row">
			<label for="set-dyn">{tr('settings.dynamicRange')}<small>{tr('settings.hintDynamic')}</small></label>
			<div class="sb-set-control sb-set-stack">
				<div class="sb-set-inline">
					<input id="set-dyn" type="text" inputmode="numeric" class={cssError(5)} bind:value={modalVals.dynamicRange} onkeyup={checkSpectroSettings} onfocus={onFocus} onblur={onBlur} />
					<span class="sb-set-unit">dB</span>
				</div>
				{#if errorID[5]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errInt')}</p>{/if}
			</div>
		</div>

		<div class="sb-set-row">
			<label for="set-pre">{tr('settings.preEmph')}<small>{tr('settings.hintPreEmph')}</small></label>
			<div class="sb-set-control sb-set-stack">
				<input id="set-pre" type="text" inputmode="decimal" class={cssError(7)} bind:value={modalVals.preEmphasisFilterFactor} onkeyup={checkSpectroSettings} onfocus={onFocus} onblur={onBlur} />
				<p class="sb-set-result sb-data">{tr('settings.preEmphInfo')} <em>ŝ(k) = s(k) − {modalVals.preEmphasisFilterFactor}·s(k−1)</em></p>
				{#if errorID[7]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errFloat')}</p>{/if}
			</div>
		</div>

		<div class="sb-set-row">
			<label for="set-wfn">{tr('settings.windowFunction')}<small>{tr('settings.hintWindowFn')}</small></label>
			<div class="sb-set-control">
				<select id="set-wfn" bind:value={selWindowName}>
					{#each windowOptions as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			</div>
		</div>

		<div class="sb-set-row">
			<label for="set-invert">{tr('settings.invertText')}<small>{tr('settings.hintInvert')}</small></label>
			<div class="sb-set-control"><input id="set-invert" type="checkbox" bind:checked={modalVals.invert} /></div>
		</div>

		<div class="sb-set-row">
			<label for="set-heat">{tr('settings.heatMap')}<small>{tr('settings.hintHeatMap')}</small></label>
			<div class="sb-set-control"><input id="set-heat" type="checkbox" bind:checked={modalVals.drawHeatMapColors} /></div>
		</div>

		<div class="sb-set-row" class:sb-set-disabled={!modalVals.drawHeatMapColors}>
			<span class="sb-set-label">{tr('settings.colorOptions')}<small>{tr('settings.hintAnchors')}</small></span>
			<div class="sb-set-control sb-set-stack">
				<div class="sb-set-gradient" style:background={gradientCss} role="img" aria-label={tr('settings.resulting')}></div>
				<table class="sb-set-anchors {cssError(8)}">
					<thead>
						<tr><th></th><th>{tr('settings.red')}</th><th>{tr('settings.green')}</th><th>{tr('settings.blue')}</th><th>{tr('settings.resulting')}</th></tr>
					</thead>
					<tbody>
						{#each [0, 1, 2] as anchorIdx}
							<tr>
								<th scope="row">{tr(['settings.anchor1', 'settings.anchor2', 'settings.anchor3'][anchorIdx])}</th>
								{#each [0, 1, 2] as ch}
									<td><input type="text" inputmode="numeric" class="artic-rgbTextInput" aria-label="{tr(['settings.anchor1', 'settings.anchor2', 'settings.anchor3'][anchorIdx])} {tr(['settings.red', 'settings.green', 'settings.blue'][ch])}" bind:value={modalVals.heatMapColorAnchors[anchorIdx][ch]} onkeyup={checkSpectroSettings} onfocus={onFocus} onblur={onBlur} /></td>
								{/each}
								<td><span class="sb-set-swatch" style:background={anchorCss(anchorIdx)}></span></td>
							</tr>
						{/each}
					</tbody>
				</table>
				{#if errorID[8]}<p class="sb-set-error" role="alert"><b>{tr('settings.error')}</b> {tr('settings.errInt')}</p>{/if}
			</div>
		</div>
	</section>
</div>

<div class="artic-modal-footer">
	<Button label={tr('dialog.cancel')} onclick={reset} />
	<Button id="artic-modal-save" variant="primary" icon={icons.save} label={tr('dataSelector.save')} onclick={saveSettings} />
</div>

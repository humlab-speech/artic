<script lang="ts">
	import { tr } from '../stores/i18n.svelte';
	import { getConfigTick, getTick, invalidate } from '../stores/app-state.svelte';
	import {
		viewStateService,
		levelService,
		soundHandlerService,
		configProviderService,
	} from '../stores/services';
	import OsciOverview from './OsciOverview.svelte';
	import Button from './ui/Button.svelte';
	import { icons } from './ui/icons';

	function cmdZoomIn() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.zoomViewPort(true, levelService);
		invalidate();
	}

	function cmdZoomOut() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.zoomViewPort(false, levelService);
		invalidate();
	}

	function cmdZoomLeft() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.shiftViewPort(false);
		invalidate();
	}

	function cmdZoomRight() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.shiftViewPort(true);
		invalidate();
	}

	function cmdZoomAll() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.setViewPort(0, soundHandlerService.audioBuffer.length);
		invalidate();
	}

	function cmdZoomSel() {
		if (!viewStateService.getPermission('zoom')) return;
		levelService.deleteEditArea();
		viewStateService.setViewPort(viewStateService.curViewPort.selectS, viewStateService.curViewPort.selectE);
		invalidate();
	}

	function cmdPlayView() {
		if (!viewStateService.getPermission('playaudio')) return;
		soundHandlerService.playFromTo(viewStateService.curViewPort.sS, viewStateService.curViewPort.eS);
		viewStateService.animatePlayHead(viewStateService.curViewPort.sS, viewStateService.curViewPort.eS);
		invalidate();
	}

	function cmdPlaySel() {
		if (!viewStateService.getPermission('playaudio')) return;
		soundHandlerService.playFromTo(viewStateService.curViewPort.selectS, viewStateService.curViewPort.selectE);
		viewStateService.animatePlayHead(viewStateService.curViewPort.selectS, viewStateService.curViewPort.selectE);
		invalidate();
	}

	function cmdPlayAll() {
		if (!viewStateService.getPermission('playaudio')) return;
		soundHandlerService.playFromTo(0, soundHandlerService.audioBuffer.length);
		viewStateService.animatePlayHead(0, soundHandlerService.audioBuffer.length);
		invalidate();
	}

	let restrictions = $derived(getConfigTick() >= 0 && configProviderService.vals?.restrictions ? {...configProviderService.vals.restrictions} : undefined);

	let canZoom = $derived.by(() => { getConfigTick(); return viewStateService.getPermission('zoom'); });
	let canPlay = $derived.by(() => { getConfigTick(); return viewStateService.getPermission('playaudio'); });

	// Selection readout, e.g. "Selection 0.740–0.893 s (153 ms)"
	let selectionText = $derived.by(() => {
		getTick();
		const vp = viewStateService.curViewPort;
		const rate = soundHandlerService.audioBuffer?.sampleRate;
		if (!vp || !rate || !(vp.selectE > vp.selectS)) return '';
		const s = vp.selectS / rate, e = vp.selectE / rate;
		return tr('bottom.selectionReadout', { from: s.toFixed(3), to: e.toFixed(3), ms: Math.round((e - s) * 1000) });
	});
</script>

<div class="sb-bottombar artic-bottom-menu">
	<div>
		<OsciOverview />
	</div>

	<div class="sb-bottombar-row">
		<Button id="zoomInBtn" icon={icons.zoomIn} label={tr('bottom.zoomIn')} disabled={!canZoom} onclick={cmdZoomIn} />
		<Button id="zoomOutBtn" icon={icons.zoomOut} label={tr('bottom.zoomOut')} disabled={!canZoom} onclick={cmdZoomOut} />
		<Button id="zoomLeftBtn" icon={icons.left} label={tr('bottom.left')} disabled={!canZoom} onclick={cmdZoomLeft} />
		<Button id="zoomRightBtn" icon={icons.right} label={tr('bottom.right')} disabled={!canZoom} onclick={cmdZoomRight} />
		<Button id="zoomAllBtn" icon={icons.zoomAll} label={tr('bottom.all')} disabled={!canZoom} onclick={cmdZoomAll} />
		<Button id="zoomSelBtn" icon={icons.zoomSelection} label={tr('bottom.selection')} disabled={!canZoom} onclick={cmdZoomSel} />

		{#if restrictions?.playback}
			<Button id="playViewBtn" variant="outline" icon={icons.play} label={tr('bottom.playView')} disabled={!canPlay} onclick={cmdPlayView} />
			<Button id="playSelBtn" icon={icons.playSelection} label={tr('bottom.playSelection')} disabled={!canPlay} onclick={cmdPlaySel} />
			<Button id="playAllBtn" icon={icons.play} label={tr('bottom.playAll')} disabled={!canPlay} onclick={cmdPlayAll} />
		{/if}

		{#if selectionText}<span class="sb-selection sb-data">{selectionText}</span>{/if}
	</div>
</div>

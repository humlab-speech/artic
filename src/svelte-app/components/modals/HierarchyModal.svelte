<script lang="ts">
	import { getConfigTick, invalidate } from '../../stores/app-state.svelte';
	import {
		viewStateService,
		historyService,
		modalService,
		hierarchyLayoutService,
		configProviderService,
		standardFuncsService,
	} from '../../stores/services';
	import EmuHierarchy from '../EmuHierarchy.svelte';
	import Icon from '../ui/Icon.svelte';
	import Button from '../ui/Button.svelte';
	import Menu from '../ui/Menu.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { icons } from '../ui/icons';

	const pathInfo = hierarchyLayoutService.findAllNonPartialPaths();
	const possiblePaths: string[][] = pathInfo.possible;
	const possiblePathsAsStr: string[] = pathInfo.possibleAsStr;

	// Initialize path if not yet set (RC1)
	if ((!viewStateService.hierarchyState.path || viewStateService.hierarchyState.path.length === 0) && possiblePaths.length > 0) {
		viewStateService.hierarchyState.path = possiblePaths[0];
		viewStateService.hierarchyState.curPathIdx = 0;
	}

	// Reactive state
	let selectedPathIdx = $state(viewStateService.hierarchyState.curPathIdx || 0);

	// Reactive bridge: derive current path from tick so Svelte detects changes (RC3)
	let currentPath = $derived.by(() => {
		getConfigTick();
		return [...(viewStateService.hierarchyState.path || [])];
	});

	$effect(() => {
		getConfigTick();
		selectedPathIdx = viewStateService.hierarchyState.curPathIdx || 0;
	});

	// Dropdown state for attribute definition selectors per level (RC4)

	function onPathChange(event: Event) {
		const idx = parseInt((event.target as HTMLSelectElement).value, 10);
		selectedPathIdx = idx;
		viewStateService.hierarchyState.curPathIdx = idx;
		viewStateService.hierarchyState.path = possiblePaths[idx];
		invalidate(); // RC2: trigger EmuHierarchy re-render
	}

	function rotateHierarchy() {
		viewStateService.hierarchyState.toggleRotation();
		invalidate();
	}

	function playSelection() {
		++viewStateService.hierarchyState.playing;
		invalidate();
	}

	function toggleViewportSync() {
		viewStateService.hierarchyState.toggleViewportSync();
		invalidate();
	}

	let viewportSyncLabel = $derived.by(() => {
		getConfigTick();
		return viewStateService.hierarchyState.viewportSync ? tr('hierarchyDialog.showAll') : tr('hierarchyDialog.syncZoom');
	});

	function setCurrentAttrDef(levelName: string, attrName: string, index: number) {
		viewStateService.setCurAttrDef(levelName, attrName, index);
		invalidate();
	}
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		{#each [...currentPath].reverse() as levelName (levelName)}
			<span style="margin-left: 5px;">
				<Menu
					variant="outline"
					label={levelName}
					items={(configProviderService.getAttrDefsNames(levelName) || []).map((attrName: string, i: number) => ({
						label: '→ ' + attrName,
						onselect: () => setCurrentAttrDef(levelName, attrName, i),
					}))}
				/>
			</span>
		{/each}
	</div>
	<div class="artic-modal-body artic-modal-hierarchy">
		<div class="artic-modal-select">
			<select id="artic-selection" onchange={onPathChange} value={selectedPathIdx}>
				{#each possiblePathsAsStr as pathStr, idx (idx)}
					<option value={idx}>{pathStr}</option>
				{/each}
			</select>
		</div>
		<EmuHierarchy />
	</div>
	<div class="artic-modal-footer">
		<Button icon={icons.play} label={tr('hierarchyDialog.playSelected')} onclick={playSelection} />
		<Button label={viewportSyncLabel} onclick={toggleViewportSync} />
		<Button icon={icons.rotate} label={tr('hierarchyDialog.rotate')} onclick={rotateHierarchy} />
		<Button label={tr('dialog.close')} onclick={() => modalService.close()} />
	</div>
</div>

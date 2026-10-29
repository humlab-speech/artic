<script lang="ts">
	import { getTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { configProviderService, viewStateService, dataSourceService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import Menu from '../ui/Menu.svelte';
	import { icons } from '../ui/icons';
	import * as actions from './toolbar-actions';
	import DataSelector from './DataSelector.svelte';
	import HeaderMenu from './HeaderMenu.svelte';

	// chrome="toolbar": no header, so the data selector and menu live in the toolbar
	let { chrome = 'full' }: { chrome?: 'full' | 'embedded' | 'toolbar' } = $props();

	// Reactive bridge: spread so Svelte sees a new object on every tick
	let caps = $derived(getTick() >= 0 ? dataSourceService.capabilities : undefined);
	let activeButtons = $derived(getTick() >= 0 && configProviderService.vals?.activeButtons ? { ...configProviderService.vals.activeButtons } : undefined);
	let demoDBs = $derived.by(() => {
		if (getTick() < 0) return [] as string[];
		const base = configProviderService.vals?.demoDBs ?? [];
		if (!configProviderService.devMode) return base;
		return [...base, ...(configProviderService.vals?.devDemoDBs ?? [])].sort();
	});
	let perms = $derived.by(() => {
		getTick();
		const p = (k: string) => viewStateService.getPermission(k);
		return {
			addLevelSeg: p('addLevelSegBtnClick'), addLevelEvent: p('addLevelPointBtnClick'), renameSel: p('renameSelLevelBtnClick'),
			spectSettings: p('spectSettingsChange'), openDemo: p('openDemoBtnDBclick'), connect: p('connectBtnClick'),
			showHierarchy: p('showHierarchyBtnClick'), search: p('searchBtnClick'), clear: p('clearBtnClick'),
		};
	});
	let hasLeftGroup = $derived(!!caps?.canEditStructure || !!caps?.canRenameLevel);
	let hasMiddleGroup = $derived(!!activeButtons?.showHierarchy || !!activeButtons?.search);
</script>

<div class="sb-toolbar" role="toolbar" aria-label="Artic">
	{#if chrome === 'toolbar'}
		<DataSelector compact />
		<span class="sb-toolbar-sep"></span>
	{/if}
	{#if caps?.canEditStructure}
		<Button icon={icons.add} label={tr('toolbar.addSegmentLevel')} disabled={!perms.addLevelSeg} onclick={actions.addLevelSeg} />
		<Button icon={icons.add} label={tr('toolbar.addEventLevel')} disabled={!perms.addLevelEvent} onclick={actions.addLevelEvent} />
	{/if}
	{#if caps?.canRenameLevel}
		<Button icon={icons.rename} label={tr('toolbar.renameLevel')} disabled={!perms.renameSel} onclick={actions.renameSelLevel} />
	{/if}
	{#if hasLeftGroup && (hasMiddleGroup || activeButtons?.specSettings)}<span class="sb-toolbar-sep"></span>{/if}

	{#if activeButtons?.showHierarchy}
		<Button id="showHierarchy" icon={icons.hierarchy} label={tr('toolbar.hierarchy')} disabled={!perms.showHierarchy} onclick={actions.showHierarchy} />
	{/if}
	{#if activeButtons?.search}
		<Button id="searchBtn" icon={icons.search} label={tr('toolbar.search')} disabled={!perms.search} onclick={actions.openSearch} />
	{/if}
	{#if hasMiddleGroup && activeButtons?.specSettings}<span class="sb-toolbar-sep"></span>{/if}

	{#if activeButtons?.specSettings}
		<Button id="spectSettingsBtn" icon={icons.settings} label={tr('toolbar.settings')} disabled={!perms.spectSettings} onclick={actions.openSettings} />
	{/if}

	<span class="sb-toolbar-spacer"></span>

	{#if activeButtons?.clear && caps}
		<Button id="clear" variant="danger" icon={icons.close} label={tr(caps.closeLabelKey)} disabled={!perms.clear} onclick={actions.closeAll} />
	{/if}
	{#if chrome === 'toolbar'}
		<span class="sb-toolbar-sep"></span>
		<HeaderMenu />
	{/if}
</div>

<script lang="ts">
	import { getTick, invalidate } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import {
		configProviderService,
		viewStateService,
		historyService,
		loadedMetaDataService,
		dataSourceService,
	} from '../../stores/services';
	import { motion } from '../../../core/theme/tokens';
	import Badge from '../ui/Badge.svelte';
	import Button from '../ui/Button.svelte';
	import Field from '../ui/Field.svelte';
	import Menu from '../ui/Menu.svelte';
	import { icons } from '../ui/icons';
	import { requestBundleSwitch } from './bundle-switch';
	import { saveBundle, downloadTextGrid, downloadAnnotation } from './toolbar-actions';

	let { compact = false }: { compact?: boolean } = $props();

	let caps = $derived(getTick() >= 0 ? dataSourceService.capabilities : undefined);
	let source = $derived(getTick() >= 0 ? dataSourceService.source : 'none');
	let curBndl = $derived(getTick() >= 0 ? loadedMetaDataService.getCurBndl() : undefined);
	let list = $derived(getTick() >= 0 ? (loadedMetaDataService.getBundleList() ?? []) : []);
	let idx = $derived(curBndl ? list.indexOf(curBndl) : -1);
	let dirty = $derived(getTick() >= 0 && historyService.movesAwayFromLastSave !== 0);
	let sidebarEnabled = $derived(
		getTick() >= 0 && !!configProviderService.vals?.activeButtons?.openMenu && !(viewStateService as any).bundleListSideBarDisabled,
	);

	let dbName = $derived.by(() => {
		if (getTick() < 0 || source === 'none') return tr('dataSelector.noDatabase');
		if (source === 'local') return tr('dataSelector.localFiles');
		if (source === 'demo') return loadedMetaDataService.getDemoDbName();
		return configProviderService.curDbConfig?.name || '–';
	});
	let bundleLabel = $derived(
		source === 'none' ? tr('dataSelector.noBundle')
		: curBndl?.name ? (curBndl.session ? curBndl.session + ' / ' : '') + curBndl.name : '–',
	);

	function toggleSidebar() {
		viewStateService.toggleBundleListSideBar(motion.period);
		invalidate();
	}

	function go(i: number) {
		const target = list[i];
		if (target) requestBundleSwitch(target);
	}
</script>

<div class="sb-data-selector">
	{#if caps && source === 'local'}
		<Badge tone="warning" icon={icons.warning} title={tr('dataSelector.localModeHint')}>{tr('dataSelector.localMode')}</Badge>
	{/if}

	<Field label={tr('dataSelector.database')} muted={source === 'none'}>{dbName}</Field>

	{#if true}
		<Field
			label={tr('dataSelector.bundle')}
			mode="button"
			id="bundleListSideBarOpen"
			muted={source === 'none'}
			disabled={source === 'none' || !sidebarEnabled}
			onclick={toggleSidebar}
		>
			{bundleLabel}
			{#if dirty}<span class="sb-unsaved-dot" role="img" aria-label={tr('dataSelector.unsaved')} title={tr('dataSelector.unsaved')}></span>{/if}
		</Field>

		{#if caps?.canSave}
			<Button
				variant={dirty ? 'primary' : 'default'}
				icon={icons.save}
				label={tr('dataSelector.save')}
				title={tr('dataSelector.saveTooltip', { name: curBndl?.name ?? '', key: 'S' })}
				onclick={saveBundle}
			/>
		{:else if caps?.canExport}
			<Menu
				label={tr('dataSelector.export')}
				icon={icons.export}
				variant={dirty ? 'primary' : 'default'}
				items={[
					{ id: 'downloadTextgrid', label: tr('dataSelector.exportTextGrid'), onselect: downloadTextGrid },
					{ id: 'downloadAnnotation', label: tr('dataSelector.exportAnnotJson'), onselect: downloadAnnotation },
				]}
			/>
		{/if}

		{#if list.length > 1 || source === 'none'}
			<div role="group" aria-label={tr('dataSelector.bundle')} style="display: inline-flex; align-items: center;">
				<Button size="sm" iconOnly icon={icons.firstBundle} label={tr('dataSelector.firstBundle')} disabled={idx <= 0} onclick={() => go(0)} />
				<Button size="sm" iconOnly icon={icons.prevBundle} label={tr('dataSelector.prevBundle')} disabled={idx <= 0} onclick={() => go(idx - 1)} />
				<Button size="sm" iconOnly icon={icons.nextBundle} label={tr('dataSelector.nextBundle')} disabled={idx < 0 || idx >= list.length - 1} onclick={() => go(idx + 1)} />
				<Button size="sm" iconOnly icon={icons.lastBundle} label={tr('dataSelector.lastBundle')} disabled={idx < 0 || idx >= list.length - 1} onclick={() => go(list.length - 1)} />
			</div>
			<span class="sb-count sb-data">{tr('dataSelector.count', { n: idx + 1, m: list.length })}</span>
		{/if}
	{/if}
</div>

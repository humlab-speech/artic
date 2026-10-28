<script lang="ts">
	import { getDataTick } from '../stores/app-state.svelte';
	import { tr } from '../stores/i18n.svelte';
	import {
		viewStateService,
		loadedMetaDataService,
		historyService,
		configProviderService,
		dataSourceService,
	} from '../stores/services';
	import { requestBundleSwitch } from './shell/bundle-switch';
	import Icon from './ui/Icon.svelte';
	import { icons } from './ui/icons';

	let filterText = $state('');

	// Reactive state from services
	let sideBarOpen = $derived.by(() => {
		getDataTick();
		return !dataSourceService.capabilities.showStartView
			&& !viewStateService.bundleListSideBarDisabled && viewStateService.getBundleListSideBarOpen();
	});

	let groupedBundles = $derived.by(() => {
		getDataTick();
		const list = loadedMetaDataService.getBundleList();
		if (!list || list.length === 0) return [];
		const groups: Map<string, any[]> = new Map();
		for (const bndl of list) {
			const session = bndl.session || '';
			if (!groups.has(session)) groups.set(session, []);
			groups.get(session)!.push(bndl);
		}
		return Array.from(groups.entries()).map(([session, bundles]) => ({ session, bundles }));
	});

	let curBndl = $derived.by(() => {
		getDataTick();
		return loadedMetaDataService.getCurBndl();
	});

	let timeAnchors = $derived.by(() => {
		getDataTick();
		return curBndl?.timeAnchors ?? [];
	});

	let curAnchorIdx = $derived.by(() => {
		getDataTick();
		return viewStateService.curTimeAnchorIdx ?? -1;
	});

	let hasUnsavedChanges = $derived(getDataTick() >= 0 && historyService.movesAwayFromLastSave !== 0);

	// Read-only when the configuration forbids every kind of editing
	let readOnly = $derived.by(() => {
		getDataTick();
		const r = configProviderService.vals?.restrictions;
		return !!r && !(r.editItemName || r.editItemSize || r.addItem || r.deleteItem);
	});

	function prevAnchor() {
		if (curAnchorIdx <= 0) {
			goToAdjacentBundle(-1, true);
			return;
		}
		viewStateService.navigateTimeAnchor(-1, timeAnchors);
	}

	function nextAnchor() {
		if (curAnchorIdx >= timeAnchors.length - 1) {
			goToAdjacentBundle(1, false);
			return;
		}
		viewStateService.navigateTimeAnchor(1, timeAnchors);
	}

	// Step to the neighbouring bundle in the playlist and land on its first
	// (or, going backwards, last) time anchor, so a review playlist plays
	// through without manual bundle clicks.
	function goToAdjacentBundle(offset: number, atEnd: boolean) {
		const list = loadedMetaDataService.getBundleList();
		const i = list.indexOf(curBndl);
		const target = i >= 0 ? list[i + offset] : undefined;
		if (!target) return;
		Promise.resolve(loadBundle(target)).then(() => {
			const anchors = loadedMetaDataService.getCurBndl()?.timeAnchors ?? [];
			if (anchors.length === 0) return;
			viewStateService.curTimeAnchorIdx = atEnd ? anchors.length - 1 : 0;
			viewStateService.navigateTimeAnchor(0, anchors);
		});
	}

	function loadBundle(bndl: any) {
		return requestBundleSwitch(bndl);
	}

	function toggleSession(session: string) {
		loadedMetaDataService.openCollapseSession(session);
	}

	function isFiltered(bndl: any): boolean {
		if (!filterText) return true;
		const search = filterText.toLowerCase();
		return (bndl.name?.toLowerCase().includes(search) || bndl.session?.toLowerCase().includes(search));
	}

	function isSessionOpen(session: string): boolean {
		return loadedMetaDataService.isSessionOpen ? loadedMetaDataService.isSessionOpen(session) : true;
	}
</script>

{#if sideBarOpen}
<div class="artic-bundle-outer">
	<h3 class="sb-sidebar-heading">{tr('bundleList.title')}</h3>
	<div class="sb-filter">
		<Icon icon={icons.filter} />
		<input
			class="artic-filter sb-data"
			type="text"
			aria-label={tr('bundleList.filter')}
			placeholder={tr('bundleList.filter')}
			bind:value={filterText}
			onfocus={() => viewStateService.setcursorInTextField(true)}
			onblur={() => viewStateService.setcursorInTextField(false)}
		/>
	</div>
	{#if timeAnchors.length > 0}
		<div class="sb-anchors">
			<button class="sb-icon-btn" onclick={prevAnchor} disabled={curAnchorIdx <= 0}
				title={tr('bundleList.prevAnchor')} aria-label={tr('bundleList.prevAnchor')}><Icon icon={icons.prevAnchor} /></button>
			<span>{tr('bundleList.anchor', { n: Math.max(0, curAnchorIdx + 1), m: timeAnchors.length })}</span>
			<button class="sb-icon-btn" onclick={nextAnchor} disabled={curAnchorIdx >= timeAnchors.length - 1}
				title={tr('bundleList.nextAnchor')} aria-label={tr('bundleList.nextAnchor')}><Icon icon={icons.nextAnchor} /></button>
		</div>
	{/if}
	<div class="artic-bundle-container">
		{#each groupedBundles as group}
			{#if group.session || groupedBundles.length > 1}
				<div class="artic-bundle-session sb-data" onclick={() => toggleSession(group.session)} onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSession(group.session)} role="button" tabindex="0" aria-expanded={isSessionOpen(group.session)}>
					<Icon icon={isSessionOpen(group.session) ? icons.expanded : icons.collapsed} />
					<b>{group.session}</b>
				</div>
			{/if}
			{#if isSessionOpen(group.session)}
				<ul>
					{#each group.bundles as bndl, i}
						{#if isFiltered(bndl)}
							<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<li class="artic-bundle-item sb-data"
								class:artic-bundle-last={i === group.bundles.length - 1}
								class:is-current={curBndl === bndl}
								class:is-dirty={curBndl === bndl && hasUnsavedChanges}
								aria-current={curBndl === bndl ? 'true' : undefined}
								onclick={() => loadBundle(bndl)}
								onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && loadBundle(bndl)}
								tabindex="0"
							>
								{bndl.name}
								{#if curBndl === bndl && hasUnsavedChanges}
									<span class="sb-unsaved-dot" role="img" aria-label={tr('dataSelector.unsaved')} title={tr('dataSelector.unsaved')}></span>
								{/if}
							</li>
						{/if}
					{/each}
				</ul>
			{/if}
		{/each}
	</div>
	<div class="sb-sidebar-footer">
		<Icon icon={readOnly ? icons.readOnly : icons.editable} />
		{readOnly ? tr('bundleList.readOnly') : tr('bundleList.editable')}
	</div>
</div>
{/if}

<script lang="ts">
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';
	import { modalService, viewStateService, hierarchyLayoutService, levelService, loadedMetaDataService, configProviderService, standardFuncsService, dataService } from '../../stores/services';

	const hierPaths = hierarchyLayoutService.findAllNonPartialPaths();

	let curHierPathIdx = $state(0);
	let curLevels = $state<string[]>(hierPaths.possible[0] || []);
	let curLevel = $state(hierPaths.possible[0]?.[0] || '');
	let curAttrDefs = $state<string[]>(configProviderService.getAttrDefsNames(hierPaths.possible[0]?.[0] || '') || []);
	let curAttrDef = $state((configProviderService.getAttrDefsNames(hierPaths.possible[0]?.[0] || '') || [])[0] || '');
	let curAttrIdx = $state(0);
	let searchString = $state('');
	let useRegExSearch = $state(false);
	let resultTimeAnchors = $state<any[]>([]);

	function changedHierPath() {
		curLevels = hierPaths.possible[curHierPathIdx] || [];
		curLevel = curLevels[0] || '';
		curAttrDefs = configProviderService.getAttrDefsNames(curLevel) || [];
		curAttrDef = curAttrDefs[0] || '';
		curAttrIdx = 0;
	}

	function changedLevel() {
		curAttrDefs = configProviderService.getAttrDefsNames(curLevel) || [];
		curAttrDef = curAttrDefs[0] || '';
		curAttrIdx = 0;
	}

	function changedAttrDef() {
		curAttrIdx = curAttrDefs.indexOf(curAttrDef);
	}

	function search() {
		hierarchyLayoutService.findParents(hierPaths.possible[curHierPathIdx]);
		const curLevelDetails = levelService.getLevelDetails(curLevel);
		resultTimeAnchors = [];
		for (let itemIdx = 0; itemIdx < curLevelDetails.items.length; itemIdx++) {
			const val = curLevelDetails.items[itemIdx].labels[curAttrIdx].value;
			const match = useRegExSearch
				? val.match(searchString)
				: val === searchString;
			if (match) {
				resultTimeAnchors.push({
					label: val,
					sample_start: curLevelDetails.items[itemIdx]._derivedSampleStart,
					sample_end: curLevelDetails.items[itemIdx]._derivedSampleEnd,
				});
			}
		}
	}

	function previewTimeAnchor(ta) {
		viewStateService.curViewPort.selectS = ta.sample_start;
		viewStateService.curViewPort.selectE = ta.sample_end;
		viewStateService.setViewPort(ta.sample_start, ta.sample_end);
	}

	function saveTimeAnchors() {
		loadedMetaDataService.setTimeAnchors(resultTimeAnchors);
		standardFuncsService.traverseAndClean(dataService.getData());
		modalService.close();
	}

	function onFocus() { viewStateService.setEditing(true); viewStateService.setcursorInTextField(true); }
	function onBlur() { viewStateService.setEditing(false); viewStateService.setcursorInTextField(false); }
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('search.title')}</h3>
	</div>
	<div class="artic-modal-body">
		<div class="artic-text">
			<h2>{tr('search.path')}</h2>
			<select bind:value={curHierPathIdx} onchange={changedHierPath}>
				{#each hierPaths.possibleAsStr as pathStr, idx}
					<option value={idx}>{pathStr}</option>
				{/each}
			</select>

			<h2>{tr('search.level')}</h2>
			<select bind:value={curLevel} onchange={changedLevel}>
				{#each curLevels as lvl}
					<option value={lvl}>{lvl}</option>
				{/each}
			</select>

			<h2>{tr('search.attrDef')}</h2>
			<select bind:value={curAttrDef} onchange={changedAttrDef}>
				{#each curAttrDefs as ad}
					<option value={ad}>{ad}</option>
				{/each}
			</select>

			<h2>{tr('search.string')}</h2>
			<input type="text" bind:value={searchString} onfocus={onFocus} onblur={onBlur} /><br />
			Use RegEx Search: <input type="checkbox" bind:checked={useRegExSearch} /><br />
			<button onclick={search}>{tr('search.search')}</button>

			{#if resultTimeAnchors.length > 0}
				<h2>{tr('search.result')}</h2>
				<table class="artic-modalTable"><tbody>
					<tr><td>{tr('search.colString')}</td><td>sample_start</td><td>sample_end</td></tr>
					{#each resultTimeAnchors as ta}
						<tr onclick={() => previewTimeAnchor(ta)} style="cursor:pointer" title={tr('search.preview')}><td>{ta.label}</td><td>{ta.sample_start}</td><td>{ta.sample_end}</td></tr>
					{/each}
				</tbody></table>
			{/if}
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button label={tr('dialog.close')} onclick={() => modalService.close()} />
		<Button id="artic-modal-save" variant="primary" label={tr('search.saveAnchors')} onclick={saveTimeAnchors} />
	</div>
</div>

<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { modalService, dataSourceService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import { icons } from '../ui/icons';

	let bundleName = $derived(getConfigTick() >= 0 ? modalService.dataIn : '');
	let caps = $derived(getConfigTick() >= 0 ? dataSourceService.capabilities : undefined);
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading"><span class="sb-dialog-icon sb-dialog-icon-warning"><Icon icon={icons.warning} /></span>{tr('saveChanges.title')}</h3>
	</div>
	<div class="artic-modal-body">
		{#if caps?.canSave}
			<p>{tr('saveChanges.askSave', { name: bundleName })}</p>
		{:else}
			<p>{tr('saveChanges.askDiscard', { name: bundleName })}</p>
		{/if}
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		{#if caps?.canExport}
			<Button label={tr('dialog.exportFirst')} onclick={() => modalService.close()} />
		{/if}
		<Button variant="danger" label={caps?.canSave ? tr('dialog.discardChanges') : tr('dialog.discardAndContinue')} onclick={() => modalService.closeAndResolve('discardChanges')} />
		{#if caps?.canSave}
			<Button variant="primary" label={tr('dialog.saveAndContinue')} onclick={() => modalService.closeAndResolve('saveChanges')} />
		{/if}
	</div>
</div>

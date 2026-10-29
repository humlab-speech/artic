<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { modalService, dataSourceService, historyService } from '../../stores/services';
	import { invalidate } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';
	import { icons } from '../ui/icons';

	let filename = $derived(getConfigTick() >= 0 ? (modalService.dataIn || '') : '');
	let content = $derived(getConfigTick() >= 0 ? modalService.dataExport : undefined);

	function doExport() {
		// Callers pass ready-made text (TextGrid, annotation JSON): write as-is, never re-encode
		const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
		const blob = new Blob([text], { type: filename.endsWith('.json') ? 'application/json' : 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
		// Local mode: the export is the save, so clear the unsaved marker
		if (dataSourceService.source === 'local') {
			historyService.movesAwayFromLastSave = 0;
			invalidate();
		}
		modalService.close();
	}
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('dialog.downloadTitle')}</h3>
	</div>
	<div class="artic-modal-body">
		<div class="artic-text">
			<div>{tr('dialog.downloadConfirm')}</div>
			<div><strong>{filename}</strong></div>
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		<Button variant="primary" icon={icons.export} label={tr('dialog.download')} onclick={doExport} />
	</div>
</div>

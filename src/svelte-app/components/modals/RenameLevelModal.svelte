<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { modalService, levelService, historyService, viewStateService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import { icons } from '../ui/icons';

	let originalName = $derived(getConfigTick() >= 0 ? (modalService.dataIn || '') : '');
	let newName = $state('');

	function renameLevel() {
		const name = newName.trim() || originalName;
		levelService.renameLevel(originalName, name);
		historyService.addCurChangeObjToUndoStack();
		modalService.close();
	}

	function onFocus() { viewStateService.cursorInTextField = true; }
	function onBlur() { viewStateService.cursorInTextField = false; }
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('rename.title')}</h3>
	</div>
	<div class="artic-modal-body">
		<p>{tr('rename.question', { name: originalName })}</p>
		<p>
			<input
				type="text"
				bind:value={newName}
				placeholder={originalName}
				aria-label={tr('rename.title')}
				onfocus={onFocus}
				onblur={onBlur}
			/>
		</p>
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		<Button variant="primary" icon={icons.rename} label={tr('dialog.rename')} onclick={renameLevel} />
	</div>
</div>

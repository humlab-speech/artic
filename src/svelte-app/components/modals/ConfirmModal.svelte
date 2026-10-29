<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { modalService } from '../../stores/services';
	import Button from '../ui/Button.svelte';

	let message = $derived(getConfigTick() >= 0 ? modalService.dataIn : '');
	let variant = $derived(getConfigTick() >= 0 ? modalService.variant : 'primary');
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('dialog.confirm')}</h3>
	</div>
	<div class="artic-modal-body">
		<div class="artic-text">
			<div>{message}</div>
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button id="artic-modal-cancel" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		<Button id="artic-modal-confirm" {variant} label={tr('dialog.confirm')} onclick={() => modalService.confirm()} />
	</div>
</div>

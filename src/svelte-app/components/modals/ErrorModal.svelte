<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { modalService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import { icons } from '../ui/icons';

	let message = $derived(getConfigTick() >= 0 ? modalService.dataIn : '');
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading"><span class="sb-dialog-icon sb-dialog-icon-danger"><Icon icon={icons.error} /></span>{tr('error.title')}</h3>
	</div>
	<div class="artic-modal-body">
		<div class="artic-text">
			<div id="artic-error-text">{message}</div>
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button id="artic-modal-cancel" label={tr('dialog.close')} onclick={() => modalService.close()} />
	</div>
</div>

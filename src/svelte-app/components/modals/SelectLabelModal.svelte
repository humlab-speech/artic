<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { modalService } from '../../stores/services';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';

	let options = $derived(getConfigTick() >= 0 ? (modalService.dataIn || []) : []);
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('select.labelTitle')}</h3>
	</div>
	<div class="artic-modal-body">
		<b>{tr('select.choose')}</b>
		<ul class="artic-modalUl">
			{#each options as opt, idx}
				<li>
					<div class="artic-card" role="button" tabindex="0"
						onclick={() => { modalService.dataOut = idx; modalService.confirmContent(); }}
						onkeydown={(e) => e.key === 'Enter' && (modalService.dataOut = idx, modalService.confirmContent())}
					>
						{opt}
					</div>
				</li>
			{/each}
		</ul>
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
	</div>
</div>

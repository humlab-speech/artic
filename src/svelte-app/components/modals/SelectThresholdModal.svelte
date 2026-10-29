<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { modalService } from '../../stores/services';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';

	let dataIn = $derived(getConfigTick() >= 0 ? (modalService.dataIn || {}) : {});
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('select.thresholdTitle')}</h3>
	</div>
	<div class="artic-modal-body">
		<b>{dataIn.description}</b><br />&nbsp;<br />
		<p>{tr('select.thresholdOptions')}</p>
		<ul class="artic-modalUl">
			<li>minimum value: {dataIn.minVal}</li>
			<li>maximum value: {dataIn.maxVal}</li>
			<li>threshold value: {dataIn.threshold}</li>
		</ul>
		<b>{tr('select.choose')}</b>
		<ul class="artic-modalUl">
			{#each (dataIn.options || []) as opt, idx}
				<li>
					<div class="artic-card" role="button" tabindex="0"
						onclick={() => modalService.select(idx)}
						onkeydown={(e) => e.key === 'Enter' && modalService.select(idx)}
					>
						<ul class="artic-modalUl">
							<li>Threshold index: {opt.thresholdIdx}</li>
							<li>Threshold value: {opt.thresholdValue}</li>
						</ul>
					</div>
				</li>
			{/each}
		</ul>
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
	</div>
</div>

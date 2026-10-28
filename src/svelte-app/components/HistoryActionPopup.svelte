<script lang="ts">
	import { viewStateService } from '../stores/services';
</script>

{#if viewStateService.historyActionTxt}
<div class="history-popup">{viewStateService.historyActionTxt}</div>
{/if}

<style>
	.history-popup {
		position: absolute;
		top: 4px;
		right: 4px;
		background: var(--sb-surface-3);
		color: var(--sb-text);
		padding: 4px 8px;
		border-radius: 4px;
		font-size: var(--sb-size-xs);
		z-index: 50;
		pointer-events: none;
	}
</style>

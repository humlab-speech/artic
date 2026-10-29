<script lang="ts">
	import { getTick } from '../../stores/app-state.svelte';
	import { dataSourceService } from '../../stores/services';
	import DataSelector from './DataSelector.svelte';
	import HeaderMenu from './HeaderMenu.svelte';
	import Logo from './Logo.svelte';
	import { closeAll } from './toolbar-actions';

	let { chrome = 'full' }: { chrome?: 'full' | 'embedded' | 'toolbar' } = $props();

	let atStart = $derived(getTick() >= 0 ? dataSourceService.source === 'none' : true);
</script>

{#if chrome !== 'toolbar'}
<header class="sb-header">
	<div class="sb-header-left">{#if chrome === 'full'}<Logo disabled={atStart} onclick={closeAll} />{/if}</div>
	<div class="sb-header-center">{#if !atStart}<DataSelector />{/if}</div>
	<div class="sb-header-right"><HeaderMenu /></div>
</header>
{/if}

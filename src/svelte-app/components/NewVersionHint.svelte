<script lang="ts">
	import { tr } from '../stores/i18n.svelte';
	import { getConfigTick } from '../stores/app-state.svelte';
	import { appcacheHandlerService } from '../stores/services';
	import { version } from '../../../package.json';
	import Icon from './ui/Icon.svelte';
	import { icons } from './ui/icons';

	let show = $derived(getConfigTick() >= 0 && appcacheHandlerService.newVersionAvailable);

	interface Props {
		onAboutClick?: () => void;
	}
	let { onAboutClick }: Props = $props();
</script>

{#if show}
<div class="artic-aboutHint">
	<button class="artic-aboutHint-hidden" onclick={onAboutClick} aria-label={tr('about.moreInfoLabel')}></button>
	{tr('about.newVersion', { version })}
	<div class="artic-aboutHint-arrow">{tr('about.moreInfo')} <Icon icon={icons.info} /></div>
</div>
{/if}

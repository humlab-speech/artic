<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	let { tone = 'warning', icon, title, children }: {
		tone?: 'warning';
		icon?: IconDefinition;
		title?: string;
		children?: Snippet;
	} = $props();
</script>

<span class="sb-badge sb-badge-{tone}" {title}>
	{#if icon}<Icon icon={icon} />{/if}
	{#if children}{@render children()}{/if}
</span>

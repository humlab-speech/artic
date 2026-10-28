<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { icons } from './icons';

	/**
	 * A labelled value. mode="readonly" is plain text; mode="button" is a
	 * clickable field with a chevron (used for the bundle chooser).
	 */
	let { label, mode = 'readonly', muted = false, disabled = false, id, title, onclick, children }: {
		label: string;
		mode?: 'readonly' | 'button';
		muted?: boolean;
		disabled?: boolean;
		id?: string;
		title?: string;
		onclick?: () => void;
		children?: Snippet;
	} = $props();
</script>

{#if mode === 'button'}
	<button type="button" class="sb-field sb-field-button" {id} {title} {disabled} {onclick}>
		<span class="sb-field-label">{label}</span>
		<span class="sb-field-value sb-data" class:sb-muted={muted}>
			{#if children}{@render children()}{/if}
			<Icon icon={icons.expanded} />
		</span>
	</button>
{:else}
	<div class="sb-field" {id} {title}>
		<span class="sb-field-label">{label}</span>
		<span class="sb-field-value sb-data" class:sb-muted={muted}>
			{#if children}{@render children()}{/if}
		</span>
	</div>
{/if}

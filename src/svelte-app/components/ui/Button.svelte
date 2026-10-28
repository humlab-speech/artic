<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		variant?: 'default' | 'primary' | 'danger' | 'outline';
		size?: 'md' | 'sm';
		icon?: IconDefinition;
		/** Visually hide the text (kept as the accessible name and tooltip). */
		iconOnly?: boolean;
		label?: string;
		children?: Snippet;
	}

	let { variant = 'default', size = 'md', icon, iconOnly = false, label, children, class: cls = '', ...rest }: Props = $props();
</script>

<button
	type="button"
	class="sb-btn sb-btn-{variant} sb-btn-{size} {cls}"
	class:sb-btn-icon-only={iconOnly}
	aria-label={iconOnly ? label : undefined}
	title={rest.title ?? (iconOnly ? label : undefined)}
	{...rest}
>
	{#if icon}<Icon icon={icon} />{/if}
	{#if children}<span class="sb-btn-text" class:sb-visually-hidden={iconOnly}>{@render children()}</span>
	{:else if label && !iconOnly}<span class="sb-btn-text">{label}</span>{/if}
</button>

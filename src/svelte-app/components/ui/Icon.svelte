<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';

	let { icon, label = undefined, class: cls = '' }: { icon: IconDefinition; label?: string; class?: string } = $props();

	const [w, h, , , path] = $derived(icon.icon);
	const d = $derived(Array.isArray(path) ? path.join(' ') : path);
</script>

<svg
	class="sb-icon {cls}"
	viewBox="0 0 {w} {h}"
	fill="currentColor"
	height="1em"
	aria-hidden={label ? undefined : 'true'}
	role={label ? 'img' : undefined}
	aria-label={label}
>
	<path {d} />
</svg>

<style>
	.sb-icon {
		display: inline-block;
		vertical-align: -0.125em;
		width: auto;
	}
</style>

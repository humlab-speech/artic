<script module lang="ts">
	export interface MenuItem {
		id?: string;
		label: string;
		onselect: () => void;
		checked?: boolean;
		disabled?: boolean;
	}
</script>

<script lang="ts">
	import type { IconDefinition } from '@fortawesome/free-solid-svg-icons';
	import { onDestroy, tick } from 'svelte';
	import { viewStateService } from '../../stores/services';
	import Button from './Button.svelte';

	let { label, items, icon, iconOnly = false, variant = 'default', radio = false, triggerId, disabled = false, align = 'left' }: {
		label: string;
		items: MenuItem[];
		icon?: IconDefinition;
		iconOnly?: boolean;
		variant?: 'default' | 'primary' | 'danger' | 'outline';
		radio?: boolean;
		triggerId?: string;
		disabled?: boolean;
		align?: 'left' | 'right';
	} = $props();

	let open = $state(false);
	let root: HTMLElement | undefined = $state();
	let list: HTMLElement | undefined = $state();

	// Global shortcuts are suspended while a menu is open (Task 8.1)
	$effect(() => { viewStateService.menuOpen = open; });
	onDestroy(() => { viewStateService.menuOpen = false; });

	const enabledItems = () => Array.from(list?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([disabled])') ?? []);

	async function toggle() {
		open = !open;
		if (open) {
			await tick();
			enabledItems()[0]?.focus();
		}
	}

	function close(refocus = false) {
		open = false;
		if (refocus) root?.querySelector<HTMLElement>('.sb-menu-trigger button, .sb-menu-trigger')?.focus();
	}

	function select(item: MenuItem) {
		if (item.disabled) return;
		close(true);
		item.onselect();
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		const els = enabledItems();
		const i = els.indexOf(document.activeElement as HTMLElement);
		if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
		else if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
		else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
		else if (e.key === 'Home') { e.preventDefault(); els[0]?.focus(); }
		else if (e.key === 'End') { e.preventDefault(); els[els.length - 1]?.focus(); }
		else if (e.key === 'Tab') { close(); }
	}

	function onOutside(e: PointerEvent) {
		if (open && root && !root.contains(e.target as Node)) close();
	}
</script>

<svelte:window onpointerdown={onOutside} />

<div class="sb-menu" bind:this={root} onkeydown={onKeydown} role="presentation">
	<span class="sb-menu-trigger">
		<Button
			id={triggerId}
			{variant} {icon} {iconOnly} {label} {disabled}
			aria-haspopup="menu"
			aria-expanded={open}
			onclick={toggle}
		/>
	</span>
	{#if open}
		<div class="sb-menu-list sb-menu-{align}" role="menu" aria-label={label} bind:this={list}>
			{#each items as item}
				<button
					type="button"
					id={item.id}
					class="sb-menu-item"
					role={radio ? 'menuitemradio' : 'menuitem'}
					aria-checked={radio ? !!item.checked : undefined}
					disabled={item.disabled}
					onclick={() => select(item)}
				>{item.label}</button>
			{/each}
		</div>
	{/if}
</div>

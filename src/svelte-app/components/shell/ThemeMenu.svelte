<script lang="ts">
	import { themeService } from '../../../core/services/theme.service';
	import { currentTheme } from '../../stores/theme.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';
	import { icons } from '../ui/icons';

	let dark = $derived(currentTheme() === 'dark');
</script>

<Button
	id="themeMenuBtn"
	iconOnly
	icon={icons.themeMenu}
	label={tr('menu.theme')}
	aria-pressed={dark}
	onclick={() => themeService.setPreference(dark ? 'light' : 'dark')}
/>

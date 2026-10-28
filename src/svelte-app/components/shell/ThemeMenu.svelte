<script lang="ts">
	import { themeService, type ThemePreference } from '../../../core/services/theme.service';
	import { themePreference } from '../../stores/theme.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import Menu from '../ui/Menu.svelte';
	import { icons } from '../ui/icons';

	const options: { pref: ThemePreference; key: string }[] = [
		{ pref: 'system', key: 'menu.themeSystem' },
		{ pref: 'light', key: 'menu.themeLight' },
		{ pref: 'dark', key: 'menu.themeDark' },
	];

	let items = $derived(
		options.map((o) => ({
			id: `theme-${o.pref}`,
			label: tr(o.key),
			checked: themePreference() === o.pref,
			onselect: () => themeService.setPreference(o.pref),
		})),
	);
</script>

<Menu label={tr('menu.theme')} icon={icons.themeMenu} iconOnly radio align="right" triggerId="themeMenuBtn" {items} />

<script lang="ts">
	import { setLanguage, languages, type Language } from '../../../core/util/i18n';
	import { currentLanguage, tr } from '../../stores/i18n.svelte';
	import Menu from '../ui/Menu.svelte';
	import { icons } from '../ui/icons';

	let items = $derived(
		languages.map((l: Language) => ({
			id: `lang-${l}`,
			label: tr(`language.${l}`),
			checked: currentLanguage() === l,
			onselect: () => setLanguage(l),
		})),
	);
</script>

<Menu label={tr(`language.${currentLanguage()}`)} icon={icons.language} radio align="right" triggerId="languageMenuBtn" {items} />

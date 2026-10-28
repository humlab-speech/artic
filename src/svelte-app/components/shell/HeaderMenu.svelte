<script lang="ts">
	import { getTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { loadedMetaDataService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import { icons } from '../ui/icons';
	import LanguageMenu from './LanguageMenu.svelte';
	import ThemeMenu from './ThemeMenu.svelte';
	import { openInfo } from './toolbar-actions';

	// Login is requested by the server during connect, so there is no standalone "Log in" button.
	let user = $derived(getTick() >= 0 ? loadedMetaDataService.currentUser : '');
</script>

{#if user}
	<span class="sb-user sb-data" title={tr('header.user', { name: user })}>
		<Icon icon={icons.user} label={tr('header.user', { name: user })} />{user}
	</span>
{/if}
<ThemeMenu />
<LanguageMenu />
<Button id="aboutBtn" iconOnly icon={icons.info} label={tr('header.info')} onclick={openInfo} />

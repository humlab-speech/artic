<script lang="ts">
	import { modalService } from '../../stores/services';
	import { tr } from '../../stores/i18n.svelte';
	import showdown from 'showdown';
	import { version } from '../../../../package.json';
	import AboutTab from '../shell/AboutTab.svelte';
	import Button from '../ui/Button.svelte';

	const converter = new showdown.Converter();

	// The help HTML stays in English (decision 8); only the tab titles are translated.
	const tabs = [
		{ key: 'help.intro', url: 'views/helpTabs/intro.html' },
		{ key: 'help.keys', url: 'views/helpTabs/keys.html' },
		{ key: 'help.manual', url: 'views/helpTabs/manual.html' },
		{ key: 'about.title', url: '' },
	];
	const ABOUT = tabs.length - 1;

	let activeTab = $state(0);
	let htmlContent = $state('');

	async function loadTab(idx: number) {
		activeTab = idx;
		if (idx === ABOUT) return;
		try {
			const res = await fetch(tabs[idx].url);
			const text = await res.text();
			htmlContent = text
				.replace('@@versionnr', version)
				.replace('@@timestamp', typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '')
				.replace('@@sha1', typeof __GIT_SHA__ !== 'undefined' ? __GIT_SHA__ : '');
		} catch {
			htmlContent = '<p>Could not load help content.</p>';
		}
	}

	// Load first tab on mount
	$effect(() => {
		loadTab(0);
	});
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('dialog.help')}</h3>
	</div>
	<div class="artic-modal-body">
		<div id="tabs" class="artic-tabbed">
			<ul class="artic-tabbed-menu">
				{#each tabs as tab, idx}
					<li>
						<button class="artic-tabbed-link"
							class:active={activeTab === idx}
							onclick={() => loadTab(idx)}
							type="button"
						>{tr(tab.key)}</button>
					</li>
				{/each}
			</ul>
			<div class="artic-tabbed-view">
				{#if activeTab === ABOUT}
					<AboutTab />
				{:else}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<div class="artic-text">{@html htmlContent}</div>
				{/if}
			</div>
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.close')} onclick={() => modalService.close()} />
	</div>
</div>

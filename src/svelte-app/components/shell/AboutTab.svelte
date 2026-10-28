<script lang="ts">
	import { tr } from '../../stores/i18n.svelte';
	import { version } from '../../../../package.json';
	import AppFooter from './AppFooter.svelte';

	const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
	const gitSha = typeof __GIT_SHA__ !== 'undefined' ? __GIT_SHA__ : '';
</script>

<div class="sb-about sb-prose">
	<h2>Artic</h2>
	<p>
		{tr('about.version', { version })}
		{#if buildTime}<span class="sb-data sb-muted"> · {buildTime}</span>{/if}
		{#if gitSha}<span class="sb-data sb-muted"> · {gitSha}</span>{/if}
	</p>
	<p>{tr('about.credits')}</p>

	<h3>{tr('about.licences')}</h3>
	<ul>
		<li>Artic: MIT</li>
		<li>Jost, Noto Sans, Noto Serif: SIL Open Font License 1.1</li>
		<li>Font Awesome Free: icons CC BY 4.0, code MIT</li>
	</ul>

	<AppFooter />
</div>

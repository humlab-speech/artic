<script lang="ts">
	import logoLight from '../../../assets/brand/sprakbanken_logo.svg';
	import logoDark from '../../../assets/brand/sprakbanken_inv_logo.svg';
	import { currentTheme } from '../../stores/theme.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import UmuLogo from './UmuLogo.svelte';

	const base = 'https://sprakbanken.se';
</script>

<footer class="sb-footer">
	<div class="sb-footer-col">
		<a href={base + '/'} class="sb-footer-logo" target="_blank" rel="noopener">
			<img src={currentTheme() === 'dark' ? logoDark : logoLight} alt="Språkbanken" height="24" />
		</a>
		<a href={base + '/om'} target="_blank" rel="noopener">{tr('footer.aboutUs')}</a>
		<a href={base + '/aktuellt'} target="_blank" rel="noopener">{tr('footer.news')}</a>
		<a href={base + '/plattformar'} target="_blank" rel="noopener">{tr('footer.platforms')}</a>
	</div>
	<div class="sb-footer-col sb-footer-cta">
		<p class="sb-prose">{tr('footer.cta')}</p>
		<div class="sb-footer-links">
			<a href={base + '/kontakt'} target="_blank" rel="noopener">{tr('footer.contact')}</a>
			<a href={base + '/om/referera-till-oss'} target="_blank" rel="noopener">{tr('footer.cite')}</a>
		</div>
	</div>
	<div class="sb-footer-nodes"><UmuLogo variant="center" /></div>
</footer>

<script lang="ts">
	import centerEn from '../../../assets/brand/umu-center-en.svg';
	import centerEnNeg from '../../../assets/brand/umu-center-en-neg.svg';
	import centerSv from '../../../assets/brand/umu-center-sv.svg';
	import centerSvNeg from '../../../assets/brand/umu-center-sv-neg.svg';
	import leftEn from '../../../assets/brand/umu-left-en.svg';
	import leftEnNeg from '../../../assets/brand/umu-left-en-neg.svg';
	import leftSv from '../../../assets/brand/umu-left-sv.svg';
	import leftSvNeg from '../../../assets/brand/umu-left-sv-neg.svg';
	import { currentTheme } from '../../stores/theme.svelte';
	import { currentLanguage, tr } from '../../stores/i18n.svelte';

	let { variant = 'center' }: { variant?: 'center' | 'left' } = $props();

	const logos = {
		center: { en: [centerEn, centerEnNeg], sv: [centerSv, centerSvNeg] },
		left: { en: [leftEn, leftEnNeg], sv: [leftSv, leftSvNeg] },
	};
	let src = $derived(logos[variant][currentLanguage()][currentTheme() === 'dark' ? 1 : 0]);
</script>

<a class="sb-umu-logo sb-umu-{variant}" href="https://www.umu.se/" target="_blank" rel="noopener">
	<img {src} alt={tr('footer.umu')} />
</a>

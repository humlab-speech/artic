<script lang="ts">
	import centerEn from '../../../assets/brand/humlab-center-en.svg';
	import centerEnNeg from '../../../assets/brand/humlab-center-en-neg.png';
	import centerSv from '../../../assets/brand/humlab-center-sv.svg';
	import centerSvNeg from '../../../assets/brand/humlab-center-sv-neg.png';
	import leftEn from '../../../assets/brand/humlab-left-en.svg';
	import leftEnNeg from '../../../assets/brand/humlab-left-en-neg.png';
	import leftSv from '../../../assets/brand/humlab-left-sv.svg';
	import leftSvNeg from '../../../assets/brand/humlab-left-sv-neg.png';
	import { currentTheme } from '../../stores/theme.svelte';
	import { currentLanguage, tr } from '../../stores/i18n.svelte';

	let { variant = 'center' }: { variant?: 'center' | 'left' } = $props();

	const logos = {
		center: { en: [centerEn, centerEnNeg], sv: [centerSv, centerSvNeg] },
		left: { en: [leftEn, leftEnNeg], sv: [leftSv, leftSvNeg] },
	};
	let src = $derived(logos[variant][currentLanguage()][currentTheme() === 'dark' ? 1 : 0]);
</script>

<a class="sb-humlab-logo sb-humlab-{variant}" href="https://www.umu.se/humlab/" target="_blank" rel="noopener">
	<img {src} alt={tr('footer.umu')} />
</a>

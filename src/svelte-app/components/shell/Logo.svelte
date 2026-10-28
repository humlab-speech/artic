<script lang="ts">
	import { tr } from '../../stores/i18n.svelte';

	/**
	 * Artic tool logo (decision 1, pending approval from Språkbanken communications).
	 * Swapping in an approved SVG only touches this file.
	 */
	let { size = 'header', disabled = false, onclick }: {
		size?: 'header' | 'hero';
		disabled?: boolean;
		onclick?: () => void;
	} = $props();
</script>

<button type="button" class="sb-logo" class:sb-logo-hero={size === 'hero'} {disabled} {onclick}
	aria-label="Artic" title={disabled ? undefined : 'Artic'}>
	<svg class="sb-logo-symbol" viewBox="0 0 32 32" aria-hidden="true">
		<g transform="translate(16,16)" fill="none" stroke="currentColor" stroke-linecap="round">
			<g stroke-width="1.5">
				<line x1="0" y1="-14" x2="0" y2="14" /><line x1="-12" y1="-7" x2="12" y2="7" /><line x1="-12" y1="7" x2="12" y2="-7" />
			</g>
			<g stroke-width="1">
				<line x1="0" y1="-5" x2="-3" y2="-8" /><line x1="0" y1="-5" x2="3" y2="-8" />
				<line x1="0" y1="-10" x2="-2.5" y2="-12.5" /><line x1="0" y1="-10" x2="2.5" y2="-12.5" />
				<line x1="0" y1="5" x2="-3" y2="8" /><line x1="0" y1="5" x2="3" y2="8" />
				<line x1="0" y1="10" x2="-2.5" y2="12.5" /><line x1="0" y1="10" x2="2.5" y2="12.5" />
				<line x1="4.5" y1="-2.5" x2="5.5" y2="-6.5" /><line x1="4.5" y1="-2.5" x2="7.5" y2="-1" />
				<line x1="9" y1="-5" x2="8" y2="-9" /><line x1="9" y1="-5" x2="12" y2="-3.5" />
				<line x1="-4.5" y1="2.5" x2="-5.5" y2="6.5" /><line x1="-4.5" y1="2.5" x2="-7.5" y2="1" />
				<line x1="-9" y1="5" x2="-8" y2="9" /><line x1="-9" y1="5" x2="-12" y2="3.5" />
				<line x1="-4.5" y1="-2.5" x2="-7.5" y2="-1" /><line x1="-4.5" y1="-2.5" x2="-5.5" y2="-6.5" />
				<line x1="-9" y1="-5" x2="-12" y2="-3.5" /><line x1="-9" y1="-5" x2="-8" y2="-9" />
				<line x1="4.5" y1="2.5" x2="7.5" y2="1" /><line x1="4.5" y1="2.5" x2="5.5" y2="6.5" />
				<line x1="9" y1="5" x2="12" y2="3.5" /><line x1="9" y1="5" x2="8" y2="9" />
			</g>
			<polygon points="0,-3 2.6,-1.5 2.6,1.5 0,3 -2.6,1.5 -2.6,-1.5" fill="currentColor" stroke="none" />
		</g>
	</svg>
	<span class="sb-logo-words">
		<span class="sb-logo-name">Artic</span>
		<span class="sb-logo-tagline">{tr('header.tagline')}</span>
	</span>
</button>

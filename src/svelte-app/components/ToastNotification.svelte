<script lang="ts">
	import { tr } from '../stores/i18n.svelte';
	import { viewStateService } from '../stores/services';
	import Icon from './ui/Icon.svelte';
	import { icons } from './ui/icons';

	let message = $state('');
	let visible = $state(false);
	let dismissTimer: ReturnType<typeof setTimeout> | null = null;

	function show(msg: string, durationMs = 8000) {
		message = msg;
		visible = true;
		if (dismissTimer !== null) clearTimeout(dismissTimer);
		dismissTimer = setTimeout(dismiss, durationMs);
	}

	function dismiss() {
		visible = false;
		setTimeout(() => { message = ''; }, 300);
		if (dismissTimer !== null) { clearTimeout(dismissTimer); dismissTimer = null; }
	}

	$effect(() => {
		viewStateService._toastCtrl = { show, dismiss };
		return () => {
			if (viewStateService._toastCtrl === { show, dismiss }) {
				viewStateService._toastCtrl = null;
			}
		};
	});
</script>

{#if message}
<div class="artic-toast" class:artic-toast-show={visible}>
	<span>{message}</span>
	<button onclick={dismiss} aria-label={tr('dialog.close')} title={tr('dialog.close')}><Icon icon={icons.xmark} /></button>
</div>
{/if}

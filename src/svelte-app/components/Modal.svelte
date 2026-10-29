<script lang="ts">
	import { tick } from 'svelte';
	import { getConfigTick } from '../stores/app-state.svelte';
	import { tr } from '../stores/i18n.svelte';
	import { modalService } from '../stores/services';
	import Button from './ui/Button.svelte';
	import Icon from './ui/Icon.svelte';
	import { icons } from './ui/icons';

	import ErrorModal from './modals/ErrorModal.svelte';
	import ConfirmModal from './modals/ConfirmModal.svelte';
	import SaveChangesModal from './modals/SaveChangesModal.svelte';
	import ConnectModal from './modals/ConnectModal.svelte';
	import LoginModal from './modals/LoginModal.svelte';
	import RenameLevelModal from './modals/RenameLevelModal.svelte';
	import SearchModal from './modals/SearchModal.svelte';
	import ExportModal from './modals/ExportModal.svelte';
	import HelpModal from './modals/HelpModal.svelte';
	import SelectLabelModal from './modals/SelectLabelModal.svelte';
	import SelectThresholdModal from './modals/SelectThresholdModal.svelte';
	import SettingsModal from './modals/SettingsModal.svelte';
	import HierarchyModal from './modals/HierarchyModal.svelte';

	let isOpen = $derived(getConfigTick() >= 0 && modalService.isOpen);
	let url = $derived(getConfigTick() >= 0 ? (modalService.getTemplateUrl() || '') : '');

	const sizes: Record<string, 'sm' | 'md' | 'lg'> = {
		'views/error.html': 'sm', 'views/confirmModal.html': 'sm', 'views/saveChanges.html': 'sm',
		'views/loginModal.html': 'sm', 'views/renameLevel.html': 'sm',
		'views/SelectLabelModal.html': 'sm', 'views/SelectThresholdModal.html': 'sm',
		'views/connectModal.html': 'md',
		'views/export.html': 'lg', 'views/searchAnnot.html': 'lg', 'views/settingsModal.html': 'lg',
		'views/showHierarchyModal.html': 'lg', 'views/help.html': 'lg',
	};
	let size = $derived(sizes[url] ?? 'md');

	let content: HTMLElement | undefined = $state();
	let opener: Element | null = null;

	const focusables = () => Array.from(content?.querySelectorAll<HTMLElement>(
		'button:not([disabled]), [href], input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
	) ?? []);

	// Focus moves into the dialog on open and back to the opener on close
	$effect(() => {
		if (isOpen) {
			opener = document.activeElement;
			tick().then(() => (content?.querySelector<HTMLElement>('input, select, textarea') ?? focusables().find((e) => !e.classList.contains('artic-close-button')))?.focus());
		} else if (opener instanceof HTMLElement) {
			opener.focus();
			opener = null;
		}
	});

	function onKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			modalService.close();
		} else if (e.key === 'Tab') {
			const els = focusables();
			if (els.length === 0) return;
			const first = els[0], last = els[els.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if isOpen}
<div class="artic-modal artic-modal-open" role="dialog" aria-modal="true" aria-labelledby="modalHeading">
	<div class="artic-modal-content sb-modal-{size}" bind:this={content}>
		<button class="artic-close-button" onclick={() => modalService.close()} aria-label={tr('dialog.close')} title={tr('dialog.close')}>
			<Icon icon={icons.xmark} />
		</button>

		{#if url === 'views/error.html'}
			<ErrorModal />
		{:else if url === 'views/confirmModal.html'}
			<ConfirmModal />
		{:else if url === 'views/saveChanges.html'}
			<SaveChangesModal />
		{:else if url === 'views/connectModal.html'}
			<ConnectModal />
		{:else if url === 'views/loginModal.html'}
			<LoginModal />
		{:else if url === 'views/renameLevel.html'}
			<RenameLevelModal />
		{:else if url === 'views/searchAnnot.html'}
			<SearchModal />
		{:else if url === 'views/export.html'}
			<ExportModal />
		{:else if url === 'views/help.html'}
			<HelpModal />
		{:else if url === 'views/SelectLabelModal.html'}
			<SelectLabelModal />
		{:else if url === 'views/SelectThresholdModal.html'}
			<SelectThresholdModal />
		{:else if url === 'views/settingsModal.html'}
			<SettingsModal />
		{:else if url === 'views/showHierarchyModal.html'}
			<HierarchyModal />
		{:else if url}
			<div class="artic-modal-wrap">
				<div class="artic-modal-body">
					<p>Modal: {url}</p>
				</div>
				<div class="artic-modal-footer">
					<Button label={tr('dialog.close')} onclick={() => modalService.close()} />
				</div>
			</div>
		{/if}
	</div>
</div>
{/if}

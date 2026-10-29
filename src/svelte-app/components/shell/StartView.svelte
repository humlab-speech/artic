<script lang="ts">
	import { getTick } from '../../stores/app-state.svelte';
	import { tr } from '../../stores/i18n.svelte';
	import { configProviderService, viewStateService, dragnDropService } from '../../stores/services';
	import Button from '../ui/Button.svelte';
	import Icon from '../ui/Icon.svelte';
	import Menu from '../ui/Menu.svelte';
	import { icons } from '../ui/icons';
	import Logo from './Logo.svelte';
	import AppFooter from './AppFooter.svelte';
	import * as actions from './toolbar-actions';

	let { showFooter = true }: { showFooter?: boolean } = $props();

	let fileInput: HTMLInputElement | undefined = $state();
	let dragging = $state(false);

	let activeButtons = $derived(getTick() >= 0 ? configProviderService.vals?.activeButtons : undefined);
	let demoDBs = $derived.by(() => {
		if (getTick() < 0) return [] as string[];
		const base = configProviderService.vals?.demoDBs ?? [];
		if (!configProviderService.devMode) return base;
		return [...base, ...(configProviderService.vals?.devDemoDBs ?? [])].sort();
	});
	let canConnect = $derived(getTick() >= 0 && viewStateService.getPermission('connectBtnClick'));

	function onFiles(files: FileList | null | undefined) {
		if (files && files.length > 0) dragnDropService.handleDrop(files);
	}
	function onDragOver(e: DragEvent) { e.preventDefault(); dragging = true; }
	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		onFiles(e.dataTransfer?.files);
	}
</script>

<div class="sb-start" class:sb-dragging={dragging} role="region" aria-label={tr('start.title')}
	ondragover={onDragOver} ondragleave={() => (dragging = false)} ondrop={onDrop}>
	<div class="sb-start-main">
		<div class="sb-start-inner">
			<Logo size="hero" disabled />
			<h1>{tr('start.title')}</h1>
			<p class="sb-prose sb-start-lead">{tr('start.lead')}</p>

			<div class="sb-cards">
				<section class="sb-card sb-card-next">
					<h2><Icon icon={icons.openFiles} /> {tr('start.openFiles')}</h2>
					<p class="sb-prose">{tr('start.openFilesText')}</p>
					<input
						bind:this={fileInput}
						type="file"
						multiple
						accept=".wav,.mp3,.flac,.ogg,.oga,.aac,.m4a,.wma,.mp4,.webm,.mkv,.mov,.textgrid,.json"
						onchange={(e) => { onFiles(e.currentTarget.files); e.currentTarget.value = ''; }}
						style="display: none;"
					/>
					<Button id="chooseFilesBtn" variant="primary" icon={icons.openFiles} label={tr('start.chooseFiles')} onclick={() => fileInput?.click()} />
				</section>

				{#if activeButtons?.openDemoDB}
					<section class="sb-card">
						<h2><Icon icon={icons.demoDb} /> {tr('start.demo')}</h2>
						<p class="sb-prose">{tr('start.demoText')}</p>
						<Menu
							triggerId="demoDB"
							variant="outline"
							label={tr('start.openDemo')}
							items={demoDBs.map((name: string, i: number) => ({ id: `demo${i}`, label: name, onselect: () => actions.openDemoDb(name) }))}
						/>
					</section>
				{/if}

				{#if activeButtons?.connect}
					<section class="sb-card">
						<h2><Icon icon={icons.connect} /> {tr('start.connect')}</h2>
						<p class="sb-prose">{tr('start.connectText')}</p>
						<Button id="connectBtn" variant="outline" label={tr('start.connectButton')} disabled={!canConnect} onclick={actions.connect} />
					</section>
				{/if}
			</div>
		</div>
	</div>
	{#if showFooter}<AppFooter />{/if}
	{#if dragging}<div class="sb-drop-hint">{tr('start.dropHint')}</div>{/if}
</div>

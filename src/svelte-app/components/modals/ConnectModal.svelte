<script lang="ts">
	import { getConfigTick } from '../../stores/app-state.svelte';
	import { modalService, configProviderService, viewStateService } from '../../stores/services';
	import { safeGetItem, safeSetItem } from '../../../core/util/safe-storage';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';
	import { icons } from '../ui/icons';

	function getStoredUrls(): string[] {
		try {
			const stored = safeGetItem('serverUrls');
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	let urls = $state<string[]>(getStoredUrls());
	let currentUrl = $state(getConfigTick() >= 0 ? configProviderService.vals.main.serverUrl : '');

	$effect(() => {
		getConfigTick();
		if (!currentUrl) currentUrl = configProviderService.vals.main.serverUrl || '';
		modalService.dataOut = currentUrl;
	});

	function saveUrl() {
		if (currentUrl && !urls.includes(currentUrl)) {
			urls = [...urls, currentUrl];
			safeSetItem('serverUrls', JSON.stringify(urls));
		}
	}

	function deleteUrl(url: string) {
		urls = urls.filter(u => u !== url);
		safeSetItem('serverUrls', JSON.stringify(urls));
	}

	function setCurrentUrl(url: string) {
		currentUrl = url;
		modalService.dataOut = url;
	}

	function onInput(e: Event) {
		currentUrl = (e.target as HTMLInputElement).value;
		modalService.dataOut = currentUrl;
	}

	function onFocus() { viewStateService.cursorInTextField = true; }
	function onBlur() { viewStateService.cursorInTextField = false; }
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('connect.title')}</h3>
	</div>
	<div class="artic-modal-body">
		<div class="artic-text">
			<div>
				{tr('connect.enterUrl')}<br />&nbsp;<br />
				<input
					class="artic-modal-URL-input"
					type="text"
					value={currentUrl}
					oninput={onInput}
					onfocus={onFocus}
					onblur={onBlur}
				/>
				<Button size="sm" iconOnly icon={icons.add} label={tr('connect.saveUrl')} onclick={saveUrl} />
				<Button size="sm" iconOnly icon={icons.trash} label={tr('connect.deleteUrl')} onclick={() => deleteUrl(currentUrl)} />
				<br />&nbsp;<br />
				<select
					size="10"
					class="artic-modal-list"
					ondblclick={() => modalService.confirmContent()}
				>
					{#each urls as url}
						<option onclick={() => setCurrentUrl(url)}>{url}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
	<div class="artic-modal-footer">
		<Button id="artic-modal-cancel" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		<Button id="artic-modal-confirm" variant="primary" icon={icons.connect} label={tr('start.connectButton')} onclick={() => modalService.confirmContent()} />
	</div>
</div>

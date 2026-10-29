<script lang="ts">
	import { modalService, ioHandlerService, viewStateService, loadedMetaDataService } from '../../stores/services';
	import { tr } from '../../stores/i18n.svelte';
	import Button from '../ui/Button.svelte';
	import { icons } from '../ui/icons';

	let username = $state('');
	let password = $state('');
	let errorMsg = $state('');

	async function tryLogin() {
		try {
			const res = await ioHandlerService.logOnUser(username, password);
			if (res) {
				loadedMetaDataService.currentUser = username;
				modalService.closeAndResolve(true);
			} else {
				errorMsg = 'Login failed. Please check credentials.';
			}
		} catch (e: any) {
			errorMsg = e?.message || 'Login failed.';
		}
	}

	function onFocus() { viewStateService.cursorInTextField = true; }
	function onBlur() { viewStateService.cursorInTextField = false; }
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('login.title')}</h3>
	</div>
	<div class="artic-modal-body">
		Please enter:
		<hr />
		<table style="width: 100%; text-align: center;"><tbody>
			<tr>
				<td>{tr('login.user')}</td>
				<td><input type="text" bind:value={username} onfocus={onFocus} onblur={onBlur} /></td>
			</tr>
			<tr>
				<td>{tr('login.password')}</td>
				<td><input type="password" bind:value={password} onfocus={onFocus} onblur={onBlur} /></td>
			</tr>
		</tbody></table>
		<hr />
		{#if errorMsg}<p style="color: red">{errorMsg}</p>{/if}
	</div>
	<div class="artic-modal-footer">
		<Button id="modalCancelBtn" label={tr('dialog.cancel')} onclick={() => modalService.close()} />
		<Button variant="primary" icon={icons.user} label={tr('login.submit')} onclick={tryLogin} />
	</div>
</div>

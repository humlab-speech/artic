<script lang="ts">
	import { tr } from '../../stores/i18n.svelte';
	import Settings from '../Settings.svelte';
</script>

<div class="artic-modal-wrap">
	<div class="artic-modal-header-large artic-modal-header">
		<h3 id="modalHeading">{tr('settings.title')}</h3>
	</div>
	<div class="artic-modal-body">
		<Settings />
	</div>
	<div class="artic-modal-footer"></div>
</div>

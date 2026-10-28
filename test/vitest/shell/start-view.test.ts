import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import { setLanguage } from '../../../src/core/util/i18n';
import { shell, setup } from './shell-mock';

vi.mock('../../../src/svelte-app/stores/services', async () => (await import('./shell-mock')).servicesFactory());

import StartView from '../../../src/svelte-app/components/shell/StartView.svelte';

beforeEach(() => { setLanguage('en', false); });

describe('StartView', () => {
	it('offers file, demo and connect cards according to activeButtons', () => {
		setup('none', { openDemoDB: true, connect: true });
		const { container, getByText } = render(StartView);
		expect(getByText('Welcome to Artic')).toBeTruthy();
		expect(container.querySelector('#chooseFilesBtn')).not.toBeNull();
		expect(container.querySelector('#demoDB')).not.toBeNull();
		expect(container.querySelector('#connectBtn')).not.toBeNull();
	});

	it('hides the demo and connect cards when disabled', () => {
		setup('none', {});
		const { container } = render(StartView);
		expect(container.querySelector('#chooseFilesBtn')).not.toBeNull();
		expect(container.querySelector('#demoDB')).toBeNull();
		expect(container.querySelector('#connectBtn')).toBeNull();
	});

	it('the demo menu lists the databases with the legacy ids', async () => {
		setup('none', { openDemoDB: true });
		const { container } = render(StartView);
		await fireEvent.click(container.querySelector('#demoDB')!);
		expect(container.querySelector('#demo0')?.textContent).toBe('ae');
		expect(container.querySelector('#demo1')?.textContent).toBe('ema');
	});

	it('dropping files hands them to the drag-and-drop service', async () => {
		setup('none', {});
		const { container } = render(StartView);
		const files = [new File(['x'], 'a.wav')];
		await fireEvent.drop(container.querySelector('.sb-start')!, { dataTransfer: { files } });
		expect(shell.calls).toContain('dragDrop.handleDrop');
	});

	it('shows the footer only when asked to', () => {
		setup('none', {});
		expect(render(StartView, { showFooter: true }).container.querySelector('.sb-footer')).not.toBeNull();
		expect(render(StartView, { showFooter: false }).container.querySelector('.sb-footer')).toBeNull();
	});

	it('is in Swedish when the language is', () => {
		setLanguage('sv', false);
		setup('none', {});
		expect(render(StartView).getByText('Välkommen till Artic')).toBeTruthy();
	});
});

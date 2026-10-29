import { mount } from 'svelte';
import { setScheduleUpdate } from '../core/util/schedule-update';
import { invalidate } from './stores/app-state.svelte';
import App from './App.svelte';

import { tokensToCss } from '../core/theme/css';
import { themeService } from '../core/services/theme.service';
import { ensureFontsLoaded } from '../core/theme/fonts';
import { detectLanguage, setLanguage, options as i18nOptions } from '../core/util/i18n';

// Fonts: Jost (UI), Noto Serif (body text), self-built IPA-complete Noto Sans (data)
import '@fontsource-variable/jost/wght.css';
import '@fontsource/noto-serif/latin-400.css';
import '@fontsource/noto-serif/latin-ext-400.css';
import '@fontsource/noto-serif/latin-400-italic.css';
import '@fontsource/noto-serif/latin-700.css';
import '@fontsource/noto-serif/latin-ext-700.css';
import '../styles/fonts.css';

// Styles (matching src/app/main.ts)
import '../styles/base.scss';
import '../styles/ui.scss';
import '../styles/font.scss';
import '../styles/text.scss';
import '../styles/button.scss';
import '../styles/artic.scss';
import '../styles/preview.scss';
import '../styles/modal.scss';
import '../styles/bundleListSideBar.scss';
import '../styles/rightSideMenu.scss';
import '../styles/twoDimCanvas.scss';
import '../styles/print.scss';
import '../styles/progressBar.scss';
import '../styles/aboutHint.scss';
import '../styles/timeline.scss';
import '../styles/flexBoxGrid.scss';
import '../styles/levels.scss';
import '../styles/historyActionPopup.scss';
import '../styles/hierarchy.scss';
import '../styles/splitPanes.scss';
import '../styles/tabbed.scss';
import '../styles/animation.scss';
import '../styles/largeTextInputField.scss';
import '../styles/levelCanvasesGrid.scss';

// Design tokens as CSS custom properties; prepended so component styles can override.
const tokenStyle = document.createElement('style');
tokenStyle.id = 'sb-tokens';
tokenStyle.textContent = tokensToCss();
document.head.prepend(tokenStyle);

themeService.init();
i18nOptions.warnOnMissing = import.meta.env.DEV;
setLanguage(detectLanguage(), false);
// Canvases must not measure text before the fonts are ready; redraw once they are.
ensureFontsLoaded().then(() => invalidate());
document.fonts?.ready?.then(() => invalidate());

// Wire scheduleUpdate → Svelte reactive invalidation
// When services call scheduleUpdate(), Svelte components re-render.
setScheduleUpdate((fn) => {
	if (fn) fn();
	invalidate();
});

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;

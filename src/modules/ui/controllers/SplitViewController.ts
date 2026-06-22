/**
 * SplitViewController
 * View toggles: split mode (track vs road), the splits/info collapsible
 * containers and the top-level tabs.
 */

import { getDOMCache, getInputIdForMode } from '../../../constants/domElements.js';
import StateManager from '../../state/StateManager.js';
import InputStore from './InputStore.js';
import CalcController from './CalcController.js';

export class SplitViewController {
  private static get dom() {
    return getDOMCache();
  }

  /** Switch split mode (track vs road) and refresh splits from current input. */
  static switchSplitMode(mode: 'track' | 'road'): void {
    StateManager.setSplitMode(mode);
    this.syncSplitModeUI(mode);
    const currentInput = getInputIdForMode(StateManager.getMode());
    if (InputStore.getInputValue(currentInput)) {
      CalcController.calculate(currentInput);
    }
    InputStore.snapshot();
    StateManager.saveToStorage(InputStore.getValues());
  }

  /** Sync split tabs and panels to the selected mode. */
  static syncSplitModeUI(mode: 'track' | 'road'): void {
    const trackDetail = document.getElementById('split-detail') as HTMLElement | null;
    const roadDetail = document.getElementById('road-detail') as HTMLElement | null;
    const toggleTrack = document.getElementById('toggle-track') as HTMLButtonElement | null;
    const toggleRoad = document.getElementById('toggle-road') as HTMLButtonElement | null;

    if (trackDetail) trackDetail.style.display = mode === 'track' ? 'flex' : 'none';
    if (roadDetail) roadDetail.style.display = mode === 'road' ? 'grid' : 'none';

    if (toggleTrack) {
      toggleTrack.classList.toggle('active', mode === 'track');
      toggleTrack.setAttribute('aria-pressed', mode === 'track' ? 'true' : 'false');
    }
    if (toggleRoad) {
      toggleRoad.classList.toggle('active', mode === 'road');
      toggleRoad.setAttribute('aria-pressed', mode === 'road' ? 'true' : 'false');
    }
  }

  /** Toggle the splits container (the "+/−" button next to the track input). */
  static toggleSplitsContainer(): void {
    if (this.dom.displays.container) {
      this.dom.displays.container.classList.toggle('SlideDown');
      const collapsed = this.dom.displays.container.classList.contains('SlideDown');
      if (this.dom.buttons.slide) {
        this.dom.buttons.slide.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        this.dom.buttons.slide.textContent = collapsed ? '+' : '−';
      }
    }
  }

  /** Toggle the info container in the header. */
  static toggleInfoContainer(): void {
    if (this.dom.displays.infoContainer) {
      this.dom.displays.infoContainer.classList.toggle('SlideDown');
    }
  }

  /** Switch top-level tabs. */
  static switchTopLevelTab(tabId: string): void {
    const tabs = document.querySelectorAll('.tab-item');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach((t) => {
      const isActive = (t as HTMLElement).dataset.tab === tabId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panes.forEach((p) => {
      p.classList.toggle('active', p.id === tabId);
    });

    StateManager.setActiveTab(tabId);
  }
}

export default SplitViewController;

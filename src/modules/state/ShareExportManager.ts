import type { ISharePayload, IPaceState, ITrainingReportData } from '../../types/index';
import ShareManager from './ShareManager.js';
import TranslationManager from './TranslationManager.js';

/** localStorage key the standalone training-report page reads on load. */
export const TRAINING_REPORT_KEY = 'rpc_training_report';

type TShareInputSnapshot = {
  pace_input: string;
  pace_input2: string;
  track_input: string;
  treadmill_input: string;
  finish_time_input: string;
};

export class ShareExportManager {
  static buildPayload(
    state: IPaceState,
    inputs: TShareInputSnapshot,
    trainingTargetDate: string,
    trainingPlanDistance: number,
    toolInputs?: Record<string, string>
  ): ISharePayload {
    return {
      state,
      inputs,
      trainingTargetDate,
      trainingPlanDistance,
      toolInputs
    };
  }

  static async copyShareLink(payload: ISharePayload): Promise<void> {
    try {
      const finalURL = ShareManager.buildShareURL(payload);
      await navigator.clipboard.writeText(finalURL);
      alert(TranslationManager.get('share_link_copied'));
    } catch {
      alert(TranslationManager.get('share_link_failed'));
    }
  }

  static openTrainingReportPage(data: ITrainingReportData): void {
    // The report renders the already-generated, already-localized plan. We pass
    // it through localStorage (not the URL) so the page stays dependency-free
    // and we never hit URL-length limits on long multi-week plans.
    try {
      localStorage.setItem(TRAINING_REPORT_KEY, JSON.stringify(data));
    } catch {
      // Storage may be unavailable (private mode / quota) — the report page
      // then shows its empty-state message rather than stale data.
    }
    window.open('training-report.html', '_blank');
  }

  static exportPDF(): void {
    window.print();
  }

  static exportImage(): void {
    const target = document.querySelector('.main-wrapper') as HTMLElement | null;
    if (!target) {
      alert('Image export unavailable');
      return;
    }

    const exportFn = () => {
      const html2canvasFn = window.html2canvas;
      if (!html2canvasFn) return;
      html2canvasFn(target, { backgroundColor: null, scale: 2 }).then(
        (canvas: HTMLCanvasElement) => {
          const link = document.createElement('a');
          link.download = 'running-pace-note.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      );
    };

    if (!window.html2canvas) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = exportFn;
      document.body.appendChild(script);
    } else {
      exportFn();
    }
  }
}

export default ShareExportManager;

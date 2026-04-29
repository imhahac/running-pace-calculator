import type { ISharePayload, IPaceState } from '../types/index';
import ShareManager from './ShareManager.js';
import TranslationManager from './TranslationManager.js';

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
    trainingPlanDistance: number
  ): ISharePayload {
    return {
      state,
      inputs,
      trainingTargetDate,
      trainingPlanDistance
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

  static openTrainingReportPage(payload: ISharePayload): void {
    const reportURL = ShareManager.buildShareURL(payload, 'training-report.html');
    window.open(reportURL, '_blank');
  }

  static exportPDF(): void {
    window.print();
  }

  static exportImage(): void {
    const target = document.querySelector('.main-wrapper') as HTMLElement | null;
    const html2canvasFn = (window as any).html2canvas;
    if (!target || !html2canvasFn) {
      alert('Image export unavailable');
      return;
    }

    html2canvasFn(target, { backgroundColor: null, scale: 2 }).then((canvas: HTMLCanvasElement) => {
      const link = document.createElement('a');
      link.download = 'running-pace-note.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}

export default ShareExportManager;

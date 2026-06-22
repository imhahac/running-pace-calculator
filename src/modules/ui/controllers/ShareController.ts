import StateManager from '../../state/StateManager.js';
import ShareExportManager from '../../state/ShareExportManager.js';
import TrainingCycleManager from '../TrainingCycleManager.js';

export class ShareController {
  static async copyShareLink(): Promise<void> {
    await ShareExportManager.copyShareLink(this.buildCurrentSharePayload());
  }

  static exportPDF(): void {
    ShareExportManager.exportPDF();
  }

  static openTrainingReportPage(): void {
    ShareExportManager.openTrainingReportPage(this.buildCurrentSharePayload());
  }

  static exportImage(): void {
    ShareExportManager.exportImage();
  }

  static buildCurrentSharePayload() {
    const trainingDate =
      (document.getElementById('training-target-date') as HTMLInputElement | null)?.value || '';
    const trainingPlanDistance = TrainingCycleManager.getPlanDistanceMeters();

    return ShareExportManager.buildPayload(
      StateManager.getState(),
      {
        pace_input: (document.getElementById('pace_input') as HTMLInputElement | null)
          ? (document.getElementById('pace_input') as HTMLInputElement).value
          : '',
        pace_input2: (document.getElementById('pace_input2') as HTMLInputElement | null)
          ? (document.getElementById('pace_input2') as HTMLInputElement).value
          : '',
        track_input: (document.getElementById('track_input') as HTMLInputElement | null)
          ? (document.getElementById('track_input') as HTMLInputElement).value
          : '',
        treadmill_input: (document.getElementById('treadmill_input') as HTMLInputElement | null)
          ? (document.getElementById('treadmill_input') as HTMLInputElement).value
          : '',
        finish_time_input: (document.getElementById('finish_time_input') as HTMLInputElement | null)
          ? (document.getElementById('finish_time_input') as HTMLInputElement).value
          : ''
      },
      trainingDate,
      trainingPlanDistance
    );
  }
}

export default ShareController;

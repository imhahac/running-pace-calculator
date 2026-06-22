import { getDOMCache } from '../../../constants/domElements.js';
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
    const inputs = getDOMCache().inputs;

    return ShareExportManager.buildPayload(
      StateManager.getState(),
      {
        pace_input: inputs.paceMin?.value || '',
        pace_input2: inputs.paceSec?.value || '',
        track_input: inputs.track?.value || '',
        treadmill_input: inputs.treadmill?.value || '',
        finish_time_input: inputs.finishTime?.value || ''
      },
      trainingDate,
      trainingPlanDistance
    );
  }
}

export default ShareController;

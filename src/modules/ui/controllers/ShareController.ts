import { getDOMCache } from '../../../constants/domElements.js';
import StateManager from '../../state/StateManager.js';
import ShareExportManager from '../../state/ShareExportManager.js';
import FormPersistence, { TOOL_INPUT_IDS } from '../../state/FormPersistence.js';
import TrainingCycleManager from '../TrainingCycleManager.js';
import InputStore from './InputStore.js';
import TimeFormatter from '../../core/TimeFormatter.js';

export class ShareController {
  static async copyShareLink(): Promise<void> {
    await ShareExportManager.copyShareLink(this.buildCurrentSharePayload());
  }

  static exportPDF(): void {
    ShareExportManager.exportPDF();
  }

  static openTrainingReportPage(): void {
    const distanceMeters = TrainingCycleManager.getPlanDistanceMeters();
    const paceSecondsPerKm = InputStore.getLastPace();
    const targetDate =
      (document.getElementById('training-target-date') as HTMLInputElement | null)?.value || '';
    ShareExportManager.openTrainingReportPage({
      plan: TrainingCycleManager.getLastPlan(),
      meta: {
        targetDate,
        planLabel: TrainingCycleManager.getPlanLabel(distanceMeters),
        estimate:
          paceSecondsPerKm > 0
            ? TimeFormatter.format(paceSecondsPerKm * (distanceMeters / 1000))
            : '--',
        lang: StateManager.getLanguage()
      }
    });
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
      trainingPlanDistance,
      FormPersistence.snapshot(TOOL_INPUT_IDS)
    );
  }
}

export default ShareController;

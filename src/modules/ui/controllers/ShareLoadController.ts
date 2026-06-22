/**
 * ShareLoadController
 * Restores calculator state from a shared URL payload on load. (Distinct from
 * ShareController, which builds/exports share artifacts.)
 */

import { getDOMCache, getInputIdForMode } from '../../../constants/domElements.js';
import StateManager from '../../state/StateManager.js';
import ShareManager from '../../state/ShareManager.js';
import TrainingCycleManager from '../TrainingCycleManager.js';
import InputStore from './InputStore.js';
import ModeController from './ModeController.js';
import SplitViewController from './SplitViewController.js';
import CalcController from './CalcController.js';
import TrainingController from './TrainingController.js';

export class ShareLoadController {
  private static get dom() {
    return getDOMCache();
  }

  static applySharedPayloadFromURL(): void {
    const payload = ShareManager.readPayloadFromURL();
    if (!payload) return;

    StateManager.setState(payload.state);

    const inputs = payload.inputs || {};
    if (this.dom.inputs.paceMin && inputs['pace_input'])
      this.dom.inputs.paceMin.value = inputs['pace_input'];
    if (this.dom.inputs.paceSec && inputs['pace_input2'])
      this.dom.inputs.paceSec.value = inputs['pace_input2'];
    if (this.dom.inputs.track && inputs['track_input'])
      this.dom.inputs.track.value = inputs['track_input'];
    if (this.dom.inputs.treadmill && inputs['treadmill_input'])
      this.dom.inputs.treadmill.value = inputs['treadmill_input'];
    if (this.dom.inputs.finishTime && inputs['finish_time_input'])
      this.dom.inputs.finishTime.value = inputs['finish_time_input'];

    if (this.dom.distanceSelect) {
      this.dom.distanceSelect.value = StateManager.getDistance().toString();
    }

    const trainingDate = document.getElementById('training-target-date') as HTMLInputElement | null;
    if (trainingDate && payload.trainingTargetDate) {
      trainingDate.value = payload.trainingTargetDate;
    }

    if (typeof payload.trainingPlanDistance === 'number') {
      TrainingCycleManager.setPlanDistanceMeters(payload.trainingPlanDistance);
    }

    ModeController.setMode(StateManager.getMode());
    ModeController.populateVenues();
    SplitViewController.syncSplitModeUI(StateManager.getSplitMode());
    TrainingController.populateSettingsPanel();
    InputStore.snapshot();

    const currentInput = getInputIdForMode(StateManager.getMode());
    if (InputStore.getInputValue(currentInput)) {
      CalcController.calculate(currentInput);
    }
  }
}

export default ShareLoadController;

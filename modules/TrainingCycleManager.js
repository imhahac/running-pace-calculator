import { HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../constants/index.js';
import Calculator from './Calculator.js';
import TimeFormatter from './TimeFormatter.js';
import TranslationManager from './TranslationManager.js';
export class TrainingCycleManager {
    static getPlanDistanceMeters() {
        const planDistanceInput = document.getElementById('training-plan-distance');
        return parseFloat(planDistanceInput?.value || '') || FULL_MARATHON_METERS;
    }
    static setPlanDistanceMeters(distanceMeters) {
        const planDistanceInput = document.getElementById('training-plan-distance');
        if (planDistanceInput && isFinite(distanceMeters) && distanceMeters > 0) {
            planDistanceInput.value = distanceMeters.toString();
        }
    }
    static update(paceSecondsPerKm) {
        const dateInput = document.getElementById('training-target-date');
        const contextEl = document.getElementById('training-plan-context');
        const emptyState = document.getElementById('training-plan-empty');
        const tableWrap = document.getElementById('training-plan-table-wrap');
        const body = document.getElementById('training-plan-body');
        if (!dateInput || !contextEl || !emptyState || !tableWrap || !body)
            return;
        const planDistanceMeters = this.getPlanDistanceMeters();
        contextEl.textContent = this.getPlanContextText(paceSecondsPerKm, planDistanceMeters);
        const focusMap = {
            base: TranslationManager.getTrainingFocusLabel('base'),
            build: TranslationManager.getTrainingFocusLabel('build'),
            peak: TranslationManager.getTrainingFocusLabel('peak'),
            taper: TranslationManager.getTrainingFocusLabel('taper'),
            race: TranslationManager.getTrainingFocusLabel('race')
        };
        const workoutMap = {
            easy: TranslationManager.getWorkoutLabel('easy'),
            tempo: TranslationManager.getWorkoutLabel('tempo'),
            interval: TranslationManager.getWorkoutLabel('interval'),
            race: TranslationManager.getWorkoutLabel('race')
        };
        const plan = Calculator.generateTrainingCycle(paceSecondsPerKm, dateInput.value, focusMap, workoutMap, planDistanceMeters);
        body.innerHTML = '';
        if (plan.length === 0) {
            emptyState.style.display = 'block';
            tableWrap.style.display = 'none';
            return;
        }
        plan.forEach((row) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${row.weekLabel}</td>
        <td>${row.focus}</td>
        <td>${row.easyPace}</td>
        <td>${row.tempoPace}</td>
        <td>${row.intervalPace}</td>
        <td>${row.longRunPace}</td>
        <td>${row.totalMileageKm}</td>
        <td>${row.keyWorkout}</td>
        <td>${row.isRecoveryWeek ? '✓' : '-'}</td>
      `;
            body.appendChild(tr);
        });
        emptyState.style.display = 'none';
        tableWrap.style.display = 'block';
    }
    static getPlanLabel(distanceMeters) {
        if (distanceMeters >= FULL_MARATHON_METERS) {
            return TranslationManager.get('plan_full');
        }
        if (distanceMeters >= HALF_MARATHON_METERS) {
            return TranslationManager.get('plan_half');
        }
        return TranslationManager.get('plan_10k');
    }
    static getPlanContextText(paceSecondsPerKm, distanceMeters) {
        if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) {
            return TranslationManager.get('training_context_empty');
        }
        const finishSeconds = paceSecondsPerKm * (distanceMeters / 1000);
        return `${TranslationManager.get('training_context_prefix')}: ${this.getPlanLabel(distanceMeters)} ${TimeFormatter.format(finishSeconds)}`;
    }
}
export default TrainingCycleManager;

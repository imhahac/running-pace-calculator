import { HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../../constants/index.js';
import Calculator from '../core/Calculator.js';
import TimeFormatter from '../core/TimeFormatter.js';
import TranslationManager from '../state/TranslationManager.js';
import StateManager from '../state/StateManager.js';
import type { ITrainingPlanConfig } from '../../types/index';

type TPlan = ReturnType<typeof Calculator.generateTrainingCycle>;

export class TrainingCycleManager {
  private static lastPlan: TPlan = [];

  /** The most recently rendered plan — surfaced for the standalone report page. */
  static getLastPlan(): TPlan {
    return this.lastPlan;
  }

  static getPlanDistanceMeters(): number {
    const planDistanceInput = document.getElementById(
      'training-plan-distance'
    ) as HTMLSelectElement | null;
    return parseFloat(planDistanceInput?.value || '') || FULL_MARATHON_METERS;
  }

  static setPlanDistanceMeters(distanceMeters: number): void {
    const planDistanceInput = document.getElementById(
      'training-plan-distance'
    ) as HTMLSelectElement | null;
    if (planDistanceInput && isFinite(distanceMeters) && distanceMeters > 0) {
      planDistanceInput.value = distanceMeters.toString();
    }
  }

  /** Read optional plan customization (weeks / start & peak volume) from the UI. */
  private static readPlanConfig(): ITrainingPlanConfig | undefined {
    const num = (id: string): number =>
      parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');
    const weeks = num('training-weeks');
    const start = num('training-start-vol');
    const peak = num('training-peak-vol');
    const config: ITrainingPlanConfig = {};
    if (weeks > 0) config.weeks = Math.floor(weeks);
    if (start > 0) config.startVolumeKm = start;
    if (peak > 0) config.peakVolumeKm = peak;
    return Object.keys(config).length > 0 ? config : undefined;
  }

  static update(paceSecondsPerKm: number): void {
    const dateInput = document.getElementById('training-target-date') as HTMLInputElement | null;
    const contextEl = document.getElementById('training-plan-context');
    const emptyState = document.getElementById('training-plan-empty');
    const container = document.getElementById('training-plan-container');
    if (!dateInput || !contextEl || !emptyState || !container) return;

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

    const isTriathlon =
      StateManager.getPlanType() === 'triathlon' ||
      planDistanceMeters > FULL_MARATHON_METERS ||
      planDistanceMeters === 51500;

    const schoolVal = (document.getElementById('training-school') as HTMLSelectElement | null)
      ?.value;
    const school =
      schoolVal === 'higdon' || schoolVal === 'pfitzinger' || schoolVal === 'daniels'
        ? schoolVal
        : undefined;

    const plan = Calculator.generateTrainingCycle(
      paceSecondsPerKm,
      dateInput.value,
      focusMap,
      workoutMap,
      planDistanceMeters,
      isTriathlon,
      (key) => TranslationManager.get(key),
      new Date(),
      this.readPlanConfig(),
      school
    );

    this.lastPlan = plan;
    container.innerHTML = '';

    const csvBtn = document.getElementById('training-export-csv');
    if (csvBtn) csvBtn.style.display = plan.length > 0 ? 'inline-block' : 'none';

    if (plan.length === 0) {
      emptyState.style.display = 'block';
      container.style.display = 'none';
      return;
    }

    plan.forEach((row, idx) => {
      const card = document.createElement('div');
      card.className = 'training-week-card';
      card.style.border = '1px solid var(--border-color)';
      card.style.borderRadius = '8px';
      card.style.padding = '10px';
      card.style.marginBottom = '10px';
      card.style.backgroundColor = 'var(--bg-secondary)';

      // Per-week header doubles as a collapse toggle (default collapsed). Reuses
      // the delegated `.detail-toggle` handler + `.tool-detail` grid-rows CSS, so
      // no extra JS — clicking the header toggles `.open` on the body panel.
      const bodyId = `training-week-${idx}-body`;
      let html = `
        <button type="button" class="detail-toggle week-toggle" aria-expanded="false" aria-controls="${bodyId}" style="border-bottom: 1px solid var(--border-color); padding-bottom: 5px; margin-bottom: 5px;">
          <strong style="font-size: 1.1rem;">${row.weekLabel}: ${row.focus}</strong>
          <span style="font-size: 0.9rem; font-weight: normal;">${row.isRecoveryWeek ? '🌿' : '🏃'} ${TranslationManager.get('label_mileage')}: ${row.totalMileageKm}</span>
        </button>
        <div id="${bodyId}" class="tool-detail"><div class="tool-detail-inner"><div style="display: grid; gap: 8px;">
      `;

      row.days.forEach((day) => {
        let icon = '🏃';
        if (day.workoutType === 'rest') icon = '🛌';
        if (day.workoutType === 'swim') icon = '🏊';
        if (day.workoutType === 'bike') icon = '🚴';
        if (day.workoutType === 'long') icon = '⛰️';
        if (day.workoutType === 'medlong') icon = '🏞️';
        if (day.workoutType === 'interval') icon = '⚡';

        let paceHtml = '';
        if (day.stages && day.stages.length > 0) {
          paceHtml = `<div style="display:flex; flex-direction:column; gap:4px; margin-top:6px; padding-left:8px; border-left:2px solid var(--highlight-glow); font-family: var(--font-main);">`;
          day.stages.forEach((stage) => {
            const labelColor = 'var(--text-muted)';
            const actionStyle = stage.isHighlight
              ? 'color: var(--highlight); font-weight: bold;'
              : 'color: var(--text-light);';
            const pacePart = stage.pace ? ` @ ${stage.pace}` : '';
            paceHtml += `
              <div style="font-size:0.8rem; ${actionStyle}">
                <span style="color:${labelColor};">${stage.label}</span> ${stage.action}${pacePart}
              </div>
            `;
          });
          paceHtml += `</div>`;
        } else {
          paceHtml = day.paceOrIntensity !== '-' ? day.paceOrIntensity : '';
        }

        html += `
          <div style="display: grid; grid-template-columns: 45px 1fr; align-items: center; gap: 10px; background: var(--bg-primary); padding: 8px; border-radius: 6px;">
            <div style="text-align: center; font-weight: bold; font-size: 0.85rem; color: var(--text-muted);">${day.dayOfWeek}</div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <strong>${icon} ${day.description}</strong>
                <span style="font-size: 0.85rem; color: var(--text-muted);">${day.durationOrDistance}</span>
              </div>
              <div style="font-size: 0.85rem; font-family: 'Roboto Mono', monospace; margin-top: 2px;">${paceHtml}</div>
            </div>
          </div>
        `;
      });

      html += `</div></div></div>`;
      card.innerHTML = html;
      container.appendChild(card);
    });

    emptyState.style.display = 'none';
    container.style.display = 'flex';
  }

  /** Serialise a plan to CSV (pure; every field quoted/escaped). */
  static planToCsv(plan: TPlan): string {
    const esc = (v: string | number): string => `"${String(v).replace(/"/g, '""')}"`;
    const t = (k: string): string => TranslationManager.get(k);
    const header = [
      t('label_week'),
      t('label_focus'),
      t('label_mileage'),
      t('label_recovery'),
      t('label_workout'),
      t('label_duration'),
      t('col_pace')
    ];
    const lines = [header.map(esc).join(',')];
    plan.forEach((w) => {
      w.days.forEach((d) => {
        lines.push(
          [
            w.weekLabel,
            w.focus,
            w.totalMileageKm,
            w.isRecoveryWeek ? 'Y' : 'N',
            `${d.dayOfWeek} ${d.description}`,
            d.durationOrDistance,
            d.paceOrIntensity
          ]
            .map(esc)
            .join(',')
        );
      });
    });
    return lines.join('\n');
  }

  /** Download the current plan as a CSV file (UTF-8 BOM for Excel/CJK). */
  static exportCsv(): void {
    if (!this.lastPlan.length) return;
    const csv = this.planToCsv(this.lastPlan);
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'training-plan.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  static getPlanLabel(distanceMeters: number): string {
    if (distanceMeters >= FULL_MARATHON_METERS) {
      return TranslationManager.get('plan_full');
    }
    if (distanceMeters >= HALF_MARATHON_METERS) {
      return TranslationManager.get('plan_half');
    }
    return TranslationManager.get('plan_10k');
  }

  private static getPlanContextText(paceSecondsPerKm: number, distanceMeters: number): string {
    if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0) {
      return TranslationManager.get('training_context_empty');
    }

    const finishSeconds = paceSecondsPerKm * (distanceMeters / 1000);
    return `${TranslationManager.get('training_context_prefix')}: ${this.getPlanLabel(distanceMeters)} ${TimeFormatter.format(finishSeconds)}`;
  }
}

export default TrainingCycleManager;

import { FULL_MARATHON_METERS } from '../../../constants/index.js';
import RaceDataManager from '../../ui/RaceDataManager.js';
import TranslationManager from '../../state/TranslationManager.js';
import { raceHasHalfOrFull } from '../raceDistance.js';
import MapController from './MapController.js';

export class RaceController {
  static async fetchAndPopulateRaces(force = false): Promise<void> {
    const raceList = document.getElementById('race-list') as HTMLSelectElement | null;
    const container = document.getElementById('race-selector-container');
    if (!raceList || !container) return;

    // Show whenever ANY races source is configured. getApiUrl() is the resolved
    // source (Worker `/api/races` if a backend URL is set, else the legacy GAS
    // URL) — gating on it (not on the GAS URL alone) means a Worker-only setup
    // still shows the selector.
    if (!RaceDataManager.getApiUrl()) {
      container.style.display = 'none';
      return;
    }

    try {
      const races = await RaceDataManager.fetchRaces(force);
      // Keep the selector focused on goal races: only those offering a half or
      // full marathon (the list tab still shows every distance).
      const filtered = races.filter((race) => raceHasHalfOrFull(race.distances));
      const promptOption = raceList.options[0];
      raceList.innerHTML = '';
      raceList.appendChild(promptOption);

      if (filtered.length > 0) {
        container.style.display = 'flex';
        filtered.forEach((race) => {
          const option = document.createElement('option');
          option.value = race.id;
          option.textContent = `${race.date} ${race.name}`;
          raceList.appendChild(option);
        });
      } else {
        container.style.display = 'none';
      }
    } catch (error) {
      container.style.display = 'none';
      console.warn('Cannot populate races', error);
    }
  }

  static onRaceSelected(): void {
    const raceList = document.getElementById('race-list') as HTMLSelectElement | null;
    const targetDate = document.getElementById('training-target-date') as HTMLInputElement | null;
    if (!raceList || !targetDate) return;

    const id = raceList.value;
    if (id) {
      const race = RaceDataManager.getRaceById(id);
      if (race?.date) {
        targetDate.value = race.date;
      }
    }

    this.updateRaceInfoUI();
  }

  static updateRaceInfoUI(): void {
    const targetDate = document.getElementById('training-target-date') as HTMLInputElement | null;
    const raceList = document.getElementById('race-list') as HTMLSelectElement | null;
    const countdownEl = document.getElementById('race-countdown');
    const infoContainer = document.getElementById('race-info-container');
    const iframe = document.getElementById('strava-embed') as HTMLIFrameElement | null;
    const regLink = document.getElementById('race-registration-link') as HTMLAnchorElement | null;
    const distSelect = document.getElementById(
      'training-plan-distance'
    ) as HTMLSelectElement | null;

    if (!targetDate || !countdownEl || !infoContainer || !iframe || !regLink || !distSelect) return;

    const dateVal = targetDate.value;

    if (dateVal) {
      const target = new Date(dateVal);
      target.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      countdownEl.style.display = 'block';

      if (diffDays < 0) {
        countdownEl.textContent = TranslationManager.get('countdown_past');
        countdownEl.style.color = 'var(--text-muted)';
      } else if (diffDays === 0) {
        countdownEl.textContent = TranslationManager.get('countdown_today');
        countdownEl.style.color = 'var(--error)';
      } else {
        let text = TranslationManager.get('countdown_future').replace(
          '{days}',
          diffDays.toString()
        );
        if (diffDays > 30) text += TranslationManager.get('countdown_phase_base');
        else if (diffDays > 14) text += TranslationManager.get('countdown_phase_peak');
        else text += TranslationManager.get('countdown_phase_taper');

        countdownEl.textContent = text;
        countdownEl.style.color = diffDays <= 14 ? 'var(--warning)' : 'var(--highlight)';
      }
    } else {
      countdownEl.style.display = 'none';
      countdownEl.textContent = '';
    }

    const raceId = raceList?.value;
    const race = raceId ? RaceDataManager.getRaceById(raceId) : null;
    const stravaContainer = document.getElementById('strava-container');
    const stravaSkeleton = document.getElementById('strava-skeleton');
    const leafletContainer = document.getElementById('leaflet-map-container');

    if (race) {
      infoContainer.style.display = 'block';

      if (race.registrationLink) {
        regLink.href = race.registrationLink;
        regLink.style.display = 'inline-block';
      } else {
        regLink.style.display = 'none';
      }

      const isFull = parseFloat(distSelect.value) >= FULL_MARATHON_METERS;
      const gpxUrl = isFull ? race.gpxFull || race.gpxHalf : race.gpxHalf || race.gpxFull;
      const rawUrl = isFull ? race.stravaFull : race.stravaHalf || race.stravaFull;
      const embedUrl = RaceDataManager.getStravaEmbedUrl(rawUrl);

      if (gpxUrl) {
        MapController.renderGpxRoute(gpxUrl).then((success) => {
          if (success) {
            if (leafletContainer) leafletContainer.style.display = 'block';
            if (stravaContainer) stravaContainer.style.display = 'none';
            iframe.src = '';
            iframe.style.opacity = '0';
          } else {
            MapController.showStravaEmbed(
              embedUrl,
              stravaContainer,
              stravaSkeleton,
              leafletContainer,
              iframe
            );
          }
        });
      } else {
        MapController.showStravaEmbed(
          embedUrl,
          stravaContainer,
          stravaSkeleton,
          leafletContainer,
          iframe
        );
      }
    } else {
      infoContainer.style.display = 'none';
      iframe.src = '';
      iframe.style.opacity = '0';
      if (stravaContainer) stravaContainer.style.display = 'none';
      if (leafletContainer) leafletContainer.style.display = 'none';
    }
  }
}

export default RaceController;

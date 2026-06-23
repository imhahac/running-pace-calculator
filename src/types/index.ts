/**
 * Type Definitions for Running Pace Calculator
 */

/**
 * Time format representation
 */
export interface ITimeFormat {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculation mode type
 */
export type TMode = 'pace' | 'track' | 'treadmill' | 'finish_time' | 'triathlon';

/**
 * Unit type
 */
export type TUnit = 'km' | 'mile';

/**
 * Theme type
 */
export type TTheme = 'light' | 'dark';

/**
 * Language type
 */
export type TLanguage = 'zh' | 'en';

/**
 * Split mode type
 */
export type TSplitMode = 'track' | 'road';

/**
 * Plan type
 */
export type TPlanType = 'running' | 'triathlon';

/**
 * Periodization phase within a training cycle
 */
export type TTrainingPhase = 'base' | 'build' | 'peak' | 'taper' | 'race';

/**
 * Workout type for a single training day
 */
export type TWorkoutType =
  | 'rest'
  | 'swim'
  | 'bike'
  | 'long'
  | 'easy'
  | 'tempo'
  | 'interval'
  | 'race';

/**
 * Triathlon per-leg inputs (raw string values from the form)
 */
export interface ITriathlonInputs {
  totalTarget: string;
  swim: string;
  t1: string;
  bike: string;
  t2: string;
  run: string;
}

/**
 * Application global state
 */
export interface IPaceState {
  mode: TMode;
  paceUnit: TUnit;
  treadmillUnit: TUnit;
  venue: string;
  lane: number;
  distance: number;
  trackDistance: number;
  theme: TTheme;
  lang: TLanguage;
  splitMode: TSplitMode;
  planType: TPlanType;
  gasApiUrl: string;
  backendUrl: string;
  activeTab: string;
  triDistance: 51.5 | 113 | 226;
  triInputs?: ITriathlonInputs;
}

/**
 * Calculation result
 */
export interface ICalculationResult {
  secondsPerLap: number;
  splits: Record<string, string>;
  zones: Record<string, string>;
}

/**
 * Track lane structure
 */
export interface ITrackLane {
  id: number;
  dist: number;
  label: string;
}

/**
 * Venue structure
 */
export interface IVenue {
  id: string;
  name: string;
  lanes: ITrackLane[];
}

/**
 * Venues map
 */
export interface IVenuesMap {
  [key: string]: IVenue;
}

/**
 * Translation dictionary structure
 */
export interface ITranslations {
  zh: Record<string, string>;
  en: Record<string, string>;
}

/**
 * DOM elements storage
 */
export interface IDOMElements {
  inputs: {
    paceMin: HTMLInputElement | null;
    paceSec: HTMLInputElement | null;
    track: HTMLInputElement | null;
    treadmill: HTMLInputElement | null;
    finishTime: HTMLInputElement | null;
  };
  radios: NodeListOf<HTMLInputElement>;
  laneSelect: HTMLSelectElement | null;
  venueSelect: HTMLSelectElement | null;
  distanceSelect: HTMLSelectElement | null;
  buttons: {
    mile: HTMLButtonElement | null;
    mileSwitchText: HTMLElement | null;
    perHour: HTMLButtonElement | null;
    perHourSwitchText: HTMLElement | null;
    slide: HTMLButtonElement | null;
    info: HTMLButtonElement | null;
    theme: HTMLButtonElement | null;
  };
  displays: {
    unit: HTMLElement | null;
    unit2: HTMLElement | null;
    laneLength: HTMLElement | null;
    themeIcon: HTMLElement | null;
    splits: {
      m100: HTMLInputElement | null;
      m200: HTMLInputElement | null;
      m300: HTMLInputElement | null;
      m400: HTMLInputElement | null;
      m800: HTMLInputElement | null;
      m1200: HTMLInputElement | null;
      m1600: HTMLInputElement | null;
      m2000: HTMLInputElement | null;
      inc200: HTMLInputElement | null;
      inc300: HTMLInputElement | null;
      inc400: HTMLInputElement | null;
      lapsText: {
        two: HTMLElement | null;
        three: HTMLElement | null;
        four: HTMLElement | null;
        five: HTMLElement | null;
      };
    };
    zones: {
      e: HTMLElement | null;
      m: HTMLElement | null;
      t: HTMLElement | null;
      i: HTMLElement | null;
      r: HTMLElement | null;
    };
    prediction: {
      k5: HTMLElement | null;
      k10: HTMLElement | null;
      half: HTMLElement | null;
      full: HTMLElement | null;
    };
    container: HTMLElement | null;
    infoContainer: HTMLElement | null;
  };
}

/**
 * Conversion factors
 */
export interface IConversionFactors {
  km_to_mile: number;
  mile_to_km: number;
}

/**
 * Training paces for different intensity zones
 */
export interface ITrainingPaces {
  easy: number;
  tempo: number;
  interval: number;
  long: number;
}

/**
 * Daniels VDOT zone keys
 */
export type TVdotZoneKey = 'easy' | 'marathon' | 'threshold' | 'interval' | 'repetition';

/**
 * Daniels VDOT training paces (seconds per km)
 */
export interface IVdotPaces {
  easy: number;
  marathon: number;
  threshold: number;
  interval: number;
  repetition: number;
}

/**
 * Race-pace split strategy
 */
export type TRaceStrategy = 'even' | 'negative' | 'positive';

/**
 * One row of a race-pace plan (per-km / final partial segment)
 */
export interface IRacePlanRow {
  km: number;
  paceSec: number;
  cumulativeSec: number;
  phase: 'start' | 'mid' | 'surge' | 'finish';
}

/**
 * A full race-pace plan
 */
export interface IRacePlan {
  rows: IRacePlanRow[];
  avgPaceSec: number;
  avgSpeedKmh: number;
  vdot: number;
}

/**
 * A structured interval workout session
 */
export interface IIntervalSession {
  type: 'I' | 'T' | 'R';
  repMeters: number;
  reps: number;
  repPaceSec: number;
  restDesc: string;
  warmupKm: number;
  cooldownKm: number;
  mainKm: number;
  totalKm: number;
  totalSec: number;
  cappedByWeekly: boolean;
}

/**
 * Max-HR estimation formula
 */
export type THrFormula = 'tanaka' | 'gellish' | 'fox';

/**
 * Heart-rate training zone (Karvonen / %HRR)
 */
export interface IHrZone {
  key: TVdotZoneKey;
  loPct: number;
  hiPct: number;
  loBpm: number;
  hiBpm: number;
}

/**
 * Training zone information
 */
export interface ITrainingZone {
  name: string;
  label: string;
  pace: string;
}

export interface IWorkoutStage {
  label: string;
  action: string;
  pace?: string;
  isHighlight?: boolean;
}

/**
 * Daily training recommendation
 */
export interface ITrainingDay {
  dayOfWeek: string;
  workoutType: 'rest' | 'easy' | 'tempo' | 'interval' | 'long' | 'swim' | 'bike' | 'race';
  description: string;
  durationOrDistance: string;
  paceOrIntensity: string;
  stages?: IWorkoutStage[];
}

/**
 * Optional configuration for a customizable training plan. When omitted, the
 * generator keeps its original date-derived, pace-based behavior.
 */
export interface ITrainingPlanConfig {
  weeks?: number;
  startVolumeKm?: number;
  peakVolumeKm?: number;
}

/**
 * Weekly training recommendation row
 */
export interface ITrainingWeekPlan {
  week: number;
  weekLabel: string;
  focus: string;
  totalMileageKm: number;
  isRecoveryWeek: boolean;
  days: ITrainingDay[];
}

/**
 * Share payload schema stored in URL query
 */
export interface ISharePayload {
  state: Partial<IPaceState>;
  inputs: Record<string, string>;
  trainingTargetDate?: string;
  trainingPlanDistance?: number;
  /** Science/environment tool inputs (id → value); omitted when empty. */
  toolInputs?: Record<string, string>;
}

/**
 * Data handed to the standalone training-report page via localStorage.
 * The plan rows are already localized at capture time, so the report page
 * needs no i18n module — only the language tag for its own static chrome.
 */
export interface ITrainingReportData {
  plan: ITrainingWeekPlan[];
  meta: {
    targetDate: string;
    planLabel: string;
    estimate: string;
    lang: TLanguage;
  };
}

/**
 * Race Event schema fetched from Google Apps Script
 */
export interface IRaceEvent {
  id: string;
  date: string;
  name: string;
  location: string;
  registrationLink: string;
  stravaFull: string;
  stravaHalf: string;
  gpxFull: string;
  gpxHalf: string;
}

/**
 * Countdown state mapping
 */
export type TCountdownPhase = 'future' | 'base' | 'taper' | 'peak' | 'today' | 'past';

/**
 * Minimal Leaflet types
 */
declare global {
  // html2canvas is loaded on demand from a CDN for image export.
  interface Window {
    html2canvas?: (el: HTMLElement, opts?: Record<string, unknown>) => Promise<HTMLCanvasElement>;
  }

  // Leaflet is loaded as a global UMD bundle from a CDN; an ambient namespace
  // is the idiomatic way to describe it. Args are loosely typed (unknown) since
  // we only pass values through to Leaflet and never inspect them.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace L {
    interface Map {
      eachLayer(fn: (layer: Layer) => void): this;
      removeLayer(layer: Layer): this;
      fitBounds(bounds: unknown, options?: unknown): this;
      invalidateSize(): this;
      remove(): this;
    }
    interface Layer {
      getTileUrl?: () => string;
      addTo(map: Map): this;
    }
    interface Polyline extends Layer {
      getBounds(): unknown;
      addTo(map: Map): this;
    }
    interface CircleMarker extends Layer {
      addTo(map: Map): this;
      bindPopup(content: string): this;
    }

    function polyline(latlngs: unknown[], options?: unknown): Polyline;
    function circleMarker(latlng: unknown, options?: unknown): CircleMarker;
    function map(id: string | HTMLElement, options?: unknown): Map;
    function tileLayer(urlTemplate: string, options?: unknown): Layer;
  }
}

/**
 * Basic GeoJSON Types
 */
export type TGeoJsonCoordinates = number[];

export interface IGeoJsonPoint {
  type: 'Point';
  coordinates: TGeoJsonCoordinates;
}

export interface IGeoJsonLineString {
  type: 'LineString';
  coordinates: TGeoJsonCoordinates[];
}

export interface IGeoJsonMultiLineString {
  type: 'MultiLineString';
  coordinates: TGeoJsonCoordinates[][];
}

export interface IGeoJsonPolygon {
  type: 'Polygon';
  coordinates: TGeoJsonCoordinates[][];
}

export type TGeoJsonGeometry =
  | IGeoJsonPoint
  | IGeoJsonLineString
  | IGeoJsonMultiLineString
  | IGeoJsonPolygon;

export interface IGeoJsonFeature {
  type: 'Feature';
  geometry: TGeoJsonGeometry;
  properties?: Record<string, unknown>;
}

export interface IGeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: IGeoJsonFeature[];
}

export type TGeoJsonNode = IGeoJsonFeatureCollection | IGeoJsonFeature | TGeoJsonGeometry;

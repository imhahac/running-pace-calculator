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
export type TMode = 'pace' | 'track' | 'treadmill' | 'finish_time';

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
 * Application global state
 */
export interface IPaceState {
  mode: TMode;
  paceUnit: TUnit;
  treadmillUnit: TUnit;
  venue: string;
  lane: number;
  distance: number;
  theme: TTheme;
  lang: TLanguage;
  splitMode: TSplitMode;
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
 * Training zone information
 */
export interface ITrainingZone {
  name: string;
  label: string;
  pace: string;
}

/**
 * Weekly training recommendation row
 */
export interface ITrainingWeekPlan {
  week: number;
  weekLabel: string;
  focus: string;
  easyPace: string;
  tempoPace: string;
  intervalPace: string;
  longRunPace: string;
  totalMileageKm: number;
  keyWorkout: string;
  isRecoveryWeek: boolean;
}

/**
 * Share payload schema stored in URL query
 */
export interface ISharePayload {
  state: Partial<IPaceState>;
  inputs: Record<string, string>;
  trainingTargetDate?: string;
}

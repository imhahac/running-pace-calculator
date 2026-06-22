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
  activeTab: string;
  triDistance: 51.5 | 113 | 226;
  triInputs?: {
    totalTarget: string;
    swim: string;
    t1: string;
    bike: string;
    t2: string;
    run: string;
  };
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
  // Leaflet is loaded as a global UMD bundle from a CDN; an ambient namespace
  // is the idiomatic way to describe it.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace L {
    interface Map {
      eachLayer(fn: (layer: Layer) => void): this;
      removeLayer(layer: Layer): this;
      fitBounds(bounds: any, options?: any): this;
      invalidateSize(): this;
      remove(): this;
    }
    interface Layer {
      getTileUrl?: () => string;
      addTo(map: Map): this;
    }
    interface Polyline extends Layer {
      getBounds(): any;
      addTo(map: Map): this;
    }
    interface CircleMarker extends Layer {
      addTo(map: Map): this;
      bindPopup(content: string): this;
    }

    function polyline(latlngs: any[], options?: any): Polyline;
    function circleMarker(latlng: any, options?: any): CircleMarker;
    function map(id: string | HTMLElement, options?: any): Map;
    function tileLayer(urlTemplate: string, options?: any): Layer;
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

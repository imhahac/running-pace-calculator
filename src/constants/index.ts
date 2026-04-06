/**
 * Constants and Configuration for Running Pace Calculator
 */

import type {
  IConversionFactors,
  IPaceState,
  IVenuesMap,
  ITranslations,
  IVenue,
  ITrackLane
} from '../types/index';

/**
 * Conversion factors for distance units
 */
export const CONVERSION_FACTORS: IConversionFactors = {
  km_to_mile: 0.621371192,
  mile_to_km: 1.609344
};

/**
 * Riegel's formula exponent for race prediction
 */
export const RIEGEL_EXPONENT = 1.06;

/**
 * Training zone pace multipliers (based on base pace in seconds/km)
 */
export const TRAINING_ZONES = {
  easy: 1.2,         // 20% slower than base pace
  marathon: 1.05,    // 5% slower
  threshold: 0.95,   // 5% faster
  interval: 0.90,    // 10% faster
  repetition: 0.85   // 15% faster
};

/**
 * Default application state
 */
export const DEFAULT_STATE: IPaceState = {
  mode: 'pace',
  paceUnit: 'km',
  treadmillUnit: 'km',
  venue: 'standard_400',
  lane: 400,
  distance: 42195, // Marathon distance in meters
  theme: 'dark',
  lang: 'zh',
  splitMode: 'track'
};

/**
 * Track venues database
 */
export const VENUES: IVenuesMap = {
  standard_400: {
    id: 'standard_400',
    name: '台北田徑場 (400m)',
    lanes: [
      { id: 1, dist: 400, label: '第1道' },
      { id: 2, dist: 408, label: '第2道' },
      { id: 3, dist: 415, label: '第3道' },
      { id: 4, dist: 423, label: '第4道' },
      { id: 5, dist: 430, label: '第5道' },
      { id: 6, dist: 438, label: '第6道' },
      { id: 7, dist: 445, label: '第7道' },
      { id: 8, dist: 453, label: '第8道' }
    ]
  },
  warmup_300: {
    id: 'warmup_300',
    name: '台北暖身場 (300m)',
    lanes: [
      { id: 1, dist: 300, label: '第1道' },
      { id: 2, dist: 308, label: '第2道' },
      { id: 3, dist: 315, label: '第3道' },
      { id: 4, dist: 323, label: '第4道' }
    ]
  }
};

/**
 * Multi-language translations
 */
export const TRANSLATIONS: ITranslations = {
  zh: {
    helper: "任意輸入、即刻換算",
    mode_pace: "配速",
    mode_track: "田徑場",
    mode_treadmill: "跑步機",
    mode_finish: "完成",
    label_sec_lap: "秒/圈",
    lap_2: "2圈",
    lap_3: "3圈",
    lap_4: "4圈",
    lap_5: "5圈",
    btn_copy: "📋 複製結果",
    btn_advanced: "🛠️ 進階工具 (區間/預測)",
    title_zones: "🏃 訓練配速區間 (基於當前配速)",
    title_predict: "🔮 完賽成績預測 (Riegel's Formula)",
    dist_marathon: "全馬 Marathon",
    dist_half: "半馬 Half-Marathon",
    half_marathon: "半馬",
    lane_prefix: "第",
    lane_suffix: "道",
    venue_400: "台北田徑場 (400m)",
    venue_300: "台北暖身場 (300m)",
    copy_success: "✅ 已複製",
    copy_fail: "複製失敗",
    copy_header: "🏃 RunningPaceNote 計算結果:",
    copy_pace: "⏱️ 配速:",
    copy_track: "🔄 田徑場:",
    copy_finish: "🏁 完賽時間:",
    tab_track: "🏟️ 田徑場",
    tab_road: "🛣️ 路跑分段 (每2.5k)",
    label_water: "💧",
    road_km_suffix: "k",
    road_finish: "完賽"
  },
  en: {
    helper: "Input anything, calculate instantly.",
    mode_pace: "Pace",
    mode_track: "Track",
    mode_treadmill: "Treadmill",
    mode_finish: "Finish",
    label_sec_lap: "sec/lap",
    lap_2: "2 laps",
    lap_3: "3 laps",
    lap_4: "4 laps",
    lap_5: "5 laps",
    btn_copy: "📋 Copy Result",
    btn_advanced: "🛠️ Advanced Tools",
    title_zones: "🏃 Training Zones (Based on Pace)",
    title_predict: "🔮 Race Predictor (Riegel's)",
    dist_marathon: "Full Marathon",
    dist_half: "Half Marathon",
    half_marathon: "Half",
    lane_prefix: "Lane ",
    lane_suffix: "",
    venue_400: "Taipei Stadium (400m)",
    venue_300: "Warmup Field (300m)",
    copy_success: "✅ Copied",
    copy_fail: "Copy Failed",
    copy_header: "🏃 RunningPaceNote Result:",
    copy_pace: "⏱️ Pace:",
    copy_track: "🔄 Track:",
    copy_finish: "🏁 Finish:",
    tab_track: "🏟️ Track",
    tab_road: "🛣️ Road Splits (2.5k)",
    label_water: "💧",
    road_km_suffix: "k",
    road_finish: "Finish"
  }
};

/**
 * Road split distances (in meters) for marathon calculation
 */
export const ROAD_SPLIT_DISTANCES: number[] = (() => {
  const distances: number[] = [];
  for (let k = 2.5; k <= 40; k += 2.5) {
    distances.push(k * 1000);
  }
  distances.push(21097.5); // Half marathon
  distances.push(42195);   // Full marathon
  return distances.sort((a, b) => a - b);
})();

/**
 * Placeholder text for each mode
 */
export const MODE_PLACEHOLDERS: Record<string, string | string[]> = {
  pace: ['4', '30'],
  track: '96',
  treadmill: '12',
  finish_time: 'm:s / h:m:s'
};

/**
 * Local storage key for state persistence
 */
export const STORAGE_KEY = 'runningPaceNoteState';

/**
 * Local storage key for theme
 */
export const THEME_STORAGE_KEY = 'theme';

/**
 * Local storage key for language
 */
export const LANG_STORAGE_KEY = 'lang';

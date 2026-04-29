/**
 * Constants and Configuration for Running Pace Calculator
 */

import type {
  IConversionFactors,
  IPaceState,
  IVenuesMap,
  ITranslations
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
    road_finish: "完賽",
    finish_hint_short: "短距離建議格式 m:ss，例如 20:00",
    finish_hint_long: "半馬/全馬建議格式 h:mm:ss，例如 3:30:00",
    finish_error_invalid: "時間格式不正確，請使用 m:ss 或 h:mm:ss",
    finish_error_expected_long: "此距離建議使用 h:mm:ss，例如 3:30:00",
    finish_error_expected_short: "此距離建議使用 m:ss，例如 20:00",
    btn_settings: "⚙️ 設定",
    title_settings: "偏好設定",
    settings_lang: "語言",
    settings_pace_unit: "配速單位",
    settings_treadmill_unit: "跑步機單位",
    settings_split_mode: "分段顯示偏好",
    settings_venue: "預設場地",
    settings_lane: "預設跑道道次",
    btn_apply_settings: "套用設定",
    btn_open_diagnostics: "開啟離線診斷",
    btn_share_link: "🔗 分享連結",
    btn_export_pdf: "📄 匯出 PDF",
    btn_export_image: "🖼️ 匯出圖片",
    share_link_copied: "已複製分享連結",
    share_link_failed: "分享連結建立失敗",
    title_training_cycle: "📅 訓練週期建議",
    label_target_race_date: "目標賽事日期",
    label_week: "週",
    label_focus: "訓練重點",
    label_easy: "Easy",
    label_tempo: "Tempo",
    label_interval: "Interval",
    label_long: "Long",
    no_training_cycle: "請先設定目標日期並輸入配速",
    label_plan_race: "課表項目",
    plan_full: "全馬課表",
    plan_half: "半馬課表",
    plan_10k: "10K課表",
    training_context_prefix: "目前課表（以目前配速推估）",
    training_context_empty: "目前尚未產生課表時間",
    label_mileage: "里程(km)",
    label_workout: "主課表",
    label_recovery: "恢復週",
    workout_easy: "E配速慢跑 + 核心",
    workout_tempo: "節奏跑 20-40 分",
    workout_interval: "間歇 5-8 組",
    workout_race: "比賽配速短課表",
    btn_open_report: "📑 開啟訓練報表",
    short_link_failed: "短連結服務失敗，已改用完整連結"
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
    road_finish: "Finish",
    finish_hint_short: "Short races: use m:ss, e.g. 20:00",
    finish_hint_long: "Half/Full races: use h:mm:ss, e.g. 3:30:00",
    finish_error_invalid: "Invalid time format. Use m:ss or h:mm:ss",
    finish_error_expected_long: "For this distance, use h:mm:ss, e.g. 3:30:00",
    finish_error_expected_short: "For this distance, use m:ss, e.g. 20:00",
    btn_settings: "⚙️ Settings",
    title_settings: "Preferences",
    settings_lang: "Language",
    settings_pace_unit: "Pace Unit",
    settings_treadmill_unit: "Treadmill Unit",
    settings_split_mode: "Split Preference",
    settings_venue: "Default Venue",
    settings_lane: "Default Lane",
    btn_apply_settings: "Apply Settings",
    btn_open_diagnostics: "Open Offline Diagnostics",
    btn_share_link: "🔗 Share Link",
    btn_export_pdf: "📄 Export PDF",
    btn_export_image: "🖼️ Export Image",
    share_link_copied: "Share link copied",
    share_link_failed: "Failed to build share link",
    title_training_cycle: "📅 Training Cycle",
    label_target_race_date: "Target race date",
    label_week: "Week",
    label_focus: "Focus",
    label_easy: "Easy",
    label_tempo: "Tempo",
    label_interval: "Interval",
    label_long: "Long",
    no_training_cycle: "Set target date and provide a valid pace",
    label_plan_race: "Plan race",
    plan_full: "Marathon Plan",
    plan_half: "Half Marathon Plan",
    plan_10k: "10K Plan",
    training_context_prefix: "Current plan (estimated by current pace)",
    training_context_empty: "No training plan time generated yet",
    label_mileage: "Mileage(km)",
    label_workout: "Key Workout",
    label_recovery: "Recovery",
    workout_easy: "Easy run + core",
    workout_tempo: "Tempo run 20-40 min",
    workout_interval: "Intervals 5-8 reps",
    workout_race: "Race-pace sharpening",
    btn_open_report: "📑 Open Training Report",
    short_link_failed: "Short-link service failed, copied long link"
  }
};

/**
 * Language rules are separated from plain words so adding new locales is easier.
 */
export const I18N_RULES = {
  zh: {
    units: {
      pace: { km: '/km', mile: '/mile' },
      treadmill: { km: 'km/h', mile: 'mile/h' }
    },
    options: {
      paceUnit: { km: '/km', mile: '/mile' },
      treadmillUnit: { km: 'km/h', mile: 'mile/h' },
      language: { zh: '繁體中文', en: 'English' }
    },
    trainingFocus: {
      base: '有氧基礎',
      build: '節奏與耐力',
      peak: '比賽配速',
      taper: '減量調整',
      race: '比賽週'
    },
    workouts: {
      easy: 'E配速慢跑 + 核心',
      tempo: '節奏跑 20-40 分',
      interval: '間歇 5-8 組',
      race: '比賽配速短課表'
    }
  },
  en: {
    units: {
      pace: { km: '/km', mile: '/mile' },
      treadmill: { km: 'km/h', mile: 'mile/h' }
    },
    options: {
      paceUnit: { km: '/km', mile: '/mile' },
      treadmillUnit: { km: 'km/h', mile: 'mile/h' },
      language: { zh: 'Traditional Chinese', en: 'English' }
    },
    trainingFocus: {
      base: 'Aerobic base',
      build: 'Tempo and endurance',
      peak: 'Race pace sharpening',
      taper: 'Taper and freshness',
      race: 'Race week'
    },
    workouts: {
      easy: 'Easy run + core',
      tempo: 'Tempo run 20-40 min',
      interval: 'Intervals 5-8 reps',
      race: 'Race-pace sharpening'
    }
  }
} as const;

/**
 * Standard race distances in meters
 */
export const HALF_MARATHON_METERS = 21097.5;
export const FULL_MARATHON_METERS = 42195;

/**
 * Road split distances (in meters) for marathon calculation
 */
export const ROAD_SPLIT_DISTANCES: number[] = (() => {
  const distances: number[] = [];
  for (let k = 2.5; k <= 40; k += 2.5) {
    distances.push(k * 1000);
  }
  distances.push(HALF_MARATHON_METERS);
  distances.push(FULL_MARATHON_METERS);
  return distances.sort((a, b) => a - b);
})();

/**
 * Placeholder text for each mode
 */
export const MODE_PLACEHOLDERS: Record<string, string | string[]> = {
  pace: ['4', '30'],
  track: '96',
  treadmill: '12',
  finish_time: '5K: m:ss / Half-Full: h:mm:ss'
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

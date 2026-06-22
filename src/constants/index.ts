/**
 * Constants and Configuration for Running Pace Calculator
 */

import type {
  IConversionFactors,
  IPaceState,
  IVenuesMap,
  ITranslations,
  TTrainingPhase
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
  easy: 1.2, // 20% slower than base pace
  marathon: 1.05, // 5% slower
  threshold: 0.95, // 5% faster
  interval: 0.9, // 10% faster
  repetition: 0.85 // 15% faster
};

/**
 * Periodized training-plan tuning constants.
 * Extracted verbatim from the former Calculator.generateTrainingCycle so the
 * numbers are named, documented, and auditable in one place.
 */
export const TRAINING_PLAN = {
  /** Hard cap on planned weeks regardless of how far away the race is. */
  maxWeeks: 24,
  /** Recovery (down) week cadence — every Nth week, outside taper/race. */
  recoveryEveryWeeks: 4,
  /** Running volume is scaled down for triathlon plans. */
  triVolumeFactor: 0.6,
  /** Baseline weekly mileage = clamp(round(3600/pace * coeff + base), min, max). */
  baselinePaceCoeff: 6,
  baselinePaceBase: 16,
  baselineMinKm: 24,
  baselineMaxKm: 80,
  /** Absolute floor for any computed weekly mileage. */
  mileageFloorKm: 16,
  /** Progressive overload: +stepKm every stepWeeks of training. */
  progressStepWeeks: 3,
  progressStepKm: 4,
  /** Volume scale by goal-race distance bucket (long ≥ marathon, mid ≥ half). */
  raceScale: { long: 1, mid: 0.8, short: 0.62 },
  /** Per-phase weekly-volume scale and floor (km). */
  phaseVolume: {
    race: { scale: 0.45, floorKm: 16 },
    taper: { scale: 0.65, floorKm: 20 },
    recovery: { scale: 0.7, floorKm: 22 }
  }
} as const;

/**
 * Per-phase target paces. Each entry maps a workout type to a base
 * TRAINING_ZONES multiplier (zone) plus a fine adjustment (adj):
 *   pace = paceSecondsPerKm * TRAINING_ZONES[zone] * adj
 */
export const PHASE_PACE_PLAN: Record<
  TTrainingPhase,
  Record<'easy' | 'tempo' | 'interval' | 'long', { zone: keyof typeof TRAINING_ZONES; adj: number }>
> = {
  base: {
    easy: { zone: 'easy', adj: 1.05 },
    tempo: { zone: 'marathon', adj: 1.02 },
    interval: { zone: 'interval', adj: 1 },
    long: { zone: 'easy', adj: 1.1 }
  },
  build: {
    easy: { zone: 'easy', adj: 1.02 },
    tempo: { zone: 'threshold', adj: 1.05 },
    interval: { zone: 'interval', adj: 0.98 },
    long: { zone: 'easy', adj: 1.05 }
  },
  peak: {
    easy: { zone: 'easy', adj: 1 },
    tempo: { zone: 'threshold', adj: 1 },
    interval: { zone: 'interval', adj: 0.95 },
    long: { zone: 'easy', adj: 1 }
  },
  taper: {
    easy: { zone: 'easy', adj: 0.98 },
    tempo: { zone: 'marathon', adj: 0.98 },
    interval: { zone: 'interval', adj: 1.02 },
    long: { zone: 'easy', adj: 0.95 }
  },
  race: {
    easy: { zone: 'easy', adj: 1 },
    tempo: { zone: 'marathon', adj: 1 },
    interval: { zone: 'interval', adj: 1 },
    long: { zone: 'easy', adj: 1 }
  }
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
  trackDistance: 400,
  theme: 'dark',
  lang: 'zh',
  splitMode: 'track',
  planType: 'running',
  gasApiUrl: '',
  activeTab: 'tab-pace',
  triDistance: 51.5
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
    helper: '任意輸入、即刻換算',
    hint_pace_mode: '輸入每公里配速（分:秒），自動換算時速、分段與完賽時間',
    hint_track_mode: '選場地後輸入單圈秒數，自動算各距離分段',
    hint_treadmill_mode: '輸入跑步機時速，換算成路跑配速',
    hint_finish_mode: '選距離並輸入目標完賽時間，反推所需配速',
    hint_triathlon_intro: '輸入目標總時間或各段配速，推算游／騎／跑分段',
    hint_training_intro: '選賽事日期並輸入配速，自動產生每週課表與里程',
    hint_settings_intro: '調整語言、單位、預設場地與賽事 API',
    info_time_format:
      '時間格式：m:ss（分:秒）或 h:mm:ss（時:分:秒）。任一欄位輸入即時換算，點上方分頁切換功能。',
    tab_science: '科學訓練',
    vdot_title: '📊 VDOT 訓練配速',
    hint_vdot_intro: '輸入近期賽事成績，算出 VDOT 與 E/M/T/I/R 訓練配速',
    zone_easy_desc: '有氧基礎',
    zone_marathon_desc: '馬拉松配速',
    zone_threshold_desc: '乳酸閾值',
    zone_interval_desc: 'VO₂max 間歇',
    zone_repetition_desc: '速度與經濟性',
    vdot_equiv: '等效比賽成績',
    hr_title: '❤️ 心率區間',
    hint_hr_intro: '輸入年齡與靜息心率，算出 Karvonen 五區心率',
    hr_age: '年齡',
    hr_rest: '靜息心率 (bpm)',
    hr_max_optional: '實測最大心率 (可選)',
    hr_formula: '最大心率公式',
    hr_formula_tanaka: 'Tanaka (建議)',
    hr_formula_fox: '220 − 年齡',
    hr_maxhr: '最大心率',
    hr_vo2max: '估計 VO₂max',
    interval_title: '⚡ 間歇課表產生器',
    hint_interval_intro: '依上方 VDOT 與週里程，產生結構化間歇課表',
    interval_weekly: '週里程 (km)',
    interval_type: '課表類型',
    interval_type_i: 'I 間歇 (VO₂max)',
    interval_type_t: 'T 節奏 (閾值)',
    interval_type_r: 'R 重複 (速度)',
    interval_warmup: '暖身',
    interval_cooldown: '緩和',
    interval_total: '總計',
    interval_capped: '已依週量上限調整組數',
    interval_need_vdot: '請先在上方 VDOT 區輸入賽事成績',
    raceplan_title: '🎯 比賽配速規劃',
    hint_raceplan_intro: '設定目標完賽時間與策略，產生每公里配速表',
    strategy_even: '平均配速',
    strategy_negative: '負分段（後段加速）',
    strategy_positive: '正分段（前段較快）',
    raceplan_avg: '平均',
    col_km: '公里',
    col_pace: '配速',
    col_time: '累積',
    col_phase: '階段',
    phase_start: '起步',
    phase_mid: '中段',
    phase_surge: '加速',
    phase_finish: '衝線',
    methods_title: '🏆 名師訓練法',
    hint_methods_intro: '輸入目標全馬時間，套用名師課表',
    methods_need_time: '請輸入目標全馬時間',
    method_yasso: 'Yasso 800',
    method_norwegian4x4: '挪威 4×4',
    method_hansons: 'Hansons',
    method_double: '挪威雙閾值',
    method_yasso_work: '10 × 800m（趟間慢跑 400m）',
    method_yasso_note: '800m 的「分:秒」≈ 全馬的「時:分」',
    method_n4x4_work: '4 × 4 分鐘 @ 90–95% 最大心率（3 分鐘恢復）',
    method_n4x4_note: '暖身/緩和各 10 分鐘；以 I 配速約略對應',
    method_hansons_tempo: '節奏跑 @ 馬拉松配速',
    method_hansons_long: '長跑（上限 ~25 km）',
    method_hansons_note: 'Hansons：累積疲勞，長跑不過量',
    method_double_am: '上午：5 × 6 分鐘 @ 閾值',
    method_double_pm: '下午：10 × 1 km @ 閾值',
    method_double_note: '同日兩次閾值，控制在「舒適的辛苦」',
    hint_plan_config: '可選：設定難度或自訂週數與里程（留白則自動推算）',
    plan_difficulty: '難度',
    plan_diff_custom: '自訂',
    plan_diff_beginner: '初階',
    plan_diff_intermediate: '進階',
    plan_diff_elite: '菁英',
    plan_weeks: '週數',
    plan_start_vol: '起始里程',
    plan_peak_vol: '巔峰里程',
    explain_pace:
      '配速＝跑 1 公里所需時間。任一欄位輸入後，時速、各距離分段與完賽時間會即時連動換算。',
    explain_track:
      '固定使用最內圈（圈長＝場地距離）。輸入單圈秒數即可算出 100m–2000m 各分段；可切換 400m 標準場或 300m 暖身場。',
    explain_treadmill: '把跑步機時速換算成室外路跑配速（以坡度 0% 約略對應；實際路跑通常略慢）。',
    explain_finish: '選目標距離並輸入想完賽的時間，反推所需的平均配速與各分段。',
    explain_splits:
      '分段表是配速檢查點：田徑場顯示每段所需時間；路跑每 2.5k 顯示累積時間，方便對錶與補給。',
    explain_zones:
      'E 輕鬆跑（打底/恢復）、M 馬拉松配速、T 乳酸閾值（可維持 20–40 分）、I VO₂max 間歇（3–5 分）、R 重複跑（速度與跑姿）。單次質量課表別超過週里程約 8–10%。',
    explain_predict:
      '以一個近期成績用 Riegel 公式（時間 × 距離比^1.06）推估其他距離；參考距離與目標距離越接近越準。',
    explain_triathlon:
      '輸入目標總時間會依賽事類型自動反推游/騎/跑分段配速；也可直接填各段配速得到總時間。T1/T2 為轉換區時間。',
    explain_training_cycle:
      '計畫分期：基礎→進展→巔峰→減量→比賽週；每 4 週安排一次減量恢復週。里程與配速隨分期自動調整。',
    explain_plan_config:
      '難度（初/進/菁英）會自動帶入建議的週數與起始/巔峰週里程；想自訂可直接改數字，全部留白則依賽事日期與目前配速自動推算。',
    explain_raceplan:
      '策略：平均（穩定）；負分段（後半加速，通常成績較佳）；正分段（前快後掉，較不建議）。表格為每公里目標配速與累積時間。提醒：起步勿過快、約 30k 易撞牆、依表補給。',
    explain_vdot:
      'VDOT 是由近期成績推估的「有效 VO₂max」，數字越大代表體能越好。下方 E/M/T/I/R 是對應訓練配速，等效成績是相同體能下各距離的預估成績。',
    explain_hr:
      '先用 Tanaka 公式（208−0.7×年齡）或實測值估最大心率，再以 Karvonen（心率儲備）分成五區，各區對應不同訓練目的。VO₂max 為由最大/靜息心率比值推估（非實測）。',
    explain_interval:
      'I 練 VO₂max、T 練乳酸閾值、R 練速度與經濟性。系統依 VDOT 給配速，並把單次質量里程限制在 min(10km, 週量 8%) 以內；課表＝暖身＋主課表＋緩和。',
    explain_methods:
      'Yasso 800：以 800m 反覆預估全馬。挪威 4×4：4×4 分鐘高強度練 VO₂max。Hansons：累積疲勞、長跑不過量。挪威雙閾值：同日兩次閾值、控制強度。',
    mode_pace: '配速',
    mode_track: '田徑場',
    mode_treadmill: '跑步機',
    mode_finish: '完成',
    label_sec_lap: '秒/圈',
    lap_2: '2圈',
    lap_3: '3圈',
    lap_4: '4圈',
    lap_5: '5圈',
    btn_copy: '📋 複製結果',
    btn_advanced: '🛠️ 進階工具 (區間/預測)',
    title_zones: '🏃 訓練配速區間 (基於當前配速)',
    title_predict: "🔮 完賽成績預測 (Riegel's Formula)",
    dist_marathon: '全馬 Marathon',
    dist_half: '半馬 Half-Marathon',
    half_marathon: '半馬',
    lane_prefix: '第',
    lane_suffix: '道',
    venue_400: '台北田徑場 (400m)',
    venue_300: '台北暖身場 (300m)',
    copy_success: '✅ 已複製',
    copy_fail: '複製失敗',
    copy_header: '🏃 RunningPaceNote 計算結果:',
    copy_pace: '⏱️ 配速:',
    copy_track: '🔄 田徑場:',
    copy_finish: '🏁 完賽時間:',
    tab_track: '🏟️ 田徑場',
    tab_road: '🛣️ 路跑分段 (每2.5k)',
    label_water: '💧',
    road_km_suffix: 'k',
    road_finish: '完賽',
    finish_hint_short: '短距離建議格式 m:ss，例如 20:00',
    finish_hint_long: '半馬/全馬建議格式 h:mm:ss，例如 3:30:00',
    finish_error_invalid: '時間格式不正確，請使用 m:ss 或 h:mm:ss',
    finish_error_expected_long: '此距離建議使用 h:mm:ss，例如 3:30:00',
    finish_error_expected_short: '此距離建議使用 m:ss，例如 20:00',
    btn_settings: '⚙️ 設定',
    title_settings: '偏好設定',
    settings_lang: '語言',
    settings_pace_unit: '配速單位',
    settings_treadmill_unit: '跑步機單位',
    settings_split_mode: '分段顯示偏好',
    settings_venue: '預設場地',
    settings_lane: '預設跑道道次',
    btn_apply_settings: '套用設定',
    btn_open_diagnostics: '開啟離線診斷',
    btn_share_link: '🔗 分享連結',
    btn_export_pdf: '📄 匯出 PDF',
    btn_export_image: '🖼️ 匯出圖片',
    share_link_copied: '已複製分享連結',
    share_link_failed: '分享連結建立失敗',
    title_training_cycle: '📅 訓練週期建議',
    label_target_race_date: '目標賽事日期',
    label_week: '週',
    label_focus: '訓練重點',
    label_easy: 'Easy',
    label_tempo: 'Tempo',
    label_interval: 'Interval',
    label_long: 'Long',
    no_training_cycle: '請先設定目標日期並輸入配速',
    label_plan_race: '課表項目',
    label_plan_type: '訓練類型',
    type_running: '純跑步',
    type_triathlon: '鐵人三項',
    plan_full: '全馬課表',
    plan_half: '半馬課表',
    plan_10k: '10K課表',
    training_context_prefix: '目前課表（以目前配速推估）',
    training_context_empty: '目前尚未產生課表時間',
    label_mileage: '里程(km)',
    label_workout: '主課表',
    label_recovery: '恢復週',
    workout_easy: 'E配速慢跑 + 核心',
    workout_tempo: '節奏跑 20-40 分',
    workout_interval: '間歇 5-8 組',
    workout_race: '比賽配速短課表',
    btn_open_report: '📑 開啟訓練報表',
    short_link_failed: '短連結服務失敗，已改用完整連結',
    day_mon: '週一',
    day_tue: '週二',
    day_wed: '週三',
    day_thu: '週四',
    day_fri: '週五',
    day_sat: '週六',
    day_sun: '週日',
    workout_rest: '休息日',
    workout_swim: '游泳',
    workout_bike: '自行車',
    workout_long: '長距離',
    stage_front: '前段',
    stage_mid: '中段',
    stage_end: '後段',
    stage_main: '主課表',
    act_warmup: '暖身',
    act_steady: '穩定',
    act_pickup: '加速',
    act_cooldown: '緩和',
    act_tempo_run: '節奏跑',
    note_as_able: '視體能',
    rest_short: '休',
    settings_gas_url: '賽事 API (GAS)',
    label_race_list: '快速選擇賽事',
    countdown_today: '🎉 就是今天！祝您順利完賽！',
    countdown_past: '✅ 賽事已結束',
    countdown_future: '⏳ 距離賽事還有 {days} 天',
    countdown_phase_base: ' (基礎準備期)',
    countdown_phase_peak: ' (巔峰訓練期)',
    countdown_phase_taper: ' (減量恢復期)',
    mode_triathlon: '三鐵配速',
    triathlon_total_time: '目標總時間',
    tri_swim_pace: '游泳配速 (/100m)',
    tri_t1_time: 'T1 轉換 (分鐘)',
    tri_bike_speed: '單車時速 (km/h)',
    tri_t2_time: 'T2 轉換 (分鐘)',
    tri_run_pace: '跑步配速 (/km)',
    tri_swim: '游泳',
    tri_bike: '單車',
    tri_run: '跑步',
    tri_total: '總計'
  },
  en: {
    helper: 'Input anything, calculate instantly.',
    hint_pace_mode:
      'Enter pace per km (min:sec); speed, splits and finish time update automatically',
    hint_track_mode: 'Pick a venue, enter lap seconds; per-distance splits are computed',
    hint_treadmill_mode: 'Enter treadmill speed to convert it into road pace',
    hint_finish_mode: 'Pick a distance and target finish time to back-calculate the required pace',
    hint_triathlon_intro: 'Enter a target total time or per-leg paces for swim / bike / run',
    hint_training_intro: 'Pick a race date and enter a pace to generate a weekly plan with mileage',
    hint_settings_intro: 'Adjust language, units, default venue and the race API',
    info_time_format:
      'Time format: m:ss (min:sec) or h:mm:ss (hr:min:sec). Type in any field to convert instantly; switch features via the tabs above.',
    tab_science: 'Science Training',
    vdot_title: '📊 VDOT Training Paces',
    hint_vdot_intro: 'Enter a recent race result to get VDOT and E/M/T/I/R paces',
    zone_easy_desc: 'Aerobic base',
    zone_marathon_desc: 'Marathon pace',
    zone_threshold_desc: 'Lactate threshold',
    zone_interval_desc: 'VO₂max intervals',
    zone_repetition_desc: 'Speed & economy',
    vdot_equiv: 'Equivalent race times',
    hr_title: '❤️ Heart-Rate Zones',
    hint_hr_intro: 'Enter age and resting HR for Karvonen 5-zone heart rates',
    hr_age: 'Age',
    hr_rest: 'Resting HR (bpm)',
    hr_max_optional: 'Measured max HR (optional)',
    hr_formula: 'Max-HR formula',
    hr_formula_tanaka: 'Tanaka (recommended)',
    hr_formula_fox: '220 − age',
    hr_maxhr: 'Max HR',
    hr_vo2max: 'Est. VO₂max',
    interval_title: '⚡ Interval Generator',
    hint_interval_intro:
      'Builds a structured interval session from the VDOT above + weekly mileage',
    interval_weekly: 'Weekly mileage (km)',
    interval_type: 'Workout type',
    interval_type_i: 'I intervals (VO₂max)',
    interval_type_t: 'T tempo (threshold)',
    interval_type_r: 'R reps (speed)',
    interval_warmup: 'Warm-up',
    interval_cooldown: 'Cool-down',
    interval_total: 'Total',
    interval_capped: 'reps adjusted to the weekly-volume cap',
    interval_need_vdot: 'Enter a race result in the VDOT section above first',
    raceplan_title: '🎯 Race Pace Planner',
    hint_raceplan_intro: 'Set a target finish time and strategy for a per-km pace table',
    strategy_even: 'Even pace',
    strategy_negative: 'Negative split',
    strategy_positive: 'Positive split',
    raceplan_avg: 'Avg',
    col_km: 'km',
    col_pace: 'Pace',
    col_time: 'Elapsed',
    col_phase: 'Phase',
    phase_start: 'Start',
    phase_mid: 'Mid',
    phase_surge: 'Surge',
    phase_finish: 'Finish',
    methods_title: '🏆 Coach Methods',
    hint_methods_intro: 'Enter a target marathon time to apply a coach method',
    methods_need_time: 'Enter a target marathon time',
    method_yasso: 'Yasso 800',
    method_norwegian4x4: 'Norwegian 4×4',
    method_hansons: 'Hansons',
    method_double: 'Norwegian Double Threshold',
    method_yasso_work: '10 × 800m (jog 400m between reps)',
    method_yasso_note: '800m time (min:sec) ≈ marathon time (hr:min)',
    method_n4x4_work: '4 × 4 min @ 90–95% max HR (3 min recovery)',
    method_n4x4_note: '10 min warm-up/cool-down; approximated at I pace',
    method_hansons_tempo: 'Tempo @ marathon pace',
    method_hansons_long: 'Long run (cap ~25 km)',
    method_hansons_note: 'Hansons: cumulative fatigue, no over-long runs',
    method_double_am: 'AM: 5 × 6 min @ threshold',
    method_double_pm: 'PM: 10 × 1 km @ threshold',
    method_double_note: 'Two threshold sessions a day, kept comfortably hard',
    hint_plan_config: 'Optional: pick a level or set custom weeks/mileage (blank = auto)',
    plan_difficulty: 'Level',
    plan_diff_custom: 'Custom',
    plan_diff_beginner: 'Beginner',
    plan_diff_intermediate: 'Intermediate',
    plan_diff_elite: 'Elite',
    plan_weeks: 'Weeks',
    plan_start_vol: 'Start km',
    plan_peak_vol: 'Peak km',
    explain_pace:
      'Pace = time to run 1 km. Type in any field and speed, per-distance splits and finish time update instantly.',
    explain_track:
      'Always uses the innermost lane (lap = track distance). Enter one lap’s seconds to get 100m–2000m splits; switch between a 400m standard or 300m warm-up track.',
    explain_treadmill:
      'Converts treadmill speed into outdoor road pace (roughly matching 0% incline; real road running is usually a touch slower).',
    explain_finish:
      'Pick a target distance and the time you want to finish in; it back-calculates the required average pace and splits.',
    explain_splits:
      'Splits are pacing checkpoints: the track view shows each segment’s time; the road view shows cumulative time every 2.5k for watch checks and fueling.',
    explain_zones:
      'E easy (base/recovery), M marathon pace, T threshold (sustainable 20–40 min), I VO₂max intervals (3–5 min), R reps (speed & form). Keep each quality session under ~8–10% of weekly volume.',
    explain_predict:
      'Uses one recent result and Riegel’s formula (time × distance-ratio^1.06) to predict other distances; the closer the reference and target distances, the more accurate.',
    explain_triathlon:
      'Enter a target total time to back-calculate swim/bike/run paces by event type, or fill each leg’s pace to get the total. T1/T2 are transition times.',
    explain_training_cycle:
      'Phases: base → build → peak → taper → race week; a recovery (down) week every 4th week. Mileage and paces adjust automatically by phase.',
    explain_plan_config:
      'A level (beginner/intermediate/elite) fills in suggested weeks and start/peak weekly mileage; edit the numbers to customize, or leave all blank to auto-derive from race date and current pace.',
    explain_raceplan:
      'Strategies: even (steady); negative (faster second half, usually a better result); positive (fast start that fades, not recommended). The table is per-km target pace and cumulative time. Tips: don’t start too fast, the wall often hits ~30k, fuel on schedule.',
    explain_vdot:
      'VDOT is an “effective VO₂max” estimated from a recent result — higher is fitter. The E/M/T/I/R values are the matching training paces; equivalent times are predicted results at the same fitness across distances.',
    explain_hr:
      'Max HR is estimated with Tanaka (208−0.7×age) or your measured value, then Karvonen (heart-rate reserve) splits it into 5 zones, each for a different purpose. VO₂max here is estimated from the max/resting HR ratio (not measured).',
    explain_interval:
      'I trains VO₂max, T trains lactate threshold, R trains speed & economy. Paces come from your VDOT, and a single session’s quality volume is capped at min(10km, 8% of weekly mileage); structure = warm-up + main set + cool-down.',
    explain_methods:
      'Yasso 800: predict the marathon from 800m repeats. Norwegian 4×4: 4×4 min hard for VO₂max. Hansons: cumulative fatigue, no over-long runs. Norwegian double threshold: two threshold sessions a day at controlled intensity.',
    mode_pace: 'Pace',
    mode_track: 'Track',
    mode_treadmill: 'Treadmill',
    mode_finish: 'Finish',
    label_sec_lap: 'sec/lap',
    lap_2: '2 laps',
    lap_3: '3 laps',
    lap_4: '4 laps',
    lap_5: '5 laps',
    btn_copy: '📋 Copy Result',
    btn_advanced: '🛠️ Advanced Tools',
    title_zones: '🏃 Training Zones (Based on Pace)',
    title_predict: "🔮 Race Predictor (Riegel's)",
    dist_marathon: 'Full Marathon',
    dist_half: 'Half Marathon',
    half_marathon: 'Half',
    lane_prefix: 'Lane ',
    lane_suffix: '',
    venue_400: 'Taipei Stadium (400m)',
    venue_300: 'Warmup Field (300m)',
    copy_success: '✅ Copied',
    copy_fail: 'Copy Failed',
    copy_header: '🏃 RunningPaceNote Result:',
    copy_pace: '⏱️ Pace:',
    copy_track: '🔄 Track:',
    copy_finish: '🏁 Finish:',
    tab_track: '🏟️ Track',
    tab_road: '🛣️ Road Splits (2.5k)',
    label_water: '💧',
    road_km_suffix: 'k',
    road_finish: 'Finish',
    finish_hint_short: 'Short races: use m:ss, e.g. 20:00',
    finish_hint_long: 'Half/Full races: use h:mm:ss, e.g. 3:30:00',
    finish_error_invalid: 'Invalid time format. Use m:ss or h:mm:ss',
    finish_error_expected_long: 'For this distance, use h:mm:ss, e.g. 3:30:00',
    finish_error_expected_short: 'For this distance, use m:ss, e.g. 20:00',
    btn_settings: '⚙️ Settings',
    title_settings: 'Preferences',
    settings_lang: 'Language',
    settings_pace_unit: 'Pace Unit',
    settings_treadmill_unit: 'Treadmill Unit',
    settings_split_mode: 'Split Preference',
    settings_venue: 'Default Venue',
    settings_lane: 'Default Lane',
    btn_apply_settings: 'Apply Settings',
    btn_open_diagnostics: 'Open Offline Diagnostics',
    btn_share_link: '🔗 Share Link',
    btn_export_pdf: '📄 Export PDF',
    btn_export_image: '🖼️ Export Image',
    share_link_copied: 'Share link copied',
    share_link_failed: 'Failed to build share link',
    title_training_cycle: '📅 Training Cycle',
    label_target_race_date: 'Target race date',
    label_week: 'Week',
    label_focus: 'Focus',
    label_easy: 'Easy',
    label_tempo: 'Tempo',
    label_interval: 'Interval',
    label_long: 'Long',
    no_training_cycle: 'Set target date and provide a valid pace',
    label_plan_race: 'Plan race',
    label_plan_type: 'Plan Type',
    type_running: 'Running Only',
    type_triathlon: 'Triathlon',
    plan_full: 'Marathon Plan',
    plan_half: 'Half Marathon Plan',
    plan_10k: '10K Plan',
    training_context_prefix: 'Current plan (estimated by current pace)',
    training_context_empty: 'No training plan time generated yet',
    label_mileage: 'Mileage(km)',
    label_workout: 'Key Workout',
    label_recovery: 'Recovery',
    workout_easy: 'Easy run + core',
    workout_tempo: 'Tempo run 20-40 min',
    workout_interval: 'Intervals 5-8 reps',
    workout_race: 'Race-pace sharpening',
    btn_open_report: '📑 Open Training Report',
    short_link_failed: 'Short-link service failed, copied long link',
    day_mon: 'Mon',
    day_tue: 'Tue',
    day_wed: 'Wed',
    day_thu: 'Thu',
    day_fri: 'Fri',
    day_sat: 'Sat',
    day_sun: 'Sun',
    workout_rest: 'Rest',
    workout_swim: 'Swim',
    workout_bike: 'Bike',
    workout_long: 'Long Run',
    stage_front: 'Start',
    stage_mid: 'Middle',
    stage_end: 'End',
    stage_main: 'Main set',
    act_warmup: 'Warm-up',
    act_steady: 'Steady',
    act_pickup: 'Pick-up',
    act_cooldown: 'Cool-down',
    act_tempo_run: 'Tempo',
    note_as_able: 'as able',
    rest_short: 'rest',
    settings_gas_url: 'Race API (GAS)',
    label_race_list: 'Select Race',
    countdown_today: '🎉 Race Day! Good luck!',
    countdown_past: '✅ Race Finished',
    countdown_future: '⏳ {days} days until race',
    countdown_phase_base: ' (Base Phase)',
    countdown_phase_peak: ' (Peak Phase)',
    countdown_phase_taper: ' (Taper Phase)',
    mode_triathlon: 'Tri Planner',
    triathlon_total_time: 'Target Time',
    tri_swim_pace: 'Swim Pace (/100m)',
    tri_t1_time: 'T1 (mins)',
    tri_bike_speed: 'Bike Speed (km/h)',
    tri_t2_time: 'T2 (mins)',
    tri_run_pace: 'Run Pace (/km)',
    tri_swim: 'Swim',
    tri_bike: 'Bike',
    tri_run: 'Run',
    tri_total: 'Total'
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

export const TRIATHLON_DISTANCES = {
  51.5: { swimKm: 1.5, bikeKm: 40, runKm: 10, totalMeters: 51500 },
  113: { swimKm: 1.9, bikeKm: 90, runKm: 21.1, totalMeters: 113000 },
  226: { swimKm: 3.8, bikeKm: 180, runKm: 42.2, totalMeters: 226000 }
};

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
  finish_time: '5K: m:ss / Half-Full: h:mm:ss',
  triathlon: '2:30:00'
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

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
  backendUrl: '',
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
    school_label: '派別',
    school_none: '自動',
    school_higdon: 'Higdon',
    school_pfitzinger: 'Pfitzinger',
    school_daniels: 'Daniels',
    school_desc_none: '未指定派別：依難度或自訂值（全部留白則自動推算）。',
    school_desc_higdon: 'Higdon：親民、循序漸進，量適中、結構簡單，適合初中階。',
    school_desc_pfitzinger: 'Pfitzinger：高里程 + 中長跑與閾值，適合進階者衝成績。',
    school_desc_daniels: 'Daniels：以 VDOT 配速為核心、品質取向、里程中等。',
    btn_export_csv: '⬇️ 匯出 CSV',
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
    label_duration: '時長/距離',
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
    settings_backend_url: '後端 URL (Worker)',
    auth_title: '☁️ 帳號與雲端同步',
    hint_auth_intro: '用 Email 魔術連結登入，跨裝置同步工具輸入與偏好',
    auth_send_link: '寄送登入連結',
    auth_signed_in_as: '已登入',
    auth_logout: '登出',
    auth_need_backend: '請先在上方填入後端 URL (Worker)',
    auth_sending: '寄送中…',
    auth_link_sent: '✅ 登入連結已寄出，請查收 Email（15 分鐘內有效）',
    auth_error: '⚠️ 操作失敗，請稍後再試',
    auth_verifying: '驗證登入中…',
    auth_signed_in: '✅ 已登入',
    auth_logged_out_msg: '已登出',
    auth_synced: '☁️ 已從雲端同步',
    explain_auth:
      '用 Email 收到的魔術連結登入（免密碼）。登入後，各科學/環境工具的輸入與主題/語言偏好會存到你的雲端後端、跨裝置同步；登出即停止同步。需先在上方填入自架的 Worker「後端 URL」。',
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
    tri_total: '總計',
    tab_environment: '環境與補給',
    hr_formula_gellish: 'Gellish',
    hr_compare_label: '公式比較',
    cadence_title: '👟 步頻分析',
    hint_cadence_intro: '輸入配速與目前步頻，算出合理步頻區間與 +5/+10% 目標',
    cadence_pace: '配速 (m:ss/km)',
    cadence_current: '目前步頻 (可選)',
    cadence_band_label: '建議步頻區間',
    cadence_stride_label: '步幅',
    cadence_plus5_label: '+5% 目標',
    cadence_plus10_label: '+10% 目標',
    cadence_advice_input: '輸入目前步頻可評估是否過度跨步，並給 +5/+10% 目標。',
    cadence_advice_over: '⚠️ 目前步頻偏低、可能過度跨步：試著小幅提高步頻、縮短跨步。',
    cadence_advice_ok: '✅ 步頻已在建議區間內，維持即可。',
    explain_cadence:
      '180 SPM 是迷思：合理步頻隨速度變化、因人而異。提高步頻 5–10% 可縮短跨步、降低膝與跟腱的單步衝擊（Heiderscheit 2011）。步幅過大（步頻偏低）常是過度跨步的訊號。',
    strides_title: '🏃‍♂️💨 Strides 加速段',
    hint_strides_intro: '選擇進度週，產生加速段課表與 12 週漸進',
    strides_week_input: '進度週 (1–12)',
    strides_progression_label: '12 週漸進',
    strides_recovery: '恢復',
    explain_strides:
      'Strides＝約 15–30 秒「可控的快」（非衝刺），組間完全恢復，一週插入 2–3 次（輕鬆跑後或質量課表前）。改善神經肌肉協調與跑步經濟性（Daniels & Gilbert 1979；Blagrove 2018）。本表為 12 週漸進：4×15s → 8×30s。',
    acwr_title: '🩹 傷害風險 (ACWR)',
    hint_acwr_intro: '輸入最近 4 週里程（最後一欄為本週），算出急慢性負荷比',
    acwr_w1: '第 1 週 (最舊)',
    acwr_w2: '第 2 週',
    acwr_w3: '第 3 週',
    acwr_w4: '第 4 週 (本週)',
    acwr_acute_label: '急性 (本週)',
    acwr_chronic_label: '慢性 (4週均)',
    acwr_rec_label: '下週建議里程',
    acwr_zone_undertraining: '訓練不足',
    acwr_zone_sweet: '✅ 甜蜜區',
    acwr_zone_caution: '⚠️ 注意',
    acwr_zone_highrisk: '🚨 高風險',
    explain_acwr:
      'ACWR＝本週里程÷近 4 週平均。甜蜜區約 0.8–1.3；>1.5 代表負荷暴增，軟組織傷害風險上升（Gabbett 2016）；<0.8 多為訓練不足或剛回歸。據此調整下週里程，避免一次加太多。',
    env_title: '🌡️ 環境配速調整',
    hint_env_intro: '輸入氣溫、濕度與基準配速，算出露點、WBGT 與今日實際目標配速',
    env_temp: '氣溫 (°C)',
    env_humidity: '相對濕度 (%)',
    env_pace: '基準配速 (m:ss/km)',
    env_grade: '坡度 (%, 可選)',
    env_risk_label: '熱壓力等級',
    env_dewpoint_label: '露點',
    env_wbgt_label: 'WBGT',
    env_heat_label: '高溫減速',
    env_grade_label: '坡度係數',
    env_adjusted_label: '建議目標配速',
    env_risk_low: '🟢 低',
    env_risk_moderate: '🟡 中等',
    env_risk_high: '🟠 高',
    env_risk_extreme: '🔴 極端',
    explain_env:
      '露點與 WBGT 反映身體散熱難度：高溫高濕下汗水難蒸發，配速需放慢。本工具用 WBGT（ABM 陰影近似）對應減速幅度，並用 Minetti（2002）坡度能量成本換算坡度係數。台灣夏天常落在「高/極端」區，務必依建議配速放慢並加強補水。',
    fuel_title: '🍫 卡路里 + 補給時間軸',
    hint_fuel_intro: '輸入體重、距離與目標完賽時間，算出熱量與每站補給',
    fuel_weight: '體重 (kg)',
    fuel_dist: '距離',
    fuel_time: '目標完賽時間',
    fuel_kcal_label: '總熱量',
    fuel_carbrate_label: '建議碳水',
    fuel_fluidrate_label: '建議水分',
    fuel_totalcarb_label: '全程碳水',
    fuel_timeline_label: '補給時間軸',
    explain_fuel:
      '跑步約消耗 1 kcal/kg/km。超過 60 分鐘的賽事需邊跑邊補碳水：1–2 小時約 30 g/h、2–2.5 小時約 60 g/h、更久可達 90 g/h（多種可轉運醣類）；水分約 500 ml/h。表格依完賽時間排出每站建議（ACSM／Stellingwerff & Cox 2014）。',
    sweat_title: '💦 長跑個人化補給',
    hint_sweat_intro: '依體重、配速與氣溫濕度估汗率，產生逐站碳水/水分/鈉',
    sweat_weight: '體重 (kg)',
    sweat_pace: '配速 (m:ss/km)',
    sweat_dist: '距離 (km)',
    sweat_temp: '氣溫 (°C)',
    sweat_humidity: '濕度 (%)',
    sweat_rate_label: '汗率',
    sweat_fluidrate_label: '水分',
    sweat_sodiumrate_label: '鈉',
    sweat_carbrate_label: '碳水',
    sweat_timeline_label: '逐站補給',
    explain_sweat:
      '汗率由跑步產熱推估：約 80% 運動能量轉為熱，蒸發 1 L 汗約散熱 580 kcal；高溫高濕下汗水蒸發效率低、流失更多（Périard 2015）。建議補回約 75% 汗失（避免過量導致低血鈉），汗鈉約 1 g/L。最準的方法仍是運動前後量體重。',
    cool_title: '🧊 賽前降溫策略',
    hint_cool_intro: '輸入體重與氣溫濕度，評估熱壓力並給降溫方案',
    cool_weight: '體重 (kg)',
    cool_temp: '氣溫 (°C)',
    cool_humidity: '濕度 (%)',
    cool_slurry_label: '冰沙',
    cool_hydrate: '充足補水、提前水合',
    cool_shade: '賽前待在陰涼處、避免曝曬',
    cool_colddrink: '飲用冰涼飲料',
    cool_slurry: '賽前 30–60 分鐘喝冰沙（約 7.5 g/kg）',
    cool_icetowel: '頸部／手腕冰毛巾降溫',
    cool_immersion: '賽前冷水浸泡降核心溫度',
    cool_postpone: '極端熱壓力，考慮降速或延後',
    explain_cool:
      'WBGT 反映熱壓力，越高越需主動降溫。賽前冰沙（約 7.5 g/kg 體重，賽前 30–60 分鐘）可降核心溫度延長表現；高溫時搭配陰涼、冷飲、冰毛巾，極端時考慮冷水浸泡甚至延後（Siegel 2010；Périard 2015）。',
    glyco_title: '🍚 賽前肝醣超補',
    hint_glyco_intro: '輸入體重與方案，產生賽前每日碳水克數',
    glyco_weight: '體重 (kg)',
    glyco_protocol: '方案',
    glyco_modifiedSherman: 'Modified Sherman',
    glyco_classic: 'Classic (Bergström)',
    glyco_wa: 'WA 一日法',
    glyco_load_label: '超補量',
    glyco_schedule_label: '每日時程',
    glyco_peak: '峰值',
    glyco_raceday: '賽事日',
    glyco_train_normal: '正常訓練',
    glyco_train_easy: '輕鬆',
    glyco_train_rest: '休息',
    glyco_train_race: '比賽',
    glyco_train_deplete: '耗竭',
    explain_glyco:
      '超過 90 分鐘的賽事，賽前 36–48 小時提高碳水至 10–12 g/kg/天可填滿肝醣（Burke 2011）。Modified Sherman：免耗竭、減量＋3 天高碳水；Classic：先耗竭再超補；WA：一日壓縮超補。數字為依你體重換算的每日碳水克數。',
    taper_title: '📉 賽前 Taper 倒數',
    hint_taper_intro: '輸入巔峰週里程與減量週數，產生每週降量',
    taper_peak: '巔峰週里程 (km)',
    taper_weeks: '減量週數',
    taper_schedule_label: '每週降量',
    taper_raceweek: '比賽週',
    taper_weeksout_prefix: 'T-',
    explain_taper:
      '減量期「降量、不降強度」：1–3 週內把週里程逐步降到巔峰的 40–60%，維持訓練強度與頻率，通常可帶來約 1–3% 的成績提升（Mujika 2010；Bosquet 2007 統合分析）。表格為各週建議里程。',
    rec_title: '🛌 賽後恢復協議',
    hint_rec_intro: '依距離、費力與年齡，估個人化恢復天數',
    rec_dist: '距離',
    rec_effort: '費力程度',
    rec_effort_easy: '輕鬆',
    rec_effort_moderate: '中等',
    rec_effort_hard: '辛苦',
    rec_effort_allout: '全力',
    rec_age: '年齡',
    rec_easy_label: '輕鬆/恢復天數',
    rec_beforehard_label: '恢復高強度前',
    rec_days: '天',
    rec_refuel: '24 小時內補碳水＋蛋白質',
    rec_rehydrate: '補回水分與電解質',
    rec_sleep: '優先充足睡眠',
    rec_active: '輕鬆活動／主動恢復',
    rec_cwi: '冷水浸泡舒緩痠痛（選用）',
    explain_rec:
      '恢復天數隨距離、費力與年齡增加（約 1 天/英里為保守上限）。賽後 24 小時黃金窗：補碳水＋蛋白質、補水、睡眠。策略證據等級：補給/補水/睡眠最強，主動恢復次之，冷水浸泡（CWI）對主觀疲勞有益（Mujika 2010；Halson 2013；Ihsan 2016）。',
    gap_title: '⛰️ GPX 路線 GAP 配速分析',
    hint_gap_intro: '上傳賽事 GPX 並輸入平路目標配速，算出每公里坡度修正配速與爬升',
    gap_file: 'GPX 檔案',
    gap_pace: '平路目標配速 (m:ss/km)',
    gap_totaldist_label: '總距離',
    gap_ascent_label: '總爬升',
    gap_descent_label: '總下降',
    gap_predicted_label: '預估完賽配速',
    gap_splits_label: '每公里坡度修正配速',
    gap_maxhr: '最大心率 (可選)',
    gap_resthr: '靜息心率 (可選)',
    gap_hr_band_label: '建議耐力心率',
    gap_hr_note:
      '🍬 標記為補給時機（約 45 分起、每 30 分）；上坡心率易飆，以心率為上限、別追配速。',
    gap_ascent_col: '爬升',
    gap_gf_col: '係數',
    explain_gap:
      '上傳 GPX 後，系統用 haversine 算距離、逐段坡度套用 Minetti（2002）能量成本，預估在你「平路配速」的努力下各公里實際配速（上坡變慢、下坡變快）與總爬升。海拔資料可能有雜訊，數字僅供配速與補給策略參考；丘陵賽事可據此在陡坡保留體力。',
    re_title: '🏋️ 跑步經濟性 + 體組成',
    hint_re_intro: '由 5K 成績估 VO₂max、判讀體脂級距，給三層優化策略',
    re_5k: '5K 成績 (m:ss)',
    re_sex: '生理性別',
    re_sex_male: '男性',
    re_sex_female: '女性',
    re_bf: '體脂率 (%)',
    re_vo2max_label: '估計 VO₂max',
    re_band_label: '體脂級距',
    re_band_essential: '必需脂肪',
    re_band_athlete: '運動員',
    re_band_fitness: '健身',
    re_band_average: '一般',
    re_band_high: '偏高',
    re_strat_strength: '肌力訓練：重訓改善跑步經濟性約 2–8%（Beattie 2017）',
    re_strat_plyo: '增強式：跳躍／彈振，強化肌腱剛性與彈性回收',
    re_strat_bodycomp: '體組成：健康範圍內降低非功能性體重，改善功率體重比',
    explain_re:
      '由 5K 成績以 Daniels 引擎推估 VO₂max（即 VDOT）。體脂級距採 ACE 常用標準（男/女不同）。提升跑步經濟性三層：肌力訓練（重訓改善 RE 約 2–8%，Beattie 2017）、增強式（跳躍/彈振強化肌腱剛性）、體組成（在健康範圍內降低非功能性體重以改善功率體重比）。',
    hrv_title: '📈 HRV 訓練調整',
    hint_hrv_intro: '輸入晨起 RMSSD（逗號分隔 3–7 筆，最後一筆為今天）',
    hrv_input_label: '晨起 RMSSD',
    hrv_status_label: '今日狀態',
    hrv_baseline_label: '基線',
    hrv_today_label: '今日',
    hrv_band_label: '正常區間',
    hrv_cv_label: '變異係數',
    hrv_status_low: '🔻 偏低',
    hrv_status_normal: '✅ 正常',
    hrv_status_high: '🔺 偏高',
    hrv_advice_low: '副交感受抑制：改輕鬆跑或恢復，別硬上高強度。',
    hrv_advice_normal: '落在基線區間內：照原計畫訓練。',
    hrv_advice_high: '高於基線：多為良好適應、可安排品質課表；若伴隨疲勞可能是飽和，留意體感。',
    explain_hrv:
      '用晨起 7 日 RMSSD 算出個人基線（平均 ± 1 標準差）。今日落在區間內＝照計畫；明顯偏低＝副交感受抑制，改輕鬆/恢復；偏高＝多為良好適應，但也可能是飽和，留意身體訊號。變異係數（CV）越大代表越不穩定、宜保守（Plews 法）。',
    cycle_title: '🌸 月經週期訓練調整',
    hint_cycle_intro: '輸入週期第幾天與週期長度，給該階段訓練微調',
    cycle_day: '週期第幾天',
    cycle_length: '週期長度 (天)',
    cycle_phase_label: '目前階段',
    menstrual_phase_menstrual: '月經期',
    menstrual_phase_follicular: '濾泡期',
    menstrual_phase_ovulation: '排卵期',
    menstrual_phase_luteal: '黃體期',
    menstrual_advice_menstrual: '依症狀調整；不適就降量，無症狀可正常訓練。',
    menstrual_advice_follicular: '通常體感較佳、耐受度高，適合高品質與高強度課表。',
    menstrual_advice_ovulation: '力量常見高點；注意關節鬆弛、暖身充分。',
    menstrual_advice_luteal: '體溫升高、較易疲勞與不耐熱：加強補水與恢復，必要時降強度。',
    explain_cycle:
      '依週期分四階段給訓練微調。重要：McNulty 2020 系統綜述指出「個體差異遠大於群體效應」，所以這些只是起點，請以自身體感與症狀為準（黃體期常見體溫升高、較易疲勞與不耐熱，宜加強補水與恢復）。',
    alt_title: '🏔️ 海拔訓練規劃',
    hint_alt_intro: '輸入海拔、天數與每日時數，估 Hb mass / VO₂max 增益',
    alt_altitude: '海拔 (m)',
    alt_days: '天數',
    alt_hours: '每日高住時數',
    alt_protocol: '協議',
    alt_lhtl: 'LHTL 高住低練',
    alt_lhth: 'LHTH 高住高練',
    alt_ihe: 'IHE 間歇低氧',
    alt_status_label: '評估',
    alt_hours_label: '總曝露時數',
    alt_hbmass_label: 'Hb mass 增益',
    alt_vo2_label: 'VO₂max 增益',
    alt_status_good: '✅ 條件充足',
    alt_status_lowalt: '⚠️ 海拔不在 2000–3000m 有效區',
    alt_status_lowhours: '⚠️ 曝露時數不足',
    explain_alt:
      '有效「高住」窗約 2000–3000m；Hb mass 隨足量曝露時數上升（約每 100 有效小時 +1%，本工具上限 5%），VO₂max 增益約為 Hb 的 0.6 倍。賽事時機：常見建議下山後 1–2 天或 2–3 週後出賽、避開第 5–10 天。數字為估計、反應者差異大（Levine 1997；Wilber 2007；Chapman 2014）。',
    ref_title: '📚 科學實證與訓練原則',
    ref_intro: '本站工具方法論的依據與引用來源',
    ref_daniels:
      'Daniels VDOT 公式：Jack Daniels《Running Formula》— VO₂=−4.60+0.182258v+0.000104v²；被 RQ、VDOT Pro、Runalyze 等平台廣泛採用。',
    ref_seiler:
      'Seiler 80/20 極化訓練：菁英耐力選手約 80% 訓練在輕鬆區、20% 高強度；極化分布常勝過大量中強度（Seiler 2006/2013）。',
    ref_stellingwerff:
      'Stellingwerff 碳水補給：運動 >90 分鐘需 60–90 g/h 碳水（多種可轉運醣類）；近年超馬探索更高上限，需訓練腸道耐受（Stellingwerff & Cox 2014）。',
    ref_periard:
      '熱適應：10–14 天熱適應血漿容量 +10–12%、核心體溫下降，約 70–80% 效益在前 4–7 天取得（Périard 2015）。',
    ref_principles:
      '訓練原則：80/20 極化、每週里程增幅 ≤ 10%、硬日/輕鬆日交替、超過 60 分鐘運動每小時補碳水 30–60 g。',
    ref_resources:
      '延伸資源：RQ（訓練平台 + VDOT 分析）、Strava（GPS + 社群）；書籍：Daniels《Running Formula》、Fitzgerald《80/20 Running》。工具內各頁標註引用來源，可追 PubMed/PMC/原著。',
    ref_accuracy:
      '準確度與信任：屬「公式」者為教科書精確公式（VDOT、Tanaka/Gellish 最大心率、Karvonen、Minetti 坡度、Riegel、碳水 30–90 g/h、冰沙 7.5 g/kg、Mujika 減量），數值已用單元測試鎖定；屬「估算」者（高溫減速、汗率、步頻區間、恢復天數、海拔增益）為依文獻建立的合理模型，個體差異大，請當作起點而非保證。海拔/HRV/月經週期尤其因人而異。'
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
    school_label: 'Plan school',
    school_none: 'Auto',
    school_higdon: 'Higdon',
    school_pfitzinger: 'Pfitzinger',
    school_daniels: 'Daniels',
    school_desc_none: 'No school selected: uses difficulty or custom values (auto if all blank).',
    school_desc_higdon:
      'Higdon: approachable and gradual; moderate volume, simple structure — good for beginner–intermediate.',
    school_desc_pfitzinger:
      'Pfitzinger: higher mileage with medium-long runs and threshold work — for advanced time goals.',
    school_desc_daniels: 'Daniels: VDOT-paced and quality-focused, with moderate volume.',
    btn_export_csv: '⬇️ Export CSV',
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
    label_duration: 'Duration',
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
    settings_backend_url: 'Backend URL (Worker)',
    auth_title: '☁️ Account & Cloud Sync',
    hint_auth_intro:
      'Sign in with an email magic link to sync tool inputs and preferences across devices',
    auth_send_link: 'Send login link',
    auth_signed_in_as: 'Signed in',
    auth_logout: 'Sign out',
    auth_need_backend: 'Set the Backend URL (Worker) above first',
    auth_sending: 'Sending…',
    auth_link_sent: '✅ Login link sent — check your email (valid 15 min)',
    auth_error: '⚠️ Something went wrong, please try again later',
    auth_verifying: 'Verifying login…',
    auth_signed_in: '✅ Signed in',
    auth_logged_out_msg: 'Signed out',
    auth_synced: '☁️ Synced from the cloud',
    explain_auth:
      'Sign in with the magic link from your email (no password). Once signed in, your science/environment tool inputs and theme/language preferences are saved to your own cloud backend and synced across devices; signing out stops syncing. Set your self-hosted Worker "Backend URL" above first.',
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
    tri_total: 'Total',
    tab_environment: 'Environment & Fueling',
    hr_formula_gellish: 'Gellish',
    hr_compare_label: 'Formula comparison',
    cadence_title: '👟 Cadence Analysis',
    hint_cadence_intro:
      'Enter pace and current cadence for a sensible cadence band and +5/+10% targets',
    cadence_pace: 'Pace (m:ss/km)',
    cadence_current: 'Current cadence (optional)',
    cadence_band_label: 'Recommended band',
    cadence_stride_label: 'Stride length',
    cadence_plus5_label: '+5% target',
    cadence_plus10_label: '+10% target',
    cadence_advice_input:
      'Enter your current cadence to check for overstriding and get +5/+10% targets.',
    cadence_advice_over:
      '⚠️ Cadence looks low (possible overstride): try a slightly higher cadence with shorter steps.',
    cadence_advice_ok: '✅ Cadence is within the recommended band — keep it up.',
    explain_cadence:
      '180 spm is a myth: optimal cadence rises with speed and varies between runners. Raising cadence 5–10% shortens overstride and lowers per-step impact on the knee and Achilles (Heiderscheit 2011). A long stride (low cadence) is often a sign of overstriding.',
    strides_title: '🏃‍♂️💨 Strides',
    hint_strides_intro:
      'Pick a progression week to generate a strides session and the 12-week plan',
    strides_week_input: 'Progression week (1–12)',
    strides_progression_label: '12-week progression',
    strides_recovery: 'recovery',
    explain_strides:
      'Strides = ~15–30 s of controlled fast (not maximal) running with full recovery, 2–3×/week (after easy runs or before quality). They improve neuromuscular coordination and running economy (Daniels & Gilbert 1979; Blagrove 2018). This table progresses 4×15s → 8×30s over 12 weeks.',
    acwr_title: '🩹 Injury Risk (ACWR)',
    hint_acwr_intro:
      'Enter the last 4 weeks of mileage (last box = this week) for the acute:chronic ratio',
    acwr_w1: 'Week 1 (oldest)',
    acwr_w2: 'Week 2',
    acwr_w3: 'Week 3',
    acwr_w4: 'Week 4 (current)',
    acwr_acute_label: 'Acute (this week)',
    acwr_chronic_label: 'Chronic (4-wk avg)',
    acwr_rec_label: 'Next week target',
    acwr_zone_undertraining: 'Undertraining',
    acwr_zone_sweet: '✅ Sweet spot',
    acwr_zone_caution: '⚠️ Caution',
    acwr_zone_highrisk: '🚨 High risk',
    explain_acwr:
      'ACWR = this week’s mileage ÷ the recent 4-week average. Sweet spot ≈ 0.8–1.3; > 1.5 means a load spike with higher soft-tissue injury risk (Gabbett 2016); < 0.8 is usually undertraining or a return from a break. Use it to set next week’s mileage and avoid adding too much at once.',
    env_title: '🌡️ Environmental Pace',
    hint_env_intro:
      'Enter temperature, humidity and a base pace for dew point, WBGT and today’s real target pace',
    env_temp: 'Temperature (°C)',
    env_humidity: 'Humidity (%)',
    env_pace: 'Base pace (m:ss/km)',
    env_grade: 'Grade (%, optional)',
    env_risk_label: 'Heat stress',
    env_dewpoint_label: 'Dew point',
    env_wbgt_label: 'WBGT',
    env_heat_label: 'Heat slowdown',
    env_grade_label: 'Grade factor',
    env_adjusted_label: 'Suggested target pace',
    env_risk_low: '🟢 Low',
    env_risk_moderate: '🟡 Moderate',
    env_risk_high: '🟠 High',
    env_risk_extreme: '🔴 Extreme',
    explain_env:
      'Dew point and WBGT reflect how hard it is for your body to shed heat: in hot, humid air sweat evaporates poorly and pace must ease. This tool maps WBGT (ABM shade approximation) to a slowdown, and uses Minetti (2002) gradient energy cost for the grade factor. Taiwan summers often land in the High/Extreme band — slow to the suggested pace and hydrate more.',
    fuel_title: '🍫 Calories + Fueling Timeline',
    hint_fuel_intro:
      'Enter weight, distance and target finish time for kcal and a per-station plan',
    fuel_weight: 'Weight (kg)',
    fuel_dist: 'Distance',
    fuel_time: 'Target finish time',
    fuel_kcal_label: 'Total energy',
    fuel_carbrate_label: 'Carb rate',
    fuel_fluidrate_label: 'Fluid rate',
    fuel_totalcarb_label: 'Total carbs',
    fuel_timeline_label: 'Fueling timeline',
    explain_fuel:
      'Running burns ~1 kcal/kg/km. Events over 60 min need carbs on the move: ~30 g/h for 1–2 h, ~60 g/h for 2–2.5 h, up to ~90 g/h (multiple transportable carbs) beyond that; fluid ~500 ml/h. The table lays out per-station targets from your finish time (ACSM / Stellingwerff & Cox 2014).',
    sweat_title: '💦 Personalised Long-Run Fueling',
    hint_sweat_intro:
      'Estimate sweat rate from weight, pace, temp & humidity → per-station carbs/fluid/sodium',
    sweat_weight: 'Weight (kg)',
    sweat_pace: 'Pace (m:ss/km)',
    sweat_dist: 'Distance (km)',
    sweat_temp: 'Temperature (°C)',
    sweat_humidity: 'Humidity (%)',
    sweat_rate_label: 'Sweat rate',
    sweat_fluidrate_label: 'Fluid',
    sweat_sodiumrate_label: 'Sodium',
    sweat_carbrate_label: 'Carbs',
    sweat_timeline_label: 'Per-station plan',
    explain_sweat:
      'Sweat rate is derived from running heat: ~80% of energy becomes heat and evaporating 1 L of sweat sheds ~580 kcal; hot, humid air evaporates sweat poorly so more is lost (Périard 2015). Replace ~75% of losses (avoid over-drinking → hyponatraemia); sweat sodium ≈ 1 g/L. Pre/post weighing is still the most accurate method.',
    cool_title: '🧊 Pre-cooling Strategy',
    hint_cool_intro: 'Enter weight, temp and humidity to assess heat stress and get a cooling plan',
    cool_weight: 'Weight (kg)',
    cool_temp: 'Temperature (°C)',
    cool_humidity: 'Humidity (%)',
    cool_slurry_label: 'Ice slurry',
    cool_hydrate: 'Hydrate well and pre-hydrate',
    cool_shade: 'Stay in shade before the start; avoid sun',
    cool_colddrink: 'Drink cold fluids',
    cool_slurry: 'Ice slurry 30–60 min pre-race (~7.5 g/kg)',
    cool_icetowel: 'Ice towels on neck/wrists',
    cool_immersion: 'Cold-water immersion to lower core temp',
    cool_postpone: 'Extreme heat — consider slowing or postponing',
    explain_cool:
      'WBGT reflects heat stress; the higher it is, the more active cooling helps. An ice slurry (~7.5 g/kg body weight, 30–60 min pre-race) lowers core temperature and extends performance; add shade, cold drinks and ice towels in the heat, and consider cold-water immersion or postponing in the extreme (Siegel 2010; Périard 2015).',
    glyco_title: '🍚 Carbohydrate Loading',
    hint_glyco_intro: 'Enter weight and protocol for a daily pre-race carbohydrate schedule',
    glyco_weight: 'Weight (kg)',
    glyco_protocol: 'Protocol',
    glyco_modifiedSherman: 'Modified Sherman',
    glyco_classic: 'Classic (Bergström)',
    glyco_wa: 'WA 1-day',
    glyco_load_label: 'Loading dose',
    glyco_schedule_label: 'Daily schedule',
    glyco_peak: 'peak',
    glyco_raceday: 'Race day',
    glyco_train_normal: 'Normal training',
    glyco_train_easy: 'Easy',
    glyco_train_rest: 'Rest',
    glyco_train_race: 'Race',
    glyco_train_deplete: 'Deplete',
    explain_glyco:
      'For events over 90 min, raising carbs to 10–12 g/kg/day for 36–48 h pre-race tops up glycogen (Burke 2011). Modified Sherman: no depletion, taper + 3 high-carb days; Classic: deplete then load; WA: 1-day compressed load. Numbers are daily carbohydrate grams scaled to your weight.',
    taper_title: '📉 Pre-race Taper',
    hint_taper_intro: 'Enter peak weekly volume and taper length for a weekly volume reduction',
    taper_peak: 'Peak weekly km',
    taper_weeks: 'Taper weeks',
    taper_schedule_label: 'Weekly reduction',
    taper_raceweek: 'Race week',
    taper_weeksout_prefix: 'T-',
    explain_taper:
      'Taper = cut VOLUME, keep INTENSITY: reduce weekly mileage to 40–60% of peak over 1–3 weeks while holding training intensity and frequency, typically for a ~1–3% performance gain (Mujika 2010; Bosquet 2007 meta-analysis). The table shows the suggested weekly mileage.',
    rec_title: '🛌 Post-race Recovery',
    hint_rec_intro: 'Estimate personalised recovery days from distance, effort and age',
    rec_dist: 'Distance',
    rec_effort: 'Effort',
    rec_effort_easy: 'Easy',
    rec_effort_moderate: 'Moderate',
    rec_effort_hard: 'Hard',
    rec_effort_allout: 'All-out',
    rec_age: 'Age',
    rec_easy_label: 'Easy/recovery days',
    rec_beforehard_label: 'Before hard training',
    rec_days: 'days',
    rec_refuel: 'Refuel carbs + protein within 24 h',
    rec_rehydrate: 'Replace fluids and electrolytes',
    rec_sleep: 'Prioritise sleep',
    rec_active: 'Light activity / active recovery',
    rec_cwi: 'Cold-water immersion for soreness (optional)',
    explain_rec:
      'Recovery days scale with distance, effort and age (≈ 1 day/mile as a conservative ceiling). In the first 24 h prioritise carbs + protein, rehydration and sleep. Evidence: refuel/rehydrate/sleep are strongest, then active recovery; cold-water immersion (CWI) helps perceived soreness (Mujika 2010; Halson 2013; Ihsan 2016).',
    gap_title: '⛰️ GPX Route GAP Analysis',
    hint_gap_intro:
      'Upload a race GPX and a flat-ground target pace for per-km grade-adjusted pace and climb',
    gap_file: 'GPX file',
    gap_pace: 'Flat target pace (m:ss/km)',
    gap_totaldist_label: 'Total distance',
    gap_ascent_label: 'Total ascent',
    gap_descent_label: 'Total descent',
    gap_predicted_label: 'Predicted pace',
    gap_splits_label: 'Per-km grade-adjusted pace',
    gap_maxhr: 'Max HR (optional)',
    gap_resthr: 'Resting HR (optional)',
    gap_hr_band_label: 'Endurance HR band',
    gap_hr_note:
      '🍬 marks fueling points (~from 45 min, every 30 min); HR rises on climbs — cap by HR, don’t chase pace.',
    gap_ascent_col: 'Climb',
    gap_gf_col: 'Factor',
    explain_gap:
      'After upload, distance comes from haversine and per-segment gradient applies the Minetti (2002) energy cost to predict each kilometre’s real pace at your flat-ground effort (uphill slower, downhill faster), plus total climb. Elevation data can be noisy, so treat the numbers as pacing/fuelling guidance; on hilly courses use it to save energy on steep climbs.',
    re_title: '🏋️ Running Economy + Body Composition',
    hint_re_intro: 'Estimate VO₂max from a 5K, classify body-fat %, and get a three-layer strategy',
    re_5k: '5K time (m:ss)',
    re_sex: 'Sex',
    re_sex_male: 'Male',
    re_sex_female: 'Female',
    re_bf: 'Body fat (%)',
    re_vo2max_label: 'Estimated VO₂max',
    re_band_label: 'Body-fat band',
    re_band_essential: 'Essential',
    re_band_athlete: 'Athlete',
    re_band_fitness: 'Fitness',
    re_band_average: 'Average',
    re_band_high: 'High',
    re_strat_strength: 'Strength: heavy resistance improves running economy ~2–8% (Beattie 2017)',
    re_strat_plyo: 'Plyometrics: jumps/bounding build tendon stiffness and elastic return',
    re_strat_bodycomp:
      'Body composition: trim non-functional weight within a healthy range to improve power-to-weight',
    explain_re:
      'VO₂max is estimated from your 5K via the Daniels engine (i.e. VDOT). Body-fat bands use common ACE standards (sex-specific). Three layers to improve running economy: strength training (heavy resistance improves RE ~2–8%, Beattie 2017), plyometrics (jumps/bounding for tendon stiffness), and body composition (lower non-functional weight within a healthy range to improve power-to-weight).',
    hrv_title: '📈 HRV-guided Training',
    hint_hrv_intro: 'Enter morning RMSSD readings (comma-separated, 3–7, last = today)',
    hrv_input_label: 'Morning RMSSD',
    hrv_status_label: "Today's status",
    hrv_baseline_label: 'Baseline',
    hrv_today_label: 'Today',
    hrv_band_label: 'Normal band',
    hrv_cv_label: 'Coeff. of variation',
    hrv_status_low: '🔻 Suppressed',
    hrv_status_normal: '✅ Normal',
    hrv_status_high: '🔺 Elevated',
    hrv_advice_low: 'Parasympathetic suppression: switch to easy/recovery, don’t force intensity.',
    hrv_advice_normal: 'Within your baseline band: train as planned.',
    hrv_advice_high:
      'Above baseline: usually good adaptation and fine for quality work; if paired with fatigue it may be saturation — watch how you feel.',
    explain_hrv:
      'A 7-day series of morning RMSSD builds a personal baseline (mean ± 1 SD). Today inside the band = proceed; clearly below = parasympathetic suppression, go easy/recovery; above = usually good adaptation but can be saturation, so check how you feel. A higher coefficient of variation (CV) means less stability — be conservative (Plews method).',
    cycle_title: '🌸 Menstrual-Cycle Adjustment',
    hint_cycle_intro: 'Enter cycle day and length for phase-based training micro-adjustments',
    cycle_day: 'Cycle day',
    cycle_length: 'Cycle length (days)',
    cycle_phase_label: 'Current phase',
    menstrual_phase_menstrual: 'Menstrual',
    menstrual_phase_follicular: 'Follicular',
    menstrual_phase_ovulation: 'Ovulation',
    menstrual_phase_luteal: 'Luteal',
    menstrual_advice_menstrual:
      'Adjust to symptoms; ease off if uncomfortable, train normally if asymptomatic.',
    menstrual_advice_follicular:
      'Often feel strong with good tolerance — a good window for quality/high-intensity work.',
    menstrual_advice_ovulation: 'Strength often peaks; mind joint laxity and warm up well.',
    menstrual_advice_luteal:
      'Higher core temp, more fatigue and heat sensitivity: hydrate and recover more, ease intensity if needed.',
    explain_cycle:
      'Four phases give a training micro-adjustment. Important: McNulty 2020 (systematic review) found individual variation far outweighs the group effect, so treat these as a starting point and go by your own body and symptoms (the luteal phase commonly raises core temperature, fatigue and heat sensitivity — hydrate and recover more).',
    alt_title: '🏔️ Altitude Training Planner',
    hint_alt_intro: 'Enter altitude, days and hours/day to estimate Hb-mass / VO₂max gains',
    alt_altitude: 'Altitude (m)',
    alt_days: 'Days',
    alt_hours: 'Live-high hours/day',
    alt_protocol: 'Protocol',
    alt_lhtl: 'LHTL (live high, train low)',
    alt_lhth: 'LHTH (live high, train high)',
    alt_ihe: 'IHE (intermittent hypoxia)',
    alt_status_label: 'Verdict',
    alt_hours_label: 'Total exposure hours',
    alt_hbmass_label: 'Hb-mass gain',
    alt_vo2_label: 'VO₂max gain',
    alt_status_good: '✅ Adequate',
    alt_status_lowalt: '⚠️ Altitude outside the 2000–3000 m window',
    alt_status_lowhours: '⚠️ Not enough exposure hours',
    explain_alt:
      'The effective "live-high" window is ~2000–3000 m; Hb mass rises with adequate exposure (~+1% per 100 effective hours, capped at 5% here) and VO₂max gains track Hb mass at ~0.6×. Race timing: common advice is to race in the first 1–2 days after descent or after ~2–3 weeks, avoiding days 5–10. Numbers are estimates and responders vary widely (Levine 1997; Wilber 2007; Chapman 2014).',
    ref_title: '📚 Science & Training Principles',
    ref_intro: 'The methodology behind these tools, with sources',
    ref_daniels:
      'Daniels VDOT formula: Jack Daniels, "Running Formula" — VO₂=−4.60+0.182258v+0.000104v²; widely adopted by RQ, VDOT Pro, Runalyze and others.',
    ref_seiler:
      'Seiler 80/20 polarised training: elite endurance athletes spend ~80% of training easy and 20% hard; a polarised distribution often beats lots of moderate work (Seiler 2006/2013).',
    ref_stellingwerff:
      'Stellingwerff carbohydrate fueling: exercise > 90 min needs 60–90 g/h carbs (multiple transportable); recent ultra research explores higher ceilings that require gut training (Stellingwerff & Cox 2014).',
    ref_periard:
      'Heat adaptation: 10–14 days raises plasma volume +10–12% and lowers core temperature, with ~70–80% of the benefit in the first 4–7 days (Périard 2015).',
    ref_principles:
      'Principles: 80/20 polarisation, weekly mileage increase ≤ 10%, alternate hard/easy days, and 30–60 g/h carbs for exercise over 60 minutes.',
    ref_resources:
      'Further resources: RQ (training platform + VDOT analysis), Strava (GPS + community); books: Daniels "Running Formula", Fitzgerald "80/20 Running". Each tool cites its sources (traceable to PubMed/PMC/original works).',
    ref_accuracy:
      'Accuracy & trust: items marked "formula" are exact textbook formulas (VDOT, Tanaka/Gellish max-HR, Karvonen, Minetti grade, Riegel, 30–90 g/h carbs, 7.5 g/kg ice slurry, Mujika taper) and are locked by unit tests; items marked "estimate" (heat slowdown, sweat rate, cadence band, recovery days, altitude gains) are literature-grounded models with large individual variation — treat them as a starting point, not a guarantee. Altitude/HRV/menstrual responses especially vary by person.'
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

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

// Public backend/race-API URLs baked in at build time from GitHub Actions
// *Variables* (esbuild `define` in scripts/build.mjs). `typeof` guards keep this
// safe under tsc/tests where the tokens are undefined → fall back to ''.
declare const __GAS_API_URL__: string | undefined;
declare const __BACKEND_URL__: string | undefined;
export const INJECTED_GAS_API_URL = typeof __GAS_API_URL__ !== 'undefined' ? __GAS_API_URL__ : '';
export const INJECTED_BACKEND_URL = typeof __BACKEND_URL__ !== 'undefined' ? __BACKEND_URL__ : '';

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
  gasApiUrl: INJECTED_GAS_API_URL,
  backendUrl: INJECTED_BACKEND_URL,
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
    tab_pace: '配速與分析',
    tab_triathlon: '鐵人三項',
    tab_training: '訓練課表',
    tab_races: '賽事列表',
    tab_assessment: '科學評估',
    tab_workout: '課表設計',
    tab_monitoring: '監控與適應',
    tab_settings: '系統設定',
    allraces_title: '🗓️ 全部賽事',
    allraces_hint: '來源：運動筆記＋馬拉松世界,每日自動更新;點 ↗ 開啟賽事頁。',
    allraces_search_ph: '搜尋名稱／地點／日期',
    allraces_count: '顯示 {shown} / 共 {total} 場',
    allraces_empty: '尚無賽事資料（後端尚未抓取或未設定後端 URL）。',
    allraces_month_all: '全部月份',
    allraces_region_all: '全部地點',
    allraces_distance_all: '全部距離',
    allraces_dist_full: '全馬',
    allraces_dist_half: '半馬',
    allraces_dist_10k: '10K',
    allraces_dist_5k: '5K',
    allraces_dist_ultra: '超馬',
    allraces_upcoming_only: '只看即將',
    allraces_unclassified: '未分類',
    allraces_no_match: '沒有符合條件的賽事',
    allraces_today: '今天',
    allraces_past: '已結束',
    allraces_in_days: '{n} 天後',
    allraces_updated: '資料更新於 {date}',
    allraces_reg_close: '報名截止 {date}',
    allraces_reg_open: '報名中',
    allraces_reg_closing: '即將截止',
    allraces_reg_closed: '已截止',
    footer_tagline: '🏃 RunningPaceNote · 為跑者用 ❤️ 打造',
    version_latest: '✓ 已是最新版',
    version_update: '● 有新版，點此更新',
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
    hr_max_optional: '實測最大心率 (可選, bpm)',
    hr_formula: '最大心率公式',
    hr_formula_tanaka: 'Tanaka (建議)',
    hr_formula_fox: '220 − 年齡',
    hr_maxhr: '最大心率',
    hr_vo2max: '估計 VO₂max',
    interval_title: '⚡ 間歇課表產生器',
    hint_interval_intro: '依 VDOT（科學評估分頁）與週里程，產生結構化間歇課表',
    interval_weekly: '週里程 (km)',
    interval_type: '課表類型',
    interval_type_i: 'I 間歇 (VO₂max)',
    interval_type_t: 'T 節奏 (閾值)',
    interval_type_r: 'R 重複 (速度)',
    interval_goal: '目標賽事',
    interval_goal_any: '不指定',
    interval_goal_5k: '5K',
    interval_goal_10k: '10K',
    interval_goal_half: '半馬',
    interval_goal_full: '全馬',
    interval_phase: '訓練階段',
    interval_phase_quality: '質量期',
    interval_phase_base: '基礎期',
    interval_phase_peak: '巔峰期',
    interval_qdays: '每週質量天數',
    interval_warmup: '暖身',
    interval_cooldown: '緩和',
    interval_total: '總計',
    interval_capped: '已依週量上限調整組數',
    interval_need_vdot: '請先到「科學評估」分頁的 VDOT 區輸入賽事成績',
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
    zones_readout:
      '採 80/20：約 8 成里程放在 E 輕鬆跑，2 成做 T/I/R 質量；輕鬆跑「真的要慢」，質量課表才有品質。更精準請用 VDOT 分頁。',
    detail_zones_principle:
      '不同配速刺激不同生理系統：慢跑強化有氧基礎與恢復，閾值提升乳酸耐受，間歇逼近 VO₂max。把訓練分成幾個強度區，才能「該慢的慢、該快的快」，避免全部都跑成中等強度。',
    detail_zones_how:
      '這些區間由你目前的配速推估（更精準可改用 VDOT 分頁）。多數里程放在 E；T/I/R 等質量課表合計約佔週里程 8–10%。採 80/20：約 8 成輕鬆、2 成高強度。',
    detail_zones_stages:
      'E 有氧打底／恢復（量最多、可對話）；M 馬拉松特定配速；T 乳酸閾值（可維持約 20–40 分）；I VO₂max 間歇（3–5 分反覆）；R 重複跑（短而快，練速度與跑姿）。',
    detail_zones_note:
      '由單一配速線性推估，僅供方向參考；正式課表建議以近期成績的 VDOT 為準。輕鬆跑「真的要慢」——多數人 E 跑太快，反而累積疲勞、擠壓質量課表品質。',
    explain_predict:
      '以一個近期成績用 Riegel 公式（時間 × 距離比^1.06）推估其他距離；參考距離與目標距離越接近越準。',
    pred_readout:
      '參考距離與目標越接近越準；距離跨越越大（尤其推全馬）通常偏樂觀，請當「理想上限」看待。',
    detail_pred_principle:
      'Riegel 公式 T2＝T1×(D2/D1)^1.06：在體能固定下，時間隨距離以次冪成長；指數 1.06 反映長距離的「耐力衰減」。',
    detail_pred_how:
      '輸入一筆近期、盡力的成績（參考距離與目標越接近越準）。看四個距離的預估時間，據此設定目標與配速。',
    detail_pred_stages:
      '5K↔10K 互推最準；推半馬尚可；推全馬偏樂觀（耐力、補給、肌耐力另外決定），宜當上限參考。',
    detail_pred_note:
      '假設你的訓練量足以支撐該距離；長距離若里程不足會明顯慢於預估。當天狀態、賽道、天氣都會影響。',
    tri_seg_swim: '游泳',
    tri_seg_bike: '自行車',
    tri_seg_run: '跑步',
    tri_readout:
      '總時間 {total}；游 {swim}、騎 {bike}、跑 {run}。把訓練重點放在佔比高且可進步的段落。',
    detail_tri_principle:
      '鐵人成績是三項加兩次轉換的總和；配速分配與轉換效率都影響總時間。下方依各段時間佔比視覺化，幫你看出時間花在哪。',
    detail_tri_how:
      '選距離，輸入目標總時間自動反推各段；或直接填各段配速得到總時間。把訓練重點放在耗時最多、最易進步的項目（多為自行車與跑步）。',
    detail_tri_stages:
      '游泳（定位、節省力氣）→T1→自行車（最長、補給主場）→T2→跑步（疲勞下維持）。轉換雖短，慌亂與失誤易失分，值得演練。',
    detail_tri_note:
      '反推假設典型分配比例，個人強弱項差異大，務必依自身三項能力調整。長距離鐵人自行車若太猛，跑步會崩。',
    detail_raceplan_principle:
      '把目標完賽時間依策略分配到每公里。最關鍵是「別起步過快」：正分段（前快後掉）最常見、也最傷成績；越強的跑者配速越平穩（March 2011）。菁英多以接近均速、略為負分段創紀錄（Kipchoge 柏林 2018、Kiptum 芝加哥 2023 後半都更快；Díaz 2018：世界紀錄多為均速）。實戰：前段略保守、中段守目標、末段行有餘力再加速。下方曲線為每公里配速。',
    detail_raceplan_how:
      '選距離、輸入目標時間與策略，得到每公里配速與累積時間。比照曲線控速：前 ~1/4 刻意慢 5–10 秒/km、中段守目標、末 ~1/4 行有餘力再快 5–15 秒/km。重點不是「前半慢」，而是別被現場腎上腺素騙去跑「感覺輕鬆卻偏快」的前半。',
    detail_raceplan_stages:
      '起步保守（別衝）→中段守目標配速、規律補給→全馬約 30k 易撞牆→末段行有餘力再加速。',
    detail_raceplan_note:
      '配速只是計畫，需與體感、心率、天氣動態調整；高溫或丘陵請改用「環境配速」與「GAP」修正預期。',
    gap_readout:
      '總距離 {dist} km、爬升 +{ascent} m；在你的平路努力下預估完賽配速約 {pace}。陡坡保留體力、約每 30 分補給。',
    detail_gap_principle:
      '用 haversine 算距離、逐段坡度套用 Minetti（2002）能量成本，把「平路配速的努力」換算成各段實際配速：上坡變慢、下坡略快但有限。',
    detail_gap_how:
      '上傳賽道 GPX、填平路目標配速（可填心率）。看高程圖與每公里修正配速，在陡坡保留體力、依時間軸補給。',
    detail_gap_stages:
      '上坡（降速、縮步，以努力／心率為準）→頂點（別急著追）→下坡（放鬆但控制、別過度衝擊）→補給（約 45 分起、每 30 分）。',
    detail_gap_note:
      '海拔資料常有雜訊，數字僅供策略參考；實際受風、路面、疲勞影響。下坡省的時間通常少於上坡損失，淨爬升越多越慢。',
    re_readout:
      '估計 VO₂max {vo2}、體脂級距 {band}。先練肌力與增強式改善經濟性，體組成在健康範圍內微調。',
    detail_re_principle:
      '由 5K 成績以 Daniels 引擎推估 VO₂max。跑步經濟性指「同樣速度更省氧」，與 VO₂max、乳酸閾值並列耐力三支柱；體組成影響功率體重比。',
    detail_re_how:
      '輸入 5K 成績、生理性別與體脂率。看 VO₂max 與體脂級距，再依下方三層策略安排訓練：肌力、增強式、體組成。',
    detail_re_stages:
      '① 肌力訓練（重訓改善 RE 約 2–8%，Beattie 2017）② 增強式（跳躍／彈振強化肌腱剛性）③ 體組成（健康範圍內優化功率體重比）。',
    detail_re_note:
      'VO₂max 為由成績推估非實測；體脂級距採 ACE 標準、個體差異大。減重勿過度，過低體脂反而傷害表現與健康。',
    detail_interval_principle:
      '間歇＝高強度區間與恢復交替，以最少時間累積最多目標強度刺激。I 練 VO₂max、T 練乳酸閾值、R 練速度與跑姿。',
    detail_interval_how:
      '先在「VDOT」或上方填好成績取得配速，輸入週里程與類型。系統把單次質量里程限制在 min(10km, 週量 8%) 內；課表＝暖身＋主課表＋緩和。',
    detail_interval_stages:
      '暖身（漸進、帶幾趟 strides）→主課表（按配速與恢復反覆）→緩和（輕鬆跑收操）。恢復別偷跑太快，品質重於數量。',
    detail_interval_note:
      '質量課表每週至多 2–3 次、與輕鬆日交替；配速以能完成全部反覆為準，跑崩代表設太快。傷痛或大疲勞先跳過。',
    detail_methods_principle:
      '名師訓練法是把訓練原理打包成可操作的關鍵課表。各法側重不同：成績預測、VO₂max、累積疲勞、嚴格控速的雙閾值。',
    detail_methods_how:
      '輸入目標全馬時間，選一種方法看關鍵課表與配速。挑一個與你目標與可投入時間相符的長期執行，別每週亂換。',
    detail_methods_stages:
      'Yasso 800（以 800m 反覆預估全馬）、挪威 4×4（4×4 分鐘 VO₂max）、Hansons（累積疲勞、長跑不過量）、挪威雙閾值（同日兩次閾值、嚴格控速）。',
    detail_methods_note:
      '這些是「關鍵課表」非完整週計畫，需嵌入有輕鬆跑與長跑的週期。雙閾值對業餘者的強度控管要求高，務必循序漸進。',
    detail_strides_principle:
      'Strides 是約 15–30 秒「可控的快」（非衝刺），組間完全恢復。在低疲勞下改善神經肌肉協調與跑步經濟性（Daniels & Gilbert 1979；Blagrove 2018）。',
    detail_strides_how:
      '選進度週看當週課表；一週插入 2–3 次（輕鬆跑後或質量課表前）。加速段要放鬆、由慢漸快、不衝線，恢復走或慢跑到完全回復。',
    detail_strides_stages:
      '由 4×15s 漸增到 8×30s（下方長條為各週總時長）。先建立頻率與技術，再逐步加趟數與時長。',
    detail_strides_note:
      '強度是「快但放鬆」非全力衝刺；場地平整、避免在疲勞下硬做。傷痛初期或恢復期可降量。',
    detail_cadence_principle:
      '合理步頻隨速度變化、因人而異（180 SPM 是迷思）。提高步頻 5–10% 可縮短跨步、降低膝與跟腱的單步衝擊（Heiderscheit 2011）。',
    detail_cadence_how:
      '輸入配速（可填目前步頻）。看建議區間與 +5%/+10% 目標；若步幅過大（步頻偏低）代表過度跨步，可循序提頻。下方儀表顯示你目前步頻落在建議帶的位置。',
    detail_cadence_stages:
      '漸進提頻：每 2–4 週 +5%，用節拍器或音樂輔助；先在輕鬆跑練熟，再帶入質量課表。',
    detail_cadence_note:
      '步頻非越高越好，過高反增能耗；以「落地在重心下方、不過度跨步」為原則。改變跑姿循序漸進，避免代償受傷。',
    explain_triathlon:
      '輸入目標總時間會依賽事類型自動反推游/騎/跑分段配速；也可直接填各段配速得到總時間。T1/T2 為轉換區時間。',
    explain_training_cycle:
      '計畫分期：基礎→進展→巔峰→減量→比賽週；每 4 週安排一次減量恢復週。里程與配速隨分期自動調整。選派別後每日課表會依該流派差異化（Higdon 親民、Pfitzinger 中長跑+閾值、Daniels VDOT 質量輪換）。',
    explain_plan_config:
      '難度（初/進/菁英）會自動帶入建議的週數與起始/巔峰週里程；想自訂可直接改數字，全部留白則依賽事日期與目前配速自動推算。',
    explain_raceplan:
      '策略：均速（保守穩定）；負分段（前保守、末加速，菁英與多數世界紀錄的型態）；正分段（前快後掉，最常見也最傷成績）。關鍵：起步勿過快。表格為每公里目標配速與累積時間；約 30k 易撞牆、依表補給。',
    explain_vdot:
      'VDOT 是由近期成績推估的「有效 VO₂max」，數字越大代表體能越好。下方 E/M/T/I/R 是對應訓練配速，等效成績是相同體能下各距離的預估成績。',
    btn_detail: '詳解',
    detail_h_principle: '原理',
    detail_h_how: '怎麼用',
    detail_h_stages: '階段',
    detail_h_note: '注意',
    detail_h_refs: '參考文獻',
    vdot_grade_beginner: '入門',
    vdot_grade_recreational: '休閒跑者',
    vdot_grade_intermediate: '進階',
    vdot_grade_advanced: '高階',
    vdot_grade_elite: '菁英',
    vdot_readout:
      '你的 VDOT {v}（{grade}）。先把輕鬆量堆起來，再加質量：E 打底、T 練閾值、I 練 VO₂max。',
    detail_vdot_principle:
      'VDOT 由近期賽事成績反推「有效 VO₂max」，整合配速與可維持時間，是把體能換算成個人化訓練配速的單一指標（Daniels–Gilbert 公式）。',
    detail_vdot_how:
      '輸入一筆近期、盡力跑出的比賽成績（距離越接近目標越準）。系統給出 E/M/T/I/R 五種訓練配速與各距離等效成績，據此安排課表並設定合理目標。',
    detail_vdot_stages:
      'E 有氧打底／恢復（量最多）；M 馬拉松配速；T 乳酸閾值（可維持約 20–40 分）；I VO₂max 間歇（3–5 分）；R 速度與跑姿（短而快）。由易到難、量由多到少。',
    detail_vdot_note:
      '由單筆成績推估，當天狀態、天氣、賽道都會影響；跨距離預測越遠越保守看待。每週質量課表（T/I/R）合計別超過週里程約 8–10%。',
    explain_hr:
      '先用 Tanaka 公式（208−0.7×年齡）或實測值估最大心率，再以 Karvonen（心率儲備）分成五區，各區對應不同訓練目的。VO₂max 為由最大/靜息心率比值推估（非實測）。',
    hr_readout:
      '最大心率約 {max} bpm、靜息 {rest} bpm。輕鬆日把心率壓在 E/M 區，質量日才進 T/I 區；以心率為上限控強度，別在熱天或疲勞時硬追配速。',
    detail_hr_principle:
      '最大心率以 Tanaka（208−0.7×年齡）或你的實測值估算，再用 Karvonen「心率儲備」＝（最大−靜息）×強度＋靜息，分出五個訓練區。比單純用 220−年齡更貼近個人。',
    detail_hr_how:
      '輸入年齡與晨起靜息心率（有實測最大心率更準）。輕鬆日把心率壓在 E/M 區，質量日才進 T/I 區；以心率為「上限」控制強度，熱天、疲勞時同配速心率會偏高。',
    detail_hr_stages:
      'E 恢復／有氧（RPE 2–3，可輕鬆對話）；M 馬拉松（RPE 4–5）；T 閾值（RPE 6–7，吃力但可維持）；I VO₂max（RPE 8–9，僅能講短句）；R 最大速度（RPE 10）。',
    detail_hr_note:
      '公式估算非實測；個體差異大，最準是實驗室或場測最大心率。心率有延遲（短間歇看配速更可靠）；咖啡因、缺水、睡眠不足都會墊高心率。',
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
    workout_medlong: '中長跑',
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
    tri_t1_time: 'T1 轉換 (m:ss)',
    tri_bike_speed: '單車時速 (km/h)',
    tri_t2_time: 'T2 轉換 (m:ss)',
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
    cadence_current: '目前步頻 (可選, spm)',
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
    strides_need_vdot: '（到 VDOT／間歇填成績可得配速）',
    explain_strides:
      'Strides＝約 15–30 秒「可控的快」（非衝刺），組間完全恢復，一週插入 2–3 次（輕鬆跑後或質量課表前）。改善神經肌肉協調與跑步經濟性（Daniels & Gilbert 1979；Blagrove 2018）。本表為 12 週漸進：4×15s → 8×30s。',
    acwr_title: '🩹 傷害風險 (ACWR)',
    hint_acwr_intro: '輸入最近 4 週里程（最後一欄為本週），算出急慢性負荷比',
    acwr_w1: '第 1 週 (最舊, km)',
    acwr_w2: '第 2 週 (km)',
    acwr_w3: '第 3 週 (km)',
    acwr_w4: '第 4 週 (本週, km)',
    acwr_acute_label: '急性 (本週)',
    acwr_chronic_label: '慢性 (4週均)',
    acwr_rec_label: '下週建議里程',
    acwr_zone_undertraining: '訓練不足',
    acwr_zone_sweet: '✅ 甜蜜區',
    acwr_zone_caution: '⚠️ 注意',
    acwr_zone_highrisk: '🚨 高風險',
    explain_acwr:
      'ACWR＝本週里程÷近 4 週平均。甜蜜區約 0.8–1.3；>1.5 代表負荷暴增，軟組織傷害風險上升（Gabbett 2016）；<0.8 多為訓練不足或剛回歸。據此調整下週里程，避免一次加太多。',
    acwr_readout: 'ACWR {acwr}（{zone}）。下週里程建議 {min}–{max} km；單週增幅盡量別超過約 10%。',
    acwr_strength: '每週肌力訓練',
    acwr_shoes: '輪替 2+ 雙跑鞋',
    acwr_opt_no: '否',
    acwr_opt_yes: '是',
    acwr_mag_low: '量偏低：傷害風險低，但體能進展有限。',
    acwr_mag_optimal: '甜蜜區：傷害風險約基準水準。',
    acwr_mag_elevated: '風險升高：留意疲勞與痠痛。',
    acwr_mag_high: '負荷暴增：軟組織傷害風險約 2–4 倍（Gabbett 2016）。',
    acwr_mag_extreme: 'ACWR > 2.0：傷害風險約 4.5 倍（Hulin 2014），強烈建議減量。',
    acwr_protect_strength_on: '✅ 你有肌力訓練：可降低約 50% 傷害（Lauersen 2014）。',
    acwr_protect_strength_off: '➕ 每週 2–3 次肌力訓練可降約 50% 傷害（Lauersen 2014）。',
    acwr_protect_shoes_on: '✅ 你有輪替跑鞋：可降約 39% 傷害（Malisoux 2015）。',
    acwr_protect_shoes_off: '➕ 輪替 2+ 雙不同跑鞋可降約 39% 傷害（Malisoux 2015）。',
    detail_acwr_principle:
      'ACWR＝急性負荷（本週里程）÷慢性負荷（近 4 週平均）。它衡量「最近的訓練量相對於身體已適應的量」漲得多快——漲太快，軟組織來不及適應，受傷風險就上升（Gabbett 2016）。',
    detail_acwr_how:
      '填入最近 4 週的週里程（最後一欄為本週）。比值落在甜蜜區（約 0.8–1.3）較安全；參考「下週建議里程」漸進加量，單週增幅盡量別超過約 10%。',
    detail_acwr_stages:
      '<0.8 訓練不足／剛回歸（量偏低）；0.8–1.3 甜蜜區（穩健進步）；1.3–1.5 警戒（留意疲勞與痠痛）；>1.5 高風險（負荷暴增，建議減量）。',
    detail_acwr_note:
      '里程只是負荷的一種代理；強度、地形、睡眠與壓力同樣重要。ACWR 是趨勢參考非保證，務必結合自身體感與疼痛訊號。',
    env_title: '🌡️ 環境配速調整',
    hint_env_intro: '選模式，輸入氣溫、濕度、配速與熱適應程度，算出露點、WBGT 與目標／等效配速',
    env_mode: '模式',
    env_mode_forward: '預測（目標→熱天配速）',
    env_mode_reverse: '反推（熱天實際→涼天等效）',
    env_temp: '氣溫 (°C)',
    env_humidity: '相對濕度 (%)',
    env_pace: '配速 (m:ss/km)',
    env_grade: '坡度 (%, 可選)',
    env_acclim: '熱適應程度',
    env_acclim_none: '未適應',
    env_acclim_partial: '部分（約 1 週）',
    env_acclim_full: '已適應（10–14 天）',
    env_risk_label: '熱壓力等級',
    env_dewpoint_label: '露點',
    env_wbgt_label: 'WBGT',
    env_heat_label: '高溫減速',
    env_grade_label: '坡度係數',
    env_adjusted_label: '建議目標配速',
    env_result_rev: '涼天等效配速',
    env_risk_low: '🟢 低',
    env_risk_moderate: '🟡 中等',
    env_risk_high: '🟠 高',
    env_risk_extreme: '🔴 極端',
    explain_env:
      '露點與 WBGT 反映身體散熱難度：高溫高濕下汗水難蒸發，配速需放慢。本工具用 WBGT（ABM 陰影近似）對應減速幅度，並用 Minetti（2002）坡度能量成本換算坡度係數。台灣夏天常落在「高/極端」區，務必依建議配速放慢並加強補水。',
    env_readout:
      'WBGT {wbgt}°C（{risk}）：建議比平路放慢約 {pct}%、目標約 {pace}，並每 15–20 分鐘補水、多走陰涼處。',
    env_readout_reverse:
      'WBGT {wbgt}°C（{risk}）：此熱度／坡度約使配速慢 {pct}%；你的表現相當於涼天平路約 {pace}。',
    env_sweat_warn: '⚠️ 脫水流失逾體重 2% 即開始影響表現，請提早、規律補水與電解質。',
    detail_env_principle:
      '人體靠流汗蒸發散熱。高溫高濕（露點高）時汗水不易蒸發，核心體溫上升、心率攀高，同樣配速會更吃力。WBGT 綜合溫濕度評估熱壓力，越高越需放慢（ABM 陰影近似）。',
    detail_env_how:
      '「預測」模式：輸入平路涼天目標配速，得熱天/坡地建議配速。「反推」模式：輸入熱天實際跑出的配速，回推涼天平路等效配速（評估真實體能）。並選「熱適應程度」：已適應者高溫減速幅度較小（Périard 2015）。依結果放慢、別硬追原訂配速；以體感與心率為準，提早、規律補水與電解質。',
    detail_env_stages:
      'WBGT <18 低（影響小）；18–23 中（略放慢、注意補水）；23–28 高（明顯放慢、找陰涼、增加補給）；>28 極端（大幅放慢，考慮改時段／縮短／取消）。',
    detail_env_note:
      '為陰影近似，烈日直曬、無風或柏油路面會更嚴峻。熱適應約需 7–14 天（Périard 2015），尚未適應者更保守。脫水流失逾體重 2% 即開始影響表現，務必提早規律補水。出現頭暈、起雞皮疙瘩、停止流汗等中暑徵兆務必立即停下。',
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
    glyco_dist: '賽事距離',
    glyco_dist_full: '全馬',
    glyco_dist_half: '半馬',
    glyco_dist_10k: '10K',
    glyco_dist_5k: '5K',
    glyco_dist_ultra: '超馬',
    glyco_time: '目標時間 (選填)',
    glyco_notneeded: '此距離通常 <90 分鐘，肝醣超補幫助不大；正常飲食＋賽前餐即可。',
    glyco_prerace: '賽前 1–4 小時：約 {lo}–{hi} g 碳水（好消化、低纖低脂）',
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
    rec_refuel: '24h 內補碳水＋蛋白質（蛋白 1.6–2.0 g/kg/天 × 24–48h）',
    rec_rehydrate: '補回水分與電解質',
    rec_sleep: '優先充足睡眠（9–10 小時）',
    rec_active: '輕鬆活動／主動恢復',
    rec_cwi: '冷水浸泡 15°C × 10–15 分鐘舒緩痠痛（選用）',
    rec_massage: '按摩可緩解延遲性痠痛（效益中等）',
    rec_nsaid: '非必要少用 NSAIDs；除非痛到影響睡眠',
    rec_time: '完賽時間 (選填)',
    explain_rec:
      '恢復天數隨距離、費力、年齡與完賽時間增加（約 1 天/英里為保守上限）。賽後 24 小時黃金窗：補碳水＋蛋白質（1.6–2.0 g/kg/天）、補水、睡眠 9–10 小時。冷水浸泡與按摩對主觀疲勞有益（CWI 可能鈍化長期適應）；NSAIDs 非必要少用（Morton 2018；Halson 2014；Ihsan 2016；Dupuy 2018；Schoenfeld 2012）。',
    fuel_readout:
      '全程約 {kcal} kcal。超過 60 分鐘需邊跑邊補：約 {carb} g/h 碳水、{fluid} ml/h 水分，全程共約 {total} g 碳水。提早、少量多次補給。',
    detail_fuel_principle:
      '跑步每公里約消耗體重×1 kcal。肝醣存量約僅夠 90–120 分鐘高強度，超過就得邊跑邊補碳水以延後「撞牆」。補碳速率隨時間拉長而提高，並需搭配水分維持血量與散熱。',
    detail_fuel_how:
      '輸入體重、距離與目標完賽時間，得到每小時碳水/水分速率與每站建議量。比照下方時間軸，提早、少量多次補給，別等餓了或渴了才補；長賽事務必先在訓練中演練腸胃耐受。',
    detail_fuel_stages:
      '<60 分鐘：通常免補；1–2 小時：約 30 g/h；2–2.5 小時：約 60 g/h；>2.5 小時：可達 90 g/h（需葡萄糖＋果糖等多重轉運醣類）。水分約 400–800 ml/h，依汗率調整。',
    detail_fuel_note:
      '數值為群體估計，腸胃耐受個體差異大，高劑量需漸進訓練。過量飲水可能導致低血鈉；高溫另見「長跑個人化補給」與「環境配速」。',
    sweat_readout:
      '估計汗率約 {rate} L/h：每小時補水約 {fluid} ml、鈉 {sodium} mg、碳水 {carb} g；補回約 75% 汗失即可，別過量。',
    detail_sweat_principle:
      '跑步約 80% 能量化為熱，主要靠流汗蒸發散熱（蒸發 1 L 汗約散熱 580 kcal）。配速越快、天氣越熱濕，產熱與流汗越多。本工具由產熱與溫濕度推估個人汗率，再換算補水/鈉/碳水。',
    detail_sweat_how:
      '輸入體重、配速、距離、氣溫與濕度。依「每小時」速率與下方逐站建議補給；目標補回約 75% 汗失即可（別過量）。最準仍是賽前後量體重：每少 1 kg≈1 L 汗。',
    detail_sweat_stages:
      '水分：補回約 75% 汗失；鈉：汗鈉約 1 g/L（重鹹汗者更高）；碳水：超過 60–90 分鐘比照補給原則。少量多次、規律補給，勝過一次灌大量。',
    detail_sweat_note:
      '汗率與汗鈉個體差異大（估計值僅供起點）。喝過量純水＋大量流汗易致低血鈉，務必同時補鈉；熱適應 2 週後汗率與汗鈉會下降，需重新評估。',
    cool_readout:
      'WBGT {wbgt}°C（{risk}）：賽前 30–60 分鐘冰沙約 {slurry}；高溫再加陰涼、冷飲、冰毛巾／降溫背心。',
    detail_cool_principle:
      '熱天表現受限於核心體溫上升。賽前主動降溫（pre-cooling）先把核心溫度壓低，等於擴大可吸熱的「空間」，延後達到臨界體溫的時間。冰沙從體內降溫、效果好且攜帶方便。',
    detail_cool_how:
      '輸入體重、氣溫、濕度，得到熱風險與冰沙建議量。賽前 30–60 分鐘攝取冰沙；WBGT 越高，越要加上陰涼、冷飲、冰毛巾／降溫背心，極端時考慮改時段或縮短。',
    detail_cool_stages:
      '低：補水即可；中：冰沙＋陰涼熱身；高：再加冷飲、冰毛巾、降溫背心；極端：冷水浸泡降溫，並認真評估改時段／縮短／取消。',
    detail_cool_note:
      '降溫效果會隨開跑遞減，需搭配賽中散熱（澆水、找陰涼）。冰沙一口氣太大量可能頭痛或腸胃不適，先在訓練演練。中暑徵兆出現務必立即停止。',
    glyco_readout:
      '賽前把碳水拉到約 {load} g/kg／天、巔峰日約 {peak} g，搭配減量把肝醣填滿；僅 90 分鐘以上賽事需要。',
    detail_glyco_principle:
      '肝醣是高強度運動的主要燃料但存量有限。賽前數天搭配減量、提高碳水攝取，能把肌肉與肝臟肝醣「超補」到平常的 1.5–2 倍，延後撞牆、穩住後半段配速（Burke 2011）。',
    detail_glyco_how:
      '輸入體重、選方案，得到每日碳水克數。下方長條為逐日攝取量；照表把碳水分散到 4–6 餐、選好消化的來源，並同步減量讓肝醣堆積。僅 90 分鐘以上賽事需要。',
    detail_glyco_stages:
      'Modified Sherman（推薦）：免耗竭、賽前 3 天高碳水＋減量；Classic：先耗竭再超補（較辛苦、風險高）；WA：賽前一日壓縮超補（10–12 g/kg 單日）。',
    detail_glyco_note:
      '高碳水會伴隨水分滯留、體重短期上升 1–2 kg 屬正常。高纖、高脂、太晚的大餐易腸胃不適；務必在訓練中先試過你的賽前餐。',
    taper_readout:
      '減量 {weeks} 週：週量逐步降到約 {pct}%（賽事週約 {km} km），但維持強度與頻率；通常帶來約 1–3% 進步。',
    detail_taper_principle:
      '減量是「降量、不降強度」：減少總里程讓累積疲勞消退、肝醣與肌肉修復補滿，同時保留少量高強度維持體感與神經肌肉鋒利度。研究顯示適當減量約可帶來 1–3% 成績提升（Bosquet 2007）。',
    detail_taper_how:
      '輸入巔峰週里程與減量週數（1–3 週）。下方長條為各週建議里程；照表逐步降量，但「課表的強度與頻率維持不變」，只是把每次的量縮短。',
    detail_taper_stages:
      '週量逐步降到巔峰的約 40–60%（賽事週最低）；保留每週 1–2 次短而帶強度的課表（如閾值/間歇縮短版）；賽前 2–3 天以輕鬆跑＋幾趟 strides 收尾。',
    detail_taper_note:
      '最常見錯誤是「完全休息」或連強度一起砍，反而變鈍、腿重。減量期間搭配睡眠與碳水補充；體重微升、偶感腿癢想跑都屬正常。',
    rec_readout:
      '建議約 {easy} 天輕鬆、約第 {hard} 天後再進行質量課表；賽後 24 小時補碳水＋蛋白、補水、睡眠最關鍵。',
    rec_phase_window: '黃金窗',
    rec_phase_easy: '輕鬆恢復',
    rec_phase_quality: '回到質量',
    detail_rec_principle:
      '激烈比賽造成肌肉微損傷、肝醣耗盡與全身發炎，需時間修復才能再承受高強度。恢復天數隨距離、費力與年齡增加（約 1 天/英里為保守上限），急著回到質量訓練易拉傷或過度訓練。',
    detail_rec_how:
      '輸入距離、費力與年齡，得到建議的輕鬆天數與「幾天後再質量」。下方階段條為恢復時間軸；照建議走，並以晨脈/HRV、睡眠與痠痛回穩作為可加量的依據。',
    detail_rec_stages:
      '0–24h 黃金窗：補碳水＋蛋白質、補水、睡眠；接著數天全休或輕鬆活動恢復；達建議天數後，先以一次短質量試水溫，再逐步回到正常課表。',
    detail_rec_note:
      '證據強度：補給/補水/睡眠最強，主動恢復次之，冷水浸泡（CWI）對主觀疲勞有益但可能鈍化長期適應，賽後用可、平時少用；同理，避免常規使用消炎止痛藥（NSAIDs），以免抑制肌肉適應（Schoenfeld 2012）。疼痛異常請就醫。',
    gap_title: '⛰️ GPX 路線 GAP 配速分析',
    hint_gap_intro: '上傳賽事 GPX 並輸入平路目標配速，算出每公里坡度修正配速與爬升',
    gap_file: 'GPX 檔案',
    gap_pace: '平路目標配速 (m:ss/km)',
    gap_totaldist_label: '總距離',
    gap_ascent_label: '總爬升',
    gap_descent_label: '總下降',
    gap_predicted_label: '預估完賽配速',
    gap_splits_label: '每公里坡度修正配速',
    gap_maxhr: '最大心率 (可選, bpm)',
    gap_resthr: '靜息心率 (可選, bpm)',
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
    hrv_input_label: '晨起 RMSSD (ms, 逗號分隔)',
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
    detail_hrv_principle:
      'HRV（以晨起 RMSSD 衡量）反映自律神經的恢復狀態。把連續數日的 RMSSD 取平均 ± 1 標準差當作個人「正常帶」，今日值相對於這條帶的位置，比單一絕對值更能判讀恢復（Plews 法）。',
    detail_hrv_how:
      '每天起床後同條件量 RMSSD（同姿勢、同時間、未喝咖啡），輸入逗號分隔的 3–7 天、最後一筆為今天。落在帶內照計畫；明顯偏低改輕鬆／恢復；偏高多為適應良好但也留意是否過勞飽和。另可填睡眠品質／肌肉痠痛／壓力／心情等主觀狀態，與 HRV 合成「今日訓練建議」——主觀自評對訓練負荷往往比客觀指標更敏感（Saw 2016）。',
    detail_hrv_stages:
      '陰影帶為個人正常範圍（基線 ± 1 標準差），折線為每日 RMSSD，末點為今天。趨勢比單日更重要：連續下降代表累積疲勞，平穩或上升代表恢復良好。',
    detail_hrv_note:
      '需穩定的量測條件才可靠；酒精、生病、缺水、壓力都會影響。變異係數（CV）越大越不穩定、宜保守。單日數字僅供參考，請對齊體感與睡眠。晨起 RMSSD 是實用的代理，但夜間連續量測對訓練反應可能更敏感（Nuuttila 2024）。',
    hrv_wellness_title: '主觀狀態（選填，未填不計）',
    hrv_sleep_label: '睡眠品質',
    hrv_soreness_label: '肌肉痠痛',
    hrv_stress_label: '壓力',
    hrv_mood_label: '心情',
    hrv_opt_na: '—',
    hrv_sleep_good: '好',
    hrv_sleep_fair: '普通',
    hrv_sleep_poor: '差',
    hrv_soreness_none: '無',
    hrv_soreness_mild: '輕',
    hrv_soreness_high: '明顯',
    hrv_stress_low: '低',
    hrv_stress_mid: '中',
    hrv_stress_high: '高',
    hrv_mood_good: '佳',
    hrv_mood_normal: '普通',
    hrv_mood_low: '低落',
    hrv_rec_label: '今日訓練建議',
    hrv_rec_quality: '可進行品質課表',
    hrv_rec_moderate: '適度訓練即可',
    hrv_rec_easy: '以輕鬆／恢復為主',
    hrv_rec_rest: '建議休息／恢復',
    hrv_rec_saturation_note: '（HRV 偏高但主觀狀態差，可能是副交感飽和或累積疲勞，別貿然加量。）',
    cycle_title: '🌸 月經週期訓練調整',
    hint_cycle_intro:
      '填「最近一次月經第一天」自動推算週期天數（或直接填第幾天）；日期越久未更新越不準。',
    cycle_start_date: '最近一次月經第一天',
    cycle_derived_day: '（依日期推算為第 {n} 天）',
    cycle_day: '週期第幾天',
    cycle_length: '週期長度 (天)',
    cycle_dysmenorrhea: '經痛程度',
    cycle_dys_none: '無',
    cycle_dys_mild: '輕',
    cycle_dys_moderate: '中',
    cycle_dys_severe: '重',
    cycle_mood: '情緒',
    cycle_mood_normal: '普通',
    cycle_mood_good: '佳',
    cycle_mood_low: '低落',
    cycle_sleep: '睡眠 (小時)',
    cycle_phase_label: '目前階段',
    menstrual_phase_menstrual: '月經期',
    menstrual_phase_follicular: '濾泡期',
    menstrual_phase_ovulation: '排卵期',
    menstrual_phase_luteal: '黃體期',
    menstrual_advice_menstrual:
      '症狀因人而異：無不適可照常訓練（含質量課）；經痛或疲勞明顯就降量到舒適，輕鬆有氧與伸展有時可緩解經痛。',
    menstrual_advice_follicular:
      '雌激素上升，常（非必然）體感較佳、耐受度高；狀況好時適合安排質量課與長距離，仍以體感為準、別只看日曆。',
    menstrual_advice_ovulation:
      '部分人力量與表現達高點、可衝；雌激素高峰期關節鬆弛度可能略升（與受傷的關聯證據仍不一致，Herzberg 2017），務必充分暖身。',
    menstrual_advice_luteal:
      '體溫與黃體素上升→較不耐熱、同強度體感更費力、後段（經前）易疲勞：加強補水、預留恢復，熱天酌降強度。',
    menstrual_rec_go: '症狀輕微：可照計畫進行，必要時聽身體調整。',
    menstrual_rec_caution: '有不適徵兆：建議降低強度或縮短課表，優先品質與恢復。',
    menstrual_rec_easy: '症狀明顯：今天以輕鬆／恢復為主，必要時休息。',
    menstrual_pms_note:
      '經前（黃體期後段）情緒、睡眠與經痛常會變差：彈性安排、優先恢復；輕鬆有氧有時有助情緒（Sims & Yeager 2024）。',
    menstrual_luteal_fuel:
      '黃體期碳水氧化下降、脂肪利用上升，質量課前後可略增碳水補給（Carmichael 2021）。',
    menstrual_reds_warn:
      '⚠️ 週期長度異常／停經是 RED-S（能量可用性不足）的首要警訊；請檢視熱量攝取與訓練量，必要時就醫。',
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
    alt_readout:
      'Hb mass +{hb}%、VO₂max +{vo2}%（{status}）。下山後 1–2 天或 2–3 週出賽較佳，避開第 5–10 天。',
    detail_cycle_principle:
      '雌激素與黃體素在週期中起伏，可能影響體溫、體感與恢復。本工具依週期分四階段給「微調起點」。McNulty 2020 系統綜述強調：個體差異遠大於群體平均效應。',
    detail_cycle_how:
      '填「最近一次月經第一天」自動推算目前週期天數（規律週期會循環換算），或直接填「第幾天」；填了日期就以日期為準。看目前階段與該階段的訓練微調，下方為週期時間軸（目前階段已標示）。最終仍以自身體感、症狀與表現為準。',
    detail_cycle_stages:
      '月經期（症狀因人而異，舒適即可訓練）→濾泡期（精力漸增，適合質量與加量）→排卵期（常為高峰，可衝表現）→黃體期（體溫升、較易疲勞與不耐熱，宜加強補水與恢復）。',
    detail_cycle_note:
      '這些是起點而非規則；研究證據分歧、個體差異大。服用荷爾蒙避孕者週期反應不同。以症狀與表現調整，異常出血或經痛請就醫。',
    detail_alt_principle:
      '低氧環境刺激紅血球生成（EPO），足量曝露後血紅素總量（Hb mass）上升、攜氧能力變好、VO₂max 提升。關鍵是「足夠的低氧曝露時數」，下方曲線即 Hb 隨曝露累積的概念。',
    detail_alt_how:
      '輸入海拔、天數、每日高住時數與協議，估算總曝露時數與 Hb mass／VO₂max 增益。有效高住窗約 2000–3000m；每日高住時數越長、天數越足，效益越大。',
    detail_alt_stages:
      '常見建議：下山後 1–2 天（殘餘適應、未失代償）或 2–3 週後出賽較佳；避開第 5–10 天（換氣與酸鹼再適應的低谷）。個體差異大，最好先試驗自己的反應。',
    detail_alt_note:
      '數字為估計、反應者差異大（Levine 1997；Wilber 2007；Chapman 2014）；非反應者也不少。高海拔初期睡眠與訓練品質下降、需補鐵與補水；高住高練易訓練過度，宜降強度。',
    ref_title: '📚 科學實證與訓練原則',
    ref_intro:
      '本站工具方法論的依據與引用來源。每張工具卡片下方點「詳解」可展開原理、用法、階段與注意。',
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
      '準確度與信任：屬「公式」者為教科書精確公式（VDOT、Tanaka/Gellish 最大心率、Karvonen、Minetti 坡度、Riegel、碳水 30–90 g/h、冰沙 7.5 g/kg、Mujika 減量），數值已用單元測試鎖定；屬「估算」者（高溫減速、汗率、步頻區間、恢復天數、海拔增益）為依文獻建立的合理模型，個體差異大，請當作起點而非保證。海拔/HRV/月經週期尤其因人而異。',
    vdot_log_btn: '＋ 記錄此成績到體能趨勢',
    trend_title: '📈 體能趨勢',
    hint_trend_intro: '記錄歷次比賽成績，追蹤 VDOT 隨時間變化與各距離個人最佳',
    trend_date: '日期',
    trend_dist: '距離',
    trend_time: '成績 (m:ss / h:mm:ss)',
    trend_add: '＋ 新增紀錄',
    trend_empty: '尚無紀錄，新增一筆比賽成績開始追蹤。',
    trend_delete: '刪除這筆',
    trend_readout: '最佳 VDOT {best}，最近 {recent}。長期走勢比單點更可靠。',
    explain_trend:
      '記錄每次比賽成績，自動換算 VDOT 並畫出隨時間的體能趨勢，以及各距離個人最佳（PB）。資料存在本機，登入後跨裝置同步。',
    detail_trend_principle:
      '每筆成績用 Daniels–Gilbert 公式換算成 VDOT（有效 VO₂max）。追蹤 VDOT 隨時間的走勢，比單看完賽時間更能跨距離地反映體能變化。',
    detail_trend_how:
      '填日期、距離與成績後「新增紀錄」，或在上方 VDOT 工具按「記錄此成績」。下方顯示紀錄清單、VDOT 趨勢線與各距離 PB。可刪除任一筆。',
    detail_trend_note:
      'VDOT 為單筆成績推估，受當天狀態、天氣、賽道影響；趨勢看長期方向比單點更可靠。資料僅存於你的瀏覽器（登入則同步到你的後端）。',
    readiness_title: '🧭 今日訓練準備度',
    hint_readiness_intro: '整合下方 ACWR、HRV、恢復與主觀狀態的輸入；未填的因子不計分',
    readiness_level_label: '準備度',
    readiness_none: '尚無足夠資料 — 填下方 ACWR／HRV／恢復任一項即可。',
    readiness_na: 'n/a（未填）',
    readiness_factor_hrv: 'HRV（自律神經）',
    readiness_factor_acwr: 'ACWR（負荷）',
    readiness_factor_recovery: '恢復需求',
    readiness_factor_wellness: '主觀狀態',
    readiness_state_good: '🟢 良好',
    readiness_state_ok: '🟡 普通',
    readiness_state_bad: '🔴 不佳',
    readiness_level_go: '可進行高品質訓練',
    readiness_level_caution: '注意，適度即可',
    readiness_level_easy: '以輕鬆為主',
    readiness_level_rest: '建議休息／恢復',
    readiness_readout: '今日準備度 {score}/100：{level}。此為啟發式整合，請結合體感判斷。',
    explain_readiness:
      '把 HRV（自律神經）、ACWR（負荷／傷害風險）、恢復需求與主觀狀態整合成單一每日準備度。這是「啟發式整合」非經驗證的指標，僅供參考，請以體感與專業判斷為準。',
    detail_readiness_principle:
      '四個訊號各映成 0–100 子分：HRV 正常/偏高/偏低、ACWR 甜蜜區→高風險、恢復需求天數、主觀狀態（睡眠／痠痛／壓力／心情）。讀數取「有值因子」的平均；未填者不計分。分數越高越適合高品質訓練。',
    detail_readiness_how:
      '先在下方填 ACWR 週里程、HRV 晨起讀數、賽後恢復；本卡會自動綜合成今日準備度與建議。只填其中一兩項也可用，缺的記 n/a。',
    detail_readiness_note:
      '此為透明的啟發式加權，非臨床或經驗證指標；個體差異大。請結合主觀體感、睡眠與生活壓力綜合判斷，異常請尋求專業建議。'
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
    tab_pace: 'Pace & Analysis',
    tab_triathlon: 'Triathlon',
    tab_training: 'Training Plan',
    tab_races: 'Races',
    tab_assessment: 'Assessment',
    tab_workout: 'Workout Design',
    tab_monitoring: 'Monitoring',
    tab_settings: 'Settings',
    allraces_title: '🗓️ All Races',
    allraces_hint: 'Source: 運動筆記 + 馬拉松世界, refreshed daily; click ↗ to open the race page.',
    allraces_search_ph: 'Search name / location / date',
    allraces_count: 'Showing {shown} of {total}',
    allraces_empty: 'No races yet (backend has not crawled, or no backend URL set).',
    allraces_month_all: 'All months',
    allraces_region_all: 'All locations',
    allraces_distance_all: 'All distances',
    allraces_dist_full: 'Full',
    allraces_dist_half: 'Half',
    allraces_dist_10k: '10K',
    allraces_dist_5k: '5K',
    allraces_dist_ultra: 'Ultra',
    allraces_upcoming_only: 'Upcoming only',
    allraces_unclassified: 'Unclassified',
    allraces_no_match: 'No races match your filters',
    allraces_today: 'Today',
    allraces_past: 'Past',
    allraces_in_days: 'in {n}d',
    allraces_updated: 'Updated {date}',
    allraces_reg_close: 'Reg by {date}',
    allraces_reg_open: 'Open',
    allraces_reg_closing: 'Closing soon',
    allraces_reg_closed: 'Closed',
    footer_tagline: '🏃 RunningPaceNote · Made with ❤️ for runners',
    version_latest: '✓ Up to date',
    version_update: '● Update available — tap to refresh',
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
    hr_max_optional: 'Measured max HR (optional, bpm)',
    hr_formula: 'Max-HR formula',
    hr_formula_tanaka: 'Tanaka (recommended)',
    hr_formula_fox: '220 − age',
    hr_maxhr: 'Max HR',
    hr_vo2max: 'Est. VO₂max',
    interval_title: '⚡ Interval Generator',
    hint_interval_intro:
      'Builds a structured interval session from your VDOT (Assessment tab) + weekly mileage',
    interval_weekly: 'Weekly mileage (km)',
    interval_type: 'Workout type',
    interval_type_i: 'I intervals (VO₂max)',
    interval_type_t: 'T tempo (threshold)',
    interval_type_r: 'R reps (speed)',
    interval_goal: 'Goal race',
    interval_goal_any: 'Any',
    interval_goal_5k: '5K',
    interval_goal_10k: '10K',
    interval_goal_half: 'Half',
    interval_goal_full: 'Marathon',
    interval_phase: 'Training phase',
    interval_phase_quality: 'Quality',
    interval_phase_base: 'Base',
    interval_phase_peak: 'Peak',
    interval_qdays: 'Quality days/wk',
    interval_warmup: 'Warm-up',
    interval_cooldown: 'Cool-down',
    interval_total: 'Total',
    interval_capped: 'reps adjusted to the weekly-volume cap',
    interval_need_vdot: 'Enter a race result in the VDOT section (Assessment tab) first',
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
    zones_readout:
      'Follow 80/20: ~80% of mileage easy (E), ~20% as T/I/R quality. Easy means truly easy so quality days stay sharp. For more precision, use the VDOT tab.',
    detail_zones_principle:
      'Different paces train different systems: easy running builds the aerobic base and recovery, threshold raises lactate tolerance, intervals push VO₂max. Splitting training into intensity zones lets you keep easy days easy and hard days hard — instead of grinding everything at medium effort.',
    detail_zones_how:
      'These ranges are estimated from your current pace (use the VDOT tab for more precision). Put most mileage in E; keep T/I/R quality to ~8–10% of weekly volume. Aim for 80/20 — about 80% easy, 20% hard.',
    detail_zones_stages:
      'E aerobic base/recovery (most volume, conversational); M marathon-specific pace; T lactate threshold (sustain ~20–40 min); I VO₂max intervals (3–5 min reps); R reps (short and fast for speed & form).',
    detail_zones_note:
      'A linear estimate from a single pace — directional only; base real plans on a VDOT from a recent race. Easy must be truly easy — most runners run E too fast, piling on fatigue and dulling their quality sessions.',
    explain_predict:
      'Uses one recent result and Riegel’s formula (time × distance-ratio^1.06) to predict other distances; the closer the reference and target distances, the more accurate.',
    pred_readout:
      'The closer the reference and target distances, the more accurate; big jumps (especially to the marathon) tend to be optimistic — treat as an ideal ceiling.',
    detail_pred_principle:
      'Riegel’s formula T2 = T1×(D2/D1)^1.06: at fixed fitness, time grows with distance as a power law; the 1.06 exponent reflects endurance decay over longer distances.',
    detail_pred_how:
      'Enter one recent, all-out result (closer reference-to-target is more accurate). Use the four predicted times to set goals and pacing.',
    detail_pred_stages:
      '5K↔10K predict each other best; half-marathon is fair; the marathon runs optimistic (endurance, fueling and muscular endurance decide it) — treat as a ceiling.',
    detail_pred_note:
      'Assumes your training supports that distance; with insufficient mileage the long ones come in well slower. Day-form, course and weather all matter.',
    tri_seg_swim: 'Swim',
    tri_seg_bike: 'Bike',
    tri_seg_run: 'Run',
    tri_readout:
      'Total {total}; swim {swim}, bike {bike}, run {run}. Focus training on the biggest, most improvable segment.',
    detail_tri_principle:
      'A triathlon time is the sum of three legs plus two transitions; both pacing split and transition efficiency shape the total. The strip below visualises each leg’s share of time.',
    detail_tri_how:
      'Pick the distance and enter a goal total to back-solve each leg, or enter leg paces to get the total. Focus training on the most time-consuming, most improvable legs (usually bike and run).',
    detail_tri_stages:
      'Swim (sight, save energy) → T1 → Bike (longest, main fueling) → T2 → Run (hold form when tired). Transitions are short but fumbles cost time — rehearse them.',
    detail_tri_note:
      'Back-solving assumes typical split ratios; individual strengths vary a lot, so adjust to your three-sport profile. Over-cook the bike in long course and the run falls apart.',
    detail_raceplan_principle:
      'Distributes your goal finish time across each km by strategy. The biggest lever is not starting too fast: a positive split (fast then fade) is the most common and most costly pattern, and stronger runners pace more evenly (March 2011). Elites set records running near-even / slightly negative (Kipchoge, Berlin 2018 and Kiptum, Chicago 2023 both ran faster second halves; Díaz 2018: world records are paced near-even). In practice: start a touch conservative, hold goal pace through the middle, lift the finish only if you have it. The curve below is per-km pace.',
    detail_raceplan_how:
      'Pick distance, enter goal time and strategy for per-km pace and cumulative time. Pace to the curve: first ~1/4 deliberately 5–10 s/km slower, hold goal pace through the middle, last ~1/4 faster by 5–15 s/km if you have it. The point isn’t a “slow first half” — it’s not letting race-day adrenaline pull you into a first half that feels easy but is too fast.',
    detail_raceplan_stages:
      'Conservative start (don’t surge) → middle (hold goal pace, fuel regularly) → ~30k wall in the marathon → finish (lift it only if you have it).',
    detail_raceplan_note:
      'Pace is a plan; adjust to feel, heart rate and weather. In heat or on hills use “Environmental Pace” and “GAP” to reset expectations.',
    gap_readout:
      'Total {dist} km, climb +{ascent} m; at your flat-pace effort the predicted pace is about {pace}. Save energy on steep climbs and fuel ~every 30 min.',
    detail_gap_principle:
      'Distance from haversine, per-segment grade via Minetti (2002) energy cost — converting your flat-pace effort into actual per-segment pace: slower uphill, a little faster downhill (but limited).',
    detail_gap_how:
      'Upload the course GPX and enter your flat target pace (heart rate optional). Read the profile and per-km adjusted pace to save energy on steep climbs and fuel along the timeline.',
    detail_gap_stages:
      'Uphill (ease, shorten stride, go by effort/HR) → crest (don’t chase) → downhill (relax but controlled, avoid pounding) → fueling (from ~45 min, every 30 min).',
    detail_gap_note:
      'Elevation data is often noisy — numbers are for strategy only; wind, surface and fatigue all affect reality. Downhill rarely returns what the uphill costs, so more net climb = slower.',
    re_readout:
      'Estimated VO₂max {vo2}, body-fat band {band}. Train strength and plyometrics first for economy, and fine-tune body composition within a healthy range.',
    detail_re_principle:
      'VO₂max is estimated from your 5K with the Daniels engine. Running economy means “using less oxygen at the same speed” — one of the three endurance pillars with VO₂max and lactate threshold; body composition affects power-to-weight.',
    detail_re_how:
      'Enter 5K time, sex and body-fat %. Read VO₂max and the body-fat band, then follow the three-layer strategy below: strength, plyometrics, body composition.',
    detail_re_stages:
      '① Strength training (lifting improves RE ~2–8%, Beattie 2017) ② Plyometrics (jumps/bounding stiffen tendons) ③ Body composition (optimise power-to-weight within a healthy range).',
    detail_re_note:
      'VO₂max is estimated from a result, not measured; body-fat bands use ACE norms and vary a lot. Don’t over-restrict — too-low body fat harms performance and health.',
    detail_interval_principle:
      'Intervals alternate hard reps with recovery to bank the most target-intensity stimulus in the least time. I trains VO₂max, T lactate threshold, R speed & form.',
    detail_interval_how:
      'Get paces from the VDOT card (or fill the result above), then enter weekly mileage and type. The single quality session is capped at min(10km, 8% of weekly volume); the session = warm-up + main set + cool-down.',
    detail_interval_stages:
      'Warm-up (progressive, a few strides) → main set (reps at pace with recovery) → cool-down (easy). Don’t cut recovery short — quality over quantity.',
    detail_interval_note:
      'At most 2–3 quality sessions per week, alternating with easy days; set paces you can complete for all reps — blowing up means it was too fast. Skip when injured or very fatigued.',
    detail_methods_principle:
      'Named methods package training principles into actionable key sessions, each emphasising something different: prediction, VO₂max, cumulative fatigue, or strictly controlled double threshold.',
    detail_methods_how:
      'Enter a goal marathon time, pick a method, and see its key session and paces. Choose one that fits your goal and available time and run it consistently — don’t switch every week.',
    detail_methods_stages:
      'Yasso 800 (800m reps predict the marathon), Norwegian 4×4 (4×4-min VO₂max), Hansons (cumulative fatigue, capped long run), Norwegian double threshold (two threshold sessions a day, tight pacing).',
    detail_methods_note:
      'These are key sessions, not full weekly plans — embed them in a cycle with easy runs and long runs. Double threshold demands careful intensity control for amateurs; progress gradually.',
    detail_strides_principle:
      'Strides are ~15–30 s of “controlled fast” (not sprints) with full recovery between. Done fresh, they improve neuromuscular coordination and running economy (Daniels & Gilbert 1979; Blagrove 2018).',
    detail_strides_how:
      'Pick a progression week to see that week’s session; insert 2–3 times a week (after easy runs or before quality). Accelerate relaxed, build gradually, don’t lunge for a line, and recover fully between.',
    detail_strides_stages:
      'Progress from 4×15s to 8×30s (bars show each week’s total stride seconds). Establish frequency and technique first, then add reps and duration.',
    detail_strides_note:
      'Effort is “fast but relaxed,” not all-out; use flat ground and avoid doing them fatigued. Reduce volume early in injury or during recovery.',
    detail_cadence_principle:
      'Optimal cadence varies with speed and the individual (180 SPM is a myth). Raising cadence 5–10% shortens overstride and cuts per-step load on the knee and Achilles (Heiderscheit 2011).',
    detail_cadence_how:
      'Enter pace (current cadence optional). Read the recommended band and +5%/+10% targets; an overlong stride (low cadence) signals overstriding you can gradually fix. The gauge shows where your current cadence sits in the band.',
    detail_cadence_stages:
      'Raise gradually: +5% every 2–4 weeks, aided by a metronome or music; practise on easy runs first, then bring it into quality sessions.',
    detail_cadence_note:
      'Higher isn’t always better — too high wastes energy; aim to land under your centre of mass without overstriding. Change form gradually to avoid compensation injuries.',
    explain_triathlon:
      'Enter a target total time to back-calculate swim/bike/run paces by event type, or fill each leg’s pace to get the total. T1/T2 are transition times.',
    explain_training_cycle:
      'Phases: base → build → peak → taper → race week; a recovery (down) week every 4th week. Mileage and paces adjust automatically by phase. Pick a school and the daily workouts differentiate by methodology (Higdon approachable, Pfitzinger medium-long + threshold, Daniels VDOT quality rotation).',
    explain_plan_config:
      'A level (beginner/intermediate/elite) fills in suggested weeks and start/peak weekly mileage; edit the numbers to customize, or leave all blank to auto-derive from race date and current pace.',
    explain_raceplan:
      'Strategies: even (steady and conservative); negative split (conservative start, faster finish — how elites and most world records are run); positive split (fast then fade — most common and most costly). Key: don’t start too fast. The table shows per-km target pace and cumulative time; mind the ~30k wall and fuel to plan.',
    explain_vdot:
      'VDOT is an “effective VO₂max” estimated from a recent result — higher is fitter. The E/M/T/I/R values are the matching training paces; equivalent times are predicted results at the same fitness across distances.',
    btn_detail: 'Learn more',
    detail_h_principle: 'Principle',
    detail_h_how: 'How to use',
    detail_h_stages: 'Stages',
    detail_h_note: 'Notes',
    detail_h_refs: 'References',
    vdot_grade_beginner: 'Beginner',
    vdot_grade_recreational: 'Recreational',
    vdot_grade_intermediate: 'Intermediate',
    vdot_grade_advanced: 'Advanced',
    vdot_grade_elite: 'Elite',
    vdot_readout:
      'Your VDOT is {v} ({grade}). Build easy volume first, then add quality — E base, T threshold, I VO₂max.',
    detail_vdot_principle:
      'VDOT estimates your “effective VO₂max” from a recent race, combining pace and sustainable duration into one number that turns fitness into personalised training paces (Daniels–Gilbert).',
    detail_vdot_how:
      'Enter one recent, all-out race result (the closer to your target distance, the better). You get five training paces (E/M/T/I/R) and equivalent times at other distances to plan workouts and set realistic goals.',
    detail_vdot_stages:
      'E aerobic base/recovery (most volume); M marathon pace; T lactate threshold (sustain ~20–40 min); I VO₂max intervals (3–5 min); R speed & form (short, fast). Easy→hard, volume high→low.',
    detail_vdot_note:
      'Estimated from a single result; day-form, weather and course all affect it, and cross-distance predictions get rougher the further out. Keep weekly quality (T/I/R) under ~8–10% of weekly mileage.',
    explain_hr:
      'Max HR is estimated with Tanaka (208−0.7×age) or your measured value, then Karvonen (heart-rate reserve) splits it into 5 zones, each for a different purpose. VO₂max here is estimated from the max/resting HR ratio (not measured).',
    hr_readout:
      'Max HR ~{max} bpm, resting {rest} bpm. Keep easy days in the E/M zones and only enter T/I on quality days; use HR as a ceiling — don’t chase pace in heat or when fatigued.',
    detail_hr_principle:
      'Max HR is estimated with Tanaka (208−0.7×age) or your measured value, then Karvonen heart-rate reserve = (max−rest)×intensity+rest splits it into five zones — more personal than plain 220−age.',
    detail_hr_how:
      'Enter age and morning resting HR (a measured max HR is more accurate). Keep easy days in E/M and only go to T/I on quality days; treat HR as a ceiling — same pace reads higher in heat or when tired.',
    detail_hr_stages:
      'E recovery/aerobic (RPE 2–3, easy to talk); M marathon (RPE 4–5); T threshold (RPE 6–7, hard but sustainable); I VO₂max (RPE 8–9, short sentences only); R top speed (RPE 10).',
    detail_hr_note:
      'Formula-estimated, not measured; individual variation is large — a lab or field max-HR test is most accurate. HR lags (use pace for short intervals); caffeine, dehydration and poor sleep all raise it.',
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
    workout_medlong: 'Medium-long Run',
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
    tri_t1_time: 'T1 (m:ss)',
    tri_bike_speed: 'Bike Speed (km/h)',
    tri_t2_time: 'T2 (m:ss)',
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
    cadence_current: 'Current cadence (optional, spm)',
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
    strides_need_vdot: '(enter a race result for pace)',
    explain_strides:
      'Strides = ~15–30 s of controlled fast (not maximal) running with full recovery, 2–3×/week (after easy runs or before quality). They improve neuromuscular coordination and running economy (Daniels & Gilbert 1979; Blagrove 2018). This table progresses 4×15s → 8×30s over 12 weeks.',
    acwr_title: '🩹 Injury Risk (ACWR)',
    hint_acwr_intro:
      'Enter the last 4 weeks of mileage (last box = this week) for the acute:chronic ratio',
    acwr_w1: 'Week 1 (oldest, km)',
    acwr_w2: 'Week 2 (km)',
    acwr_w3: 'Week 3 (km)',
    acwr_w4: 'Week 4 (current, km)',
    acwr_acute_label: 'Acute (this week)',
    acwr_chronic_label: 'Chronic (4-wk avg)',
    acwr_rec_label: 'Next week target',
    acwr_zone_undertraining: 'Undertraining',
    acwr_zone_sweet: '✅ Sweet spot',
    acwr_zone_caution: '⚠️ Caution',
    acwr_zone_highrisk: '🚨 High risk',
    explain_acwr:
      'ACWR = this week’s mileage ÷ the recent 4-week average. Sweet spot ≈ 0.8–1.3; > 1.5 means a load spike with higher soft-tissue injury risk (Gabbett 2016); < 0.8 is usually undertraining or a return from a break. Use it to set next week’s mileage and avoid adding too much at once.',
    acwr_readout:
      'ACWR {acwr} ({zone}). Suggested next week: {min}–{max} km; try not to jump more than ~10% in a single week.',
    acwr_strength: 'Weekly strength training',
    acwr_shoes: 'Rotate 2+ shoes',
    acwr_opt_no: 'No',
    acwr_opt_yes: 'Yes',
    acwr_mag_low: 'Low load: injury risk is low but fitness gains are limited.',
    acwr_mag_optimal: 'Sweet spot: injury risk near baseline.',
    acwr_mag_elevated: 'Elevated: watch fatigue and soreness.',
    acwr_mag_high: 'Load spike: ~2–4× soft-tissue injury risk (Gabbett 2016).',
    acwr_mag_extreme: 'ACWR > 2.0: ~4.5× injury risk (Hulin 2014) — strongly consider backing off.',
    acwr_protect_strength_on: '✅ You strength-train: ~50% lower injury risk (Lauersen 2014).',
    acwr_protect_strength_off:
      '➕ 2–3 strength sessions/week can cut injury risk ~50% (Lauersen 2014).',
    acwr_protect_shoes_on: '✅ You rotate shoes: ~39% lower injury risk (Malisoux 2015).',
    acwr_protect_shoes_off:
      '➕ Rotating 2+ different shoes can cut injury risk ~39% (Malisoux 2015).',
    detail_acwr_principle:
      'ACWR = acute load (this week) ÷ chronic load (4-week average). It measures how fast recent training is rising relative to what your body has adapted to — rise too fast and soft tissue can’t keep up, raising injury risk (Gabbett 2016).',
    detail_acwr_how:
      'Enter the last 4 weeks of mileage (last box = this week). Staying in the sweet spot (~0.8–1.3) is safer; use the suggested next-week range to progress gradually, ideally under ~10% per week.',
    detail_acwr_stages:
      '<0.8 undertraining / returning (low load); 0.8–1.3 sweet spot (steady gains); 1.3–1.5 caution (watch fatigue & soreness); >1.5 high risk (load spike — back off).',
    detail_acwr_note:
      'Mileage is only one proxy for load; intensity, terrain, sleep and stress matter too. ACWR is a trend guide, not a guarantee — always combine it with how you feel and any pain signals.',
    env_title: '🌡️ Environmental Pace',
    hint_env_intro:
      'Pick a mode, enter temperature, humidity, pace and acclimatisation for dew point, WBGT and a target/equivalent pace',
    env_mode: 'Mode',
    env_mode_forward: 'Predict (target → hot pace)',
    env_mode_reverse: 'Reverse (hot actual → cool-equiv)',
    env_temp: 'Temperature (°C)',
    env_humidity: 'Humidity (%)',
    env_pace: 'Pace (m:ss/km)',
    env_grade: 'Grade (%, optional)',
    env_acclim: 'Heat acclimatisation',
    env_acclim_none: 'Not adapted',
    env_acclim_partial: 'Partial (~1 week)',
    env_acclim_full: 'Adapted (10–14 days)',
    env_risk_label: 'Heat stress',
    env_dewpoint_label: 'Dew point',
    env_wbgt_label: 'WBGT',
    env_heat_label: 'Heat slowdown',
    env_grade_label: 'Grade factor',
    env_adjusted_label: 'Suggested target pace',
    env_result_rev: 'Cool-weather equivalent',
    env_risk_low: '🟢 Low',
    env_risk_moderate: '🟡 Moderate',
    env_risk_high: '🟠 High',
    env_risk_extreme: '🔴 Extreme',
    explain_env:
      'Dew point and WBGT reflect how hard it is for your body to shed heat: in hot, humid air sweat evaporates poorly and pace must ease. This tool maps WBGT (ABM shade approximation) to a slowdown, and uses Minetti (2002) gradient energy cost for the grade factor. Taiwan summers often land in the High/Extreme band — slow to the suggested pace and hydrate more.',
    env_readout:
      'WBGT {wbgt}°C ({risk}): ease ~{pct}% off flat pace, target about {pace}, and drink every 15–20 min while seeking shade.',
    env_readout_reverse:
      'WBGT {wbgt}°C ({risk}): this heat/grade costs ~{pct}%; your run is worth about {pace} on a flat, cool day.',
    env_sweat_warn:
      '⚠️ Losing more than 2% of body mass to sweat starts to hurt performance — hydrate early and regularly with electrolytes.',
    detail_env_principle:
      'You cool mainly by evaporating sweat. In hot, humid air (high dew point) sweat evaporates poorly, core temperature and heart rate climb, and the same pace feels harder. WBGT combines temperature and humidity into a heat-stress index — the higher it is, the more you must ease (ABM shade approximation).',
    detail_env_how:
      'Predict mode: enter a flat, cool target pace to get the hot/hilly pace. Reverse mode: enter the pace you actually ran in the heat to back out a flat, cool-weather equivalent (gauging true fitness). Also set acclimatisation: adapted runners take a smaller heat penalty (Périard 2015). Ease to the result instead of chasing your original pace; go by feel and heart rate, and hydrate early and regularly with electrolytes.',
    detail_env_stages:
      'WBGT <18 low (little effect); 18–23 moderate (ease slightly, mind hydration); 23–28 high (ease clearly, seek shade, fuel more); >28 extreme (ease a lot — consider rescheduling/shortening/cancelling).',
    detail_env_note:
      'A shade approximation: direct sun, no wind or asphalt make it harsher. Heat acclimatisation takes ~7–14 days (Périard 2015); be more conservative if unadapted. Losing more than 2% of body mass to sweat starts to hurt performance — hydrate early. Stop immediately on heat-illness signs (dizziness, goosebumps, stopping sweating).',
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
    glyco_dist: 'Race distance',
    glyco_dist_full: 'Marathon',
    glyco_dist_half: 'Half',
    glyco_dist_10k: '10K',
    glyco_dist_5k: '5K',
    glyco_dist_ultra: 'Ultra',
    glyco_time: 'Goal time (optional)',
    glyco_notneeded:
      'Usually under ~90 min for this distance — loading adds little; normal eating + a pre-race meal is enough.',
    glyco_prerace: 'Pre-race 1–4 h: ~{lo}–{hi} g carbs (easy-to-digest, low fibre/fat)',
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
    rec_refuel: 'Refuel carbs + protein within 24 h (protein 1.6–2.0 g/kg/day × 24–48 h)',
    rec_rehydrate: 'Replace fluids and electrolytes',
    rec_sleep: 'Prioritise sleep (9–10 h)',
    rec_active: 'Light activity / active recovery',
    rec_cwi: 'Cold-water immersion 15°C × 10–15 min for soreness (optional)',
    rec_massage: 'Massage eases delayed-onset soreness (moderate benefit)',
    rec_nsaid: 'Use NSAIDs sparingly — only if pain disrupts sleep',
    rec_time: 'Finish time (optional)',
    explain_rec:
      'Recovery days scale with distance, effort, age and finish time (≈ 1 day/mile as a conservative ceiling). First-24 h golden window: carbs + protein (1.6–2.0 g/kg/day), rehydration and 9–10 h sleep. Cold-water immersion and massage help perceived soreness (CWI may blunt long-term adaptation); use NSAIDs sparingly (Morton 2018; Halson 2014; Ihsan 2016; Dupuy 2018; Schoenfeld 2012).',
    fuel_readout:
      '~{kcal} kcal total. Over 60 min, fuel on the move: ~{carb} g/h carbs and {fluid} ml/h fluid, ~{total} g carbs across the race. Start early, little and often.',
    detail_fuel_principle:
      'Running burns about body-weight×1 kcal per km. Glycogen stores only last ~90–120 min at intensity, so beyond that you must take carbs on the move to delay “the wall.” The carb rate rises with duration and must be paired with fluid to maintain blood volume and cooling.',
    detail_fuel_how:
      'Enter weight, distance and goal finish time to get hourly carb/fluid rates and per-station amounts. Follow the timeline below — fuel early and little-and-often, don’t wait until hungry or thirsty; rehearse gut tolerance in training for long races.',
    detail_fuel_stages:
      '<60 min: usually none; 1–2 h: ~30 g/h; 2–2.5 h: ~60 g/h; >2.5 h: up to 90 g/h (needs multiple transportable sugars like glucose+fructose). Fluid ~400–800 ml/h, adjusted to sweat rate.',
    detail_fuel_note:
      'These are population estimates; gut tolerance varies a lot and high doses need progressive training. Over-drinking can cause hyponatremia; for heat see “Personalised Long-Run Fueling” and “Environmental Pace.”',
    sweat_readout:
      'Estimated sweat rate ~{rate} L/h: per hour drink ~{fluid} ml, sodium {sodium} mg, carbs {carb} g; aim to replace ~75% of losses — don’t overdo it.',
    detail_sweat_principle:
      'About 80% of running energy becomes heat, shed mainly by evaporating sweat (~580 kcal per litre evaporated). Faster pace and hotter, more humid air mean more heat and sweat. This tool estimates your sweat rate from heat production and conditions, then converts to fluid/sodium/carbs.',
    detail_sweat_how:
      'Enter weight, pace, distance, temperature and humidity. Use the hourly rates and per-station plan below; aim to replace ~75% of sweat loss (no more). Most accurate is weighing before/after: each 1 kg lost ≈ 1 L sweat.',
    detail_sweat_stages:
      'Fluid: replace ~75% of losses; sodium: sweat sodium ~1 g/L (higher for salty sweaters); carbs: beyond 60–90 min follow the fueling guidance. Little-and-often beats one big gulp.',
    detail_sweat_note:
      'Sweat rate and sweat sodium vary widely (estimates are a starting point). Lots of plain water + heavy sweating risks hyponatremia, so take sodium too; after ~2 weeks of heat acclimation both drop and need re-checking.',
    cool_readout:
      'WBGT {wbgt}°C ({risk}): ice slurry ~{slurry} 30–60 min pre-race; in heat add shade, cold drinks and an ice towel/cooling vest.',
    detail_cool_principle:
      'Heat performance is limited by rising core temperature. Pre-cooling lowers core temperature beforehand, widening the “heat sink” and delaying the critical-temperature point. An ice slurry cools from the inside and is effective and portable.',
    detail_cool_how:
      'Enter weight, temperature and humidity to get heat risk and a slurry dose. Take the slurry 30–60 min pre-race; the higher the WBGT, the more you add shade, cold drinks, an ice towel/cooling vest, and at the extreme reschedule or shorten.',
    detail_cool_stages:
      'Low: hydrate only; Moderate: slurry + shaded warm-up; High: add cold drinks, ice towel, cooling vest; Extreme: cold-water immersion to cool, and seriously weigh rescheduling/shortening/cancelling.',
    detail_cool_note:
      'Cooling fades after the start, so combine with in-race cooling (dousing, shade). A large slurry at once can cause brain-freeze or GI upset — rehearse in training. Stop immediately on any heat-illness signs.',
    glyco_readout:
      'Lift carbs to ~{load} g/kg/day pre-race, peaking near {peak} g, paired with a taper to top off glycogen; only needed for races over 90 min.',
    detail_glyco_principle:
      'Glycogen is the main fuel for hard efforts but stores are limited. Combining a taper with higher carbs for a few days pre-race “supercompensates” muscle and liver glycogen to ~1.5–2× normal, delaying the wall and steadying the back half (Burke 2011).',
    detail_glyco_how:
      'Enter weight, pick a protocol, and get daily carb grams. The bars show the daily intake; spread carbs across 4–6 meals from easy-to-digest sources and taper at the same time to bank glycogen. Only needed for races over 90 min.',
    detail_glyco_stages:
      'Modified Sherman (recommended): no depletion, 3 high-carb days + taper; Classic: deplete then load (harder, riskier); WA: a single-day compressed load (10–12 g/kg in one day).',
    detail_glyco_note:
      'High carbs bring water retention; a short-term 1–2 kg weight rise is normal. High-fibre, high-fat or late large meals can upset the gut — always test your pre-race meal in training first.',
    taper_readout:
      'Taper {weeks} weeks: step volume down to ~{pct}% (race week ~{km} km) while keeping intensity and frequency; typically worth ~1–3%.',
    detail_taper_principle:
      'A taper drops volume, not intensity: cutting total mileage lets accumulated fatigue fade and glycogen/muscle repair top off, while keeping a little high intensity preserves feel and neuromuscular sharpness. Done well it’s worth ~1–3% (Bosquet 2007).',
    detail_taper_how:
      'Enter peak weekly mileage and taper length (1–3 weeks). The bars show each week’s suggested mileage; step volume down but keep the intensity and frequency of sessions — just make each one shorter.',
    detail_taper_stages:
      'Step weekly volume down to ~40–60% of peak (lowest in race week); keep 1–2 short, sharp sessions per week (e.g. shortened threshold/intervals); finish with easy runs + a few strides 2–3 days out.',
    detail_taper_note:
      'The classic mistakes are “full rest” or cutting intensity too — both leave you flat and heavy-legged. Pair the taper with sleep and carbs; a slight weight rise and itchy-to-run legs are normal.',
    rec_readout:
      'Aim for ~{easy} easy days and resume quality around day {hard}; in the first 24 h, carbs + protein, rehydration and sleep matter most.',
    rec_phase_window: 'Golden window',
    rec_phase_easy: 'Easy recovery',
    rec_phase_quality: 'Back to quality',
    detail_rec_principle:
      'Hard racing causes muscle micro-damage, glycogen depletion and systemic inflammation that need time to repair before high intensity again. Recovery days scale with distance, effort and age (≈ 1 day/mile as a conservative ceiling); rushing back to quality risks strains or overtraining.',
    detail_rec_how:
      'Enter distance, effort and age to get suggested easy days and “days before quality.” The phase strip below is the recovery timeline; follow it and use resting HR/HRV, sleep and soreness settling as your green light to add load.',
    detail_rec_stages:
      'First 24 h golden window: carbs + protein, rehydrate, sleep; then several days of full rest or easy active recovery; once past the suggested days, test the waters with one short quality session before returning to normal training.',
    detail_rec_note:
      'Evidence strength: refuel/rehydrate/sleep strongest, then active recovery; cold-water immersion (CWI) helps perceived soreness but may blunt long-term adaptation — fine post-race, sparing in normal training; likewise, avoid routine anti-inflammatory drugs (NSAIDs), which may suppress muscle adaptation (Schoenfeld 2012). See a clinician for abnormal pain.',
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
    gap_maxhr: 'Max HR (optional, bpm)',
    gap_resthr: 'Resting HR (optional, bpm)',
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
    hrv_input_label: 'Morning RMSSD (ms, comma-separated)',
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
    detail_hrv_principle:
      'HRV (measured as morning RMSSD) reflects autonomic recovery. Taking several days’ RMSSD as a personal “normal band” (mean ± 1 SD), today’s position relative to that band reads recovery better than any single absolute value (Plews method).',
    detail_hrv_how:
      'Measure RMSSD each morning under the same conditions (same posture, time, before caffeine). Enter 3–7 comma-separated days with today last. Inside the band → proceed; clearly low → go easy/recovery; high → usually good adaptation, but watch for overload saturation. You can also rate sleep / soreness / stress / mood; these subjective factors blend with the HRV status into a single recommendation — self-report often tracks training load more sensitively than objective markers (Saw 2016).',
    detail_hrv_stages:
      'The shaded band is your normal range (baseline ± 1 SD); the line is daily RMSSD with the last point being today. Trend matters more than one day: a steady decline signals accumulating fatigue; flat or rising signals good recovery.',
    detail_hrv_note:
      'Reliable only with consistent measurement; alcohol, illness, dehydration and stress all affect it. A higher CV means less stability — be conservative. Treat any single day as a hint and align it with how you feel and your sleep. Morning RMSSD is a practical proxy, but nocturnal recordings may track the training response more sensitively (Nuuttila 2024).',
    hrv_wellness_title: 'Subjective wellness (optional; blanks ignored)',
    hrv_sleep_label: 'Sleep quality',
    hrv_soreness_label: 'Muscle soreness',
    hrv_stress_label: 'Stress',
    hrv_mood_label: 'Mood',
    hrv_opt_na: '—',
    hrv_sleep_good: 'Good',
    hrv_sleep_fair: 'Fair',
    hrv_sleep_poor: 'Poor',
    hrv_soreness_none: 'None',
    hrv_soreness_mild: 'Mild',
    hrv_soreness_high: 'Marked',
    hrv_stress_low: 'Low',
    hrv_stress_mid: 'Moderate',
    hrv_stress_high: 'High',
    hrv_mood_good: 'Good',
    hrv_mood_normal: 'Normal',
    hrv_mood_low: 'Low',
    hrv_rec_label: "Today's recommendation",
    hrv_rec_quality: 'Quality session OK',
    hrv_rec_moderate: 'Keep it moderate',
    hrv_rec_easy: 'Easy / recovery',
    hrv_rec_rest: 'Rest / recover',
    hrv_rec_saturation_note:
      '(HRV elevated but subjective state poor — possible parasympathetic saturation or accumulated fatigue; don’t ramp up.)',
    cycle_title: '🌸 Menstrual-Cycle Adjustment',
    hint_cycle_intro:
      'Enter your last period’s first day to auto-derive the cycle day (or type the day directly); accuracy drifts the longer ago that date was.',
    cycle_start_date: 'First day of your last period',
    cycle_derived_day: '(Derived: day {n})',
    cycle_day: 'Cycle day',
    cycle_length: 'Cycle length (days)',
    cycle_dysmenorrhea: 'Period pain',
    cycle_dys_none: 'None',
    cycle_dys_mild: 'Mild',
    cycle_dys_moderate: 'Moderate',
    cycle_dys_severe: 'Severe',
    cycle_mood: 'Mood',
    cycle_mood_normal: 'Normal',
    cycle_mood_good: 'Good',
    cycle_mood_low: 'Low',
    cycle_sleep: 'Sleep (h)',
    cycle_phase_label: 'Current phase',
    menstrual_phase_menstrual: 'Menstrual',
    menstrual_phase_follicular: 'Follicular',
    menstrual_phase_ovulation: 'Ovulation',
    menstrual_phase_luteal: 'Luteal',
    menstrual_advice_menstrual:
      'Symptoms vary widely: train normally (including quality work) if you feel fine; if cramps or fatigue are notable, ease volume to comfort — easy aerobic work and stretching can sometimes relieve cramps.',
    menstrual_advice_follicular:
      'Estrogen rising — many (not all) feel strong with good tolerance; a good window to schedule quality and long runs if you feel good, but go by feel rather than the calendar.',
    menstrual_advice_ovulation:
      'Strength and performance peak for some — a day to push; estrogen peaks and joint laxity may rise slightly around ovulation (its link to injury remains inconclusive, Herzberg 2017), so warm up well.',
    menstrual_advice_luteal:
      'Higher core temp and progesterone → less heat tolerance, the same pace feels harder, and the late (premenstrual) days bring more fatigue: hydrate more, build in recovery, and ease intensity in the heat.',
    menstrual_rec_go: 'Symptoms minimal — train as planned; adjust to your body if needed.',
    menstrual_rec_caution:
      'Some symptoms — lower intensity or shorten the session; prioritise quality and recovery.',
    menstrual_rec_easy: 'Notable symptoms — keep it easy/recovery today, or rest if needed.',
    menstrual_pms_note:
      'Premenstrual (late luteal): mood, sleep and cramps often worsen — stay flexible and prioritise recovery; easy aerobic work can sometimes help mood (Sims & Yeager 2024).',
    menstrual_luteal_fuel:
      'In the luteal phase carb oxidation drops and fat use rises; add a little carbohydrate around quality sessions (Carmichael 2021).',
    menstrual_reds_warn:
      '⚠️ An irregular or absent cycle is a primary warning sign of RED-S (low energy availability); review energy intake vs training load and seek advice if needed.',
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
    alt_readout:
      'Hb mass +{hb}%, VO₂max +{vo2}% ({status}). Race in the first 1–2 days after descent or after ~2–3 weeks; avoid days 5–10.',
    detail_cycle_principle:
      'Estrogen and progesterone rise and fall across the cycle and may affect temperature, perceived effort and recovery. This tool gives a per-phase “starting point.” McNulty 2020’s review stresses that individual variation far exceeds the average group effect.',
    detail_cycle_how:
      'Enter the first day of your last period to auto-derive the current cycle day (it wraps around for a regular cycle), or type the day directly; the date takes precedence when set. See the current phase and its training tweak — the strip below is the cycle timeline (current phase highlighted). Ultimately go by your own symptoms, feel and performance.',
    detail_cycle_stages:
      'Menstrual (symptoms vary — train if comfortable) → Follicular (energy rising, good for quality and volume) → Ovulation (often a peak — push performance) → Luteal (higher temp, more fatigue and heat intolerance — emphasise hydration and recovery).',
    detail_cycle_note:
      'These are starting points, not rules; evidence is mixed and individuals vary widely. Hormonal contraception changes the response. Adjust by symptoms and performance; see a clinician for abnormal bleeding or pain.',
    detail_alt_principle:
      'Low oxygen stimulates red-cell production (EPO); with enough exposure, total haemoglobin mass (Hb mass) rises, oxygen carrying improves and VO₂max increases. The key is sufficient hypoxic exposure hours — the curve below is the idea of Hb accruing with exposure.',
    detail_alt_how:
      'Enter altitude, days, daily live-high hours and protocol to estimate total exposure hours and Hb-mass/VO₂max gains. The effective live-high window is ~2000–3000 m; more daily hours and more days mean more benefit.',
    detail_alt_stages:
      'Common advice: race in the first 1–2 days after descent (residual adaptation, not yet decompensated) or after ~2–3 weeks; avoid days 5–10 (the dip while ventilation and acid-base re-adapt). Individuals vary — test your own response first.',
    detail_alt_note:
      'Numbers are estimates and responders vary widely (Levine 1997; Wilber 2007; Chapman 2014); non-responders are common. Early at altitude sleep and training quality drop — supplement iron and fluids; live-high/train-high risks overtraining, so ease intensity.',
    ref_title: '📚 Science & Training Principles',
    ref_intro:
      'The methodology behind these tools, with sources. Tap “Learn more” under each tool card to expand its principle, how-to, stages and notes.',
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
      'Accuracy & trust: items marked "formula" are exact textbook formulas (VDOT, Tanaka/Gellish max-HR, Karvonen, Minetti grade, Riegel, 30–90 g/h carbs, 7.5 g/kg ice slurry, Mujika taper) and are locked by unit tests; items marked "estimate" (heat slowdown, sweat rate, cadence band, recovery days, altitude gains) are literature-grounded models with large individual variation — treat them as a starting point, not a guarantee. Altitude/HRV/menstrual responses especially vary by person.',
    vdot_log_btn: '＋ Log this result to Fitness Trend',
    trend_title: '📈 Fitness Trend',
    hint_trend_intro: 'Log past races to track VDOT over time and per-distance personal bests',
    trend_date: 'Date',
    trend_dist: 'Distance',
    trend_time: 'Time (m:ss / h:mm:ss)',
    trend_add: '＋ Add entry',
    trend_empty: 'No entries yet — add a race result to start tracking.',
    trend_delete: 'Delete entry',
    trend_readout:
      'Best VDOT {best}, latest {recent}. The long-term direction is more reliable than any single point.',
    explain_trend:
      'Log each race result; it converts to VDOT and plots your fitness trend over time plus per-distance PBs. Stored on this device; synced across devices when signed in.',
    detail_trend_principle:
      'Each result converts to VDOT (effective VO₂max) via the Daniels–Gilbert formula. Tracking VDOT over time reflects fitness change across distances better than finish time alone.',
    detail_trend_how:
      'Enter date, distance and time then "Add entry", or use "Log this result" on the VDOT tool above. Below: the entry list, a VDOT trend line and per-distance PBs. Any row can be deleted.',
    detail_trend_note:
      'VDOT is estimated from a single result and is affected by conditions, weather and course; trust the long-term direction over single points. Data lives only in your browser (synced to your backend when signed in).',
    readiness_title: '🧭 Daily Readiness',
    hint_readiness_intro:
      'Combines the ACWR, HRV, Recovery and subjective-wellness inputs below; unfilled factors are not scored',
    readiness_level_label: 'Readiness',
    readiness_none: 'Not enough data yet — fill any of ACWR / HRV / Recovery below.',
    readiness_na: 'n/a (unfilled)',
    readiness_factor_hrv: 'HRV (autonomic)',
    readiness_factor_acwr: 'ACWR (load)',
    readiness_factor_recovery: 'Recovery need',
    readiness_factor_wellness: 'Subjective wellness',
    readiness_state_good: '🟢 Good',
    readiness_state_ok: '🟡 Fair',
    readiness_state_bad: '🔴 Poor',
    readiness_level_go: 'Ready for quality training',
    readiness_level_caution: 'Caution — keep it moderate',
    readiness_level_easy: 'Keep it easy',
    readiness_level_rest: 'Rest / recover',
    readiness_readout:
      'Today’s readiness {score}/100: {level}. A heuristic blend — combine with how you feel.',
    explain_readiness:
      'Blends HRV (autonomic), ACWR (load / injury risk), recovery need and subjective wellness into one daily readiness. A transparent heuristic, not a validated index — for guidance; go by feel and professional judgement.',
    detail_readiness_principle:
      'Each signal maps to a 0–100 sub-score (HRV normal/high/low; ACWR sweet→high-risk; recovery days needed; subjective wellness from sleep/soreness/stress/mood). Readiness is the average of available factors; unfilled ones are not scored. Higher = better suited to quality work.',
    detail_readiness_how:
      'Fill ACWR weekly mileage, morning HRV and post-race recovery below; this card auto-combines them into today’s readiness and advice. One or two filled is fine — missing ones show n/a.',
    detail_readiness_note:
      'A transparent heuristic weighting, not a clinical or validated index; individuals vary widely. Combine with subjective feel, sleep and life stress; seek professional advice for anomalies.'
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

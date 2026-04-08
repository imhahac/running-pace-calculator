export const CONVERSION_FACTORS = {
    km_to_mile: 0.621371192,
    mile_to_km: 1.609344
};
export const RIEGEL_EXPONENT = 1.06;
export const TRAINING_ZONES = {
    easy: 1.2,
    marathon: 1.05,
    threshold: 0.95,
    interval: 0.90,
    repetition: 0.85
};
export const DEFAULT_STATE = {
    mode: 'pace',
    paceUnit: 'km',
    treadmillUnit: 'km',
    venue: 'standard_400',
    lane: 400,
    distance: 42195,
    theme: 'dark',
    lang: 'zh',
    splitMode: 'track'
};
export const VENUES = {
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
export const TRANSLATIONS = {
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
export const HALF_MARATHON_METERS = 21097.5;
export const FULL_MARATHON_METERS = 42195;
export const ROAD_SPLIT_DISTANCES = (() => {
    const distances = [];
    for (let k = 2.5; k <= 40; k += 2.5) {
        distances.push(k * 1000);
    }
    distances.push(HALF_MARATHON_METERS);
    distances.push(FULL_MARATHON_METERS);
    return distances.sort((a, b) => a - b);
})();
export const MODE_PLACEHOLDERS = {
    pace: ['4', '30'],
    track: '96',
    treadmill: '12',
    finish_time: 'm:s / h:m:s'
};
export const STORAGE_KEY = 'runningPaceNoteState';
export const THEME_STORAGE_KEY = 'theme';
export const LANG_STORAGE_KEY = 'lang';

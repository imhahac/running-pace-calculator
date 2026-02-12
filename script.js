/**
 * RunningPaceNote Logic
 * Refactored to modern ES6+ standards.
 */

// Venues Data
const VENUES = {
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

// Translations
const TRANSLATIONS = {
    zh: {
        helper: "任意輸入、即刻換算",
        mode_pace: "配速",
        mode_track: "田徑場",
        mode_treadmill: "跑步機",
        mode_finish: "完成",
        label_sec_lap: "秒/圈",
        lap_2: "2圈", lap_3: "3圈", lap_4: "4圈", lap_5: "5圈",
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
        lap_2: "2 laps", lap_3: "3 laps", lap_4: "4 laps", lap_5: "5 laps",
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

// Global State
const state = {
    mode: 'pace', // pace, track, treadmill, finish_time
    paceUnit: 'km', // km, mile
    treadmillUnit: 'km', // km, mile
    venue: 'standard_400',
    lane: 400, // meters
    distance: 42195, // meters (default Marathon)
    theme: 'dark',
    lang: 'zh', // zh, en
    splitMode: 'track' // track, road
};

// Formatting & Math Helpers
const TimeFormatter = {
    // Convert seconds to "mm:ss" or "h:mm:ss"
    format: (seconds) => {
        if (!isFinite(seconds) || isNaN(seconds)) return "";

        let s = Math.round(seconds);
        const h = Math.floor(s / 3600);
        s %= 3600;
        const m = Math.floor(s / 60);
        s %= 60;

        const pad = (n) => n.toString().padStart(2, '0');

        if (h > 0) {
            return `${h}:${pad(m)}:${pad(s)}`;
        } else {
            return `${pad(m)}:${pad(s)}`;
        }
    },
    // Parse "m:s" or "h:m:s" to seconds
    parse: (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.toString().split(':').map(Number);
        if (parts.some(isNaN)) return 0;

        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else {
            return parts[0];
        }
    }
};

const MathHelper = {
    round: (num, precision = 0) => {
        const factor = Math.pow(10, precision);
        return Math.round(num * factor) / factor;
    }
}

// Unit Conversion
const STEPS_PER_MILE = 1.609344;
const STEPS_PER_KM = 0.621371192;

const Converter = {
    mpkToMpm: (sec) => sec * STEPS_PER_MILE,
    mpmToMpk: (sec) => sec * STEPS_PER_KM,
    mphToKph: (val) => val * STEPS_PER_MILE,
    kphToMph: (val) => val * STEPS_PER_KM,
};

// DOM Elements
const Elements = {
    inputs: {
        paceMin: document.getElementById('pace_input'),
        paceSec: document.getElementById('pace_input2'),
        track: document.getElementById('track_input'),
        treadmill: document.getElementById('treadmill_input'),
        finishTime: document.getElementById('finish_time_input'),
    },
    radios: document.querySelectorAll('input[name="type"]'),
    laneSelect: document.getElementById('laneNumber'),
    venueSelect: document.getElementById('venue-select'),
    distanceSelect: document.getElementById('dropdown'),
    buttons: {
        mile: document.getElementById('mile-button'),
        mileSwitchText: document.getElementById('switch'),
        perHour: document.getElementById('perHour-button'),
        perHourSwitchText: document.getElementById('switch2'),
        slide: document.getElementById('slide-button'),
        info: document.getElementById('slide-button2'),
        theme: document.getElementById('theme-toggle'),
    },
    displays: {
        unit: document.getElementById('unit'),
        unit2: document.getElementById('unit2'),
        laneLength: document.getElementById('lane-length2'),
        themeIcon: document.getElementById('theme-icon-text'),
        splits: {
            m100: document.getElementById('m100_input'),
            m200: document.getElementById('m200_input'),
            m300: document.getElementById('m300_input'),
            m400: document.getElementById('m400_input'),
            m800: document.getElementById('m800_input'),
            m1200: document.getElementById('m1200_input'),
            m1600: document.getElementById('m1600_input'),
            m2000: document.getElementById('m2000_input'),
            inc200: document.getElementById('m200_increment'),
            inc300: document.getElementById('m300_increment'),
            inc400: document.getElementById('m400_increment'),
            lapsText: {
                two: document.getElementById('twolaps'),
                three: document.getElementById('threelaps'),
                four: document.getElementById('fourlaps'),
                five: document.getElementById('fivelaps'),
            }
        },
        container: document.getElementById('container'),
        infoContainer: document.getElementById('container2'),
    }
};

// Core Calculation
function calculate(sourceId) {
    // Highlight active input
    highlightInput(sourceId);

    // Gather Inputs
    let paceMin = parseFloat(Elements.inputs.paceMin.value) || 0;
    let paceSec = parseFloat(Elements.inputs.paceSec.value) || 0;
    let trackSec = parseFloat(Elements.inputs.track.value) || 0;
    let treadmillVal = parseFloat(Elements.inputs.treadmill.value) || 0;
    let finishTimeVal = Elements.inputs.finishTime.value;

    let secondsPerLap = 0;

    // Determine Base Speed (Seconds per Lap) based on Mode
    if (state.mode === 'pace') {
        let paceSeconds = paceMin * 60 + paceSec;
        if (state.paceUnit === 'mile') {
            paceSeconds = Converter.mpmToMpk(paceSeconds);
        }
        // Pace is min/km => seconds/km. 
        secondsPerLap = (state.lane * paceSeconds) / 1000;

    } else if (state.mode === 'track') {
        secondsPerLap = trackSec;

    } else if (state.mode === 'treadmill') {
        let speedKph = treadmillVal;
        if (state.treadmillUnit === 'mile') {
            speedKph = Converter.mphToKph(treadmillVal);
        }
        if (speedKph > 0) {
            secondsPerLap = (state.lane * 3.6) / speedKph;
        }

    } else if (state.mode === 'finish_time') {
        let totalSeconds = TimeFormatter.parse(finishTimeVal);
        if (state.distance > 0) {
            secondsPerLap = (state.lane * totalSeconds) / state.distance;
        }
    }

    if (secondsPerLap <= 0 || !isFinite(secondsPerLap)) return;

    // Update UI based on calculated secondsPerLap
    updateUI(secondsPerLap, sourceId);
}

function updateUI(secondsPerLap, sourceId) {
    // 1. Update Track (if not source)
    if (state.mode !== 'track') {
        Elements.inputs.track.value = MathHelper.round(secondsPerLap, 2);
    }

    // 2. Update Pace (if not source)
    if (state.mode !== 'pace') {
        let paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
        let finalPaceSeconds = paceSecondsPerKm;

        if (state.paceUnit === 'mile') {
            finalPaceSeconds = Converter.mpkToMpm(paceSecondsPerKm);
        }

        let formatted = TimeFormatter.format(finalPaceSeconds);
        let [m, s] = formatted.split(':');
        // Handle case where format might be h:m:s
        if (formatted.split(':').length === 3) {
            let parts = formatted.split(':');
            m = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            s = parts[2];
        }

        Elements.inputs.paceMin.value = m;
        Elements.inputs.paceSec.value = s;
    }

    // 3. Update Treadmill (if not source)
    if (state.mode !== 'treadmill') {
        let kph = (state.lane * 3.6) / secondsPerLap;
        let val = kph;
        if (state.treadmillUnit === 'mile') {
            val = Converter.kphToMph(kph);
        }
        Elements.inputs.treadmill.value = MathHelper.round(val, 2);
    }

    // 4. Update Finish Time (if not source)
    if (state.mode !== 'finish_time') {
        let totalTime = state.distance * (secondsPerLap / state.lane);
        Elements.inputs.finishTime.value = TimeFormatter.format(totalTime);
    }

    // 5. Update Splits (Always)
    updateSplits(secondsPerLap);

    // 6. Update Zones
    // Convert to sec/km for zone logic
    let paceSecondsPerKm = (secondsPerLap * 1000) / state.lane;
    updateZones(paceSecondsPerKm);
}

function updateSplits(lapSeconds) {
    const perMeter = lapSeconds / state.lane;

    // Splits based on distance
    const m100 = perMeter * 100;
    const m200 = perMeter * 200;
    const m300 = perMeter * 300;
    const m400 = perMeter * 400;

    Elements.displays.splits.m100.value = TimeFormatter.format(m100);
    Elements.displays.splits.m200.value = TimeFormatter.format(m200);
    Elements.displays.splits.m300.value = TimeFormatter.format(m300);
    Elements.displays.splits.m400.value = TimeFormatter.format(m400);

    Elements.displays.splits.inc200.value = `(+${MathHelper.round(m200 - m100, 1)})`;
    Elements.displays.splits.inc300.value = `(+${MathHelper.round(m300 - m200, 1)})`;
    Elements.displays.splits.inc400.value = `(+${MathHelper.round(m400 - m300, 1)})`;

    // Multi-laps (Full laps of current lane)
    Elements.displays.splits.m800.value = TimeFormatter.format(lapSeconds * 2);
    Elements.displays.splits.m1200.value = TimeFormatter.format(lapSeconds * 3);
    Elements.displays.splits.m1600.value = TimeFormatter.format(lapSeconds * 4);
    Elements.displays.splits.m2000.value = TimeFormatter.format(lapSeconds * 5);

    // Update Road Splits if active
    if (state.splitMode === 'road') {
        updateRoadSplits(lapSeconds);
    }
}

function updateRoadSplits(lapSeconds) {
    const roadContainer = document.getElementById('road-detail');
    if (!roadContainer) return;

    roadContainer.innerHTML = ''; // Clear current
    const t = TRANSLATIONS[state.lang];

    // Insert Half Marathon correctly?
    // 20k -> 21.0975k -> 22.5k
    // My loop above skips 21.0975.
    // Let's do a strict list generation.
    // 2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, (21.0975), 22.5, 25...
    // Let's rewrite generation for better list.

    roadContainer.innerHTML = ''; // Clear again



    // Calculate Pace per Meter
    // lapSeconds is time for state.lane (usually 400m)
    const perMeter = lapSeconds / state.lane;

    const distances = [];
    for (let k = 2.5; k <= 40; k += 2.5) {
        distances.push(k * 1000);
    }
    // Sort and insert Half (21097.5) and Full (42195)
    distances.push(21097.5);
    distances.push(42195);

    // Sort
    distances.sort((a, b) => a - b);

    // Dedup if 2.5 step hits exact half? (It doesn't)

    distances.forEach(d => {
        // Calculate
        const time = d * perMeter;

        const row = document.createElement('div');
        row.className = 'road-row';

        let distLabel = (d / 1000) + t.road_km_suffix;
        let isWater = true;

        // Custom Labels
        if (Math.abs(d - 21097.5) < 1) {
            distLabel = t.half_marathon || "Half";
            isWater = false; // Usually aid stations are at standard intervals, but major markers are key
        }
        if (Math.abs(d - 42195) < 1) {
            distLabel = t.dist_marathon || "Full"; // or t.road_finish
            isWater = false;
        }

        // Water Logic: typically every 2.5k or 5k
        // Our list is mostly 2.5k steps. 
        // Half (21.1) is not a 2.5 step.
        // Full (42.2) is not a 2.5 step. 

        const waterHtml = isWater ? `<span class="water-icon">${t.label_water}</span>` : '';

        row.innerHTML = `
            <div>${waterHtml}<span class="road-dist">${distLabel}</span></div>
            <div class="road-time">${TimeFormatter.format(time)}</div>
        `;

        // Highlight 5K steps and Major
        if (d % 5000 === 0 || Math.abs(d - 42195) < 1 || Math.abs(d - 21097.5) < 1) {
            row.style.borderLeft = '3px solid var(--highlight)';
            row.style.background = 'var(--option-bg)';
        }

        roadContainer.appendChild(row);
    });
}

// UI Helpers
function highlightInput(targetId) {
    Object.values(Elements.inputs).forEach(el => el.style.color = '');
    const el = document.getElementById(targetId);
    if (el) el.style.color = 'var(--highlight)'; // Use CSS variable color
    if (targetId.startsWith('pace')) {
        Elements.inputs.paceMin.style.color = 'var(--highlight)';
        Elements.inputs.paceSec.style.color = 'var(--highlight)';
    }
}

function setMode(newMode) {
    state.mode = newMode;
    document.querySelector(`input[name="type"][value="${newMode}"]`).checked = true;
    document.querySelectorAll('.row').forEach(el => el.classList.remove('selected'));
    document.getElementById(`${newMode}_icon`).classList.add('selected');

    clearPlaceholders();
    const ph = {
        pace: ['4', '30'],
        track: '96',
        treadmill: '12',
        finish_time: 'm:s / h:m:s'
    };

    if (newMode === 'pace') {
        Elements.inputs.paceMin.placeholder = ph.pace[0];
        Elements.inputs.paceSec.placeholder = ph.pace[1];
        highlightInput('pace_input');
    } else if (newMode === 'track') {
        Elements.inputs.track.placeholder = ph.track;
        highlightInput('track_input');
    } else if (newMode === 'treadmill') {
        Elements.inputs.treadmill.placeholder = ph.treadmill;
        highlightInput('treadmill_input');
    } else if (newMode === 'finish_time') {
        Elements.inputs.finishTime.placeholder = ph.finish_time;
        highlightInput('finish_time_input');
    }
}

function clearPlaceholders() {
    Object.values(Elements.inputs).forEach(el => el.placeholder = '');
}

// Venue & Lane Logic
function populateVenues() {
    Elements.venueSelect.innerHTML = '';
    const t = TRANSLATIONS[state.lang];

    // Dynamic venue names based on lang
    // Needs way to map venue ID to trans key
    const venueMap = {
        'standard_400': t.venue_400,
        'warmup_300': t.venue_300
    };

    Object.values(VENUES).forEach(venue => {
        const opt = document.createElement('option');
        opt.value = venue.id;
        opt.textContent = venueMap[venue.id] || venue.name;
        Elements.venueSelect.appendChild(opt);
    });
    // Set initial
    Elements.venueSelect.value = state.venue;
    updateLanes();
}

function updateLanes() {
    const venue = VENUES[state.venue];
    Elements.laneSelect.innerHTML = '';
    const t = TRANSLATIONS[state.lang];

    venue.lanes.forEach(lane => {
        const opt = document.createElement('option');
        opt.value = lane.dist;
        // Label: "第1道" vs "Lane 1"
        opt.textContent = `${t.lane_prefix}${lane.id}${t.lane_suffix}`;
        Elements.laneSelect.appendChild(opt);
    });

    // Default to Lane 1 if possible
    // Wait, if we just repopulated, value might be lost if we don't preserve it.
    // Ideally we preserve state.lane
    if (state.lane && venue.lanes.find(l => l.dist === state.lane)) {
        Elements.laneSelect.value = state.lane;
    } else {
        Elements.laneSelect.value = venue.lanes[0].dist;
    }

    updateLaneState();
}

function updateLaneState() {
    state.lane = parseInt(Elements.laneSelect.value);
    Elements.displays.laneLength.textContent = `${state.lane}m`;

    // Proactively update splits text label (Lane * laps)
    const venue = VENUES[state.venue];
    Elements.displays.splits.lapsText.two.innerHTML = `&emsp;${state.lane * 2}`;
    Elements.displays.splits.lapsText.three.innerHTML = `${state.lane * 3}`;
    Elements.displays.splits.lapsText.four.innerHTML = `${state.lane * 4}`;
    Elements.displays.splits.lapsText.five.innerHTML = `${state.lane * 5}`;

    // Recalculate
    const currentInput = getInputIdForMode(state.mode);
    if (document.getElementById(currentInput).value) {
        calculate(currentInput);
    }
}

// Theme Logic
function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    Elements.displays.themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('theme', state.theme);
}

function initTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    state.theme = saved;
    document.documentElement.setAttribute('data-theme', state.theme);
    Elements.displays.themeIcon.textContent = state.theme === 'dark' ? '🌙' : '☀️';
}

// Language Logic
function toggleLanguage() {
    state.lang = state.lang === 'zh' ? 'en' : 'zh';
    updateLanguage(state.lang);
    saveState(); // Or save lang separately
    localStorage.setItem('lang', state.lang);
}

function updateLanguage(lang) {
    const t = TRANSLATIONS[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Update dynamic content (Venues/Lanes)
    populateVenues();
    // Lane labels are updated in populateVenues -> updateLanes

    // Update Button Text
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) langBtn.textContent = lang === 'zh' ? '中/EN' : 'EN/中';

    // Update Document Title?
    document.title = lang === 'zh' ? 'RunningPaceNote 配速計算機' : 'RunningPaceNote Calculator';
}

function initLanguage() {
    const saved = localStorage.getItem('lang') || 'zh';
    state.lang = saved;
    updateLanguage(state.lang);
}

function getInputIdForMode(mode) {
    switch (mode) {
        case 'pace': return 'pace_input';
        case 'track': return 'track_input';
        case 'treadmill': return 'treadmill_input';
        case 'finish_time': return 'finish_time_input';
        default: return 'pace_input';
    }
}

// Local Storage Logic
function saveState() {
    const dataToSave = {
        state: state,
        inputs: {
            paceMin: Elements.inputs.paceMin.value,
            paceSec: Elements.inputs.paceSec.value,
            track: Elements.inputs.track.value,
            treadmill: Elements.inputs.treadmill.value,
            finishTime: Elements.inputs.finishTime.value,
        }
    };
    localStorage.setItem('runningPaceNoteState', JSON.stringify(dataToSave));
}

function loadState() {
    const saved = localStorage.getItem('runningPaceNoteState');
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);
        // Restore State
        if (data.state) {
            Object.assign(state, data.state);
        }
        // Restore Inputs
        if (data.inputs) {
            Elements.inputs.paceMin.value = data.inputs.paceMin || '';
            Elements.inputs.paceSec.value = data.inputs.paceSec || '';
            Elements.inputs.track.value = data.inputs.track || '';
            Elements.inputs.treadmill.value = data.inputs.treadmill || '';
            Elements.inputs.finishTime.value = data.inputs.finishTime || '';
        }
        if (data.state && data.state.splitMode) {
            state.splitMode = data.state.splitMode;
        }
        return true;
    } catch (e) {
        console.error("Failed to load state", e);
        return false;
    }
}


// Logic for Copy
function copyResults() {
    const t = TRANSLATIONS[state.lang];
    const paceText = `${Elements.inputs.paceMin.value}:${Elements.inputs.paceSec.value}/${state.paceUnit}`;
    const trackText = `${Elements.inputs.track.value}s (${state.lane}m)`;
    const finishText = Elements.inputs.finishTime.value;

    const textToCopy = `${t.copy_header}
--------------------
${t.copy_pace} ${paceText}
${t.copy_track} ${trackText}
${t.copy_finish} ${finishText}
--------------------
Powered by RunningPaceNote`;

    navigator.clipboard.writeText(textToCopy).then(() => {
        const btn = document.getElementById('copy-btn');
        const originalText = btn.textContent; // Use textContent to preserve icon if separates
        // But formatting innerHTML with icon is better
        // The original logic replaced innerHTML.
        // Let's rely on updateLanguage to restore text properly if needed,
        // or just use translation key for success message.
        btn.textContent = t.copy_success;
        setTimeout(() => {
            // Restore text from translation
            btn.textContent = t.btn_copy;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy', err);
        alert(t.copy_fail);
    });
}

// Logic for Training Zones (VDOT approximations)
function updateZones(secondsPerKm) {
    if (!secondsPerKm || secondsPerKm <= 0) return;

    // Approximate percentages of 5K pace (very rough VDOT adaptation)
    // Actually simpler: 
    // Easy: 110-125% of 5K pace? Or simply Pace + X seconds.
    // Let's use standard multipliers for simplicity if VDOT table is too large.
    // Jack Daniels:
    // E-pace is roughly 75-100s/km slower than M-pace. M-pace is T-pace + 15s/km?
    // Let's use simple logic: "Current Pace" implies "Goal Race Pace" or "VDOT"?
    // The user input "Pace" could be anything.
    // Let's assume the user entered their "5K Race Pace" or "Threshold Pace"? 
    // Usually user inputs "Marathon Pace" or just "Training Pace".
    // 
    // BETTER APPROACH: "Current Pace" IS the reference.
    // We can't know if it's 5K or Marathon.
    // Let's assume the current input IS the "Easy" pace? No.
    // Let's assume the current input is the VDOT reference pace (e.g. 5K/10K).
    // The Requirement says: "Input Target Pace -> Calculate Zones".
    // So if I put 5:00/km (Target), what is Easy?
    // Let's assume input is **Marathon Pace (M)** as a middle ground? Or **Threshold (T)**?
    // Most calculators ask for a recent race time to calculate VDOT.
    // Let's simplified: 
    // E (Easy): Pace * 1.25
    // M (Marathon): Pace * 1.1
    // T (Threshold): Pace * 1.05
    // I (Interval): Pace * 0.95
    // R (Repetition): Pace * 0.9
    // WAIT, this assumes input is... something in the middle.
    // Let's assume the input is "VDOT Reference" (roughly 5K pace).
    // E-Pace: +90s ~ +120s / km
    // M-Pace: +30s ~ +45s / km
    // T-Pace: +15s ~ +20s / km
    // I-Pace: 0s (Reference 5K approx)
    // R-Pace: -15s / km

    // Let's try: Input = Reference Pace (VDOT ~= 5K pace)
    const ref = secondsPerKm;

    const fmt = (s) => TimeFormatter.format(s);

    // E: +60s to +90s
    document.getElementById('zone-e').textContent = `${fmt(ref + 60)} - ${fmt(ref + 90)}`;
    // M: +30s to +45s
    document.getElementById('zone-m').textContent = `${fmt(ref + 25)} - ${fmt(ref + 45)}`;
    // T: +10s to +20s
    document.getElementById('zone-t').textContent = `${fmt(ref + 10)} - ${fmt(ref + 20)}`;
    // I: -10s to +0s
    document.getElementById('zone-i').textContent = `${fmt(ref - 10)} - ${fmt(ref)}`;
    // R: -20s to -10s
    document.getElementById('zone-r').textContent = `${fmt(ref - 20)} - ${fmt(ref - 10)}`;
}

// Logic for Race Prediction (Riegel)
function calculatePrediction() {
    const dist = parseFloat(document.getElementById('pred-dist-select').value);
    const timeStr = document.getElementById('pred-time-input').value;
    const timeSec = TimeFormatter.parse(timeStr);

    if (!dist || !timeSec) return;

    // T2 = T1 * (D2 / D1)^1.06
    const predict = (d2) => {
        const t2 = timeSec * Math.pow((d2 / dist), 1.06);
        return TimeFormatter.format(t2);
    };

    document.getElementById('pred-5k').textContent = predict(5000);
    document.getElementById('pred-10k').textContent = predict(10000);
    document.getElementById('pred-half').textContent = predict(21097.5);
    document.getElementById('pred-full').textContent = predict(42195);
}


// UI Helpers
// ... (previous highlights etc)

// Event Listeners
function initEventListeners() {
    // ... existing listeners ...

    // Copy Button
    const copyBtn = document.getElementById('copy-btn');
    if (copyBtn) copyBtn.addEventListener('click', copyResults);

    // Advanced Tools Toggle
    const toolsBtn = document.getElementById('toggle-tools');
    const toolsContainer = document.getElementById('advanced-tools');
    if (toolsBtn && toolsContainer) {
        toolsBtn.addEventListener('click', () => {
            toolsContainer.classList.toggle('SlideDown');
        });
    }

    // Race Predictor
    const predDist = document.getElementById('pred-dist-select');
    const predTime = document.getElementById('pred-time-input');
    if (predDist && predTime) {
        predDist.addEventListener('change', calculatePrediction);
        predTime.addEventListener('keyup', calculatePrediction);
    }

    // ... existing radios etc ...
    // 1. Radio Buttons (Mode Switch)
    Elements.radios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            setMode(e.target.value);
            const inputId = getInputIdForMode(e.target.value);
            if (document.getElementById(inputId).value) {
                calculate(inputId);
            }
            saveState(); // Save on mode change
        });

        // Also support clicking the div/icon to select
        const iconDiv = document.getElementById(`${radio.value}_icon`);
        if (iconDiv) {
            iconDiv.addEventListener('click', () => {
                radio.checked = true;
                setMode(radio.value);
                saveState(); // Save on mode change
            });
        }
    });

    // 2. Inputs (Calculation)
    Object.entries(Elements.inputs).forEach(([key, el]) => {
        el.addEventListener('keyup', (e) => {
            calculate(e.target.id);
            saveState();
        });
        el.addEventListener('change', (e) => {
            calculate(e.target.id);
            saveState();
        });
        el.addEventListener('click', (e) => {
            const modeMap = {
                paceMin: 'pace', paceSec: 'pace',
                track: 'track',
                treadmill: 'treadmill',
                finishTime: 'finish_time'
            };
            const newMode = modeMap[key];
            if (newMode && newMode !== state.mode) {
                setMode(newMode);
                saveState();
            }
        });
    });

    // 3. Lane Select
    Elements.laneSelect.addEventListener('change', (e) => {
        updateLaneState();
        saveState();
    });

    // 3.1 Venue Select
    Elements.venueSelect.addEventListener('change', (e) => {
        state.venue = e.target.value;
        updateLanes();
        saveState();
    });

    // 4. Distance Select
    Elements.distanceSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val) state.distance = parseFloat(val);
        calculate(getInputIdForMode(state.mode));
        saveState();
    });

    // 5. Toggle Buttons
    Elements.buttons.mile.addEventListener('click', () => {
        state.paceUnit = state.paceUnit === 'km' ? 'mile' : 'km';
        Elements.displays.unit.textContent = state.paceUnit === 'km' ? '/km' : '/mile';
        Elements.buttons.mileSwitchText.textContent = state.paceUnit === 'km' ? '/mile' : '/km';
        calculate(getInputIdForMode(state.mode));
        saveState();
    });

    Elements.buttons.perHour.addEventListener('click', () => {
        state.treadmillUnit = state.treadmillUnit === 'km' ? 'mile' : 'km';
        Elements.displays.unit2.textContent = state.treadmillUnit === 'km' ? 'km/h' : 'mph';
        Elements.buttons.perHourSwitchText.textContent = state.treadmillUnit === 'km' ? 'mile/h' : 'km/h';
        calculate(getInputIdForMode(state.mode));
        saveState();
    });

    // 6. Slide Button (Splits)
    Elements.buttons.slide.addEventListener('click', () => {
        Elements.displays.container.classList.toggle('SlideDown');
    });

    // 7. Info Button
    Elements.buttons.info.addEventListener('click', () => {
        Elements.displays.infoContainer.classList.toggle('SlideDown');
    });

    // 8. Theme Toggle
    Elements.buttons.theme.addEventListener('click', () => {
        toggleTheme();
    });

    // 9. Language Toggle
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // 10. Split Mode Toggle
    const btnTrack = document.getElementById('toggle-track');
    const btnRoad = document.getElementById('toggle-road');
    if (btnTrack && btnRoad) {
        btnTrack.addEventListener('click', () => setSplitMode('track'));
        btnRoad.addEventListener('click', () => setSplitMode('road'));
    }
}

function setSplitMode(mode) {
    state.splitMode = mode;
    saveState();
    updateSplitUI();
}

function updateSplitUI() {
    const btnTrack = document.getElementById('toggle-track');
    const btnRoad = document.getElementById('toggle-road');
    const divTrack = document.getElementById('split-detail');
    const divRoad = document.getElementById('road-detail');

    if (state.splitMode === 'track') {
        btnTrack.classList.add('active');
        btnRoad.classList.remove('active');
        divTrack.style.display = 'flex'; // or whatever flex style
        divRoad.style.display = 'none';
    } else {
        btnTrack.classList.remove('active');
        btnRoad.classList.add('active');
        divTrack.style.display = 'none';
        divRoad.style.display = 'grid';
    }

    // Trigger recalc to populate if needed, or just refresh view
    // Ideally we just call updateUI or specifically updateRoadSplits if we have data
    // We can fetch current secondsPerLap via a hack or store it?
    // Let's just store `lastSecondsPerLap` in state or global var to re-render without full recalc?
    // Or just re-calculate from inputs.
    const inputId = getInputIdForMode(state.mode);
    if (document.getElementById(inputId).value) {
        calculate(inputId);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initLanguage(); // Localization first
    populateVenues(); // Init venues first
    initTheme();

    // Try to load state
    if (loadState()) {
        // If state loaded, we need to sync UI elements
        // 1. Sync Mode
        setMode(state.mode);

        // 2. Sync Units
        Elements.displays.unit.textContent = state.paceUnit === 'km' ? '/km' : '/mile';
        Elements.buttons.mileSwitchText.textContent = state.paceUnit === 'km' ? '/mile' : '/km';

        Elements.displays.unit2.textContent = state.treadmillUnit === 'km' ? 'km/h' : 'mph';
        Elements.buttons.perHourSwitchText.textContent = state.treadmillUnit === 'km' ? 'mile/h' : 'km/h';

        // 3. Sync Venue/Lane
        Elements.venueSelect.value = state.venue;
        updateLanes(); // This will reset lane to default of venue or... wait
        // UpdateLanes resets lane select innerHTML. We need to set value again if it was loaded
        Elements.laneSelect.value = state.lane;
        updateLaneState(); // Update lane display text

        // 4. Trigger Calculation based on loaded mode's input
        const inputId = getInputIdForMode(state.mode);
        if (document.getElementById(inputId).value) {
            calculate(inputId);
        }
    } else {
        setMode('pace');
        // Initialize with default 4:30 pace to avoid 0:00 issues
        Elements.inputs.paceMin.value = '4';
        Elements.inputs.paceSec.value = '30';
        calculate('pace_input');
    }

    updateSplitUI(); // Ensure toggle state is correct

    initEventListeners();
});

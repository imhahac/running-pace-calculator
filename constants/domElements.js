export function initializeDOMElements() {
    const elements = {
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
            zones: {
                e: document.getElementById('zone-e'),
                m: document.getElementById('zone-m'),
                t: document.getElementById('zone-t'),
                i: document.getElementById('zone-i'),
                r: document.getElementById('zone-r'),
            },
            prediction: {
                k5: document.getElementById('pred-5k'),
                k10: document.getElementById('pred-10k'),
                half: document.getElementById('pred-half'),
                full: document.getElementById('pred-full'),
            },
            container: document.getElementById('container'),
            infoContainer: document.getElementById('container2'),
        }
    };
    return elements;
}
export function getInputElementByMode(mode) {
    const elements = getDOMCache();
    switch (mode) {
        case 'pace':
            return elements.inputs.paceMin;
        case 'track':
            return elements.inputs.track;
        case 'treadmill':
            return elements.inputs.treadmill;
        case 'finish_time':
            return elements.inputs.finishTime;
        default:
            return null;
    }
}
let domCache = null;
export function getDOMCache() {
    if (!domCache) {
        domCache = initializeDOMElements();
    }
    return domCache;
}
export function getInputIdForMode(mode) {
    switch (mode) {
        case 'pace':
            return 'pace_input';
        case 'track':
            return 'track_input';
        case 'treadmill':
            return 'treadmill_input';
        case 'finish_time':
            return 'finish_time_input';
        default:
            return 'pace_input';
    }
}

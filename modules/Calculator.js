import { RIEGEL_EXPONENT, TRAINING_ZONES, ROAD_SPLIT_DISTANCES } from '../constants/index.js';
import TimeFormatter from './TimeFormatter.js';
import Converter from './Converter.js';
export class Calculator {
    static calculateSecondsPerLap(mode, state, paceMin = 0, paceSec = 0, trackSec = 0, treadmillVal = 0, finishTimeVal = '') {
        let secondsPerLap = 0;
        if (mode === 'pace') {
            let paceSeconds = paceMin * 60 + paceSec;
            if (state.paceUnit === 'mile') {
                paceSeconds = Converter.paceMileToKm(paceSeconds);
            }
            secondsPerLap = (state.lane * paceSeconds) / 1000;
        }
        else if (mode === 'track') {
            secondsPerLap = trackSec;
        }
        else if (mode === 'treadmill') {
            let speedKph = treadmillVal;
            if (state.treadmillUnit === 'mile') {
                speedKph = Converter.mphToKph(treadmillVal);
            }
            if (speedKph > 0) {
                secondsPerLap = (state.lane * 3.6) / speedKph;
            }
        }
        else if (mode === 'finish_time') {
            let totalSeconds = TimeFormatter.parse(finishTimeVal);
            if (state.distance > 0) {
                secondsPerLap = (state.lane * totalSeconds) / state.distance;
            }
        }
        return secondsPerLap > 0 && isFinite(secondsPerLap) ? secondsPerLap : 0;
    }
    static calculateSplits(secondsPerLap, laneDistance) {
        const perMeter = secondsPerLap / laneDistance;
        const splits = {};
        const distances = [100, 200, 300, 400, 800, 1200, 1600, 2000];
        distances.forEach((dist) => {
            const time = dist * perMeter;
            splits[`m${dist}`] = TimeFormatter.format(time);
        });
        const m100 = perMeter * 100;
        const m200 = perMeter * 200;
        const m300 = perMeter * 300;
        const m400 = perMeter * 400;
        splits['inc200'] = `(+${this.round(m200 - m100, 1)})`;
        splits['inc300'] = `(+${this.round(m300 - m200, 1)})`;
        splits['inc400'] = `(+${this.round(m400 - m300, 1)})`;
        return splits;
    }
    static calculateTrainingZones(paceSecondsPerKm) {
        const zones = {};
        const zoneNames = [
            'easy',
            'marathon',
            'threshold',
            'interval',
            'repetition'
        ];
        zoneNames.forEach((zoneName) => {
            const multiplier = TRAINING_ZONES[zoneName];
            const zonePaceSeconds = paceSecondsPerKm * multiplier;
            zones[zoneName] = TimeFormatter.format(zonePaceSeconds);
        });
        return zones;
    }
    static predictFinishTime(referenceDistance, referencePaceSecondsPerKm, targetDistance) {
        if (referenceDistance <= 0 || referencePaceSecondsPerKm <= 0 || targetDistance <= 0) {
            return 0;
        }
        const timeRatio = Math.pow(targetDistance / referenceDistance, RIEGEL_EXPONENT);
        const predictedSeconds = (referencePaceSecondsPerKm * referenceDistance) / 1000 * timeRatio;
        return predictedSeconds;
    }
    static generateRoadSplits(secondsPerLap, laneDistance) {
        const perMeter = secondsPerLap / laneDistance;
        const splits = [];
        ROAD_SPLIT_DISTANCES.forEach((distance) => {
            const time = distance * perMeter;
            let label = `${(distance / 1000).toFixed(1)}k`;
            if (Math.abs(distance - 21097.5) < 1) {
                label = 'Half';
            }
            else if (Math.abs(distance - 42195) < 1) {
                label = 'Full';
            }
            splits.push({
                distance,
                time: TimeFormatter.format(time),
                label
            });
        });
        return splits;
    }
    static round(num, precision = 0) {
        const factor = Math.pow(10, precision);
        return Math.round(num * factor) / factor;
    }
}
export default Calculator;

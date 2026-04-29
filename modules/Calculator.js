import { RIEGEL_EXPONENT, TRAINING_ZONES, ROAD_SPLIT_DISTANCES, HALF_MARATHON_METERS, FULL_MARATHON_METERS } from '../constants/index.js';
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
            if (Math.abs(distance - HALF_MARATHON_METERS) < 1) {
                label = 'Half';
            }
            else if (Math.abs(distance - FULL_MARATHON_METERS) < 1) {
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
    static generateTrainingCycle(paceSecondsPerKm, targetDateISO, focusTextMap, workoutTextMap, planDistanceMeters = FULL_MARATHON_METERS) {
        if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm <= 0 || !targetDateISO) {
            return [];
        }
        const today = new Date();
        const target = new Date(targetDateISO);
        if (isNaN(target.getTime()) || target.getTime() <= today.getTime()) {
            return [];
        }
        const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const weekCount = Math.min(24, Math.max(1, Math.ceil(diffDays / 7)));
        const plans = [];
        const raceScale = planDistanceMeters >= FULL_MARATHON_METERS
            ? 1
            : planDistanceMeters >= HALF_MARATHON_METERS
                ? 0.8
                : 0.62;
        const phaseForWeek = (w) => {
            if (weekCount === 1)
                return 'race';
            if (w === weekCount)
                return 'race';
            if (w >= weekCount - 1)
                return 'taper';
            if (w >= weekCount - 4)
                return 'peak';
            if (w >= weekCount - 8)
                return 'build';
            return 'base';
        };
        const buildMileage = (w, phase) => {
            const baselineRaw = Math.max(24, Math.min(80, Math.round(3600 / paceSecondsPerKm * 6 + 16)));
            const baseline = Math.max(16, Math.round(baselineRaw * raceScale));
            const progressStep = Math.floor((w - 1) / 3) * 4;
            const raw = baseline + progressStep;
            const isRecovery = w % 4 === 0 && phase !== 'race' && phase !== 'taper';
            if (phase === 'race')
                return { mileage: Math.max(16, Math.round(raw * 0.45)), isRecovery: false };
            if (phase === 'taper')
                return { mileage: Math.max(20, Math.round(raw * 0.65)), isRecovery: false };
            if (isRecovery)
                return { mileage: Math.max(22, Math.round(raw * 0.7)), isRecovery: true };
            return { mileage: raw, isRecovery: false };
        };
        const workoutForPhase = (phase, isRecovery) => {
            if (phase === 'race')
                return workoutTextMap.race;
            if (isRecovery)
                return workoutTextMap.easy;
            if (phase === 'base')
                return workoutTextMap.easy;
            if (phase === 'build')
                return workoutTextMap.tempo;
            return workoutTextMap.interval;
        };
        const paceByPhase = (phase) => {
            switch (phase) {
                case 'base':
                    return { easy: paceSecondsPerKm + 80, tempo: paceSecondsPerKm + 20, interval: paceSecondsPerKm - 5, long: paceSecondsPerKm + 55 };
                case 'build':
                    return { easy: paceSecondsPerKm + 70, tempo: paceSecondsPerKm + 15, interval: paceSecondsPerKm - 10, long: paceSecondsPerKm + 45 };
                case 'peak':
                    return { easy: paceSecondsPerKm + 60, tempo: paceSecondsPerKm + 10, interval: paceSecondsPerKm - 15, long: paceSecondsPerKm + 35 };
                case 'taper':
                    return { easy: paceSecondsPerKm + 55, tempo: paceSecondsPerKm + 12, interval: paceSecondsPerKm - 8, long: paceSecondsPerKm + 30 };
                default:
                    return { easy: paceSecondsPerKm + 50, tempo: paceSecondsPerKm + 5, interval: paceSecondsPerKm - 5, long: paceSecondsPerKm + 20 };
            }
        };
        for (let week = 1; week <= weekCount; week += 1) {
            const phase = phaseForWeek(week);
            const p = paceByPhase(phase);
            const mileage = buildMileage(week, phase);
            plans.push({
                week,
                weekLabel: `W${week}`,
                focus: focusTextMap[phase],
                easyPace: TimeFormatter.format(p.easy),
                tempoPace: TimeFormatter.format(p.tempo),
                intervalPace: TimeFormatter.format(Math.max(120, p.interval)),
                longRunPace: TimeFormatter.format(p.long),
                totalMileageKm: mileage.mileage,
                keyWorkout: workoutForPhase(phase, mileage.isRecovery),
                isRecoveryWeek: mileage.isRecovery
            });
        }
        return plans;
    }
}
export default Calculator;

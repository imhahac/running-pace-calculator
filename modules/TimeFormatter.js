const TIME_FORMAT_REGEX = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;
export class TimeFormatter {
    static format(seconds) {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return '';
        }
        let s = Math.round(seconds);
        const h = Math.floor(s / 3600);
        s %= 3600;
        const m = Math.floor(s / 60);
        s %= 60;
        const pad = (n) => n.toString().padStart(2, '0');
        if (h > 0) {
            return `${h}:${pad(m)}:${pad(s)}`;
        }
        else {
            return `${pad(m)}:${pad(s)}`;
        }
    }
    static parse(timeStr) {
        if (!timeStr)
            return 0;
        const str = timeStr.toString().trim();
        const parts = str.split(':').map((p) => parseInt(p, 10));
        if (parts.some(isNaN))
            return 0;
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        else {
            return parts[0];
        }
    }
    static toSeconds(time) {
        return time.hours * 3600 + time.minutes * 60 + time.seconds;
    }
    static toTimeFormat(seconds) {
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return { hours: 0, minutes: 0, seconds: 0 };
        }
        let s = Math.round(seconds);
        const h = Math.floor(s / 3600);
        s %= 3600;
        const m = Math.floor(s / 60);
        s %= 60;
        return { hours: h, minutes: m, seconds: s };
    }
    static validate(timeStr) {
        if (!timeStr)
            return false;
        return TIME_FORMAT_REGEX.test(timeStr.trim());
    }
    static isValidTime(value) {
        if (!value)
            return false;
        const seconds = this.parse(value);
        return seconds > 0 && isFinite(seconds);
    }
}
export default TimeFormatter;

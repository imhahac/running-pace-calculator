/**
 * TimeFormatter Module
 * Handles time parsing, formatting, and validation
 */

import type { ITimeFormat } from '../../types/index';

/**
 * Regular expression to validate time format
 * Matches: m:s, mm:ss, h:m:s, hh:mm:ss
 */
const TIME_FORMAT_REGEX = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$|^\d+$/;

export class TimeFormatter {
  /**
   * Format seconds to time string (mm:ss or h:mm:ss)
   * @param seconds - Total seconds to format
   * @param forceHour - Force output to include hour (e.g. 0:45:00)
   * @returns Formatted time string
   */
  static format(seconds: number, forceHour: boolean = false): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '';
    }

    let s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    s %= 3600;
    const m = Math.floor(s / 60);
    s %= 60;

    const pad = (n: number): string => n.toString().padStart(2, '0');

    if (h > 0 || forceHour) {
      return `${h}:${pad(m)}:${pad(s)}`;
    } else {
      return `${pad(m)}:${pad(s)}`;
    }
  }

  /**
   * Parse time string to seconds
   * Supports formats: m:s, mm:ss, h:m:s, hh:mm:ss
   * @param timeStr - Time string to parse
   * @returns Total seconds, or 0 if invalid
   */
  static parse(timeStr: string | number): number {
    if (!timeStr) return 0;

    const str = timeStr.toString().trim();
    const parts = str.split(':').map((p) => parseInt(p, 10));

    // Validate parsed parts are numbers
    if (parts.some(isNaN)) return 0;

    if (parts.length === 3) {
      // h:m:s format
      if (parts[1] >= 60 || parts[2] >= 60) return 0;
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // m:s format
      if (parts[1] >= 60) return 0;
      return parts[0] * 60 + parts[1];
    } else {
      // Single number (seconds)
      return parts[0];
    }
  }

  /**
   * Parse a time string, distinguishing invalid input from a genuine zero.
   * Unlike parse() (which returns 0 for both), this returns null when the
   * string is empty or not a valid m:s / mm:ss / h:m:s / hh:mm:ss / seconds value.
   * @param timeStr - Time string to parse
   * @returns Total seconds, or null if the input is empty/invalid
   */
  static tryParse(timeStr: string | number | null | undefined): number | null {
    if (timeStr === null || timeStr === undefined) return null;

    const str = timeStr.toString().trim();
    if (str === '') return null;

    const parts = str.split(':').map((p) => parseInt(p, 10));
    if (parts.some(isNaN)) return null;

    if (parts.length === 3) {
      if (parts[1] >= 60 || parts[2] >= 60) return null;
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
      if (parts[1] >= 60) return null;
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 1) {
      return parts[0];
    }
    return null;
  }

  /**
   * Convert time object to seconds
   * @param time - Time format object
   * @returns Total seconds
   */
  static toSeconds(time: ITimeFormat): number {
    return time.hours * 3600 + time.minutes * 60 + time.seconds;
  }

  /**
   * Convert seconds to time object
   * @param seconds - Total seconds
   * @returns Time format object
   */
  static toTimeFormat(seconds: number): ITimeFormat {
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

  /**
   * Validate time string format
   * @param timeStr - Time string to validate
   * @returns true if valid, false otherwise
   */
  static validate(timeStr: string): boolean {
    if (!timeStr) return false;
    return TIME_FORMAT_REGEX.test(timeStr.trim());
  }

  /**
   * Check if a value can be parsed as valid time
   * @param value - Value to check
   * @returns true if parseable to valid time
   */
  static isValidTime(value: string | number): boolean {
    if (!value) return false;
    const seconds = this.parse(value);
    return seconds > 0 && isFinite(seconds);
  }
}

export default TimeFormatter;

/**
 * TimeFormatter Module
 * Handles time parsing, formatting, and validation
 */

import type { ITimeFormat } from '../types/index';

/**
 * Regular expression to validate time format
 * Matches: m:s, mm:ss, h:m:s, hh:mm:ss
 */
const TIME_FORMAT_REGEX = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/;

export class TimeFormatter {
  /**
   * Format seconds to time string (mm:ss or h:mm:ss)
   * @param seconds - Total seconds to format
   * @returns Formatted time string
   */
  static format(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '';
    }

    let s = Math.round(seconds);
    const h = Math.floor(s / 3600);
    s %= 3600;
    const m = Math.floor(s / 60);
    s %= 60;

    const pad = (n: number): string => n.toString().padStart(2, '0');

    if (h > 0) {
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
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // m:s format
      return parts[0] * 60 + parts[1];
    } else {
      // Single number (seconds)
      return parts[0];
    }
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

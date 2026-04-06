/**
 * Converter Module
 * Handles unit conversions between metric and imperial systems
 */

import { CONVERSION_FACTORS } from '../constants/index.js';

export class Converter {
  /**
   * Convert pace from km/min to mile/min
   * @param paceSeconds - Pace in seconds (e.g., seconds per km)
   * @returns Pace in seconds (e.g., seconds per mile)
   */
  static paceKmToMile(paceSeconds: number): number {
    return paceSeconds * CONVERSION_FACTORS.km_to_mile;
  }

  /**
   * Convert pace from mile/min to km/min
   * @param paceSeconds - Pace in seconds (e.g., seconds per mile)
   * @returns Pace in seconds (e.g., seconds per km)
   */
  static paceMileToKm(paceSeconds: number): number {
    return paceSeconds * CONVERSION_FACTORS.mile_to_km;
  }

  /**
   * Convert speed from km/h to mile/h
   * @param kph - Speed in km/h
   * @returns Speed in mile/h
   */
  static kphToMph(kph: number): number {
    return kph * CONVERSION_FACTORS.km_to_mile;
  }

  /**
   * Convert speed from mile/h to km/h
   * @param mph - Speed in mile/h
   * @returns Speed in km/h
   */
  static mphToKph(mph: number): number {
    return mph * CONVERSION_FACTORS.mile_to_km;
  }

  /**
   * Convert distance from km to mile
   * @param km - Distance in kilometers
   * @returns Distance in miles
   */
  static kmToMile(km: number): number {
    return km * CONVERSION_FACTORS.km_to_mile;
  }

  /**
   * Convert distance from mile to km
   * @param miles - Distance in miles
   * @returns Distance in kilometers
   */
  static mileToKm(miles: number): number {
    return miles * CONVERSION_FACTORS.mile_to_km;
  }

  /**
   * Get the conversion factor for distance
   * @param unit - Target unit ('km' or 'mile')
   * @returns Conversion factor from km
   */
  static getDistanceConversionFactor(unit: 'km' | 'mile'): number {
    return unit === 'mile' ? CONVERSION_FACTORS.km_to_mile : 1;
  }

  /**
   * Get the conversion factor for pace/speed
   * @param fromUnit - Source unit ('km' or 'mile')
   * @param toUnit - Target unit ('km' or 'mile')
   * @returns Conversion factor
   */
  static getPaceConversionFactor(fromUnit: 'km' | 'mile', toUnit: 'km' | 'mile'): number {
    if (fromUnit === toUnit) return 1;
    if (fromUnit === 'km' && toUnit === 'mile') {
      return CONVERSION_FACTORS.km_to_mile;
    }
    if (fromUnit === 'mile' && toUnit === 'km') {
      return CONVERSION_FACTORS.mile_to_km;
    }
    return 1;
  }
}

export default Converter;

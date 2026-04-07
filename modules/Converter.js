import { CONVERSION_FACTORS } from '../constants/index.js';
export class Converter {
    static paceKmToMile(paceSeconds) {
        return paceSeconds * CONVERSION_FACTORS.mile_to_km;
    }
    static paceMileToKm(paceSeconds) {
        return paceSeconds * CONVERSION_FACTORS.km_to_mile;
    }
    static kphToMph(kph) {
        return kph * CONVERSION_FACTORS.km_to_mile;
    }
    static mphToKph(mph) {
        return mph * CONVERSION_FACTORS.mile_to_km;
    }
    static kmToMile(km) {
        return km * CONVERSION_FACTORS.km_to_mile;
    }
    static mileToKm(miles) {
        return miles * CONVERSION_FACTORS.mile_to_km;
    }
    static getDistanceConversionFactor(unit) {
        return unit === 'mile' ? CONVERSION_FACTORS.km_to_mile : 1;
    }
    static getPaceConversionFactor(fromUnit, toUnit) {
        if (fromUnit === toUnit)
            return 1;
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

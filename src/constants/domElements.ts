/**
 * DOM Elements Mapping and Cache
 * Centralized access to all HTML elements
 */

import type { IDOMElements } from '../types/index';

/**
 * Cache all DOM elements on initialization
 */
export function initializeDOMElements(): IDOMElements {
  const elements: IDOMElements = {
    inputs: {
      paceMin: document.getElementById('pace_input') as HTMLInputElement | null,
      paceSec: document.getElementById('pace_input2') as HTMLInputElement | null,
      track: document.getElementById('track_input') as HTMLInputElement | null,
      treadmill: document.getElementById('treadmill_input') as HTMLInputElement | null,
      finishTime: document.getElementById('finish_time_input') as HTMLInputElement | null,
    },
    radios: document.querySelectorAll('input[name="type"]') as NodeListOf<HTMLInputElement>,
    laneSelect: document.getElementById('laneNumber') as HTMLSelectElement | null,
    venueSelect: document.getElementById('venue-select') as HTMLSelectElement | null,
    distanceSelect: document.getElementById('dropdown') as HTMLSelectElement | null,
    buttons: {
      mile: document.getElementById('mile-button') as HTMLButtonElement | null,
      mileSwitchText: document.getElementById('switch') as HTMLElement | null,
      perHour: document.getElementById('perHour-button') as HTMLButtonElement | null,
      perHourSwitchText: document.getElementById('switch2') as HTMLElement | null,
      slide: document.getElementById('slide-button') as HTMLButtonElement | null,
      info: document.getElementById('slide-button2') as HTMLButtonElement | null,
      theme: document.getElementById('theme-toggle') as HTMLButtonElement | null,
    },
    displays: {
      unit: document.getElementById('unit') as HTMLElement | null,
      unit2: document.getElementById('unit2') as HTMLElement | null,
      laneLength: document.getElementById('lane-length2') as HTMLElement | null,
      themeIcon: document.getElementById('theme-icon-text') as HTMLElement | null,
      splits: {
        m100: document.getElementById('m100_input') as HTMLInputElement | null,
        m200: document.getElementById('m200_input') as HTMLInputElement | null,
        m300: document.getElementById('m300_input') as HTMLInputElement | null,
        m400: document.getElementById('m400_input') as HTMLInputElement | null,
        m800: document.getElementById('m800_input') as HTMLInputElement | null,
        m1200: document.getElementById('m1200_input') as HTMLInputElement | null,
        m1600: document.getElementById('m1600_input') as HTMLInputElement | null,
        m2000: document.getElementById('m2000_input') as HTMLInputElement | null,
        inc200: document.getElementById('m200_increment') as HTMLInputElement | null,
        inc300: document.getElementById('m300_increment') as HTMLInputElement | null,
        inc400: document.getElementById('m400_increment') as HTMLInputElement | null,
        lapsText: {
          two: document.getElementById('twolaps') as HTMLElement | null,
          three: document.getElementById('threelaps') as HTMLElement | null,
          four: document.getElementById('fourlaps') as HTMLElement | null,
          five: document.getElementById('fivelaps') as HTMLElement | null,
        }
      },
      zones: {
        e: document.getElementById('zone-e') as HTMLElement | null,
        m: document.getElementById('zone-m') as HTMLElement | null,
        t: document.getElementById('zone-t') as HTMLElement | null,
        i: document.getElementById('zone-i') as HTMLElement | null,
        r: document.getElementById('zone-r') as HTMLElement | null,
      },
      prediction: {
        k5: document.getElementById('pred-5k') as HTMLElement | null,
        k10: document.getElementById('pred-10k') as HTMLElement | null,
        half: document.getElementById('pred-half') as HTMLElement | null,
        full: document.getElementById('pred-full') as HTMLElement | null,
      },
      container: document.getElementById('container') as HTMLElement | null,
      infoContainer: document.getElementById('container2') as HTMLElement | null,
    }
  };

  return elements;
}

/**
 * Get an input element by mode
 */
export function getInputElementByMode(mode: string): HTMLInputElement | null {
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

/**
 * Get cached DOM elements (singleton pattern)
 */
let domCache: IDOMElements | null = null;

export function getDOMCache(): IDOMElements {
  if (!domCache) {
    domCache = initializeDOMElements();
  }
  return domCache;
}

/**
 * Get input element ID for a given mode
 */
export function getInputIdForMode(mode: string): string {
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

/**
 * ShareManager Module
 * Serialize and restore calculator state through URL query.
 */

import type { ISharePayload } from '../types/index';

const QUERY_KEY = 's';
const LEGACY_QUERY_KEY = 'rp';

type TCompactPayload = {
  v: 1;
  s: {
    m?: 0 | 1 | 2 | 3;
    pu?: 0 | 1;
    tu?: 0 | 1;
    ve?: 0 | 1;
    la?: number;
    di?: number;
    sm?: 0 | 1;
    lg?: 0 | 1;
  };
  i?: [string, string, string, string, string];
  td?: string;
};

function encodePayload(payload: ISharePayload): string {
  const state = payload.state || {};
  const compact: TCompactPayload = {
    v: 1,
    s: {
      m: modeToCode(state.mode),
      pu: unitToCode(state.paceUnit),
      tu: unitToCode(state.treadmillUnit),
      ve: venueToCode(state.venue),
      la: typeof state.lane === 'number' ? state.lane : undefined,
      di: typeof state.distance === 'number' ? state.distance : undefined,
      sm: splitModeToCode(state.splitMode),
      lg: langToCode(state.lang)
    },
    i: [
      payload.inputs?.pace_input || '',
      payload.inputs?.pace_input2 || '',
      payload.inputs?.track_input || '',
      payload.inputs?.treadmill_input || '',
      payload.inputs?.finish_time_input || ''
    ],
    td: payload.trainingTargetDate || undefined
  };

  const json = JSON.stringify(compact);
  return base64UrlEncode(json);
}

function decodePayload(encoded: string): ISharePayload | null {
  try {
    const json = base64UrlDecode(encoded);
    const parsed = JSON.parse(json) as TCompactPayload;

    const state = {
      mode: codeToMode(parsed.s?.m),
      paceUnit: codeToUnit(parsed.s?.pu),
      treadmillUnit: codeToUnit(parsed.s?.tu),
      venue: codeToVenue(parsed.s?.ve),
      lane: parsed.s?.la,
      distance: parsed.s?.di,
      splitMode: codeToSplitMode(parsed.s?.sm),
      lang: codeToLang(parsed.s?.lg)
    };

    const i = parsed.i || ['', '', '', '', ''];
    return {
      state,
      inputs: {
        pace_input: i[0] || '',
        pace_input2: i[1] || '',
        track_input: i[2] || '',
        treadmill_input: i[3] || '',
        finish_time_input: i[4] || ''
      },
      trainingTargetDate: parsed.td || ''
    };
  } catch {
    try {
      const legacyJson = decodeURIComponent(escape(atob(encoded)));
      return JSON.parse(legacyJson) as ISharePayload;
    } catch {
      return null;
    }
  }
}

function base64UrlEncode(str: string): string {
  const b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
  return decodeURIComponent(escape(atob(padded)));
}

function modeToCode(mode: any): 0 | 1 | 2 | 3 | undefined {
  if (mode === 'pace') return 0;
  if (mode === 'track') return 1;
  if (mode === 'treadmill') return 2;
  if (mode === 'finish_time') return 3;
  return undefined;
}

function codeToMode(code: any): 'pace' | 'track' | 'treadmill' | 'finish_time' | undefined {
  if (code === 0) return 'pace';
  if (code === 1) return 'track';
  if (code === 2) return 'treadmill';
  if (code === 3) return 'finish_time';
  return undefined;
}

function unitToCode(unit: any): 0 | 1 | undefined {
  if (unit === 'km') return 0;
  if (unit === 'mile') return 1;
  return undefined;
}

function codeToUnit(code: any): 'km' | 'mile' | undefined {
  if (code === 0) return 'km';
  if (code === 1) return 'mile';
  return undefined;
}

function splitModeToCode(mode: any): 0 | 1 | undefined {
  if (mode === 'track') return 0;
  if (mode === 'road') return 1;
  return undefined;
}

function codeToSplitMode(code: any): 'track' | 'road' | undefined {
  if (code === 0) return 'track';
  if (code === 1) return 'road';
  return undefined;
}

function venueToCode(v: any): 0 | 1 | undefined {
  if (v === 'standard_400') return 0;
  if (v === 'warmup_300') return 1;
  return undefined;
}

function codeToVenue(code: any): 'standard_400' | 'warmup_300' | undefined {
  if (code === 0) return 'standard_400';
  if (code === 1) return 'warmup_300';
  return undefined;
}

function langToCode(l: any): 0 | 1 | undefined {
  if (l === 'zh') return 0;
  if (l === 'en') return 1;
  return undefined;
}

function codeToLang(code: any): 'zh' | 'en' | undefined {
  if (code === 0) return 'zh';
  if (code === 1) return 'en';
  return undefined;
}

export class ShareManager {
  static buildShareURL(payload: ISharePayload, fileName?: string): string {
    const url = new URL(window.location.href);
    if (fileName) {
      url.pathname = `${url.pathname.replace(/\/[^/]*$/, '')}/${fileName}`;
    }
    const encoded = encodePayload(payload);
    url.searchParams.delete(LEGACY_QUERY_KEY);
    url.searchParams.set(QUERY_KEY, encoded);
    return url.toString();
  }

  static readPayloadFromURL(): ISharePayload | null {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get(QUERY_KEY) || url.searchParams.get(LEGACY_QUERY_KEY);
    if (!encoded) return null;
    return decodePayload(encoded);
  }
}

export default ShareManager;

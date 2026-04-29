const QUERY_KEY = 's';
const LEGACY_QUERY_KEY = 'rp';
function encodePayload(payload) {
    const state = payload.state || {};
    const compact = {
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
function decodePayload(encoded) {
    try {
        const json = base64UrlDecode(encoded);
        const parsed = JSON.parse(json);
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
    }
    catch {
        try {
            const legacyJson = decodeURIComponent(escape(atob(encoded)));
            return JSON.parse(legacyJson);
        }
        catch {
            return null;
        }
    }
}
function base64UrlEncode(str) {
    const b64 = btoa(unescape(encodeURIComponent(str)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function base64UrlDecode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=');
    return decodeURIComponent(escape(atob(padded)));
}
function modeToCode(mode) {
    if (mode === 'pace')
        return 0;
    if (mode === 'track')
        return 1;
    if (mode === 'treadmill')
        return 2;
    if (mode === 'finish_time')
        return 3;
    return undefined;
}
function codeToMode(code) {
    if (code === 0)
        return 'pace';
    if (code === 1)
        return 'track';
    if (code === 2)
        return 'treadmill';
    if (code === 3)
        return 'finish_time';
    return undefined;
}
function unitToCode(unit) {
    if (unit === 'km')
        return 0;
    if (unit === 'mile')
        return 1;
    return undefined;
}
function codeToUnit(code) {
    if (code === 0)
        return 'km';
    if (code === 1)
        return 'mile';
    return undefined;
}
function splitModeToCode(mode) {
    if (mode === 'track')
        return 0;
    if (mode === 'road')
        return 1;
    return undefined;
}
function codeToSplitMode(code) {
    if (code === 0)
        return 'track';
    if (code === 1)
        return 'road';
    return undefined;
}
function venueToCode(v) {
    if (v === 'standard_400')
        return 0;
    if (v === 'warmup_300')
        return 1;
    return undefined;
}
function codeToVenue(code) {
    if (code === 0)
        return 'standard_400';
    if (code === 1)
        return 'warmup_300';
    return undefined;
}
function langToCode(l) {
    if (l === 'zh')
        return 0;
    if (l === 'en')
        return 1;
    return undefined;
}
function codeToLang(code) {
    if (code === 0)
        return 'zh';
    if (code === 1)
        return 'en';
    return undefined;
}
export class ShareManager {
    static buildShareURL(payload, fileName) {
        const url = new URL(window.location.href);
        if (fileName) {
            url.pathname = `${url.pathname.replace(/\/[^/]*$/, '')}/${fileName}`;
        }
        const encoded = encodePayload(payload);
        url.searchParams.delete(LEGACY_QUERY_KEY);
        url.searchParams.set(QUERY_KEY, encoded);
        return url.toString();
    }
    static readPayloadFromURL() {
        const url = new URL(window.location.href);
        const encoded = url.searchParams.get(QUERY_KEY) || url.searchParams.get(LEGACY_QUERY_KEY);
        if (!encoded)
            return null;
        return decodePayload(encoded);
    }
}
export default ShareManager;

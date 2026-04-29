const QUERY_KEY = 'rp';
function encodePayload(payload) {
    const json = JSON.stringify(payload);
    return btoa(unescape(encodeURIComponent(json)));
}
function decodePayload(encoded) {
    try {
        const json = decodeURIComponent(escape(atob(encoded)));
        const parsed = JSON.parse(json);
        return parsed;
    }
    catch {
        return null;
    }
}
export class ShareManager {
    static buildShareURL(payload) {
        const url = new URL(window.location.href);
        const encoded = encodePayload(payload);
        url.searchParams.set(QUERY_KEY, encoded);
        return url.toString();
    }
    static readPayloadFromURL() {
        const url = new URL(window.location.href);
        const encoded = url.searchParams.get(QUERY_KEY);
        if (!encoded)
            return null;
        return decodePayload(encoded);
    }
    static async shortenURL(longURL) {
        try {
            const endpoint = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longURL)}`;
            const response = await fetch(endpoint, { method: 'GET' });
            if (!response.ok)
                return null;
            const shortURL = (await response.text()).trim();
            if (!shortURL.startsWith('http'))
                return null;
            return shortURL;
        }
        catch {
            return null;
        }
    }
}
export default ShareManager;

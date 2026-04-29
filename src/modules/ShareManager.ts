/**
 * ShareManager Module
 * Serialize and restore calculator state through URL query.
 */

import type { ISharePayload } from '../types/index';

const QUERY_KEY = 'rp';

function encodePayload(payload: ISharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(unescape(encodeURIComponent(json)));
}

function decodePayload(encoded: string): ISharePayload | null {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const parsed = JSON.parse(json) as ISharePayload;
    return parsed;
  } catch {
    return null;
  }
}

export class ShareManager {
  static buildShareURL(payload: ISharePayload): string {
    const url = new URL(window.location.href);
    const encoded = encodePayload(payload);
    url.searchParams.set(QUERY_KEY, encoded);
    return url.toString();
  }

  static readPayloadFromURL(): ISharePayload | null {
    const url = new URL(window.location.href);
    const encoded = url.searchParams.get(QUERY_KEY);
    if (!encoded) return null;
    return decodePayload(encoded);
  }

  /**
   * Attempt to create a shorter URL via is.gd. Returns null on failure.
   */
  static async shortenURL(longURL: string): Promise<string | null> {
    try {
      const endpoint = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longURL)}`;
      const response = await fetch(endpoint, { method: 'GET' });
      if (!response.ok) return null;
      const shortURL = (await response.text()).trim();
      if (!shortURL.startsWith('http')) return null;
      return shortURL;
    } catch {
      return null;
    }
  }
}

export default ShareManager;

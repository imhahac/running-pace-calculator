import type { TGeoJsonNode, TGeoJsonGeometry, IGeoJsonFeature } from '../../../types/index.js';

export class MapController {
  private static leafletMap: L.Map | null = null;

  /**
   * Render GPX or GeoJSON route on Leaflet Map
   */
  static async renderGpxRoute(url: string): Promise<boolean> {
    const mapContainer = document.getElementById('leaflet-map-container');
    const mapEl = document.getElementById('leaflet-map');
    if (!mapContainer || !mapEl) return false;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
      const text = await response.text();

      let points: [number, number][] = [];
      const trimmed = text.trim();

      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        const geojson = JSON.parse(text);
        points = this.extractGeoJsonCoordinates(geojson);
      } else {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const trkpts = xmlDoc.getElementsByTagName('trkpt');
        for (let i = 0; i < trkpts.length; i++) {
          const lat = parseFloat(trkpts[i].getAttribute('lat') || '');
          const lon = parseFloat(trkpts[i].getAttribute('lon') || '');
          if (!isNaN(lat) && !isNaN(lon)) {
            points.push([lat, lon]);
          }
        }
      }

      if (points.length === 0) {
        throw new Error('No coordinates found in GPX/GeoJSON');
      }

      if (typeof L === 'undefined') {
        throw new Error('Leaflet is not loaded');
      }

      if (!this.leafletMap) {
        this.leafletMap = L.map('leaflet-map', {
          zoomControl: true
        });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.leafletMap);
      }

      // Clear previous layers (paths and markers)
      this.leafletMap!.eachLayer((layer: L.Layer) => {
        if (layer && typeof layer.getTileUrl !== 'function') {
          this.leafletMap!.removeLayer(layer);
        }
      });

      // Draw route path (polyline)
      const routePath = L.polyline(points, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.85
      }).addTo(this.leafletMap!);

      // Fit map bounds
      this.leafletMap!.fitBounds(routePath.getBounds(), { padding: [30, 30] });

      // Draw Start & Finish markers
      const startPt = points[0];
      const endPt = points[points.length - 1];

      L.circleMarker(startPt, {
        radius: 7,
        fillColor: '#10b981',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      })
        .addTo(this.leafletMap!)
        .bindPopup('🏁 <b>起點 Start</b>');

      L.circleMarker(endPt, {
        radius: 7,
        fillColor: '#ef4444',
        color: '#ffffff',
        weight: 2,
        fillOpacity: 1
      })
        .addTo(this.leafletMap!)
        .bindPopup('🏁 <b>終點 Finish</b>');

      // Trigger redraw in case the container was hidden initially
      setTimeout(() => {
        if (this.leafletMap) {
          this.leafletMap.invalidateSize();
        }
      }, 50);

      return true;
    } catch (err) {
      console.warn('Failed to parse or render GPX/GeoJSON map:', err);
      return false;
    }
  }

  /**
   * Recursively extract coordinates from GeoJSON
   */
  private static extractGeoJsonCoordinates(geojson: TGeoJsonNode): [number, number][] {
    const coords: [number, number][] = [];
    const processGeometry = (geom: TGeoJsonGeometry) => {
      if (!geom || !geom.type) return;
      if (geom.type === 'Point' && Array.isArray(geom.coordinates)) {
        coords.push([geom.coordinates[1], geom.coordinates[0]]);
      } else if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
        geom.coordinates.forEach((pt: number[]) => {
          coords.push([pt[1], pt[0]]);
        });
      } else if (geom.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
        geom.coordinates.forEach((line: number[][]) => {
          line.forEach((pt: number[]) => {
            coords.push([pt[1], pt[0]]);
          });
        });
      } else if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
        geom.coordinates.forEach((ring: number[][]) => {
          ring.forEach((pt: number[]) => {
            coords.push([pt[1], pt[0]]);
          });
        });
      }
    };

    if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
      geojson.features.forEach((feat: IGeoJsonFeature) => {
        if (feat.geometry) processGeometry(feat.geometry as TGeoJsonGeometry);
      });
    } else if (geojson.type === 'Feature' && 'geometry' in geojson && geojson.geometry) {
      processGeometry(geojson.geometry as TGeoJsonGeometry);
    } else if ('geometry' in geojson) {
      processGeometry(geojson.geometry as TGeoJsonGeometry);
    } else if ('coordinates' in geojson) {
      processGeometry(geojson as TGeoJsonGeometry);
    }
    return coords;
  }

  /**
   * Helper to show Strava embed and hide Leaflet map
   */
  static showStravaEmbed(
    embedUrl: string,
    stravaContainer: HTMLElement | null,
    stravaSkeleton: HTMLElement | null,
    leafletContainer: HTMLElement | null,
    iframe: HTMLIFrameElement | null
  ): void {
    if (leafletContainer) leafletContainer.style.display = 'none';
    if (!iframe) return;

    if (embedUrl) {
      if (stravaContainer) stravaContainer.style.display = 'block';
      if (stravaSkeleton) stravaSkeleton.style.display = 'block';
      iframe.style.opacity = '0';

      if (iframe.src !== embedUrl) {
        iframe.src = embedUrl;
        iframe.onload = () => {
          if (stravaSkeleton) stravaSkeleton.style.display = 'none';
          iframe.style.opacity = '1';
        };
      } else {
        if (stravaSkeleton) stravaSkeleton.style.display = 'none';
        iframe.style.opacity = '1';
      }
    } else {
      iframe.src = '';
      iframe.style.opacity = '0';
      if (stravaContainer) stravaContainer.style.display = 'none';
    }
  }

  /**
   * Destroy map to prevent memory leaks when not needed
   */
  static destroyMap() {
    if (this.leafletMap && typeof this.leafletMap.remove === 'function') {
      this.leafletMap.remove();
      this.leafletMap = null;
    }
  }
}

export default MapController;

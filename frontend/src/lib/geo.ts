/**
 * Geographic utilities for SPECTRA Earth Observation
 * Reverse geocoding and geodesic distance / area calculations.
 */

export interface GeocodedLocation {
  displayName: string;
  city?: string;
  state?: string;
  country?: string;
  approxAreaKm2: number;
  widthKm: number;
  heightKm: number;
}

const geoCache = new Map<string, string>();

/**
 * Computes approximate geodesic dimensions and area for an EPSG:4326 bounding box.
 */
export function computeBboxDimensions(bbox: [number, number, number, number]): {
  widthKm: number;
  heightKm: number;
  areaKm2: number;
  centerLat: number;
  centerLng: number;
} {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const latDiff = Math.abs(maxLat - minLat);
  const lngDiff = Math.abs(maxLng - minLng);

  // 1 degree latitude ~= 111.0 km
  const heightKm = latDiff * 111.0;
  // 1 degree longitude ~= 111.0 * cos(latitude) km
  const rad = (centerLat * Math.PI) / 180.0;
  const widthKm = lngDiff * 111.0 * Math.cos(rad);
  const areaKm2 = Math.round(widthKm * heightKm);

  return {
    widthKm: Math.round(widthKm * 10) / 10,
    heightKm: Math.round(heightKm * 10) / 10,
    areaKm2,
    centerLat: Math.round(centerLat * 10000) / 10000,
    centerLng: Math.round(centerLng * 10000) / 10000,
  };
}

/**
 * Reverse geocodes [lat, lng] using OpenStreetMap Nominatim with caching and fallback.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (geoCache.has(key)) {
    return geoCache.get(key)!;
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(4)}&lon=${lng.toFixed(4)}&zoom=10`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const parts: string[] = [];

      for (const field of ['city', 'town', 'village', 'municipality', 'county', 'state', 'country']) {
        const val = addr[field];
        if (val && !parts.includes(val)) {
          parts.push(val);
        }
      }

      let name = '';
      if (parts.length > 0) {
        name = parts.slice(0, 3).join(', ');
      } else if (data.display_name) {
        name = data.display_name.split(',').slice(0, 3).join(', ').trim();
      }

      if (name) {
        geoCache.set(key, name);
        return name;
      }
    }
  } catch (err) {
    // Network or rate-limit fallback
  }

  const latH = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lngH = `${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
  const fallback = `Geographic Region [${latH}, ${lngH}]`;
  geoCache.set(key, fallback);
  return fallback;
}

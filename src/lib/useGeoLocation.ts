import { useEffect, useRef, useState } from "react";

export interface GeoState {
  /** Full label, e.g. "Bandra West, Mumbai" */
  label: string;
  /** Short area name, e.g. "Bandra West" */
  short: string;
  coords: { lat: number; lon: number } | null;
  loading: boolean;
  denied: boolean;
  /** True while live GPS tracking (watchPosition) is active */
  tracking: boolean;
}

const FALLBACK_LABEL = "Bandra, Mumbai";
const FALLBACK_SHORT = "Bandra";
const FALLBACK_COORDS = { lat: 19.0596, lon: 72.8295 };
const CACHE_KEY = "pawsitive_geo";
/** Only reverse-geocode again after moving this far (metres) */
const REGEOCODE_MIN_MOVE_M = 150;
/** Or at most this often (ms) */
const REGEOCODE_MIN_INTERVAL = 60 * 1000;

interface GeoCache {
  label: string;
  short: string;
  lat: number;
  lon: number;
  ts: number;
}

function readCache(): GeoCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GeoCache;
    return typeof parsed?.label === "string" ? parsed : null;
  } catch {
    return null;
  }
}

function distanceM(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function reverseGeocode(lat: number, lon: number): Promise<{ label: string; short: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=16`
    );
    const data = await res.json();
    const a = data?.address ?? {};
    const area: string =
      a.suburb || a.neighbourhood || a.residential || a.village || a.town || a.city_district || "";
    const city: string = a.city || a.town || a.village || a.state_district || a.state || "";
    const short = area || city || "Current Location";
    const label = city && area && area !== city ? `${area}, ${city}` : short;
    return { label, short };
  } catch {
    return null;
  }
}

/**
 * Real-time location: starts live GPS tracking via watchPosition and keeps the
 * "Area, City" label updated as the device moves. Coordinates update on every
 * GPS fix; the reverse-geocoded label is refreshed only after moving ~150 m
 * (or once a minute) to stay within the geocoder's fair-use limits.
 * Falls back to the last cached (or default) location when denied/unavailable.
 */
export function useGeoLocation(): GeoState {
  const [state, setState] = useState<GeoState>(() => {
    const cached = readCache();
    return cached
      ? {
          label: cached.label,
          short: cached.short,
          coords: { lat: cached.lat, lon: cached.lon },
          loading: true,
          denied: false,
          tracking: false,
        }
      : { label: FALLBACK_LABEL, short: FALLBACK_SHORT, coords: FALLBACK_COORDS, loading: true, denied: false, tracking: false };
  });

  const lastGeocode = useRef<{ at: number; lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }
    let cancelled = false;
    let geocoding = false;

    const onFix = async (pos: GeolocationPosition) => {
      if (cancelled) return;
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const now = Date.now();

      const last = lastGeocode.current;
      const moved = last ? distanceM({ lat: last.lat, lon: last.lon }, { lat, lon }) : Infinity;
      const stale = last ? now - last.at > REGEOCODE_MIN_INTERVAL : true;

      if ((moved > REGEOCODE_MIN_MOVE_M || stale) && !geocoding) {
        geocoding = true;
        const geo = await reverseGeocode(lat, lon);
        geocoding = false;
        if (cancelled) return;
        if (geo) {
          lastGeocode.current = { at: now, lat, lon };
          setState({ label: geo.label, short: geo.short, coords: { lat, lon }, loading: false, denied: false, tracking: true });
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ...geo, lat, lon, ts: now }));
          } catch {
            /* storage full — ignore */
          }
          return;
        }
      }

      setState((prev) => ({ ...prev, coords: { lat, lon }, loading: false, denied: false, tracking: true }));
    };

    const onError = () => {
      if (cancelled) return;
      const cached = readCache();
      setState(
        cached
          ? { label: cached.label, short: cached.short, coords: { lat: cached.lat, lon: cached.lon }, loading: false, denied: true, tracking: false }
          : { label: FALLBACK_LABEL, short: FALLBACK_SHORT, coords: FALLBACK_COORDS, loading: false, denied: true, tracking: false }
      );
    };

    const watchId = navigator.geolocation.watchPosition(onFix, onError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    });

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return state;
}


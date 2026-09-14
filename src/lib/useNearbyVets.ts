import { useCallback, useEffect, useState } from "react";
import { useGeoLocation } from "@/lib/useGeoLocation";

export type NearbyVet = {
  jp: string;
  en: string;
  rating: number; // 0 = unknown (real data has no rating)
  km: number;
  open: boolean;
  em: boolean;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  real: true;
};

const CACHE_KEY = "momentum-nearby-vets";
const CACHE_TTL = 30 * 60 * 1000; // 30 min

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

/** Search radii in metres — widen until we find something. */
const RADII = [8000, 20000, 50000, 100000, 250000, 500000];
const DEFAULT_LOCATION = { lat: 19.0544, lon: 72.8406 }; // Bandra, Mumbai

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildQuery(lat: number, lon: number, radius: number) {
  const around = `around:${radius},${lat},${lon}`;
  return `[out:json][timeout:25];(
    node["amenity"="veterinary"](${around});
    way["amenity"="veterinary"](${around});
    node["healthcare"="veterinary"](${around});
    way["healthcare"="veterinary"](${around});
    node["shop"="pet"]["veterinary"="yes"](${around});
  );out center 300;`;
}

async function overpass(query: string): Promise<any | null> {
  for (const url of MIRRORS) {
    try {
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(query) });
      if (!res.ok) continue;
      const json = await res.json();
      if (json?.elements) return json;
    } catch {
      /* try next mirror */
    }
  }
  return null;
}

function mapElements(elements: any[], lat: number, lon: number): NearbyVet[] {
  return elements
    .map((el: any) => {
      const vLat = el.lat ?? el.center?.lat;
      const vLon = el.lon ?? el.center?.lon;
      if (vLat == null || vLon == null) return null;
      const t = el.tags ?? {};
      const name = t.name || t["name:en"] || t.operator || "Veterinary Clinic";
      const addr = [t["addr:housenumber"], t["addr:street"], t["addr:suburb"], t["addr:city"]]
        .filter(Boolean)
        .join(", ");
      const hours: string = t.opening_hours ?? "";
      return {
        jp: name,
        en: name,
        rating: 0,
        km: Math.round(haversineKm(lat, lon, vLat, vLon) * 10) / 10,
        open: true,
        em: /24\s*(x|×|\*)\s*7|24\/7|24 hours/i.test(hours),
        lat: vLat,
        lon: vLon,
        address: addr || undefined,
        phone: t.phone || t["contact:phone"] || undefined,
        real: true as const,
      } as NearbyVet;
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.km - b.km)
    .slice(0, 25) as NearbyVet[];
}

export function useNearbyVets() {
  const geo = useGeoLocation();
  const [vets, setVets] = useState<NearbyVet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!geo.coords && geo.loading) return;
    // The app uses Bandra as its default location when GPS is unavailable.
    const { lat, lon } = geo.coords ?? DEFAULT_LOCATION;

    // Use cache when the user hasn't moved far
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (
          Date.now() - cached.at < CACHE_TTL &&
          haversineKm(lat, lon, cached.lat, cached.lon) < 1 &&
          Array.isArray(cached.vets) &&
          cached.vets.length
        ) {
          setVets(
            cached.vets.map((v: NearbyVet) => ({
              ...v,
              km: Math.round(haversineKm(lat, lon, v.lat, v.lon) * 10) / 10,
            }))
          );
          return;
        }
      }
    } catch { /* ignore */ }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      let found: NearbyVet[] = [];
      for (const radius of RADII) {
        const json = await overpass(buildQuery(lat, lon, radius));
        if (cancelled) return;
        if (json) found = mapElements(json.elements ?? [], lat, lon);
        if (found.length) break;
      }
      if (cancelled) return;
      if (found.length) {
        setVets(found);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), lat, lon, vets: found }));
        } catch { /* ignore */ }
      } else {
        setError("No veterinary clinics found near you right now.");
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [geo.coords?.lat, geo.coords?.lon, geo.loading, nonce]);

  return { vets, loading, error, refresh, geo };
}

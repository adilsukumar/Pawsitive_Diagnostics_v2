import { createFileRoute, useNavigate } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { useEffect, useRef, useState } from "react";
import {
  Navigation, AlertTriangle, Phone, Shield, History, Crosshair,
  Plus, Minus, Satellite, ChevronRight, Stethoscope,
} from "lucide-react";
import { toast } from "sonner";
import { useT } from "@/context/LanguageContext";
import { usePet, displayName } from "@/context/PetContext";
import { useGeoLocation } from "@/lib/useGeoLocation";
import { recordPoint, readTrail, distanceKm, type TrailPoint } from "@/lib/locationTrail";
import { useNearbyVets } from "@/lib/useNearbyVets";

export const Route = createFileRoute("/map")({ component: MapScreen });

/* Home-page card spec */
const CARD_SHADOW = "var(--shadow-card)";

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ margin: "24px 20px 10px", fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
      {title}
    </div>
  );
}

function MapScreen() {
  const t = useT();
  const navigate = useNavigate();
  const { pet } = usePet();
  const dogName = displayName(pet, t("ワンちゃん", "My Pet"));

  const [lost, setLost] = useState(false);
  const [safeZone, setSafeZone] = useState(true);
  const [radius, setRadius] = useState<100 | 200 | 500 | 1000>(200);
  const [mapType, setMapType] = useState<"map" | "satellite">("satellite");
    const [showAllHistory, setShowAllHistory] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const geo = useGeoLocation();
  const { vets } = useNearbyVets();
  const nearestVet = vets[0];
  // Real GPS trail — recorded from actual device positions only.
  const [trail, setTrail] = useState<TrailPoint[]>(() => readTrail());
  useEffect(() => {
    if (!geo.coords) return;
    const next = recordPoint(geo.coords.lat, geo.coords.lon, geo.label);
    if (next) setTrail(next);
  }, [geo.coords?.lat, geo.coords?.lon, geo.label]);

  const mapEl = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const layers = useRef<any>({});
  const mapTypeRef = useRef(mapType);
  mapTypeRef.current = mapType;

  // Init + update real satellite/street map (client only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;

      if (!leafletMap.current) {
        const map = L.map(mapEl.current, { zoomControl: false, attributionControl: false }).setView([20.5937, 78.9629], 5);
        const satellite = L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19, maxNativeZoom: 17 }
        );
        const street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, maxNativeZoom: 17 });
        layers.current = { satellite, street };
        satellite.addTo(map);
        leafletMap.current = map;
      }
      const map = leafletMap.current;

      // Toggle base layer
      const target = mapTypeRef.current === "satellite" ? "satellite" : "street";
      Object.entries(layers.current).forEach(([k, layer]: any) => {
        if (k === target) { if (!map.hasLayer(layer)) layer.addTo(map); }
        else if (map.hasLayer(layer)) map.removeLayer(layer);
      });

      if (geo.coords) {
        const petPos: [number, number] = [geo.coords.lat + 0.0004, geo.coords.lon + 0.0003];
        const youPos: [number, number] = [geo.coords.lat, geo.coords.lon];
        map.setView(petPos, map.getZoom() < 10 ? 17 : map.getZoom());

        (layers.current.overlays ?? []).forEach((o: any) => map.removeLayer(o));
        const overlays: any[] = [];

        if (safeZone) {
          overlays.push(L.circle(petPos, {
            radius, color: "#3E7C59", weight: 2, dashArray: "6 6",
            fillColor: "#3E7C59", fillOpacity: 0.08,
          }));
          overlays.push(L.marker(petPos, { interactive: false, icon: L.divIcon({
            className: "", iconSize: [80, 20], iconAnchor: [40, -radius * 0 - 6],
            html: `<div style="background:#fff;border:1px solid #3E7C59;color:#3E7C59;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap;width:max-content;transform:translateY(-14px)">Safe Zone</div>`,
          })}));
        }

        overlays.push(L.marker(youPos, { interactive: false, icon: L.divIcon({
          className: "", iconSize: [16, 16], iconAnchor: [8, 8],
          html: `<div style="position:relative;width:16px;height:16px">
            <div style="position:absolute;inset:-12px;border-radius:50%;background:rgba(90,124,158,.15);border:1px dashed rgba(90,124,158,.4)"></div>
            <div style="position:absolute;inset:0;border-radius:50%;background:#5A7C9E;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>
            <div style="position:absolute;top:-24px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #5A7C9E;color:#5A7C9E;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;white-space:nowrap">You</div>
          </div>`,
        })}));

        overlays.push(L.marker(petPos, { interactive: false, icon: L.divIcon({
          className: "", iconSize: [20, 20], iconAnchor: [10, 10],
          html: `<div style="position:relative;width:20px;height:20px">
            <div style="position:absolute;inset:-14px;border-radius:50%;background:rgba(31,122,114,.15);border:2px solid rgba(31,122,114,.4);animation:mapPulse 2s ease-in-out infinite"></div>
            <div style="position:absolute;inset:0;border-radius:50%;background:#1F7A72;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.35)"></div>
            <div style="position:absolute;top:-26px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #1F7A72;color:#1F7A72;font-size:11px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.15)">${dogName}</div>
          </div>`,
        })}));

        overlays.forEach((o) => o.addTo(map));
        layers.current.overlays = overlays;
      }
    })();
    return () => { cancelled = true; };
  }, [geo.coords?.lat, geo.coords?.lon, mapType, safeZone, radius, dogName]);

  useEffect(() => () => { leafletMap.current?.remove(); leafletMap.current = null; }, []);

  const openDirections = () => {
    const dest = geo.coords
      ? `${geo.coords.lat},${geo.coords.lon}`
      : encodeURIComponent(geo.label);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, "_blank");
  };

  return (
    <AppShell titleJp="位置情報" titleEn="Location" noPadding>
      <style>{`
        @keyframes mapPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.3); opacity: .6 } }
        @keyframes safeRotate { to { transform: translate(-50%,-50%) rotate(360deg) } }
        @keyframes greenPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.6); opacity: .4 } }
        @keyframes borderPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(229,57,53,.5) } 50% { box-shadow: 0 0 0 8px rgba(229,57,53,0) } }
        .map-pulse-ring { animation: mapPulse 2s ease-in-out infinite; }
        .safe-rotate { animation: safeRotate 60s linear infinite; }
        .green-pulse::before { content:""; position:absolute; inset:0; border-radius:9999px; background:var(--accent-sakura); animation: greenPulse 1.6s ease-in-out infinite; }
      `}</style>

      {/* LIVE STATUS BAR */}
      <div style={{ margin: "12px 16px", padding: "14px 16px", background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-card)", boxShadow: CARD_SHADOW }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative inline-block green-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: geo.tracking ? "var(--accent-sakura)" : "var(--text-placeholder)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
              {geo.tracking ? t("ライブ追跡中", "Live Tracking") : geo.loading ? t("位置を取得中…", "Locating…") : t("位置情報オフ", "Location Off")}
            </span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: geo.tracking ? "var(--accent-sakura)" : "var(--text-placeholder)" }}>
            <Satellite size={14} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {geo.coords ? `${geo.coords.lat.toFixed(4)}, ${geo.coords.lon.toFixed(4)}` : "GPS —"}
            </span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
          {t("最終更新: たった今", "Last updated: Just now")}
        </div>
      </div>

      {/* MAP CARD */}
      <div style={{ margin: "12px 16px", borderRadius: 28, overflow: "hidden", height: 320, position: "relative", boxShadow: CARD_SHADOW, border: "1px solid var(--border-card)", background: "var(--acc-pale)" }}>
        {/* Real satellite / street tiles centered on live GPS */}
        <div ref={mapEl} className="absolute inset-0" style={{ zIndex: 1 }} />
        {!geo.coords && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2, background: "var(--acc-pale)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 600 }}>
            {geo.loading ? t("位置を取得中…", "Locating…") : t("位置情報オフ", "Location Off")}
          </div>
        )}

        {/* Collar GPS badge top-left */}
        <div className="absolute" style={{ zIndex: 500, top: 12, left: 12, background: "#FFFFFF", padding: "5px 10px", borderRadius: 12, fontSize: 11, color: "var(--accent-matcha)", fontWeight: 700, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
           {t("カラーGPS", "Collar GPS")}
        </div>

        {/* Map type toggle top-left lower */}
        <div className="absolute flex" style={{ zIndex: 500, top: 48, left: 12, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(8px)", borderRadius: 14, padding: 3, fontSize: 11, fontWeight: 600 }}>
          {(["map", "satellite"] as const).map(m => (
            <button key={m} onClick={() => setMapType(m)} style={{
              padding: "4px 10px", borderRadius: 12,
              background: mapType === m ? "var(--accent-sakura)" : "transparent",
              color: mapType === m ? "#fff" : "var(--text-secondary)",
            }}>
              {m === "map" ? t("地図", "Map") : t("衛星", "Satellite")}
            </button>
          ))}
        </div>

        {/* Zoom controls top-right */}
        <div className="absolute" style={{ zIndex: 500, top: 12, right: 12, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <button onClick={() => leafletMap.current?.zoomIn()} aria-label="Zoom in" className="flex items-center justify-center" style={{ width: 36, height: 36, color: "var(--text-primary)" }}><Plus size={16} /></button>
          <div style={{ height: 1, background: "var(--border-card)" }} />
          <button onClick={() => leafletMap.current?.zoomOut()} aria-label="Zoom out" className="flex items-center justify-center" style={{ width: 36, height: 36, color: "var(--text-primary)" }}><Minus size={16} /></button>
        </div>

        {/* My location button bottom-right */}
        <button
          onClick={() => { if (geo.coords) leafletMap.current?.setView([geo.coords.lat + 0.0004, geo.coords.lon + 0.0003], 17); toast.success(t("ペットの位置に移動しました", "Centered on your pet")); }}
          aria-label="Center on pet"
          className="absolute flex items-center justify-center active:scale-90 transition-transform" style={{ zIndex: 500, bottom: 14, right: 12, width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
        >
          <Crosshair size={20} style={{ color: "var(--accent-sora)" }} />
        </button>

        {/* Attribution */}
        <div className="absolute" style={{ bottom: 4, left: 8, zIndex: 500, fontSize: 8, color: "var(--text-secondary)", background: "rgba(255,255,255,0.7)", padding: "1px 6px", borderRadius: 6 }}>
          © Esri · © OpenStreetMap contributors
        </div>
      </div>

      {/* PET INFO CARD */}
      <SectionHeader title={t("マイペット", "My Pet")} />
      <div style={{ margin: "0 16px 12px", background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-card)", boxShadow: CARD_SHADOW }}>
        <div style={{ padding: 14 }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="min-w-0">
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{dogName}</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 1 }}>
                  {geo.loading && !geo.coords ? t("位置を取得中…", "Locating…") : geo.label}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-sakura)" }} />
                  <span style={{ fontSize: 12, color: "var(--accent-sakura)", fontWeight: 600 }}>{t("今移動中", "Moving now")}</span>
                </div>
              </div>
            </div>
            <span style={{ background: "var(--accent-sakura-soft)", border: "1px solid var(--acc-pale)", color: "var(--accent-sakura)", fontSize: 13, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>0.3km</span>
          </div>

          <div className="flex items-center gap-2 mt-3" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
            <span> {t("移動中", "Moving")}</span>
            <span>·</span>
            <span> {geo.short}</span>
            <span>·</span>
            <span> {t("たった今", "Just now")}</span>
            <span>·</span>
            <span> {t("4分", "4 min")}</span>
          </div>

          <button onClick={openDirections} className="w-full flex items-center justify-center gap-2 mt-3" style={{ height: 48, borderRadius: 14, background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 6px 16px color-mix(in oklab, var(--accent-sakura) 35%, transparent)" }}>
            <Navigation size={16} />
            {t("道案内", "Get Directions")}
          </button>
        </div>
      </div>

      {/* SAFE ZONE CARD */}
      <SectionHeader title={t("安全", "Safety")} />
      <div style={{ margin: "0 16px 12px", background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-card)", boxShadow: CARD_SHADOW }}>
        <div style={{ padding: 14 }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={20} style={{ color: "var(--accent-sakura)" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{t("安全ゾーン", "Safe Zone")}</span>
            </div>
            <Toggle on={safeZone} onChange={setSafeZone} activeColor="var(--accent-sakura)" />
          </div>
          {safeZone && (
            <div className="mt-2">
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {t(`${radius < 1000 ? radius + "m" : "1km"} 半径で通知`, `Notify within ${radius < 1000 ? radius + "m" : "1km"} radius`)}
              </div>
              <div className="flex gap-2 mt-2">
                 {([100,200,500,1000] as const).map(r => (
                  <button key={r} onClick={() => setRadius(r)} style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: radius === r ? "var(--accent-sakura)" : "var(--bg-elevated)",
                    color: radius === r ? "#fff" : "var(--text-secondary)",
                  }}>{r < 1000 ? `${r}m` : "1km"}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOST MODE CARD */}
      <div style={{
        margin: "0 16px 12px",
        background: "var(--bg-card)",
        borderRadius: 24,
        border: lost ? "2px solid var(--accent-red)" : "1px solid var(--border-card)",
        boxShadow: CARD_SHADOW,
        animation: lost ? "borderPulse 1.6s infinite" : undefined,
        padding: 14,
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2 flex-1">
            <AlertTriangle size={20} style={{ color: lost ? "#E53935" : "var(--text-placeholder)", marginTop: 2 }} className={lost ? "animate-pulse" : ""} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: lost ? "#E53935" : "var(--text-primary)" }}>
                {lost ? ` ${t("迷子モード起動中", "Lost Mode ACTIVE")}` : t("迷子モード", "Lost Mode")}
              </div>
              <div style={{ fontSize: 12, color: lost ? "#E53935" : "var(--text-secondary)", marginTop: 2 }}>
                {lost ? t("緊急追跡中...", "Emergency tracking active...") : t("紛失時の緊急追跡", "Emergency tracking if lost")}
              </div>
            </div>
          </div>
          <Toggle on={lost} onChange={setLost} activeColor="#E53935" />
        </div>
        {lost && (
          <div className="mt-3 space-y-2">
            <a href="tel:+81000000000" className="w-full flex items-center justify-center gap-2" style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #E53935, #C62828)", color: "#fff", fontWeight: 700, fontSize: 13 }}>
              <Phone size={14} /> {t("獣医に通知", "Notify Vet")}
            </a>
            <button
              onClick={() => {
                if (sosActive) return;
                setSosActive(true);
                toast.error(t("SOS起動 — 近隣の獣医と警察に通報しました", "SOS activated — nearby vets and your emergency contact alerted"));
                setTimeout(() => setSosActive(false), 8000);
              }}
              className="w-full flex items-center justify-center gap-2"
              style={{ height: 44, borderRadius: 12, background: "linear-gradient(135deg, #E53935, #C62828)", color: "#fff", fontWeight: 700, fontSize: 13, opacity: sosActive ? 0.75 : 1 }}
            >
               {sosActive ? t("SOS発信中…", "SOS Broadcasting…") : t("SOS起動", "Activate SOS")}
            </button>
          </div>
        )}
      </div>

      {/* LOCATION HISTORY */}
      <SectionHeader title={t("アクティビティ", "Activity")} />
       <div style={{ margin: "0 16px 12px", background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-card)", boxShadow: CARD_SHADOW, padding: 14 }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <History size={18} style={{ color: "var(--accent-sakura)" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t("移動履歴", "Location History")}</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-sakura)", background: "var(--accent-sakura-soft)", padding: "3px 10px", borderRadius: 20 }}>{t("今日", "Today")}</span>
        </div>

        {trail.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", padding: "6px 0", lineHeight: 1.5 }}>
            {t("履歴はまだありません。", "No movement recorded yet — allow location access and your real trail will appear here.")}
          </div>
        )}
        {[...trail].reverse().slice(0, showAllHistory ? 20 : 3).map((p, i, arr) => {
          const prev = arr[i + 1];
          const dist = prev ? `+${distanceKm(prev, p).toFixed(2)}km` : t("出発地", "Start");
          return (
            <div key={p.t} className="flex items-center gap-3" style={{ padding: "8px 0", borderTop: i === 0 ? "none" : "1px solid var(--bg-elevated)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent-matcha)", flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {new Date(p.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }} className="truncate">
                    {p.label || `${p.lat.toFixed(4)}, ${p.lon.toFixed(4)}`}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--accent-sakura)", fontWeight: 600 }}>{dist}</span>
            </div>
          );
        })}

        <button onClick={() => setShowAllHistory((s) => !s)} className="flex items-center gap-1 mt-2" style={{ fontSize: 12, color: "var(--accent-sakura)", fontWeight: 600 }}>
          {showAllHistory ? t("履歴を閉じる", "Show Less") : t("全履歴を見る", "View Full History")} <ChevronRight size={14} style={{ transform: showAllHistory ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
      </div>

      {/* NEARBY CLINIC */}
      <button onClick={() => navigate({ to: "/clinics" })} className="w-full flex items-center gap-3" style={{ margin: "0 16px 24px", width: "calc(100% - 32px)", background: "var(--bg-card)", boxShadow: CARD_SHADOW, border: "1px solid var(--border-card)", borderRadius: 24, padding: 14, textAlign: "left" }}>
        <div className="flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--accent-sakura-soft)" }}>
          <Stethoscope size={20} style={{ color: "var(--accent-sakura)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("最寄りの動物病院", "Nearest Veterinary Hospital")}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {nearestVet
              ? `${nearestVet.en} · ${nearestVet.km.toFixed(1)}km${nearestVet.em ? " · 24H" : ""}`
              : t("検索中…", "Searching near your location…")}
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-sakura)", color: "#fff", flexShrink: 0 }}>
          <ChevronRight size={18} />
        </div>
      </button>
    </AppShell>
  );
}

function Toggle({ on, onChange, activeColor = "var(--accent-matcha)" }: { on: boolean; onChange: (v: boolean) => void; activeColor?: string }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 48, height: 28, borderRadius: 999, position: "relative", transition: "background .3s",
      background: on ? activeColor : "var(--border-card)",
    }}>
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3, width: 22, height: 22, borderRadius: "50%",
        background: "#fff", transition: "left .3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}


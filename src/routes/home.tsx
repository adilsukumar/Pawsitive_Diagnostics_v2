import { createFileRoute, Link } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { useEffect, useState, type ReactNode } from "react";
import { getSpecies } from "@/lib/species";
import {
  Microscope, Activity, Thermometer, MapPin, Wind, Sun, GitMerge, Mic,
  Bluetooth, Cable, Droplets, BatteryMedium, PawPrint, Search, SlidersHorizontal,
  ChevronDown, HeartHandshake, Stethoscope, type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { usePet } from "@/context/PetContext";
import { useGeoLocation } from "@/lib/useGeoLocation";
import { useAuth } from "@/context/AuthContext";
import { useCollar } from "@/context/CollarContext";
import { describeEnvironment, interpretMovement } from "@/lib/telemetryInterpretation";
import VetHome from "@/components/vet/VetHome";

export const Route = createFileRoute("/home")({ component: Home });

/* ---------- Shared botanical theme tokens ---------- */
const JP = {
  card: "var(--bg-card)",
  sumi: "var(--text-primary)",
  usuzumi: "var(--text-secondary)",
  sakura: "var(--accent-sakura)",
  sakuraSoft: "var(--accent-sakura-soft)",
  fuji: "var(--accent-fuji)",
  sora: "var(--accent-sora)",
  matcha: "var(--accent-matcha)",
  momiji: "var(--acc-strong)",
  yuzu: "var(--accent-yuzu)",
};

const CARD_SHADOW = "var(--shadow-card)";

/* Clean white card — reference style: no strips, soft shadow, 20px radius */
function JCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: JP.card,
        borderRadius: 24,
        border: "1px solid var(--border-card)",
        boxShadow: CARD_SHADOW,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* Section header — reference style: bold title left, "See all" link right */
function SectionHeader({ en, to }: { en: string; to?: string }) {
  const inner = (
    <>
      <div style={{ fontSize: 18, fontWeight: 500, color: JP.sumi, fontFamily: "var(--font-display)" }}>
        {en}
      </div>
      {to && (
        <span style={{ fontSize: 12, fontWeight: 600, color: JP.sakura }}>
          See all
        </span>
      )}
    </>
  );
  const style: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "26px 0 12px",
  };
  return to ? (
    <Link to={to} style={style}>{inner}</Link>
  ) : (
    <div style={style}>{inner}</div>
  );
}

/* ---------- Sensors ---------- */
type Sensor = {
  Icon: LucideIcon;
  accent: string; iconBg: string;
  en: string; subEn: string; valEn: string;
  to: string;
  progress?: number;
  noteEn?: string;
};

/* All sensor icons share one pastel-green circle + deep-green glyph */
const GREEN_BG = "var(--acc-pale)";
const GREEN_ICON = "var(--acc-strong)";

  const sensors: Sensor[] = [
    { Icon: Microscope, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/skin-sense",
      en: "SkinSense AI", subEn: "Skin Health", valEn: "—" },
    { Icon: Activity, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/motion-sense",
      en: "MotionSense", subEn: "Activity Track", valEn: "—" },
    { Icon: Thermometer, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/temp-sense",
      en: "Temp", subEn: "NTC sensor", valEn: "—" },
    { Icon: Droplets, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/environment-sense",
      en: "EnvironmentSense", subEn: "Temperature + Humidity", valEn: "—" },
    { Icon: MapPin, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/map",
      en: "LocationSense", subEn: "GPS + Map", valEn: "—" },
    { Icon: Wind, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/pressure-sense",
      en: "PressureSense", subEn: "Pressure Data", valEn: "—" },
    { Icon: Sun, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/light-sense",
      en: "LightSense AI", subEn: "RGB Light Data", valEn: "—" },
    { Icon: GitMerge, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/report",
      en: "CombineSense", subEn: "Combined Analysis", valEn: "—" },
      { Icon: Mic, accent: GREEN_ICON, iconBg: GREEN_BG, to: "/bark-sense",
        en: "BarkSense AI", subEn: "Vocal Analysis", valEn: "—" },
  ];

function CollarStatusCard() {
  const { state, live, battery, transport, receiving, error, connect, disconnect } = useCollar();
  const connected = state === "connected";
  const active = [live.temp, live.humidity, live.motion].filter(Boolean).length;
  const TransportIcon = transport === "bluetooth" ? Bluetooth : Cable;

  return (
    <JCard style={{ padding: "12px 14px", marginTop: 16, boxShadow: "none" }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        <div className="flex items-center justify-center" style={{ width: 38, height: 38, borderRadius: 12, background: "var(--acc-pale)", flexShrink: 0 }}>
          <TransportIcon size={18} strokeWidth={2} className={state === "connecting" ? "animate-pulse" : ""}
            style={{ color: connected ? JP.matcha : JP.sakura }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center" style={{ gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: receiving ? JP.matcha : "var(--text-placeholder)", flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: JP.sumi }}>
              {connected ? `Live over ${transport === "bluetooth" ? "Bluetooth" : "USB"}` : state === "connecting" ? "Connecting collar..." : "Awaiting telemetry"}
            </span>
          </div>
          <div style={{ fontSize: 11, color: error ? "var(--accent-red)" : JP.usuzumi, marginTop: 2, lineHeight: 1.35 }}>
            {error ?? (receiving ? `${active} of 3 readings live` : connected ? "Waiting for telemetry..." : "USB is fastest for local testing")}
          </div>
        </div>
        {connected && battery != null && (
          <div className="flex items-center" style={{ gap: 3, color: JP.sora }}>
            <BatteryMedium size={14} /><span style={{ fontSize: 11, fontWeight: 700 }}>{battery}%</span>
          </div>
        )}
        {connected ? (
          <button onClick={() => { disconnect(); toast.info("Collar disconnected"); }}
            style={{ height: 34, padding: "0 12px", borderRadius: 17, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", color: JP.usuzumi, fontSize: 11, fontWeight: 700 }}>
            Disconnect
          </button>
        ) : (
          <div className="flex items-center" style={{ gap: 6 }}>
            <button disabled={state === "connecting"} onClick={() => connect("usb")}
              style={{ height: 34, padding: "0 13px", borderRadius: 17, border: "none", background: JP.sakura, color: "var(--primary-foreground)", fontSize: 11, fontWeight: 700, opacity: state === "connecting" ? 0.65 : 1 }}>
              Connect USB
            </button>
            <button disabled={state === "connecting"} onClick={() => connect("bluetooth")} aria-label="Connect Bluetooth" title="Connect Bluetooth"
              className="flex items-center justify-center"
              style={{ width: 34, height: 34, borderRadius: 17, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", color: JP.sakura, opacity: state === "connecting" ? 0.65 : 1 }}>
              <Bluetooth size={15} />
            </button>
          </div>
        )}
      </div>
    </JCard>
  );
}

/* ---------- Page ---------- */
function Home() {
  const { session, hydrated } = useAuth();
  const [factIdx, setFactIdx] = useState(0);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { state: collarState, live, receiving } = useCollar();

  const { pet } = usePet();
  const sp = getSpecies(pet.species);
  const geo = useGeoLocation();
  useEffect(() => {
    const tm = setInterval(() => setFactIdx((i) => (i + 1) % sp.facts.length), 10000);
    return () => clearInterval(tm);
  }, [sp]);
  // Wait for the session to load from storage so vets never see a flash
  // of the pet-owner home (or vice versa) on reload.
  if (!hydrated) return null;
  // Veterinarians get a dedicated clinical console instead of the owner home
  if (session?.role === "vet") return <VetHome />;

  const fact = sp.facts[factIdx % sp.facts.length];
  // Only real collar readings contribute to the device status.
  const telemetrySensors = [live.temp, live.humidity, live.motion];
  const activeSensors = telemetrySensors.filter(Boolean).length;
  const movementState = interpretMovement(live.motion?.value);

  const filtered = (query.trim()
    ? sensors.filter((s) =>
        (s.en + " " + s.subEn).toLowerCase().includes(query.trim().toLowerCase())
      )
    : sensors
  )
    .map((s) => (s.en === "LocationSense" ? { ...s, valEn: geo.loading ? "Locating..." : geo.short } : s))
    

  return (
    <AppShell titleJp="" titleEn="" noPadding>
      <div style={{ padding: "12px 16px 0" }}>

        {/* Location header row — reference style */}
        <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: JP.usuzumi, fontWeight: 500, letterSpacing: "0.04em" }}>
              Location
            </div>
            <div className="flex items-center" style={{ gap: 5, marginTop: 2 }}>
              <MapPin size={16} strokeWidth={2.2} style={{ color: JP.sakura, flexShrink: 0 }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: JP.sumi }}>
                {geo.loading && !geo.coords ? "Locating..." : geo.label}
              </span>
              <ChevronDown size={15} strokeWidth={2.2} style={{ color: JP.sumi }} />
            </div>
          </div>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex items-center justify-center"
            style={{
              width: 42, height: 42, borderRadius: 14, flexShrink: 0,
              background: "var(--acc-pale)",
              color: JP.sakura,
            }}
          >
            <SlidersHorizontal size={19} strokeWidth={2} />
          </Link>
        </div>

        <CollarStatusCard />

        <SectionHeader en="Live now" to="/report" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: 10 }}>
          <Link to="/motion-sense">
            <JCard style={{ padding: 16, minHeight: 116 }}>
              <div className="flex items-center justify-between">
                <Activity size={18} strokeWidth={2} style={{ color: JP.sakura }} />
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: receiving ? JP.matcha : "var(--text-placeholder)" }} />
              </div>
              <div style={{ marginTop: 17, fontSize: 20, fontWeight: 700, color: JP.sumi, fontFamily: "var(--font-display)" }}>
                {movementState === "moving" ? "Moving" : movementState === "resting" ? "Resting" : "—"}
              </div>
              <div style={{ marginTop: 3, fontSize: 11, color: JP.usuzumi }}>Current activity</div>
            </JCard>
          </Link>
          <Link to="/environment-sense">
            <JCard style={{ padding: 16, minHeight: 116 }}>
              <div className="flex items-center justify-between">
                <Droplets size={18} strokeWidth={2} style={{ color: JP.sakura }} />
                <span style={{ fontSize: 10, color: JP.usuzumi }}>{receiving ? "Live" : "Waiting"}</span>
              </div>
              <div className="flex items-baseline" style={{ gap: 8, marginTop: 14 }}>
                <span style={{ fontSize: 25, fontWeight: 700, color: JP.sumi, fontFamily: "var(--font-display)" }}>
                  {live.temp ? `${live.temp.value.toFixed(1)}°C` : "—"}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: JP.sakura }}>
                  {live.humidity ? `${live.humidity.value.toFixed(0)}% RH` : ""}
                </span>
              </div>
              <div style={{ marginTop: 3, fontSize: 11, color: JP.usuzumi }}>
                {describeEnvironment(live.temp?.value, live.humidity?.value)}
              </div>
            </JCard>
          </Link>
        </div>

        {/* Search bar — reference style */}
        <div className="flex items-center" style={{ gap: 10, marginTop: 16 }}>
          <div
            className="flex items-center flex-1"
            style={{
              height: 48,
              background: JP.card,
               borderRadius: 16,
               border: "1px solid var(--border-subtle)",
              boxShadow: CARD_SHADOW,
              padding: "0 14px",
              gap: 10,
              minWidth: 0,
            }}
          >
            <Search size={18} strokeWidth={2} style={{ color: "var(--text-placeholder)", flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Senses..."
              className="flex-1 outline-none"
              style={{
                border: "none", background: "transparent", height: "100%",
                fontSize: 14, color: JP.sumi, minWidth: 0,
              }}
            />
          </div>
          <button
            onClick={() => setViewMode((m) => (m === "grid" ? "list" : "grid"))}
            aria-label="Toggle sensor view"
            className="flex items-center justify-center active:scale-95 transition-transform"
            style={{
               width: 48, height: 48, borderRadius: 16, flexShrink: 0,
              background: viewMode === "list"
                ? "var(--acc-pale)"
                : `linear-gradient(135deg, ${JP.sakura}, var(--accent-sakura-dark))`,
              boxShadow: "0 6px 16px color-mix(in oklab, var(--accent-sakura) 35%, transparent)",
               color: viewMode === "list" ? JP.sakura : "var(--primary-foreground)",
            }}
          >
            <SlidersHorizontal size={19} strokeWidth={2.2} />
          </button>
        </div>

        {/* Daily fact — clean white card, above sensors (lightweight CSS fade, no animation lib) */}
        <style>{`@keyframes factFade { from { opacity: 0; } to { opacity: 1; } }`}</style>
        <SectionHeader en={`Daily ${sp.label} Fact`} />
        <div key={factIdx} style={{ animation: "factFade 0.3s ease" }}>
          <JCard style={{ padding: 16 }}>
            <div className="flex items-center" style={{ gap: 10 }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 38, height: 38, borderRadius: 12, background: JP.sakuraSoft, flexShrink: 0 }}
              >
                <PawPrint size={18} strokeWidth={1.9} style={{ color: JP.sakura }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: JP.sumi }}>
                Did you know?
              </span>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.55, color: JP.sumi, fontWeight: 500 }}>
              {fact}
            </div>
          </JCard>
        </div>

        {/* Sensor quick icons — all 8 visible in one line, no scrolling */}
        <SectionHeader en="Sense AI" />
        {filtered.length === 0 ? (
          <JCard style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 13, color: JP.usuzumi }}>No sensors match â€œ{query}â€.</div>
          </JCard>
        ) : viewMode === "list" ? (
          <JCard style={{ padding: 6 }}>
            {filtered.map((s, i) => {
              const Icon = s.Icon;
              return (
                <Link
                  key={s.en}
                  to={s.to}
                  className="flex items-center"
                  style={{
                    gap: 12, padding: "12px 10px",
                    borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 44, height: 44, borderRadius: "50%", background: s.iconBg, flexShrink: 0 }}
                  >
                    <Icon size={20} strokeWidth={1.8} style={{ color: s.accent }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: JP.sumi }}>{s.en}</div>
                    <div style={{ fontSize: 11, color: JP.usuzumi, marginTop: 1 }}>{s.subEn}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.accent, flexShrink: 0 }}>{s.valEn}</span>
                </Link>
              );
            })}
          </JCard>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              rowGap: 24,
              columnGap: 12,
            }}
          >
            {filtered.map((s) => {
              const Icon = s.Icon;
              return (
                <Link
                  key={s.en}
                  to={s.to}
                  className="flex flex-col items-center"
                  style={{ gap: 8 }}
                  aria-label={s.en}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 58, height: 58, borderRadius: "50%",
                      background: s.iconBg,
                      boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Icon size={25} strokeWidth={1.8} style={{ color: s.accent }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: JP.usuzumi, textAlign: "center", lineHeight: 1.15, maxWidth: 74, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.en.replace(" AI", "").replace("Sense", "")}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Quick Access — circular icons matching the sensor row style */}
        <SectionHeader en="Quick Access" />
        <div className="flex" style={{ gap: 14, marginBottom: 20, justifyContent: "space-between" }}>
          {[
            { to: "/report", Icon: Activity, label: "Health Report", sub: "View details", bg: GREEN_BG, accent: GREEN_ICON },
            { to: "/breeds", Icon: PawPrint, label: "Breed Guide", sub: "200+ breeds", bg: GREEN_BG, accent: GREEN_ICON },
            { to: "/community", Icon: HeartHandshake, label: "Pet Match", sub: "Find a match", bg: GREEN_BG, accent: GREEN_ICON },
            { to: "/clinics", Icon: Stethoscope, label: "Clinics", sub: "Vets near you", bg: GREEN_BG, accent: GREEN_ICON },
          ].map((q) => (
            <Link
              key={q.label}
              to={q.to}
              className="flex flex-col items-center"
              style={{ width: 76, gap: 7 }}
              aria-label={q.label}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: q.bg,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <q.Icon size={24} strokeWidth={1.8} style={{ color: q.accent }} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: JP.sumi, lineHeight: 1.2 }}>{q.label}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: JP.usuzumi, marginTop: 1 }}>{q.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}








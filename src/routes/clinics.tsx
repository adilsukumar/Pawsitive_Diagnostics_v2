import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";

import { useNearbyVets } from "@/lib/useNearbyVets";

type ClinicItem = { jp: string; en: string; rating: number; km: number; open: boolean; em: boolean; lat?: number; lon?: number; address?: string; real?: boolean };
import { useGeoLocation } from "@/lib/useGeoLocation";
import {
  Search,
  SlidersHorizontal,
  Star,
  Navigation,
  Video,
  Phone,
  MapPin,
  HeartPulse,
  ThumbsUp,
  Microscope,
  Building2,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Clock,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  RotateCcw,
  Loader2,
  Flag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useT, useLanguage } from "@/context/LanguageContext";

export const Route = createFileRoute("/clinics")({ component: Clinics });

/* Home-page card spec */
const CARD_SHADOW = "var(--shadow-card)";
/* 8px grid · 16px side margins everywhere */
const MX = 16;

// ── Per-clinic avatar themes ──────────────────────────────────
type Theme = { accent: string; soft: string };
const CLINIC_THEMES: Theme[] = [
  { accent: "var(--accent-matcha)", soft: "var(--acc-pale)" },
  { accent: "var(--accent-sakura)", soft: "var(--accent-sakura-soft)" },
  { accent: "var(--accent-sora)", soft: "var(--acc2-pale)" },
  { accent: "var(--accent-yuzu)", soft: "var(--acc-pale)" },
  { accent: "var(--accent-fuji)", soft: "var(--acc-pale)" },
];

const SPECIALTIES = [
  { jp: "Dental", en: "Dental" },
  { jp: "Surgery", en: "Surgery" },
  { jp: "Derm", en: "Derm" },
  { jp: "Internal", en: "Internal" },
];

// ── Filter chips ──────────────────────────────────────────────
type Cat = { jp: string; en: string; Icon: typeof Star };
const CATS: Cat[] = [
  { jp: "Top Rated", en: "Top Rated", Icon: Star },
  { jp: "Nearby", en: "Nearby", Icon: MapPin },
  { jp: "Recommended", en: "Recommended", Icon: ThumbsUp },
  { jp: "Specialized", en: "Specialized", Icon: Microscope },
  { jp: "24H Open", en: "24H Open", Icon: Building2 },
];

function SectionLabel({ jp, en }: { jp: string; en: string }) {
  const t = useT();
  return (
      <div style={{ margin: `24px ${MX}px 10px` }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
        {t(jp, en)}
      </div>
    </div>
  );
}

function Clinics() {
  const t = useT();
  const { language } = useLanguage();
  const [filter, setFilter] = useState(false);
  const [active, setActive] = useState(1);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<Record<number, boolean>>({});
  const [minStars, setMinStars] = useState(4);
  const [distance, setDistance] = useState(5);
  const [openOnly, setOpenOnly] = useState(true);
  const [emOnly, setEmOnly] = useState(false);
  const [specSel, setSpecSel] = useState<Record<string, boolean>>({});
  const [applied, setApplied] = useState({ minStars: 0, distance: 50, openOnly: false, emOnly: false });
  const [visible, setVisible] = useState(5);
  const [videoBooking, setVideoBooking] = useState(false);
  const [dirFor, setDirFor] = useState<ClinicItem | null>(null);
  const { vets, loading: vetsLoading, error: vetsError, refresh: refreshVets, geo: vetsGeo } = useNearbyVets();
  const source: ClinicItem[] = vets;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = source.filter((c) => {
      if (q && !c.en.toLowerCase().includes(q) && !c.jp.includes(query.trim())) return false;
      if (c.rating > 0 && c.rating < applied.minStars) return false;
      if (c.km > applied.distance) return false;
      if (applied.openOnly && !c.open) return false;
      if (applied.emOnly && !c.em) return false;
      return true;
    });
    // Chip behaviour
    if (active === 0) list = [...list].sort((a, b) => b.rating - a.rating); // Top Rated
    else if (active === 1) list = [...list].sort((a, b) => a.km - b.km); // Nearby
    else if (active === 3) list = list.filter((_, i) => i % 4 === 1 || i % 4 === 4); // Specialized
    else if (active === 4) list = list.filter((c) => c.em); // 24H Open
    return list;
  }, [query, applied, active, source]);

  function bookVideoConsult() {
    if (videoBooking) return;
    setVideoBooking(true);
    toast.loading("Connecting you to the next available vet…", { id: "video-consult" });
    setTimeout(() => {
      setVideoBooking(false);
      toast.success("Booked! Dr. Mehta will video call you in ~5 minutes.", { id: "video-consult" });
    }, 1800);
  }

  const emergencyClinic = source.find((c) => c.em && c.open) ?? source[0];

  return (
    <AppShell noPadding>

      {/* ── Search bar + filter (aligned baseline) ─────────── */}
      <div className="flex items-center" style={{ margin: `16px ${MX}px 0`, gap: 10, height: 56 }}>
        <div
          className="flex items-center flex-1"
          style={{
            background: "var(--bg-card)",
            borderRadius: 18,
            height: 56,
            padding: "0 16px",
            gap: 10,
            minWidth: 0,
            border: `1.5px solid ${focused ? "var(--accent-sakura)" : "var(--border-card)"}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            transition: "border 0.18s ease",
          }}
        >
          <Search size={17} strokeWidth={2} style={{ color: "var(--text-placeholder)", flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: "var(--text-primary)", minWidth: 0, height: "100%", border: "none" }}
            placeholder={t("Search clinics", "Search clinics")}
          />
        </div>
        <button
          onClick={() => setFilter(true)}
          className="flex items-center justify-center active:scale-95 transition-transform"
          style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "var(--accent-sakura)",
            boxShadow: "0 4px 10px color-mix(in oklab, var(--accent-sakura) 26%, transparent)",
            color: "var(--primary-foreground)",
          }}
          aria-label={t("Filters", "Filters")}
        >
          <SlidersHorizontal size={17} strokeWidth={2.2} />
        </button>
      </div>

      {/* ── Filter chips ───────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-hide" style={{ padding: `12px ${MX}px 0`, gap: 8 }}>
        {CATS.map((c, i) => {
          const sel = active === i;
          const Icon = c.Icon;
          return (
            <button
              key={c.en}
              onClick={() => setActive(i)}
              className="shrink-0 flex items-center active:scale-95"
              style={{
                background: sel ? "var(--accent-sakura)" : "var(--bg-card)",
                border: `1.5px solid ${sel ? "var(--accent-sakura)" : "var(--border-card)"}`,
                color: sel ? "var(--primary-foreground)" : "var(--text-secondary)",
                fontWeight: sel ? 700 : 500,
                fontSize: 12,
                borderRadius: 999,
                padding: "0 13px",
                height: 34,
                gap: 5,
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={11} style={{ color: sel ? "#FFFFFF" : "var(--text-placeholder)" }} fill={sel && c.en === "Top Rated" ? "#FFFFFF" : "none"} />
              {t(c.jp, c.en)}
            </button>
          );
        })}
      </div>

      {/* ── Emergency card (compact) ───────────────────────── */}
      <div
        className="flex items-center justify-between"
        style={{
          margin: `16px ${MX}px 0`,
          background: "linear-gradient(135deg,var(--accent-red),var(--acc2-deep))",
          borderRadius: 24,
          padding: "16px 20px",
          color: "var(--primary-foreground)",
          boxShadow: "0 4px 12px rgba(229,57,53,0.18)",
          gap: 12,
        }}
      >
        <div className="min-w-0">
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.85)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {t("In Emergency", "In Emergency")}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.25, marginTop: 2 }}>
            {t("Nearest 24H Hospital", "Nearest 24H Hospital")}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {emergencyClinic.en} · {emergencyClinic.km}km {emergencyClinic.rating > 0 ? ` · ★ ${emergencyClinic.rating}` : ""}
          </div>
        </div>
        <a
          href="tel:+919820001234"
          className="flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          style={{
            background: "var(--bg-card)", color: "var(--accent-red)",
            borderRadius: 999, padding: "8px 16px",
            fontSize: 12, fontWeight: 800,
          }}
        >
          <Phone size={12} />
          {t("Call", "Call")}
        </a>
      </div>

      {/* ── Video consultation (compact action card) ───────── */}
      <button
        onClick={bookVideoConsult}
        className="text-left flex items-center active:scale-[0.98] transition-transform"
        style={{
          margin: `12px ${MX}px 0`,
          width: `calc(100% - ${MX * 2}px)`,
          background: "var(--bg-card)",
          boxShadow: CARD_SHADOW,
          borderRadius: 24,
          border: "1px solid var(--border-card)",
          padding: "14px 16px",
          gap: 12,
        }}
      >
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--bg-card-lavender)" }}
        >
          <Video size={19} style={{ color: "var(--accent-fuji)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center" style={{ gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {t("Video Consultation", "Video Consultation")}
            </span>
            <span
              style={{
                background: "var(--accent-sakura-soft)", color: "var(--accent-sakura)",
                fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, flexShrink: 0,
              }}
            >
              ● 24/7
            </span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
            {t("Consult a vet now", "Consult a vet now")}
          </div>
        </div>
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-sakura)", color: "#fff" }}
        >
          <ChevronRight size={15} />
        </div>
      </button>

      {/* ── Nearby clinics list ────────────────────────────── */}
      <SectionLabel jp="Nearby" en="Nearby" />
      {vetsLoading && (
        <div style={{ margin: `0 ${MX}px 10px`, fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
          Finding vet hospitals near you…
        </div>
      )}
      {!vetsLoading && vets.length > 0 && (
        <div className="flex items-center justify-between gap-2" style={{ margin: `0 ${MX}px 10px` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-matcha)" }}>
            {vets.length} real vet clinics near {vetsGeo.short || "you"}
          </span>
          <button onClick={refreshVets} style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-strong)" }}>Refresh</button>
        </div>
      )}
      {!vetsLoading && vets.length === 0 && (
        <div className="flex items-center justify-between gap-2" style={{ margin: `0 ${MX}px 10px` }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>
            {vetsGeo.denied
              ? "Turn on location access to see clinics around you"
              : vetsError ?? "Getting your location…"}
          </span>
          <button onClick={refreshVets} style={{ fontSize: 11, fontWeight: 700, color: "var(--acc-strong)" }}>Retry</button>
        </div>
      )}
      <div style={{ paddingBottom: 12 }}>
        {filtered.slice(0, visible).map((c, i) => {
          const th = CLINIC_THEMES[i % CLINIC_THEMES.length];
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => setDirFor(c)}
              className="active:scale-[0.99] transition-transform"
              style={{
                 background: "var(--bg-card)",
                 borderRadius: 24,
                 border: "1px solid var(--border-card)",
                margin: `0 ${MX}px 12px`,
                boxShadow: CARD_SHADOW,
                padding: "14px 16px",
                cursor: "pointer",
              }}
            >
              {/* Header row: avatar + name + bookmark */}
              <div className="flex items-center" style={{ gap: 12 }}>
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 42, height: 42, borderRadius: "50%", background: th.soft }}
                >
                  <HeartPulse size={18} style={{ color: th.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center" style={{ gap: 6 }}>
                    <span className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.25 }}>
                      {c.en}
                    </span>
                    {c.em && (
                      <span
                        className="shrink-0"
                        style={{ background: "#FDECEA", color: "#E53935", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 8, letterSpacing: "0.05em" }}
                      >
                        24H
                      </span>
                    )}
                  </div>
                  <div className="flex items-center" style={{ marginTop: 3, gap: 5 }}>
                    <span
                      style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: c.open ? "var(--accent-matcha)" : "var(--text-placeholder)",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 11, fontWeight: 600, color: c.open ? "var(--accent-matcha)" : "var(--text-secondary)" }}>
                      {c.open ? t("Open Now", "Open Now") : t("Closed", "Closed")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setSaved((s) => ({ ...s, [i]: !s[i] })); }}
                  aria-label="save"
                  className="flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-page)" }}
                >
                  <Bookmark
                    size={13}
                    style={{ color: saved[i] ? "var(--accent-sakura)" : "var(--text-placeholder)" }}
                    fill={saved[i] ? "var(--accent-sakura)" : "none"}
                  />
                </button>
              </div>

              {/* Meta row: rating · distance · time */}
              <div className="flex items-center" style={{ marginTop: 10, gap: 10, flexWrap: "wrap" }}>
                <span className="flex items-center" style={{ gap: 4 }}>
                  <Star size={11} style={{ color: "var(--accent-yuzu)" }} fill="var(--accent-yuzu)" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.rating > 0 ? c.rating : "—"}</span>
                </span>
                <span className="flex items-center" style={{ gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                  <MapPin size={11} style={{ color: "var(--accent-sakura)" }} /> {c.km} km
                </span>
                <span className="flex items-center" style={{ gap: 4, fontSize: 12, color: "var(--text-secondary)" }}>
                  <Clock size={11} style={{ color: "var(--text-placeholder)" }} /> {Math.round(c.km * 12)} min
                </span>
              </div>

              {/* Service tags */}
              <div className="flex" style={{ marginTop: 10, gap: 6, flexWrap: "wrap" }}>
                {SPECIALTIES.slice(0, 3).map((s) => (
                  <span
                    key={s.en}
                    style={{
                      background: "var(--bg-page)",
                      border: "1px solid var(--border-card)",
                      color: "var(--text-secondary)",
                      borderRadius: 20,
                      padding: "3px 9px",
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {t(s.jp, s.en)}
                  </span>
                ))}
                <span
                  style={{
                    background: "var(--acc-pale)",
                    color: "var(--accent-matcha)",
                    borderRadius: 20,
                    padding: "3px 9px",
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {t("Insurance OK", "Insurance OK")}
                </span>
              </div>

              {/* Actions */}
              <div className="flex" style={{ marginTop: 12, gap: 8 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setDirFor(c); }}
                  className="flex items-center justify-center active:scale-[0.97] transition-transform"
                  style={{
                    flex: 1, height: 36, borderRadius: 12, gap: 6,
                    background: "var(--accent-sakura)",
                    color: "#fff", fontSize: 12, fontWeight: 700,
                  }}
                >
                  <Navigation size={12} /> {t("Directions", "Directions")}
                </button>
                <a
                  href="tel:+919820001234"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Call clinic"
                  className="flex items-center justify-center shrink-0 active:scale-95 transition-transform"
                  style={{
                    width: 36, height: 36, borderRadius: 12,
                    background: "#FFFFFF", border: "1.5px solid var(--accent-sakura)",
                    color: "var(--accent-sakura)",
                  }}
                >
                  <Phone size={14} />
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 13, color: "var(--text-secondary)" }}>
            No clinics match these filters.
          </div>
        )}
        {visible < filtered.length && (
          <div className="flex justify-center" style={{ padding: "4px 16px 12px" }}>
            <button
              onClick={() => setVisible((v) => v + 3)}
              className="flex items-center gap-2 active:scale-95 transition-transform"
              style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--accent-sakura)",
                color: "var(--accent-sakura)",
                borderRadius: 20,
                padding: "9px 22px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {t("Load More", "Load More")} · {filtered.length - visible}
            </button>
          </div>
        )}
      </div>

      {/* ── Filter bottom sheet ────────────────────────────── */}
      {filter && (
        <div className="fixed inset-0 z-[120] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setFilter(false)}>
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="w-full max-w-md mx-auto"
            style={{ background: "var(--bg-page)", maxHeight: "85vh", overflowY: "auto", borderRadius: "28px 28px 0 0", padding: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 16px" }} />
            <div className="flex items-center justify-between">
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>
                {t("Filter", "Filter")}
              </div>
              <button
                onClick={() => { setMinStars(0); setDistance(5); setOpenOnly(false); setEmOnly(false); setSpecSel({}); }}
                style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-sakura)" }}
              >
                {t("Reset", "Reset")}
              </button>
            </div>

            {/* Distance */}
            <div style={{ marginTop: 20 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t("Distance", "Distance")}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-sakura)", background: "var(--accent-sakura-soft)", padding: "2px 10px", borderRadius: 20 }}>{distance}km</span>
              </div>
              <input
                type="range" min={1} max={10} step={1}
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: "var(--accent-sakura)" }}
              />
              <div className="flex justify-between" style={{ fontSize: 10, color: "var(--text-placeholder)", marginTop: 2 }}>
                <span>1km</span><span>3km</span><span>5km</span><span>10km</span>
              </div>
            </div>

            {/* Rating */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{t("Rating", "Rating")}</div>
              <div className="flex gap-2">
                {[5, 4, 3].map((n) => {
                  const sel = minStars === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setMinStars(n)}
                      className="flex items-center gap-1 flex-1 justify-center"
                      style={{
                        background: sel ? "var(--acc-pale)" : "#fff",
                        border: `1.5px solid ${sel ? "var(--accent-yuzu)" : "var(--border-card)"}`,
                        borderRadius: 12, padding: "10px 0",
                        fontSize: 12, fontWeight: 700,
                        color: sel ? "var(--accent-yuzu)" : "var(--text-secondary)",
                      }}
                    >
                      <Star size={12} fill={sel ? "var(--accent-yuzu)" : "none"} /> {n}.0+
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggles */}
            <div style={{ marginTop: 20 }} className="space-y-3">
              {[
                { label: t("Open Now Only", "Open Now Only"), val: openOnly, set: setOpenOnly, color: "var(--accent-sakura)" },
                { label: t("24H Emergency Only", "24H Emergency Only"), val: emOnly, set: setEmOnly, color: "#E53935" },
              ].map((tg) => (
                <label key={tg.label} className="flex items-center justify-between" style={{ background: "#fff", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border-card)" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{tg.label}</span>
                  <button
                    type="button"
                    onClick={() => tg.set(!tg.val)}
                    className="relative"
                    style={{
                      width: 44, height: 24, borderRadius: 999,
                      background: tg.val ? tg.color : "var(--border-card)",
                      transition: "background 0.18s",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute", top: 2, left: tg.val ? 22 : 2,
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        transition: "left 0.18s",
                      }}
                    />
                  </button>
                </label>
              ))}
            </div>

            {/* Specialization */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{t("Specialization", "Specialization")}</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { jp: "Dental", en: "Dental" },
                  { jp: "Surgery", en: "Surgery" },
                  { jp: "Derm", en: "Derm" },
                  { jp: "Internal", en: "Internal" },
                  { jp: "Eye", en: "Eye" },
                  { jp: "Ortho", en: "Ortho" },
                ].map((s) => {
                  const sel = specSel[s.en];
                  return (
                    <button
                      key={s.en}
                      onClick={() => setSpecSel((x) => ({ ...x, [s.en]: !x[s.en] }))}
                      style={{
                        background: sel ? "var(--accent-sakura-soft)" : "#fff",
                        border: `1.5px solid ${sel ? "var(--accent-sakura)" : "var(--border-card)"}`,
                        color: sel ? "var(--accent-sakura)" : "var(--text-secondary)",
                        fontWeight: 700, fontSize: 12,
                        borderRadius: 12, padding: "10px 0",
                      }}
                    >
                      {t(s.jp, s.en)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                setApplied({ minStars, distance, openOnly, emOnly });
                setVisible(5);
                setFilter(false);
                toast.success(t("Filters applied", "Filters applied"));
              }}
              className="w-full flex items-center justify-center gap-2"
              style={{
                marginTop: 24, marginBottom: 8,
                background: "linear-gradient(135deg,var(--accent-sakura),var(--accent-sakura-dark))",
                color: "#fff", borderRadius: 16,
                padding: "14px 0", fontSize: 14, fontWeight: 800,
                boxShadow: "0 6px 16px color-mix(in srgb, var(--accent-sakura) calc(0.35 * 100%), transparent)",
              }}
            >
              {t("Apply Filters", "Apply Filters")} · {CLINICS.filter((c) => (c.rating >= minStars || c.rating === 0) && c.km <= distance && (!openOnly || c.open) && (!emOnly || c.em)).length}{t(" results", " results")}
            </button>
            <button onClick={() => setFilter(false)} className="w-full flex items-center justify-center gap-1" style={{ fontSize: 12, color: "var(--text-secondary)", padding: "8px 0" }}>
              <X size={12} /> {t("Cancel", "Cancel")}
            </button>
          </motion.div>
        </div>
      )}

      {/* ── In-app directions with animated route ──────────── */}
      <AnimatePresence>
        {dirFor && <DirectionsView clinic={dirFor} onClose={() => setDirFor(null)} />}
      </AnimatePresence>
    </AppShell>
  );
}

/* ── Directions view — real map + real road route (OSRM) ────── */
type RouteStep = { text: string; dist: string; type: string; modifier?: string };

function maneuverIcon(type: string, modifier?: string) {
  if (type === "arrive") return <Flag size={13} />;
  if (type === "depart") return <Navigation size={13} />;
  if (type === "roundabout" || type === "rotary") return <RotateCcw size={13} />;
  if (modifier?.includes("left")) return <CornerUpLeft size={13} />;
  if (modifier?.includes("right")) return <CornerUpRight size={13} />;
  if (type === "merge" || modifier === "uturn") return <CornerUpLeft size={13} style={{ transform: modifier === "uturn" ? "rotate(180deg)" : undefined }} />;
  return <ArrowUp size={13} />;
}

function maneuverText(s: any): string {
  const road = s.name && s.name !== "" ? ` onto ${s.name}` : "";
  const mod = s.maneuver?.modifier;
  switch (s.maneuver?.type) {
    case "depart": return `Head ${mod ?? "forward"}${road}`;
    case "arrive": return "Arrive at destination";
    case "turn": return `Turn ${mod ?? ""}${road}`;
    case "new name": return `Continue${road}`;
    case "roundabout": case "rotary": return `At the roundabout, take the exit${road}`;
    case "merge": return `Merge${road}`;
    case "fork": return `Keep ${mod ?? ""} at the fork${road}`;
    case "end of road": return `At the end of the road, turn ${mod ?? ""}${road}`;
    case "continue": return `Continue${road}`;
    default: return `${s.maneuver?.type ?? "Continue"} ${mod ?? ""}${road}`;
  }
}

function fmtDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function DirectionsView({ clinic, onClose }: { clinic: ClinicItem; onClose: () => void }) {
  const geo = useGeoLocation();
  const mapEl = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<any>(null);
  const [route, setRoute] = useState<{ mins: number; km: number; steps: RouteStep[] } | null>(null);
  const [routeErr, setRouteErr] = useState<string | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [resolved, setResolved] = useState<{ lat: number; lon: number } | null>(null);

  // If this clinic has no stored coordinates, find them on the map by name near the user
  useEffect(() => {
    if (clinic.lat != null && clinic.lon != null) { setResolved(null); return; }
    let cancelled = false;
    const near = geo.coords
      ? `&viewbox=${geo.coords.lon - 0.4},${geo.coords.lat + 0.4},${geo.coords.lon + 0.4},${geo.coords.lat - 0.4}&bounded=0`
      : "";
    const q = encodeURIComponent(`${clinic.en} ${clinic.address ?? geo.label ?? ""}`.trim());
    fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=jsonv2&limit=1${near}`)
      .then((r) => r.json())
      .then((rows) => {
        if (cancelled || !Array.isArray(rows) || !rows[0]) return;
        setResolved({ lat: parseFloat(rows[0].lat), lon: parseFloat(rows[0].lon) });
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinic.en, clinic.lat, clinic.lon, geo.coords?.lat, geo.coords?.lon]);

  const destLat = clinic.lat ?? resolved?.lat ?? null;
  const destLon = clinic.lon ?? resolved?.lon ?? null;
  const canRoute = geo.coords != null && destLat != null && destLon != null;

  // Fetch the real driving route from OSRM (open data, real roads)
  useEffect(() => {
    if (!canRoute) return;
    const { lat: oLat, lon: oLon } = geo.coords!;
    let cancelled = false;
    setLoadingRoute(true);
    setRouteErr(null);
    fetch(`https://router.project-osrm.org/route/v1/driving/${oLon},${oLat};${destLon},${destLat}?overview=full&geometries=geojson&steps=true`)
      .then((r) => r.json())
      .then(async (data) => {
        if (cancelled) return;
        const r0 = data?.routes?.[0];
        if (!r0) { setRouteErr("No driving route found to this clinic."); return; }
        const coords: [number, number][] = r0.geometry.coordinates.map(([lon, lat]: [number, number]) => [lat, lon]);
        const steps: RouteStep[] = (r0.legs?.[0]?.steps ?? [])
          .filter((s: any) => s.distance > 0 || s.maneuver?.type === "arrive")
          .map((s: any) => ({
            text: s.maneuver?.type === "arrive" ? `Arrive at ${clinic.en}` : maneuverText(s),
            dist: fmtDist(s.distance),
            type: s.maneuver?.type ?? "continue",
            modifier: s.maneuver?.modifier,
          }));
        setRoute({ mins: Math.max(1, Math.round(r0.duration / 60)), km: Math.round(r0.distance / 100) / 10, steps });

        // Draw the real route on a Leaflet map
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
          leafletMap.current = L.map(mapEl.current, { zoomControl: false, attributionControl: false });
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(leafletMap.current);
        }
        const map = leafletMap.current;
        map.eachLayer((l: any) => { if (!(l instanceof L.TileLayer)) map.removeLayer(l); });

        const line = L.polyline(coords, { color: "#1F7A72", weight: 5, opacity: 0.9, lineJoin: "round" }).addTo(map);
        L.circleMarker(coords[0], { radius: 9, color: "#FFFFFF", weight: 3, fillColor: "#4A6FA5", fillOpacity: 1 }).addTo(map); // you
        L.circleMarker(coords[coords.length - 1], { radius: 10, color: "#FFFFFF", weight: 3, fillColor: "#E4644F", fillOpacity: 1 }).addTo(map); // clinic
        map.fitBounds(line.getBounds(), { padding: [44, 44] });
        setTimeout(() => map.invalidateSize(), 250);
      })
      .catch(() => { if (!cancelled) setRouteErr("Couldn't load the route. Check your connection."); })
      .finally(() => { if (!cancelled) setLoadingRoute(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.coords?.lat, geo.coords?.lon, destLat, destLon, clinic.en]);

  useEffect(() => () => { leafletMap.current?.remove(); leafletMap.current = null; }, []);

  const fallbackMins = Math.max(4, Math.round(clinic.km * 12));
  const mins = route?.mins ?? fallbackMins;
  const km = route?.km ?? clinic.km;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[130] flex justify-center"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="w-full max-w-md flex flex-col" style={{ height: "100%" }}>
        {/* Header */}
        <div className="flex items-center gap-3" style={{ padding: "14px 16px 10px" }}>
          <button
            onClick={onClose}
            aria-label="Back"
            className="flex items-center justify-center shrink-0"
            style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--bg-card,#fff)", boxShadow: CARD_SHADOW }}
          >
            <ChevronLeft size={17} style={{ color: "var(--text-primary)" }} />
          </button>
          <div className="min-w-0">
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Directions</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              to {clinic.en}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1" style={{ marginLeft: "auto" }}>
            <span
              style={{ background: "var(--acc-pale)", color: "var(--acc-strong)", fontSize: 11, fontWeight: 800, padding: "4px 12px", borderRadius: 999 }}
            >
              {mins} min
            </span>
            <span className="flex items-center gap-1" style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.06em", color: geo.tracking ? "var(--accent-matcha)" : "var(--text-placeholder)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor" }} className={geo.tracking ? "animate-pulse" : ""} />
              {geo.tracking ? "LIVE GPS" : geo.loading ? "LOCATING…" : "GPS OFF"}
            </span>
          </div>
        </div>

        {/* Real map with the real route */}
        <div style={{ margin: "4px 16px 0", borderRadius: 22, overflow: "hidden", boxShadow: CARD_SHADOW, position: "relative", background: "#E9F0EA", minHeight: 300 }}>
          {canRoute ? (
            <>
              <div ref={mapEl} style={{ width: "100%", height: 320 }} />
              {loadingRoute && !route && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2" style={{ background: "rgba(255,255,255,0.85)", zIndex: 500 }}>
                  <Loader2 size={22} className="animate-spin" style={{ color: "var(--acc-strong)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>Finding the best route…</span>
                </div>
              )}
              {routeErr && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.9)", zIndex: 500, padding: 24, textAlign: "center", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                  {routeErr}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2" style={{ height: 320, padding: 24, textAlign: "center" }}>
              <MapPin size={26} style={{ color: "var(--acc-strong)" }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {destLat == null ? "Pinpointing this clinic on the map…" : "Turn on location to see the live route"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>You can still open turn-by-turn navigation in Google Maps below.</div>
            </div>
          )}

          {/* ETA card */}
          <div
            className="flex items-center justify-between"
            style={{
              position: "absolute", left: 12, right: 12, bottom: 12, zIndex: 600,
              background: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)",
              borderRadius: 16, padding: "10px 14px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.10)",
            }}
          >
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{mins} min · {km} km</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                From: {geo.loading && !geo.coords ? "locating…" : geo.label}
              </div>
            </div>
            <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, color: clinic.open ? "var(--accent-matcha)" : "#E53935" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
              {clinic.open ? "Open now" : "Closed"}
            </span>
          </div>
        </div>

        {/* Real turn-by-turn steps */}
        <div className="flex-1 overflow-y-auto" style={{ margin: "14px 16px 0", background: "var(--bg-card,#fff)", borderRadius: 20, boxShadow: CARD_SHADOW, padding: "6px 14px" }}>
          {route && route.steps.length > 0 ? (
            route.steps.slice(0, 12).map((s, i) => (
              <div key={i} className="flex items-center gap-3" style={{ padding: "11px 0", borderBottom: i < Math.min(route.steps.length, 12) - 1 ? "1px solid var(--bg-elevated)" : "none" }}>
                <span className="flex items-center justify-center shrink-0" style={{ width: 30, height: 30, borderRadius: "50%", background: s.type === "arrive" ? "var(--acc-pale)" : "var(--bg-page)", color: s.type === "arrive" ? "var(--acc-strong)" : "var(--text-secondary)" }}>
                  {maneuverIcon(s.type, s.modifier)}
                </span>
                <span className="flex-1 min-w-0" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.text}</span>
                <span style={{ fontSize: 11, color: "var(--text-placeholder)", flexShrink: 0 }}>{s.dist}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: "16px 4px", fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
              {loadingRoute ? "Loading turn-by-turn directions…" : canRoute ? "No detailed steps available." : "Steps appear once your location is on."}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2" style={{ margin: "14px 16px 20px" }}>
          <button
            onClick={() => {
              if (typeof window === "undefined") return;
              const origin = geo.coords ? `&origin=${geo.coords.lat},${geo.coords.lon}` : "";
              const destination =
                destLat != null && destLon != null
                  ? `${destLat},${destLon}`
                  : encodeURIComponent(`${clinic.en} ${clinic.address ?? ""}`.trim());
              const url = `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving&dir_action=navigate`;
              const win = window.open(url, "_blank", "noopener,noreferrer");
              if (!win) {
                // Preview iframes can block popups — navigate the top window instead
                try { (window.top ?? window).location.href = url; }
                catch { window.location.href = url; }
              }
            }}
            className="flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
            style={{
              flex: 1, height: 44, borderRadius: 14,
              background: "linear-gradient(135deg, var(--acc-strong), var(--accent-matcha))",
              color: "#fff", fontSize: 13, fontWeight: 700,
              boxShadow: "0 6px 16px color-mix(in oklab, var(--acc-strong) 35%, transparent)",
            }}
          >
            <Navigation size={13} /> Start Navigation
          </button>
        </div>
      </div>
    </motion.div>
  );
}


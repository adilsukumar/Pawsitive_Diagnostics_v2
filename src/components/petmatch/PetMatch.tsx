import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  PawPrint,
  MapPin,
  BadgeCheck,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  Check,
  MessageCircle, Send,
  RotateCcw,
  Syringe,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

/* ────────────────────────────────────────────────────────────
   Pet Match — responsible breeding & compatibility discovery
   ──────────────────────────────────────────────────────────── */

export type MatchProfile = {
  id: string;
  pet: string;
  breed: string;
  slug: string; // dog.ceo breed slug (dogs only)
  photoUrl?: string;
  age: number;
  gender: "Male" | "Female";
  km: number;
  vaccinated: boolean;
  health: number; // health compatibility 0-100
  verified: boolean;
  eligible: boolean; // breeding eligibility (vet-cleared)
  owner: string;
  ownerPets: number;
  area: string;
  since: string;
  posts: number;
  compat: number;
  summary: string;
  reasons: string[];
  mutual: boolean; // owner already expressed interest
};

export const MATCH_PROFILES: MatchProfile[] = [
  {
    id: "pm-1", pet: "Bruno", breed: "Golden Retriever", slug: "retriever/golden",
    age: 3, gender: "Male", km: 2.8, vaccinated: true, health: 96, verified: true, eligible: true,
    owner: "Arjun Mehta", ownerPets: 2, area: "Bandra West, Mumbai", since: "2023", posts: 34,
    compat: 94, summary: "Similar breed • Compatible age • Nearby",
    reasons: ["Same species", "Compatible breed", "Similar age", "Vaccination verified", "Within 5 km"],
    mutual: true,
  },
  {
    id: "pm-2", pet: "Luna", breed: "Labrador Retriever", slug: "labrador",
    age: 2, gender: "Female", km: 1.2, vaccinated: true, health: 92, verified: true, eligible: true,
    owner: "Priya Sharma", ownerPets: 1, area: "Juhu, Mumbai", since: "2024", posts: 18,
    compat: 91, summary: "Friendly temperament • Very close • Vaccinated",
    reasons: ["Same species", "Compatible size", "Similar age", "Vaccination verified", "Within 2 km"],
    mutual: false,
  },
  {
    id: "pm-3", pet: "Rocky", breed: "Indian Pariah Dog", slug: "mix",
    age: 4, gender: "Male", km: 3.5, vaccinated: true, health: 89, verified: true, eligible: true,
    owner: "Rohan Iyer", ownerPets: 3, area: "Andheri West, Mumbai", since: "2022", posts: 57,
    compat: 87, summary: "Hardy indie lineage • Excellent health record",
    reasons: ["Same species", "Strong health score", "Vaccination verified", "Within 5 km"],
    mutual: false,
  },
  {
    id: "pm-4", pet: "Zara", breed: "German Shepherd", slug: "german/shepherd",
    age: 2, gender: "Female", km: 4.1, vaccinated: true, health: 90, verified: false, eligible: true,
    owner: "Sneha Kulkarni", ownerPets: 1, area: "Powai, Mumbai", since: "2024", posts: 9,
    compat: 84, summary: "Hip-score screened • Active lifestyle match",
    reasons: ["Same species", "Genetic screening done", "Similar age", "Within 5 km"],
    mutual: true,
  },
  {
    id: "pm-5", pet: "Coco", breed: "Beagle", slug: "beagle",
    age: 3, gender: "Female", km: 5.6, vaccinated: false, health: 81, verified: true, eligible: false,
    owner: "Vikram Rao", ownerPets: 2, area: "Dadar, Mumbai", since: "2023", posts: 22,
    compat: 78, summary: "Playful energy • Vaccination due soon",
    reasons: ["Same species", "Similar age", "Compatible temperament"],
    mutual: false,
  },
  {
    id: "pm-6", pet: "Simba", breed: "Indian Pariah Dog", slug: "mix",
    age: 3, gender: "Male", km: 6.2, vaccinated: true, health: 93, verified: true, eligible: true,
    owner: "Ananya Das", ownerPets: 2, area: "Chembur, Mumbai", since: "2022", posts: 41,
    compat: 72, summary: "Vet-cleared • Calm temperament",
    reasons: ["Same species", "Vaccination verified", "Strong health score"],
    mutual: false,
  },
];

/* ── photo cache (24h) ─────────────────────────────────────── */
const PHOTO_CACHE = "petmatch_photos";
const TTL = 24 * 60 * 60 * 1000;

function readPhoto(id: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const c = JSON.parse(window.localStorage.getItem(PHOTO_CACHE) ?? "{}");
    const e = c[id];
    if (!e || Date.now() - e.ts > TTL) return null;
    return e.url as string;
  } catch {
    return null;
  }
}

function writePhoto(id: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    const c = JSON.parse(window.localStorage.getItem(PHOTO_CACHE) ?? "{}");
    c[id] = { url, ts: Date.now() };
    window.localStorage.setItem(PHOTO_CACHE, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

function usePetPhoto(p: MatchProfile): string | null {
  const [url, setUrl] = useState<string | null>(p.photoUrl ?? null);
  useEffect(() => {
    if (p.photoUrl) { setUrl(p.photoUrl); return; }
    let alive = true;
    const cached = readPhoto(p.id);
    if (cached) {
      setUrl(cached);
    } else {
      fetch(`https://dog.ceo/api/breed/${p.slug}/images/random`)
        .then((r) => r.json())
        .then((d) => {
          if (alive && d?.status === "success" && typeof d.message === "string") {
            setUrl(d.message);
            writePhoto(p.id, d.message);
          }
        })
        .catch(() => {});
    }
    return () => {
      alive = false;
    };
  }, [p.id, p.slug, p.photoUrl]);
  return url;
}

/* ── shared bits ───────────────────────────────────────────── */
const SHADOW = "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)";

function CompatPill({ value, light }: { value: number; light?: boolean }) {
  return (
    <span
      className="flex items-center gap-1"
      style={{
        background: light ? "rgba(255,255,255,0.92)" : "var(--accent-sakura-soft)",
        color: "var(--accent-sakura-dark)",
        fontSize: 11,
        fontWeight: 800,
        padding: "4px 10px",
        borderRadius: 999,
        backdropFilter: light ? "blur(6px)" : undefined,
      }}
    >
      <PawPrint size={11} />
      {value}% Match
    </span>
  );
}

function PetPhoto({ p, style }: { p: MatchProfile; style?: React.CSSProperties }) {
  const url = usePetPhoto(p);
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "var(--bg-card-lavender)", ...style }}>
      {url ? (
        <img src={url} alt={`${p.pet} the ${p.breed}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
      ) : (
        <div className="flex items-center justify-center" style={{ width: "100%", height: "100%" }}>
          <PawPrint size={40} style={{ color: "var(--accent-sakura)", opacity: 0.5 }} />
        </div>
      )}
    </div>
  );
}

/* ── Featured hero card (Community page) ───────────────────── */
export function PetMatchSection() {
  const profiles = MATCH_PROFILES;
  const [featIdx, setFeatIdx] = useState(0);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [startId, setStartId] = useState<string>(profiles[0].id);


  const featured = profiles[featIdx % profiles.length];

  function skip() {
    setFeatIdx((i) => i + 1);
  }
  function viewMatch() {
    setStartId(featured.id);
    setDiscoveryOpen(true);
  }

  return (
    <>
      {/* ── Header + Featured Pet Match card ── */}
      <div
        style={{
          margin: "8px 16px 4px",
          position: "relative",
        }}
      >
        {/* Subtle lavender hero header */}
        <div
          className="relative overflow-hidden"
          style={{
            position: "absolute",
            inset: "-8px -16px auto -16px",
            height: 168,
            background: "linear-gradient(180deg, var(--accent-sakura-soft) 0%, var(--bg-page) 100%)",
            borderRadius: "0 0 28px 28px",
            opacity: 0.85,
            zIndex: 0,
          }}
        >
          {/* Decorative paw trail */}
          <svg
            width="120"
            height="140"
            viewBox="0 0 120 140"
            style={{ position: "absolute", right: 12, top: 10, opacity: 0.18 }}
          >
            <circle cx="88" cy="22" r="5" fill="var(--accent-sakura)" />
            <circle cx="74" cy="28" r="4" fill="var(--accent-sakura)" />
            <circle cx="96" cy="38" r="4" fill="var(--accent-sakura)" />
            <circle cx="82" cy="44" r="5" fill="var(--accent-sakura)" />
            <circle cx="64" cy="62" r="4" fill="var(--accent-sakura)" />
            <circle cx="88" cy="72" r="5" fill="var(--accent-sakura)" />
            <circle cx="72" cy="86" r="4" fill="var(--accent-sakura)" />
            <circle cx="56" cy="96" r="4" fill="var(--accent-sakura)" />
            <circle cx="78" cy="110" r="5" fill="var(--accent-sakura)" />
          </svg>
          {/* Very faint organic blob */}
          <div
            style={{
              position: "absolute",
              left: -40,
              top: -30,
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "var(--accent-sakura-soft)",
              opacity: 0.4,
              filter: "blur(40px)",
            }}
          />
        </div>

        {/* Header row */}
        <div className="relative flex items-end justify-between" style={{ padding: "0 4px 14px", zIndex: 1 }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 2 }}>
              <PawPrint size={18} style={{ color: "var(--accent-sakura)" }} />
              <span style={{ fontSize: 17, fontWeight: 800, color: "var(--accent-sakura)", letterSpacing: "0.16em" }}>
                PET MATCH
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1.15,
                fontFamily: "Fraunces, serif",
              }}
            >
               Discover compatible dogs
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text-placeholder)",
              textAlign: "right",
              maxWidth: 110,
              lineHeight: 1.35,
            }}
          >
            Responsible breeding discovery
          </span>
        </div>

        {/* Match card */}
        <div
          className="relative"
          style={{
            background: "#FFFFFF",
            borderRadius: 24,
            boxShadow: "0 8px 28px color-mix(in oklab, var(--accent-sakura) 16%, transparent)",
            overflow: "hidden",
            border: "1px solid var(--acc-pale)",
            zIndex: 1,
          }}
        >
          <div style={{ position: "relative" }}>
            <PetPhoto p={featured} style={{ height: 190 }} />
            <div style={{ position: "absolute", top: 12, left: 12 }}>
              <CompatPill value={featured.compat} light />
            </div>
            {featured.verified && (
              <span
                className="flex items-center gap-1"
                style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(6px)", color: "var(--accent-matcha)", fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 999 }}
              >
                <BadgeCheck size={11} /> Verified owner
              </span>
            )}
            <div
              style={{
                position: "absolute", left: 0, right: 0, bottom: 0,
                padding: "28px 16px 12px",
                background: "linear-gradient(to top, rgba(30,20,40,0.72), transparent)",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 21, fontWeight: 800, fontFamily: "Fraunces, serif" }}>Meet {featured.pet}</div>
              <div style={{ fontSize: 12, opacity: 0.92, marginTop: 2 }}>
                {featured.breed} • {featured.age} years • {featured.gender}
              </div>
              <div className="flex items-center gap-1" style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
                <MapPin size={11} /> {featured.km} km away · {featured.area}
              </div>
            </div>
          </div>

          <div style={{ padding: "14px 16px 16px" }}>
            <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              <Check size={12} style={{ color: "var(--accent-matcha)" }} />
              {featured.summary}
            </div>
            {/* Owner */}
            <div className="flex items-center gap-2" style={{ marginTop: 10 }}>
              <span
                className="flex items-center justify-center shrink-0"
                style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--bg-card-lavender)", fontSize: 12, fontWeight: 800, color: "var(--accent-fuji)" }}
              >
                {featured.owner[0]}
              </span>
              <div className="flex items-center gap-1" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>
                {featured.owner}
                {featured.verified && <BadgeCheck size={12} style={{ color: "var(--accent-matcha)" }} />}
              </div>
              <span style={{ fontSize: 10, color: "var(--text-placeholder)" }}>
                · {featured.ownerPets} pets · since {featured.since}
              </span>
            </div>
            <div className="flex gap-2" style={{ marginTop: 12 }}>
              <button
                onClick={viewMatch}
                className="flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
                style={{
                  flex: 1, height: 44, borderRadius: 14,
                  background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))",
                  color: "#fff", fontSize: 14, fontWeight: 700,
                  boxShadow: "0 6px 16px color-mix(in oklab, var(--accent-sakura) 32%, transparent)",
                }}
              >
                <Eye size={15} /> View Match
              </button>
              <button
                onClick={skip}
                className="active:scale-[0.97] transition-transform"
                style={{
                  width: 96, height: 44, borderRadius: 14,
                  background: "#FFFFFF", border: "1.5px solid var(--border-card)",
                  color: "var(--text-secondary)", fontSize: 13, fontWeight: 700,
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {discoveryOpen && (
          <PetMatchDiscovery startId={startId} onClose={() => setDiscoveryOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Filters ───────────────────────────────────────────────── */
type Filters = {
  gender: "Any" | "Male" | "Female";
  maxAge: number;
  radius: number;
  vaccinatedOnly: boolean;
  verifiedOnly: boolean;
  eligibleOnly: boolean;
};

const DEFAULT_FILTERS: Filters = {
  gender: "Any",
  maxAge: 10,
  radius: 10,
  vaccinatedOnly: false,
  verifiedOnly: false,
  eligibleOnly: false,
};

function applyFilters(list: MatchProfile[], f: Filters) {
  return list.filter((p) => {
    if (f.gender !== "Any" && p.gender !== f.gender) return false;
    if (p.age > f.maxAge) return false;
    if (p.km > f.radius) return false;
    if (f.vaccinatedOnly && !p.vaccinated) return false;
    if (f.verifiedOnly && !p.verified) return false;
    if (f.eligibleOnly && !p.eligible) return false;
    return true;
  });
}

/* ── Full-screen discovery ─────────────────────────────────── */
export function PetMatchDiscovery({ startId, onClose }: { startId: string; onClose: () => void }) {
  const profiles = MATCH_PROFILES;
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<MatchProfile | null>(null);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = React.useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Record<string, {sender: "me"|"them", text: string, time: string}[]>>({
    "pm-1": [
      { sender: "them", text: "Hi! Saw you matched with Bruno. Our dogs have similar energy levels!", time: "10:30 AM" }
    ],
    "pm-4": [
      { sender: "them", text: "Hey! Zara would love a playdate.", time: "Yesterday" }
    ]
  });

  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeChat]);

  const sendMessage = () => {
    if (!chatInput.trim() || !activeChat) return;
    const newMsg = { sender: "me" as const, text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(prev => ({
      ...prev,
      [activeChat.id]: [...(prev[activeChat.id] || []), newMsg]
    }));
    setChatInput("");
    
    // Auto reply simulation
    setTimeout(() => {
      const reply = { sender: "them" as const, text: "Haha that's awesome! Let's meet at the dog park this weekend.", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages(prev => ({
        ...prev,
        [activeChat.id]: [...(prev[activeChat.id] || []), reply]
      }));
    }, 1500);
  };
  const [ownerFor, setOwnerFor] = useState<MatchProfile | null>(null);
  const [matchFor, setMatchFor] = useState<MatchProfile | null>(null);
  const [interestedIds, setInterestedIds] = useState<Record<string, boolean>>({});
  const [dir, setDir] = useState<1 | -1>(1);

  const list = useMemo(() => applyFilters(profiles, filters), [profiles, filters]);
  const [index, setIndex] = useState(() => Math.max(0, profiles.findIndex((p) => p.id === startId)));

  useEffect(() => {
    // clamp when filters change
    if (index > list.length) setIndex(0);
  }, [list.length]);

  const current: MatchProfile | null = index < list.length ? list[index] : null;

  function advance() {
    setIndex((i) => i + 1);
  }

  function pass() {
    if (!current) return;
    setDir(-1);
    advance();
  }

  function interested() {
    if (!current) return;
    setDir(1);
    setInterestedIds((m) => ({ ...m, [current.id]: true }));
    if (current.mutual) {
      setMatchFor(current);
      advance();
    } else {
      toast(`Interest sent to ${current.owner}`, {
        description: `${current.owner} will be notified that ${current.pet} caught your eye.`,
        duration: 2200,
      });
      advance();
    }
  }

  function restart() {
    setIndex(0);
    setInterestedIds({});
  }

  const matchCount = Object.keys(interestedIds).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.22 }}
      className="fixed inset-0 z-[130] flex justify-center"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="w-full max-w-md flex flex-col" style={{ height: "100%", position: "relative" }}>
        {/* Header */}
        <div className="flex items-center justify-between" style={{ padding: "14px 16px 10px" }}>
          <button
            onClick={onClose}
            aria-label="Close Pet Match"
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#FFFFFF", boxShadow: SHADOW }}
          >
            <ChevronLeft size={18} style={{ color: "var(--text-primary)" }} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Fraunces, serif" }}>Pet Match</div>
            <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
              {list.length} compatible pets nearby
            </div>
          </div>
          <button
            onClick={() => { setDraft(filters); setFiltersOpen(true); }}
            aria-label="Match filters"
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "#FFFFFF", boxShadow: SHADOW }}
          >
            <SlidersHorizontal size={16} style={{ color: "var(--accent-sakura)" }} />
          </button>
        </div>

        {/* Card area */}
        <div className="flex-1 flex flex-col justify-center" style={{ padding: "4px 16px 16px", minHeight: 0 }}>
          <AnimatePresence mode="wait" custom={dir}>
            {current ? (
              <motion.div
                key={current.id}
                custom={dir}
                initial={{ opacity: 0, x: dir * 120, rotate: dir * 4 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={{ opacity: 0, x: dir * -140, rotate: dir * -5 }}
                transition={{ duration: 0.24 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 90) pass();
                  else if (info.offset.x < -90) interested();
                }}
                className="flex flex-col"
                style={{ background: "#FFFFFF", borderRadius: 24, boxShadow: "0 10px 30px rgba(0,0,0,0.10)", overflow: "hidden", minHeight: 0, maxHeight: "100%" }}
              >
                {/* Photo */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <PetPhoto p={current} style={{ height: 300 }} />
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <CompatPill value={current.compat} light />
                  </div>
                  {current.verified && (
                    <span
                      className="flex items-center gap-1"
                      style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", color: "var(--accent-matcha)", fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 999 }}
                    >
                      <BadgeCheck size={11} /> Verified
                    </span>
                  )}
                  <div
                    style={{
                      position: "absolute", left: 0, right: 0, bottom: 0,
                      padding: "26px 16px 12px",
                      background: "linear-gradient(to top, rgba(30,20,40,0.75), transparent)",
                      color: "#fff",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 22, fontWeight: 800, fontFamily: "Fraunces, serif" }}>{current.pet}</span>
                      <span style={{ fontSize: 12, opacity: 0.9 }}>{current.age}y · {current.gender}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.92, marginTop: 2 }}>{current.breed}</div>
                    <div className="flex items-center gap-1" style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>
                      <MapPin size={11} /> {current.km} km · {current.area}
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding: "12px 16px 16px", overflowY: "auto", minHeight: 0 }}>
                  <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                    <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: current.vaccinated ? "var(--acc-pale)" : "#FFF3F0", color: current.vaccinated ? "var(--accent-matcha)" : "#E53935" }}>
                      <Syringe size={10} /> {current.vaccinated ? "Vaccinated" : "Vaccination due"}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "var(--bg-card-lavender)", color: "var(--accent-fuji)" }}>
                      <ShieldCheck size={10} /> Health {current.health}/100
                    </span>
                    {current.eligible && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 999, background: "var(--accent-sakura-soft)", color: "var(--accent-sakura-dark)" }}>
                        Breeding eligible
                      </span>
                    )}
                  </div>

                  {/* Health compatibility bar */}
                  <div style={{ marginTop: 12 }}>
                    <div className="flex items-center justify-between" style={{ fontSize: 10, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>
                      <span>HEALTH COMPATIBILITY</span>
                      <span style={{ color: "var(--accent-sakura)" }}>{current.health}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "var(--bg-elevated)" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${current.health}%` }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, var(--accent-sakura), var(--accent-sakura-dark))" }}
                      />
                    </div>
                  </div>

                  {/* Why this match */}
                  <div style={{ marginTop: 12, background: "var(--bg-page)", borderRadius: 14, padding: "10px 12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>Why this match?</div>
                    {current.reasons.map((r) => (
                      <div key={r} className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
                        <Check size={11} style={{ color: "var(--accent-matcha)", flexShrink: 0 }} />
                        {r}
                      </div>
                    ))}
                    <div style={{ fontSize: 9, color: "var(--text-placeholder)", marginTop: 8, lineHeight: 1.4 }}>
                      Compatibility is guidance based on breed, age, distance and health data — not a medical or genetic guarantee.
                    </div>
                  </div>

                  {/* Owner */}
                  <button
                    onClick={() => setOwnerFor(current)}
                    className="flex items-center gap-2.5 w-full text-left active:scale-[0.98] transition-transform"
                    style={{ marginTop: 12, background: "var(--bg-page)", border: "1px solid var(--border-subtle)", borderRadius: 14, padding: "10px 12px" }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0"
                      style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--bg-card-lavender)", fontSize: 15, fontWeight: 800, color: "var(--accent-fuji)" }}
                    >
                      {current.owner[0]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{current.owner}</span>
                        {current.verified && <BadgeCheck size={12} style={{ color: "var(--accent-matcha)" }} />}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 1 }}>
                        {current.ownerPets} {current.ownerPets === 1 ? "pet" : "pets"} · Member since {current.since} · {current.posts} posts
                      </div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--accent-sakura)", flexShrink: 0 }}>View</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center"
                style={{ background: "#FFFFFF", borderRadius: 24, boxShadow: SHADOW, padding: 24, textAlign: "center" }}
              >
                <span className="flex items-center justify-center" style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent-sakura-soft)" }}>
                  <PawPrint size={30} style={{ color: "var(--accent-sakura)" }} />
                </span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginTop: 14, fontFamily: "Fraunces, serif" }}>
                  You're all caught up
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
                  No more compatible pets in this area. Try widening your radius or adjusting filters.
                </div>
                <div className="flex gap-2" style={{ marginTop: 16 }}>
                  <button
                    onClick={() => { setDraft({ ...filters, radius: Math.min(25, filters.radius + 5) }); setFiltersOpen(true); }}
                    style={{ height: 40, padding: "0 18px", borderRadius: 12, background: "var(--accent-sakura)", color: "#fff", fontSize: 13, fontWeight: 700 }}
                  >
                    Adjust Filters
                  </button>
                  <button
                    onClick={restart}
                    className="flex items-center gap-1.5"
                    style={{ height: 40, padding: "0 16px", borderRadius: 12, background: "#FFFFFF", border: "1.5px solid var(--border-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}
                  >
                    <RotateCcw size={13} /> Review Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action row */}
          {current && (
            <div className="flex items-center justify-center" style={{ gap: 18, paddingTop: 14 }}>
              <button
                onClick={pass}
                aria-label="Pass"
                className="flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 52, height: 52, borderRadius: "50%", background: "#FFFFFF", boxShadow: SHADOW, border: "1.5px solid var(--border-card)" }}
              >
                <X size={20} style={{ color: "var(--text-secondary)" }} />
              </button>
              <button
                onClick={() => setOwnerFor(current)}
                aria-label="View owner profile"
                className="flex items-center justify-center active:scale-90 transition-transform"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))",
                  boxShadow: "0 10px 24px color-mix(in oklab, var(--accent-sakura) 40%, transparent)",
                }}
              >
                <Eye size={24} style={{ color: "#fff" }} />
              </button>
              <button
                onClick={interested}
                aria-label="Interested"
                className="flex items-center justify-center active:scale-90 transition-transform"
                style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-card-sakura)", boxShadow: SHADOW, border: "1.5px solid var(--accent-sakura-soft)" }}
              >
                <PawPrint size={20} style={{ color: "var(--accent-sakura-dark)" }} />
              </button>
            </div>
          )}
        </div>

        {/* ── Owner profile sheet ── */}
        <AnimatePresence>
          {ownerFor && (
            <div className="fixed inset-0 z-[135] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setOwnerFor(null)}>
              <motion.div
                initial={{ y: 240 }}
                animate={{ y: 0 }}
                exit={{ y: 240 }}
                className="w-full max-w-md"
                style={{ background: "var(--bg-page)", borderRadius: "28px 28px 0 0", padding: 20, maxHeight: "75vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 16px" }} />
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--bg-card-lavender)", fontSize: 20, fontWeight: 800, color: "var(--accent-fuji)" }}
                  >
                    {ownerFor.owner[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{ownerFor.owner}</span>
                      {ownerFor.verified && <BadgeCheck size={14} style={{ color: "var(--accent-matcha)" }} />}
                    </div>
                    <div className="flex items-center gap-1" style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      <MapPin size={10} /> {ownerFor.area} · Member since {ownerFor.since}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3" style={{ marginTop: 16, background: "#FFFFFF", borderRadius: 16, boxShadow: SHADOW, padding: "12px 0" }}>
                  {[
                    { n: String(ownerFor.ownerPets), l: "Pets" },
                    { n: String(ownerFor.posts), l: "Posts" },
                    { n: ownerFor.verified ? "ID + Vet" : "Pending", l: "Verification" },
                  ].map((s) => (
                    <div key={s.l} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>{s.n}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, background: "#FFFFFF", borderRadius: 16, boxShadow: SHADOW, padding: "12px 14px", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  <div style={{ fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>Community activity</div>
                  Active in "{ownerFor.area.split(",")[0]} pet parents" group · {ownerFor.posts} posts · Helps answer vaccination questions.
                  <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-placeholder)" }}>
                    Contact details stay private until both owners choose to connect.
                  </div>
                </div>

                <button
                  onClick={() => setOwnerFor(null)}
                  style={{ marginTop: 14, width: "100%", height: 44, borderRadius: 14, background: "var(--accent-sakura)", color: "#fff", fontSize: 14, fontWeight: 700 }}
                >
                  Back to {ownerFor.pet}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Match modal ── */}
        <AnimatePresence>
          {matchFor && (
            <div className="fixed inset-0 z-[140] flex items-center justify-center" style={{ background: "rgba(40,25,55,0.55)", backdropFilter: "blur(4px)" }} onClick={() => setMatchFor(null)}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ type: "spring", damping: 18 }}
                className="w-full max-w-xs"
                style={{ background: "#FFFFFF", borderRadius: 28, padding: "28px 22px", textAlign: "center", boxShadow: "0 24px 60px rgba(0,0,0,0.25)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.12, type: "spring", damping: 10 }}
                  className="flex items-center justify-center"
                  style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--accent-sakura-soft)", margin: "0 auto" }}
                >
                  <PawPrint size={32} style={{ color: "var(--accent-sakura)" }} />
                </motion.span>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", marginTop: 14, fontFamily: "Fraunces, serif" }}>
                  It's a Match!
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
                  Your pet and {matchFor.pet} may be a good match. {matchFor.owner} is interested too.
                </div>
                <button
                  onClick={() => {
                    setActiveChat(matchFor);
                    setMatchFor(null);
                  }}
                  className="flex items-center justify-center gap-2"
                  style={{ marginTop: 18, width: "100%", height: 46, borderRadius: 14, background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))", color: "#fff", fontSize: 14, fontWeight: 700, boxShadow: "0 6px 16px color-mix(in oklab, var(--accent-sakura) 35%, transparent)" }}
                >
                  <MessageCircle size={16} /> Start Conversation
                </button>
                <button
                  onClick={() => setMatchFor(null)}
                  style={{ marginTop: 8, width: "100%", height: 42, borderRadius: 14, background: "#FFFFFF", border: "1.5px solid var(--border-card)", color: "var(--text-secondary)", fontSize: 13, fontWeight: 700 }}
                >
                  View Pet Profiles
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Filters sheet ── */}
        <AnimatePresence>
          {filtersOpen && (
            <div className="fixed inset-0 z-[135] flex items-end justify-center" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setFiltersOpen(false)}>
              <motion.div
                initial={{ y: 260 }}
                animate={{ y: 0 }}
                exit={{ y: 260 }}
                className="w-full max-w-md"
                style={{ background: "var(--bg-page)", borderRadius: "28px 28px 0 0", padding: 20, maxHeight: "80vh", overflowY: "auto" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 16px" }} />
                <div className="flex items-center justify-between">
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", fontFamily: "Fraunces, serif" }}>Match Filters</div>
                  <button onClick={() => setDraft(DEFAULT_FILTERS)} style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-sakura)" }}>
                    Reset
                  </button>
                </div>

                {/* Gender */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>Gender</div>
                  <div className="flex gap-2">
                    {(["Any", "Male", "Female"] as const).map((g) => (
                      <button
                        key={g}
                        onClick={() => setDraft((d) => ({ ...d, gender: g }))}
                        style={{
                          flex: 1, height: 38, borderRadius: 12, fontSize: 13, fontWeight: 700,
                          background: draft.gender === g ? "var(--accent-sakura)" : "#FFFFFF",
                          color: draft.gender === g ? "#fff" : "var(--text-secondary)",
                          border: `1.5px solid ${draft.gender === g ? "var(--accent-sakura)" : "var(--border-card)"}`,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div style={{ marginTop: 18 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>Max age</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-sakura)", background: "var(--accent-sakura-soft)", padding: "2px 10px", borderRadius: 20 }}>
                      {draft.maxAge >= 10 ? "Any" : `${draft.maxAge} yrs`}
                    </span>
                  </div>
                  <input type="range" min={1} max={10} step={1} value={draft.maxAge} onChange={(e) => setDraft((d) => ({ ...d, maxAge: Number(e.target.value) }))} style={{ width: "100%", accentColor: "var(--accent-sakura)" }} />
                </div>

                {/* Radius */}
                <div style={{ marginTop: 18 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>Matching radius</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-sakura)", background: "var(--accent-sakura-soft)", padding: "2px 10px", borderRadius: 20 }}>
                      {draft.radius} km
                    </span>
                  </div>
                  <input type="range" min={1} max={25} step={1} value={draft.radius} onChange={(e) => setDraft((d) => ({ ...d, radius: Number(e.target.value) }))} style={{ width: "100%", accentColor: "var(--accent-sakura)" }} />
                </div>

                {/* Toggles */}
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                  {([
                    { key: "vaccinatedOnly", label: "Vaccinated only" },
                    { key: "verifiedOnly", label: "Verified owners only" },
                    { key: "eligibleOnly", label: "Breeding eligible only" },
                  ] as const).map((row) => (
                    <button
                      key={row.key}
                      onClick={() => setDraft((d) => ({ ...d, [row.key]: !d[row.key] }))}
                      className="flex items-center justify-between"
                      style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", border: "1px solid var(--border-card)" }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.label}</span>
                      <span
                        style={{
                          width: 40, height: 22, borderRadius: 999, position: "relative",
                          background: draft[row.key] ? "var(--accent-sakura)" : "var(--border-card)",
                          transition: "background 0.2s",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute", top: 2, left: draft[row.key] ? 20 : 2,
                            width: 18, height: 18, borderRadius: "50%", background: "#fff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
                          }}
                        />
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setFilters(draft); setIndex(0); setFiltersOpen(false); }}
                  style={{ marginTop: 18, width: "100%", height: 46, borderRadius: 14, background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))", color: "#fff", fontSize: 14, fontWeight: 700 }}
                >
                  Show {applyFilters(MATCH_PROFILES, draft).length} matches
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Chat UI ── */}
        <AnimatePresence>
          {activeChat && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[150] flex flex-col"
              style={{ background: "var(--bg-page)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#FFFFFF", borderBottom: "1px solid var(--border-subtle)" }}>
                <button onClick={() => setActiveChat(null)} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "var(--bg-card-sakura)", color: "var(--accent-sakura)" }}>
                  <ChevronLeft size={20} />
                </button>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--border-subtle)", overflow: "hidden" }}>
                    <img src={activeChat.photoUrl || `https://images.dog.ceo/breeds/${activeChat.slug.split('/')[0]}/placeholder.jpg`} alt={activeChat.pet} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{activeChat.owner}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{activeChat.pet}'s Owner</div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ alignSelf: "center", fontSize: 11, color: "var(--text-secondary)", background: "rgba(0,0,0,0.05)", padding: "4px 12px", borderRadius: 12, marginBottom: 8 }}>
                  You matched with {activeChat.pet} on {new Date().toLocaleDateString()}
                </div>
                {(messages[activeChat.id] || []).map((msg, i) => {
                  const isMe = msg.sender === "me";
                  return (
                    <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                      <div style={{
                        background: isMe ? "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))" : "#FFFFFF",
                        color: isMe ? "#FFFFFF" : "var(--text-primary)",
                        padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        fontSize: 14,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: isMe ? "none" : "1px solid var(--border-card)"
                      }}>
                        {msg.text}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4, textAlign: isMe ? "right" : "left" }}>
                        {msg.time}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div style={{ padding: "12px 16px", background: "#FFFFFF", borderTop: "1px solid var(--border-subtle)" }}>
                <div className="flex items-center gap-2" style={{ background: "var(--bg-page)", padding: "4px 4px 4px 16px", borderRadius: 24, border: "1px solid var(--border-card)" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={`Message ${activeChat.owner}...`}
                    style={{ flex: 1, background: "transparent", outline: "none", fontSize: 14, color: "var(--text-primary)" }}
                  />
                  <button onClick={sendMessage} style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-sakura)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", opacity: chatInput.trim() ? 1 : 0.5, transition: "opacity 0.2s" }}>
                    <Send size={16} style={{ marginLeft: -2 }} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

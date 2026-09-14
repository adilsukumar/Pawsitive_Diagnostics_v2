import { useLocation, useNavigate } from "@tanstack/react-router";
import { Home, MapPin, HeartPulse, Users, User, ScanSearch, Pill, type LucideIcon } from "lucide-react";
import { useState, startTransition } from "react";
import { useAuth } from "@/context/AuthContext";

type Tab = {
  Icon: LucideIcon;
  label: string;
  route: string;
};

const OWNER_TABS: Tab[] = [
  { Icon: Home, label: "Home", route: "/home" },
  { Icon: MapPin, label: "Map", route: "/map" },
  { Icon: HeartPulse, label: "Clinics", route: "/clinics" },
  { Icon: Users, label: "Community", route: "/community" },
  { Icon: User, label: "Profile", route: "/settings" },
];

/* Vets only get the clinical console features — nothing else */
const VET_TABS: Tab[] = [
  { Icon: Home, label: "Console", route: "/home" },
  { Icon: ScanSearch, label: "Body Map", route: "/vet-consult" },
  { Icon: Pill, label: "e-Rx", route: "/vet-rx" },
  { Icon: User, label: "Profile", route: "/settings" },
];

const ACCENT = "var(--accent-sakura)";
const INACTIVE = "var(--text-placeholder)";

export default function BottomNav() {
  const loc = useLocation();
  const navigate = useNavigate();
  const { session, hydrated } = useAuth();
  const [bouncing, setBouncing] = useState<string | null>(null);
  const TABS = hydrated && session?.role === "vet" ? VET_TABS : OWNER_TABS;

  const isActive = (route: string) =>
    loc.pathname === route || loc.pathname.startsWith(route + "/");

  const handleTap = (route: string) => {
    setBouncing(route);
    setTimeout(() => setBouncing(null), 220);
    if (loc.pathname !== route) {
      startTransition(() => {
        navigate({ to: route });
      });
    }
  };

  return (
    <nav
      aria-label="Primary"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 76,
        background: "color-mix(in oklab, var(--bg-bottomnav) 96%, transparent)",
        borderTop: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-nav)",
        padding: "8px 8px max(8px, env(safe-area-inset-bottom))",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      <div
        className="animal-frieze"
        aria-hidden
        style={{ position: "absolute", top: -18, left: 0, right: 0, height: 18, backgroundColor: "var(--bg-page)", borderTop: "1px solid var(--border-subtle)", opacity: 0.9 }}
      />
      {TABS.map((tab) => {
        const active = isActive(tab.route);
        const { Icon } = tab;
        const bouncingNow = bouncing === tab.route;

        return (
          <button
            key={tab.route}
            onClick={() => handleTap(tab.route)}
            className="flex flex-col items-center justify-center relative press-pop"
            style={{ flex: 1, height: "100%", cursor: "pointer", gap: 4 }}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
          >
            <span
              style={{
                position: "absolute",
                inset: "3px 10px 17px",
                borderRadius: 14,
                background: "var(--acc-pale)",
                transform: active ? "scale(1)" : "scale(0.8)",
                opacity: active ? 1 : 0,
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
            />
            <Icon
              size={20}
              strokeWidth={1.8}
              style={{
                color: active ? ACCENT : INACTIVE,
                transform: bouncingNow ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.2s ease, color 0.2s ease",
                zIndex: 1,
              }}
            />
            <span
              style={{
                fontSize: 9,
                color: active ? ACCENT : INACTIVE,
                fontWeight: active ? 700 : 500,
                lineHeight: 1,
                transition: "color 0.2s ease",
                zIndex: 1,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

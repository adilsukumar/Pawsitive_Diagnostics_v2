import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ArrowLeft, AlertTriangle, Heart, Syringe } from "lucide-react";
import { toast } from "sonner";

import pawLogo from "@/assets/paw-logo.png";
import { motion } from "framer-motion";
import { useState, useEffect, type ReactNode } from "react";
import { T, useT } from "@/context/LanguageContext";
import SideDrawer, { HamburgerButton } from "@/components/SideDrawer";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/lib/notifications";

/* Pet-owner routes that veterinarians must never see — vets only get the
   clinical console (/home), body map, e-Rx and their profile. */
const VET_BLOCKED_PREFIXES = [
  "/map", "/clinics", "/community", "/ai", "/breeds", "/report",
  "/skin-sense", "/motion-sense", "/temp-sense",
  "/pressure-sense", "/light-sense", "/avatar-setup", "/onboarding",
];

/* Bottom-tab destinations — inner pages get an automatic back button. */
const TAB_ROUTES = ["/home", "/map", "/clinics", "/community", "/settings", "/"];

export function TopBar({
  titleJp,
  titleEn,
  onMenuClick,
  menuOpen = false,
  showBack = false,
  backTo = "/home",
}: {
  titleJp?: string;
  titleEn?: string;
  onMenuClick?: () => void;
  menuOpen?: boolean;
  showBack?: boolean;
  backTo?: string;
}) {
  const [sosOpen, setSosOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const navigate = useNavigate();
    const loc = useLocation();

    useEffect(() => {
      document.getElementById("main-scroll")?.scrollTo(0, 0);
    }, [loc.pathname]);
  const t = useT();
  const showTitle = Boolean(titleJp || titleEn);
  // Notifications come from real events only — nothing is pre-filled.
  const notifications = useNotifications();
  return (
    <>
      <header className="sticky top-0 z-40" style={{ background: "var(--bg-topbar)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center" style={{ padding: "8px 16px", minHeight: 64, gap: 10 }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            {onMenuClick && <HamburgerButton isOpen={menuOpen} onClick={onMenuClick} />}
            {showBack && (
              <button
                type="button"
                aria-label="Back"
                onClick={() => {
                  if (window.history.length > 1) window.history.back();
                  else navigate({ to: backTo });
                }}
                className="flex items-center justify-center"
                style={{ width: 36, height: 36, borderRadius: "50%", color: "var(--text-secondary)", background: "transparent" }}
              >
                <ArrowLeft size={22} strokeWidth={2} />
              </button>
            )}
                          <Link
                to="/home"
                className="flex items-center shrink-0"
                style={{ gap: 10, background: "transparent" }}
                aria-label="Home"
              >
                <img
                  src={pawLogo}
                  alt="Pawsitive Diagnostics logo"
                  style={{ width: 36, height: 36, objectFit: "contain", display: "block" }}
                />
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: "max-content" }}>
                  <span style={{ fontSize: 17, fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-display)", whiteSpace: "nowrap", letterSpacing: "-0.02em" }}>
                    Pawsitive Diagnostics
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap" }}>
                    Smart Dog Care
                  </span>
                </div>
              </Link>
          </div>
          <div className="flex items-center shrink-0" style={{ gap: 6 }}>
            <button
              onClick={() => setBellOpen((o) => !o)}
              className="flex items-center justify-center relative"
              style={{ width: 38, height: 38, borderRadius: 12, color: bellOpen ? "var(--acc-strong)" : "var(--text-secondary)", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", boxShadow: "0 3px 12px rgba(22,62,56,0.05)" }}
              aria-label={t("通知", "Notifications")}
            >
              <Bell size={22} strokeWidth={1.75} />
              {notifications.length > 0 && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "var(--accent-red)", border: "2px solid var(--bg-card)" }} />}
            </button>
            <button
              onClick={() => setSosOpen(true)}
              className="font-bold flex items-center active:scale-95 transition-transform"
              style={{
                background: "var(--accent-red)",
                color: "var(--primary-foreground)",
                borderRadius: 12,
                height: 38,
                padding: "0 12px",
                fontSize: 11,
                boxShadow: "0 6px 16px color-mix(in oklab, var(--accent-red) 24%, transparent)",
              }}
            >
              SOS
            </button>
          </div>
        </div>
        {showTitle && <div className="px-4 pb-2 text-center text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{t(titleJp ?? "", titleEn ?? "")}</div>}
        {bellOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-3 z-50"
              style={{ top: 64, width: "min(300px, calc(100vw - 24px))", background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)", padding: 8 }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", padding: "6px 10px 8px" }}>
                {t("通知", "Notifications")}
              </div>
              {notifications.length === 0 && (
                <div style={{ padding: "10px 12px 14px", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                  {t("通知はありません", "No notifications yet. Alerts from your collar and clinic will show up here.")}
                </div>
              )}
              {notifications.map((n, i) => (
                <button
                  key={i}
                  onClick={() => { setBellOpen(false); navigate({ to: "/ai" }); }}
                  className="w-full flex items-center gap-3 text-left"
                  style={{ padding: "8px 10px", borderRadius: 12 }}
                >
                  <span className="flex items-center justify-center shrink-0" style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--acc-pale)" }}>
                    <n.Icon size={16} style={{ color: n.color }} />
                  </span>
                  <span className="flex-1 min-w-0" style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.35 }}>{n.text}</span>
                  <span style={{ fontSize: 10, color: "var(--text-placeholder)", flexShrink: 0 }}>{n.time}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </header>
      {sosOpen && (
        <div className="fixed inset-0 z-[120] bg-foreground/40 flex items-end justify-center p-3" onClick={() => setSosOpen(false)}>
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-3xl p-6 w-full max-w-sm shadow-card border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-destructive"> <T jp="緊急" en="Emergency"/></h3>
            <p className="text-sm text-muted-foreground mt-1">{t("最寄りの24時間獣医に連絡します", "Contact the nearest 24h vet")}</p>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => { window.location.href = "tel:+919820001234"; toast.info(t("24時間獣医に発信中…", "Calling 24h vet helpline…")); }}
                className="w-full bg-destructive text-destructive-foreground rounded-xl py-3 font-bold"
              > {t("今すぐ電話", "Call Now")}</button>
              <button
                onClick={() => { setSosOpen(false); navigate({ to: "/map" }); toast.error(t("迷子モードを有効化 — 地図で確認", "Lost Mode — activate it on the map")); }}
                className="w-full bg-muted rounded-xl py-3 font-medium"
              > {t("迷子モードを起動", "Activate Lost Mode")}</button>
              <button onClick={() => setSosOpen(false)} className="w-full text-sm text-muted-foreground py-2">{t("キャンセル", "Cancel")}</button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default function AppShell({
  children,
  titleJp,
  titleEn,
  hideTopBar = false,
  noPadding = false,
  fullHeight = false,
  hideBottomNav = false,
  renderTopBar,
}: {
  children: ReactNode;
  titleJp?: string;
  titleEn?: string;
  hideTopBar?: boolean;
  noPadding?: boolean;
  fullHeight?: boolean;
  hideBottomNav?: boolean;
  renderTopBar?: (ctx: { menuOpen: boolean; onMenuClick: () => void }) => ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, hydrated } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

    useEffect(() => {
      document.getElementById("main-scroll")?.scrollTo(0, 0);
    }, [loc.pathname]);

  // Vet role guard — bounce vets away from pet-owner features
  const vetBlocked =
    hydrated &&
    session?.role === "vet" &&
    VET_BLOCKED_PREFIXES.some((p) => loc.pathname === p || loc.pathname.startsWith(p + "/"));
  useEffect(() => {
    if (vetBlocked) navigate({ to: "/home", replace: true });
  }, [vetBlocked, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("wancare-theme") === "dark") document.getElementById("mooomentum-frame")?.classList.add("dark");
  }, []);

  // Swipe-from-left to open
  useEffect(() => {
    let startX = 0;
    let tracking = false;
    const onStart = (e: TouchEvent) => {
      const x = e.touches[0]?.clientX ?? 0;
      if (!menuOpen && x < 20) { tracking = true; startX = x; }
    };
    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const dx = (e.touches[0]?.clientX ?? 0) - startX;
      if (dx > 60) { setMenuOpen(true); tracking = false; }
    };
    const onEnd = () => { tracking = false; };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [menuOpen]);

  const onMenuClick = () => setMenuOpen((o) => !o);

  return (
    <div
      style={{
        background: "var(--bg-outside)",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        id="mooomentum-frame"
        data-role={hydrated && session?.role === "vet" ? "vet" : "owner"}
        className="mooomentum-frame jaipur-buti"
        style={{
          position: "relative",
          overflow: "hidden",
          width: "100%",
          maxWidth: 430,
          height: "100dvh",
          backgroundColor: "var(--bg-page)",
          display: "flex",
          flexDirection: "column",
          // Containing block for position:fixed descendants — keeps modals,
          // drawers and bottom sheets inside phone coordinates on desktop.
          transform: "translateZ(0)",
          clipPath: "inset(0)",
          borderInline: "1px solid var(--border-subtle)",
          boxShadow: "0 24px 70px rgba(22,62,56,0.12)",
        }}
      >
        {renderTopBar
          ? renderTopBar({ menuOpen, onMenuClick })
          : !hideTopBar && (
              <TopBar
                titleJp={titleJp}
                titleEn={titleEn}
                onMenuClick={onMenuClick}
                menuOpen={menuOpen}
                showBack={!TAB_ROUTES.some((r) => loc.pathname === r || loc.pathname.startsWith(r + "/"))}
              />
            )}
        <main
          className={noPadding ? "" : "px-4 py-5"}
          style={
            fullHeight
              ? {
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  paddingBottom: hideBottomNav ? 0 : 78,
                }
              : {
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  WebkitOverflowScrolling: "touch",
                  paddingBottom: hideBottomNav ? undefined : 104,
                }
          }
        >
          {vetBlocked ? null : children}
        </main>
                <SideDrawer isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
        {!hideBottomNav && <BottomNav />}
      </div>
    </div>
  );
}







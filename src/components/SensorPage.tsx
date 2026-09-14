import { useState, type ReactNode, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Bluetooth, Cable } from "lucide-react";
import AppShell, { TopBar } from "@/components/AppShell";
import { useLanguage, useT } from "@/context/LanguageContext";
import { useCollar } from "@/context/CollarContext";
import { SenseBanner } from "@/components/SenseBanner";

/**
 * Premium botanical health design system for all sense pages.
 */
export const SP = {
  // Backgrounds
  page: "var(--bg-page)",
  card: "var(--bg-card)",
  // Text
  sumi: "var(--text-primary)",          // primary deep navy
  ink: "var(--text-secondary)",           // Japanese body
  usuzumi: "var(--text-secondary)",       // secondary
  muted: "var(--text-secondary)",          // tertiary
  divider: "var(--bg-elevated)",
  // Rose / sakura accent
  rose: "var(--acc-deep)",
  roseSoft: "var(--acc2-strong)",
  roseTint: "var(--accent-sakura-soft)",
  roseFaint: "color-mix(in oklab, var(--acc-strong) 8.0%, transparent)",
  // Status
  ok: "var(--acc-strong)", okDot: "var(--acc2-deep)", okBg: "var(--acc-pale)",
  warn: "var(--acc-deep)", warnDot: "var(--acc-deep)", warnBg: "var(--acc-pale)",
  danger: "var(--accent-red)", dangerDot: "var(--accent-red)", dangerBg: "var(--acc2-pale)",
  // Legacy alias (kept so existing components compile without changes)
  sakura: "var(--acc-deep)",
  matcha: "var(--accent-matcha)",
  yuzu: "var(--accent-yuzu)",
  fuji: "var(--accent-fuji)",
  momiji: "var(--acc-strong)",
  sora: "var(--accent-sora)",
};

export const CARD_SHADOW = "var(--shadow-card)";
export const SAKURA_HEADER = "linear-gradient(180deg,var(--bg-card) 0%,var(--acc2-pale) 100%)";

export function SensorPage({
  titleEn,
  subtitleEn,
  descriptorEn,
  bannerGradient,
  bannerSubtitleColor,
  requiresCollar = true,
  children,
}: {
  titleEn: string;
  subtitleEn?: string;
  descriptorEn?: string;
  bannerGradient?: string;
  bannerSubtitleColor?: string;
  requiresCollar?: boolean;
  children: ReactNode;
}) {
  const { connected, receiving, connect, state, error, transport } = useCollar();
  return (
    <AppShell
      noPadding
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <TopBar showBack backTo="/home" menuOpen={menuOpen} onMenuClick={onMenuClick} />
      )}
    >
      <style>{`
        @keyframes spCardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .sp-stack > * {
          opacity: 0;
          animation: spCardIn 380ms cubic-bezier(.2,.7,.2,1) forwards;
        }
        .sp-stack > *:nth-child(1){animation-delay:60ms}
        .sp-stack > *:nth-child(2){animation-delay:160ms}
        .sp-stack > *:nth-child(3){animation-delay:260ms}
        .sp-stack > *:nth-child(4){animation-delay:360ms}
        .sp-stack > *:nth-child(5){animation-delay:460ms}
        .sp-stack > *:nth-child(6){animation-delay:560ms}
        @keyframes spDraw { from{stroke-dashoffset:var(--dash)} to{stroke-dashoffset:0} }
        @keyframes spBarGrow { from{transform:scaleY(0)} to{transform:scaleY(1)} }
        @keyframes spCountFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ background: SP.page, minHeight: "100%", paddingBottom: 100 }}>
        <SenseBanner
          subtitleEn={subtitleEn ?? titleEn}
          titleEn={titleEn}
          descriptorEn={descriptorEn ?? ""}
          bgGradient={bannerGradient ?? "linear-gradient(145deg,var(--acc-pale) 0%,var(--bg-page) 100%)"}
          subtitleColor={bannerSubtitleColor ?? "var(--acc-soft)"}
        />

        {/* Content — real collar data only; no dummy numbers */}
        <div className="sp-stack" style={{ padding: "0 16px 16px", marginTop: -36, position: "relative", zIndex: 2 }}>
          {!requiresCollar || (connected && receiving) ? children : (
            <div
              style={{
                background: SP.card,
                borderRadius: 24,
                border: "1px solid var(--border-card)",
                boxShadow: CARD_SHADOW,
                padding: "32px 24px",
                textAlign: "center",
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "var(--acc-pale)", margin: "0 auto 14px",
                }}
              >
                {transport === "bluetooth"
                  ? <Bluetooth size={28} strokeWidth={1.8} style={{ color: "var(--acc-strong)" }} />
                  : <Cable size={28} strokeWidth={1.8} style={{ color: "var(--acc-strong)" }} />}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: SP.sumi, fontFamily: "var(--font-display)" }}>
                {connected ? "Waiting for readings…" : "No collar connected"}
              </div>
              <div style={{ fontSize: 13, color: SP.usuzumi, lineHeight: 1.6, marginTop: 6, maxWidth: 260, marginInline: "auto" }}>
                {connected
                  ? "Your collar is paired. Live data will appear here as soon as it starts streaming from the sensors."
                  : "Connect the collar over USB on this computer, or use Bluetooth on a supported device, to receive live sensor data."}
              </div>
              {error && (
                <div style={{ fontSize: 12, color: "var(--accent-red)", marginTop: 10, lineHeight: 1.5 }}>{error}</div>
              )}
              {!connected && (
                <div className="flex items-center justify-center" style={{ gap: 8, marginTop: 18 }}>
                  <button
                    onClick={() => connect("usb")}
                    disabled={state === "connecting"}
                    className="press-pop"
                    style={{ height: 42, padding: "0 24px", borderRadius: 21, border: "none", background: "var(--acc-strong)", color: "var(--primary-foreground)", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: state === "connecting" ? 0.7 : 1 }}
                  >
                    {state === "connecting" ? "Connecting…" : "Connect USB"}
                  </button>
                  <button
                    onClick={() => connect("bluetooth")}
                    disabled={state === "connecting"}
                    aria-label="Connect over Bluetooth"
                    title="Connect over Bluetooth"
                    className="press-pop flex items-center justify-center"
                    style={{ width: 42, height: 42, borderRadius: 21, border: "1px solid var(--border-subtle)", background: "var(--bg-card)", color: "var(--acc-strong)", opacity: state === "connecting" ? 0.7 : 1 }}
                  >
                    <Bluetooth size={18} strokeWidth={2} />
                  </button>
                </div>
              )}
              <div style={{ marginTop: 12 }}>
                <Link to="/home" style={{ fontSize: 12, fontWeight: 600, color: SP.usuzumi, textDecoration: "underline" }}>
                  Back to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/**
 * Standard floating white card. The `accent` prop is kept for backward
 * compatibility but is no longer rendered — cards are clean white with a soft
 * shadow, no borders.
 */
export function Card({
  accent: _accent,
  children,
  style,
}: {
  accent?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: SP.card,
        borderRadius: 24,
        border: "1px solid var(--border-card)",
        boxShadow: CARD_SHADOW,
        padding: 20,
        marginBottom: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TimeTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const tabs = ["1d", "1w", "1m"];
  return (
    <div
      className="flex"
      style={{
        background: "var(--bg-card-peach)",
        borderRadius: 16,
        padding: 4,
        gap: 4,
        marginBottom: 14,
      }}
    >
      {tabs.map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            style={{
              flex: 1,
              height: 32,
              borderRadius: 12,
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              background: active ? SP.rose : "transparent",
               color: active ? "var(--primary-foreground)" : SP.muted,
               letterSpacing: 0,
              transition: "all 200ms ease",
            }}
          >
            {tab.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

export function useTimeTab() {
  return useState<string>("1d");
}

export function BL({ jp, en }: { jp: string; en: string }) {
  return (
    <Bi
      jp={jp}
      en={en}
      jpStyle={{ fontSize: 13, fontWeight: 600, color: SP.sumi, lineHeight: 1.2 }}
      enStyle={{ fontSize: 10, color: SP.usuzumi, marginTop: 1 }}
    />
  );
}

/**
 * Small uppercase rose-pink label with a 2px dot. Use at the top of every card.
 */
export function SectionLabel({ jp, en }: { jp: string; en: string }) {
  const t = useT();
  return (
    <div
      className="flex items-center"
      style={{
        gap: 6,
        marginBottom: 12,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: SP.rose, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 11,
          color: SP.rose,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {t(jp, en)}
      </span>
    </div>
  );
}

/**
 * AI Insight card — the ONLY card in the system with a left border.
 * 3px rose-pink translucent stripe on the left edge.
 */
export function AIInsightCard({
  jp,
  en,
  timestampJp = "今日 10:45",
  timestampEn = "Today 10:45",
}: {
  jp: string;
  en: string;
  timestampJp?: string;
  timestampEn?: string;
}) {
  const t = useT();
  return (
    <div
      style={{
        background: SP.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        boxShadow: CARD_SHADOW,
        borderLeft: "3px solid color-mix(in oklab, var(--acc-strong) 30.0%, transparent)",
      }}
    >
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ color: SP.rose, fontSize: 13, lineHeight: 1 }}>✦</span>
        <span
          style={{
            fontSize: 11,
            color: SP.rose,
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {t("AI インサイト", "AI Insight")}
        </span>
      </div>
      <div style={{ height: 1, background: SP.divider, margin: "10px 0 12px" }} />
      <Bi
        jp={jp}
        en={en}
        jpStyle={{ fontSize: 13, color: SP.ink, lineHeight: 1.7 }}
        enStyle={{ fontSize: 13, color: SP.ink, lineHeight: 1.7 }}
      />
      <div style={{ fontSize: 11, color: SP.muted, marginTop: 12 }}>
        {t(`最終更新 ${timestampJp}`, `Last updated: ${timestampEn}`)}
      </div>
    </div>
  );
}

/**
 * Status badge using the global system. Variant determines color + dot.
 */
export function StatusBadge({
  jp,
  en,
  variant = "ok",
}: {
  jp: string;
  en: string;
  variant?: "ok" | "warn" | "danger";
}) {
  const t = useT();
  const map = {
    ok: { bg: SP.okBg, color: SP.ok, dot: SP.okDot },
    warn: { bg: SP.warnBg, color: SP.warn, dot: SP.warnDot },
    danger: { bg: SP.dangerBg, color: SP.danger, dot: SP.dangerDot },
  }[variant];
  return (
    <span
      className="inline-flex items-center"
      style={{
        gap: 6,
        background: map.bg,
        color: map.color,
        borderRadius: 50,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: map.dot }} />
      {t(jp, en)}
    </span>
  );
}

/**
 * Bilingual text that honours the global language switcher.
 *  - english  → renders only `en`
 *  - japanese → renders only `jp`
 *  - mixed    → JP on top, EN below in smaller style
 */
export function Bi({
  jp,
  en,
  jpStyle,
  enStyle,
  as: As = "div",
}: {
  jp: ReactNode;
  en: ReactNode;
  jpStyle?: CSSProperties;
  enStyle?: CSSProperties;
  as?: "div" | "span";
}) {
  return <As style={enStyle ?? jpStyle}>{en}</As>;
}

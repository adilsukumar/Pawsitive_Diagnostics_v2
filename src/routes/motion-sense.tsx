import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AppShell, { TopBar } from "@/components/AppShell";
import { SenseBanner } from "@/components/SenseBanner";
import { useLanguage, useT } from "@/context/LanguageContext";
import { usePet, displayName } from "@/context/PetContext";
import { Activity, Footprints, Flame, Timer, AlertTriangle } from "lucide-react";
import { useCollar } from "@/context/CollarContext";
import { calculateScores } from "@/lib/score";
import { NoData, DASH } from "@/components/NoData";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/motion-sense")({ component: MotionSensePage });

// ---------- Tokens ----------
const C = {
  page: "var(--acc-pale)",
  card: "#FFFFFF",
  sumi: "var(--text-primary)",
  ink: "var(--text-primary)",
  ink2: "var(--text-secondary)",
  muted: "var(--text-secondary)",
  faint: "var(--acc-soft)",
  divider: "var(--acc-pale)",
  rose: "var(--acc-strong)",       
  roseDeep: "var(--acc2-strong)",   
  roseSoft: "var(--acc-strong)",   
  rosePale: "var(--acc-soft)",   
  roseTint: "var(--acc-pale)",   
  roseFill: "var(--acc-pale)",   
  roseMid: "var(--acc-strong)",    
  roseTrack: "var(--acc-pale)",  
  indigo: "var(--acc-strong)",
  orange: "var(--acc-strong)",
  green: "var(--acc-strong)",
  greenBg: "var(--acc-pale)",
};

// ---------- Reusable ----------
function CardBox({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  
    
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 22,
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ jp, en, rightJp, rightEn }: { jp: string; en: string; rightJp?: string; rightEn?: string }) {
  const t = useT();
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
      <div className="flex items-center" style={{ gap: 6 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: C.rose }} />
        <span style={{ fontSize: 11, color: C.rose, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {t(jp, en)}
        </span>
      </div>
      {rightJp && rightEn && (
        <span style={{ fontSize: 11, color: C.muted }}>{t(rightJp, rightEn)}</span>
      )}
    </div>
  );
}

// ---------- Mock Data for 1D ----------
const MOCK_CHART_DATA = [
  { time: "13 Sep 09:00", v: 0.3 },
  { time: "13 Sep 10:14", v: 1.8 },
  { time: "13 Sep 10:20", v: 0.3 },
  { time: "13 Sep 12:42", v: 4.2 },
  { time: "13 Sep 12:46", v: 0.3 },
  { time: "13 Sep 15:15", v: 3.5 },
  { time: "13 Sep 15:20", v: 0.2 },
  { time: "13 Sep 19:55", v: 1.5 },
  { time: "13 Sep 20:00", v: 0.2 },
  { time: "14 Sep 02:00", v: 0.1 },
  { time: "14 Sep 08:30", v: 1.6 },
  { time: "14 Sep 08:34", v: 0.3 },
  { time: "14 Sep 10:05", v: 3.8 },
  { time: "14 Sep 10:10", v: 0.4 },
  { time: "14 Sep 11:30", v: 0.3 },
];

const MOCK_1D_ACTIVITIES = [
  { id: "6", time: "14 Sep, 10:05 AM", duration: "5 mins", type: "Playing", intensity: "3.8 m/s²", icon: Flame, color: "#EF4444" },
  { id: "5", time: "14 Sep, 08:30 AM", duration: "4 mins", type: "Walking", intensity: "1.6 m/s²", icon: Footprints, color: "#3B82F6" },
  { id: "4", time: "13 Sep, 07:55 PM", duration: "3 mins", type: "Walking", intensity: "1.5 m/s²", icon: Footprints, color: "#3B82F6" },
  { id: "3", time: "13 Sep, 03:15 PM", duration: "5 mins", type: "Playing", intensity: "3.5 m/s²", icon: Flame, color: "#EF4444" },
  { id: "2", time: "13 Sep, 12:42 PM", duration: "3 mins", type: "Running", intensity: "4.2 m/s²", icon: Activity, color: "#F59E0B" },
  { id: "1", time: "13 Sep, 10:14 AM", duration: "4 mins", type: "Walking", intensity: "1.8 m/s²", icon: Footprints, color: "#3B82F6" },
];

// ---------- Page ----------
function MotionSensePage() {
  const { live } = useCollar();
  const scores = calculateScores(78, live.motion?.value, live.skin?.value, live.bark?.value, live.temp?.value);
  const t = useT();
  const { pet } = usePet();
  const name = displayName(pet, "Fluffy");
  const [tab, setTab] = useState<"1d" | "1w" | "1m">("1d");
  
  const [anomaly, setAnomaly] = useState(false);
  const [simMotion, setSimMotion] = useState(0.3);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") {
        setAnomaly((a) => {
          const next = !a;
          if (next) toast.error(t("歩行異常を検知しました", "Gait Abnormality Detected! Limping suspected."), { action: { label: "View", onClick: () => window.location.href = "/motion-sense" }, onClick: () => window.location.href = "/motion-sense" });
          else toast.success(t("正常に戻りました", "Movement Normalized."));
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKey);
      
  return () => window.removeEventListener("keydown", handleKey);
  }, [t]);

  useEffect(() => {
    const int = setInterval(() => {
      setSimMotion((prev) => {
        if (anomaly) return 0.4 + Math.random() * 0.3; // limping
        // default resting with very slight random fluctuation
        const resting = 0.3 + (Math.random() * 0.1 - 0.05); 
        return resting;
      });
    }, 1200);
    return () => clearInterval(int);
  }, [anomaly]);

  return (
    <AppShell
      noPadding
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <TopBar showBack backTo="/home" menuOpen={menuOpen} onMenuClick={onMenuClick} />
      )}
    >
      <style>{`
        .ms-stack > * { opacity:0; animation: msCardIn 350ms cubic-bezier(.2,.7,.2,1) forwards; }
        @keyframes msCardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={{ background: C.page, minHeight: "100%", paddingBottom: 100 }}>
        {/* HEADER */}
        <SenseBanner score={scores.motionScore}
          subtitleEn="MotionSense"
          titleEn="MotionSense"
          descriptorEn="Activity tracking"
          bgGradient="linear-gradient(135deg,var(--acc-pale) 0%,var(--acc-pale) 100%)"
          subtitleColor="var(--acc-strong)"
        />

        {/* TIME TABS */}
        <div style={{ padding: "0 16px", marginTop: -36, position: "relative", zIndex: 2 }}>
          <div className="flex" style={{ background: "var(--bg-elevated)", borderRadius: 50, padding: 3, gap: 2 }}>
            {(["1d", "1w", "1m"] as const).map((v) => {
              const active = tab === v;
              return (
                <button key={v} onClick={() => setTab(v)} style={{
                  flex: 1, height: 30, borderRadius: 50,
                  background: active ? C.rose : "transparent",
                  color: active ? "#FFF" : C.muted,
                  fontSize: 13, fontWeight: active ? 600 : 500,
                  letterSpacing: "0.04em", transition: "all 200ms ease",
                }}>
                  {v.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="ms-stack" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
          
          {tab === "1d" ? (
            <>
              {/* Live Metric */}
              <div style={{ background: C.card, borderRadius: 24, padding: 24, boxShadow: "0 12px 36px color-mix(in oklab, var(--acc-deep) 15.0%, transparent)" }}>
                <SectionHeader jp="現在の動き" en="Live Intensity" />
                <div className="flex items-baseline" style={{ gap: 6 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: C.sumi, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                    {simMotion.toFixed(2)}
                  </span>
                  <span style={{ fontSize: 15, color: C.rose, fontWeight: 600 }}>m/s²</span>
                </div>
                <div className="flex items-center" style={{ gap: 6, marginTop: 10 }}>
                  <Activity size={14} color={anomaly ? "#DC2626" : C.rose} />
                  <span style={{ fontSize: 12, color: anomaly ? "#DC2626" : C.ink2, fontWeight: anomaly ? 600 : 400 }}>
                    {anomaly ? t("歩行異常を検知しました", "Abnormal movement detected (Limping suspected)") : t("コラーからのライブデータ", "Resting normally (Live)")}
                  </span>
                </div>
              </div>

              {/* Activity Chart */}
              <CardBox>
                <SectionHeader jp="活動グラフ" en="Activity Graph" />
                <div style={{ height: 180, marginTop: 10, marginLeft: -16, marginRight: 8 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                      <defs>
                        <linearGradient id="colorV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.rose} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={C.rose} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--acc-pale)" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                      <Area type="monotone" dataKey="v" stroke={C.rose} strokeWidth={3} fillOpacity={1} fill="url(#colorV)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardBox>

              {/* Activity List */}
              <CardBox>
                <SectionHeader jp="活動履歴" en="Activity History" />
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                  {MOCK_1D_ACTIVITIES.map((act, i) => (
                    <div key={act.id} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      paddingBottom: 12, borderBottom: i === MOCK_1D_ACTIVITIES.length - 1 ? "none" : "1px solid var(--bg-elevated)" 
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: "50%",
                        background: `${act.color}20`, color: act.color,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <act.icon size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.sumi }}>{act.type}</div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{act.time}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.sumi }}>{act.intensity}</div>
                        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                          <Timer size={12} /> {act.duration}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBox>
            </>
          ) : (
            /* 1W / 1M Empty State */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{
                background: C.card, borderRadius: 24, padding: "24px 20px",
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12,
                boxShadow: "0 12px 36px color-mix(in oklab, var(--acc-deep) 15.0%, transparent)",
              }}>
                {[
                  { label: "AVG INTENSITY", value: DASH },
                  { label: "PEAK ACTIVITY", value: DASH },
                  { label: "ACTIVE TIME", value: DASH },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: "center", borderLeft: i === 0 ? "none" : "1px solid var(--bg-elevated)"  }}>
                    <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: "0.06em", marginBottom: 6 }}>{s.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.sumi }}>{s.value}</div>
                  </div>
                ))}
              </div>
              <CardBox style={{ textAlign: "center", padding: "40px 20px" }}>
                <Activity size={48} color={C.divider} style={{ margin: "0 auto 16px" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: C.sumi, marginBottom: 8 }}>
                  {t("データが不足しています", "Not enough data recorded")}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: 280, margin: "0 auto" }}>
                  {t("長期間のトレンドを分析するには、もっと多くの記録が必要です。", "Keep wearing the collar to unlock weekly and monthly trends.")}
                </div>
              </CardBox>
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}

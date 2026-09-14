import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import AppShell, { TopBar } from "@/components/AppShell";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  CartesianGrid, LineChart, Line, PieChart, Pie, Cell
} from "recharts";
import { useState, type ReactNode, type CSSProperties } from "react";
import {
  QrCode, FileDown, Activity, Thermometer, Droplets, Footprints, Moon,
  Syringe, Check, Clock, AlertTriangle, Stethoscope, Cross, CheckCircle2,
  Mic, ShieldAlert, HeartPulse, Sun
} from "lucide-react";
import { useT, useLanguage } from "@/context/LanguageContext";
import { usePet, type PetProfile } from "@/context/PetContext";
import { useCollar } from "@/context/CollarContext";
import { getSeries, average, type HistoryKey } from "@/lib/sensorHistory";
import { useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PdfTemplate } from "@/components/PdfTemplate";

export const Route = createFileRoute("/report")({ component: Report });

const TABS = ["1d", "1w", "1m", "3m", "6m", "4y"] as const;

/* ─────────── Theme-driven palette ─────────── */
const C = {
  cafe: "var(--acc-deep)",
  kombu: "var(--acc-strong)",
  moss: "var(--acc-soft)",
  tan: "var(--acc2-soft)",
  bone: "var(--bg-page)",
  red: "#EF4444",
  orange: "#F59E0B",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  green: "#10B981"
};

const glass: CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-card)",
  borderRadius: 24,
  boxShadow: "var(--shadow-card)",
};

function Report() {
  const t = useT();
  const { language } = useLanguage();
  const { pet } = usePet();
  const [tab, setTab] = useState<(typeof TABS)[number]>("1w");

  const [bump, setBump] = useState(0);
  useEffect(() => {
    const h = () => setBump((n) => n + 1);
    window.addEventListener("sensor-history", h);
    return () => window.removeEventListener("sensor-history", h);
  }, []);

  const windowMs: Record<(typeof TABS)[number], number> = {
    "1d": 864e5, "1w": 6048e5, "1m": 2592e6, "3m": 7776e6, "6m": 15552e6, "4y": 1261e8,
  };
  const series = (k: HistoryKey) =>
    getSeries(k, windowMs[tab]).map((p) => ({
      d: new Date(p.t).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      v: p.v,
    }));

  const envTempData = series("temp");
  const movementData = series("motion");
  const humidityData = series("humidity");
  const pressureData = series("pressure");
  // using "skin" for body temperature (TempSense)
  const bodyTempData = series("skin");
  
  const avgEnvTemp = average(getSeries("temp", windowMs[tab]));
  const avgMovement = average(getSeries("motion", windowMs[tab]));
  const avgHumidity = average(getSeries("humidity", windowMs[tab]));
  const avgPressure = average(getSeries("pressure", windowMs[tab]));
  const avgBodyTemp = average(getSeries("skin", windowMs[tab]));

  // Mock Vocal Analysis data for BarkSense AI chart
  const barkData = [
    { name: "Normal/Calm", value: 65, color: C.green },
    { name: "Happy/Playful", value: 20, color: C.blue },
    { name: "Anxious/Fear", value: 10, color: C.orange },
    { name: "Aggressive", value: 5, color: C.red },
  ];

  return (
    <AppShell
      titleJp="健康レポート"
      titleEn="AI Health Dashboard"
      renderTopBar={({ menuOpen, onMenuClick }) => <TopBar showBack backTo="/home" menuOpen={menuOpen} onMenuClick={onMenuClick} />}
    >
      <div
        style={{
          position: "relative",
          margin: "-16px -16px 0",
          padding: "16px",
          minHeight: "calc(100% + 32px)",
          background: C.bone,
        }}
      >

        <div style={{ position: "relative", zIndex: 1 }}>
          <HeroBanner pet={pet} />

          {/* Time filter tabs */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid color-mix(in oklab, var(--acc-deep) 20.0%, transparent)",
              borderRadius: 18,
              padding: 4,
              margin: "0 0 16px",
              display: "flex",
              boxShadow: "0 2px 12px color-mix(in oklab, var(--acc-deep) 5.0%, transparent)",
            }}
          >
            {TABS.map((tb) => {
              const active = tab === tb;
              return (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: 700,
                    color: active ? C.bone : C.moss,
                    background: active ? C.kombu : "transparent",
                    border: "none",
                    margin: 2,
                    boxShadow: active ? "0 4px 12px color-mix(in oklab, var(--acc-deep) 30.0%, transparent)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {tb}
                </button>
              );
            })}
          </div>

          <SectionDivider jp="AI センサー" en="Combine Sense AI" />
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* BarkSense AI */}
            <ChartCard
              accent={C.purple}
              icon={<Mic size={18} color={C.purple} />}
              titleJp="音声分析"
              titleEn="BarkSense AI"
              chipText="Vocal Emotion"
              chipBg={`${C.purple}20`}
              chipBorder={`${C.purple}40`}
              chipColor={C.purple}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={barkData} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                      {barkData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {barkData.map((b) => (
                    <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: b.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: C.cafe }}>{b.name}</span>
                      <span style={{ fontSize: 11, color: C.moss, marginLeft: "auto" }}>{b.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* TemperatureSense AI */}
            <ChartCard
              accent={C.red}
              icon={<HeartPulse size={18} color={C.red} />}
              titleJp="体温センサー"
              titleEn="TemperatureSense AI"
              chipText={avgBodyTemp == null ? "—" : `Avg ${avgBodyTemp.toFixed(1)}°C`}
              chipBg={`${C.red}20`}
              chipBorder={`${C.red}40`}
              chipColor={C.red}
            >
              {bodyTempData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={bodyTempData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bodyTempFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.red} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={C.red} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--acc-deep) 10.0%, transparent)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NiceTooltip suffix="°C" />} />
                  <Area type="monotone" dataKey="v" stroke={C.red} strokeWidth={2.5} fill="url(#bodyTempFill)" isAnimationActive={false}
                    dot={{ r: 3, fill: C.red, stroke: C.bone, strokeWidth: 1.5 }} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </ChartCard>

            {/* PressureSense AI */}
            <ChartCard
              accent={C.orange}
              icon={<ShieldAlert size={18} color={C.orange} />}
              titleJp="首輪の圧力"
              titleEn="PressureSense AI"
              chipText={avgPressure == null ? "—" : `Avg ${avgPressure.toFixed(1)} kPa`}
              chipBg={`${C.orange}20`}
              chipBorder={`${C.orange}40`}
              chipColor={C.orange}
            >
              {pressureData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={pressureData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--acc-deep) 10.0%, transparent)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NiceTooltip suffix=" kPa" />} />
                  <Line type="monotone" dataKey="v" stroke={C.orange} strokeWidth={2.5} isAnimationActive={false}
                    dot={{ r: 3, fill: C.orange, stroke: C.bone, strokeWidth: 1.5 }} />
                </LineChart>
              </ResponsiveContainer>
              )}
            </ChartCard>

            {/* MotionSense AI */}
            <ChartCard
              accent={C.green}
              icon={<Activity size={18} color={C.green} />}
              titleJp="運動強度"
              titleEn="MotionSense AI"
              chipText={avgMovement == null ? "—" : `Avg ${avgMovement.toFixed(2)} m/s²`}
              chipBg={`${C.green}20`}
              chipBorder={`${C.green}40`}
              chipColor={C.green}
            >
              {movementData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={movementData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="motionFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.green} stopOpacity={1} />
                      <stop offset="100%" stopColor={`${C.green}55`} stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--acc-deep) 10.0%, transparent)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NiceTooltip suffix=" m/s²" />} />
                  <Bar dataKey="v" fill="url(#motionFill)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </ChartCard>

            {/* EnvironmentSense AI - Temp */}
            <ChartCard
              accent={C.blue}
              icon={<Sun size={18} color={C.blue} />}
              titleJp="環境センサー"
              titleEn="EnvironmentSense AI"
              chipText={avgEnvTemp == null ? "—" : `Avg ${avgEnvTemp.toFixed(1)}°C`}
              chipBg={`${C.blue}20`}
              chipBorder={`${C.blue}40`}
              chipColor={C.blue}
            >
              {envTempData.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={envTempData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="envTempFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, var(--acc-deep) 10.0%, transparent)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.moss, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NiceTooltip suffix="°C" />} />
                  <Area type="monotone" dataKey="v" stroke={C.blue} strokeWidth={2.5} fill="url(#envTempFill)" isAnimationActive={false}
                    dot={{ r: 3, fill: C.blue, stroke: C.bone, strokeWidth: 1.5 }} />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <SectionDivider jp="出力" en="Reports & Sync" />
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40 }}>
            <QRCard onClick={() => toast.success(language === "en" ? "QR Generated" : "QR生成完了")} />
            <PDFCard onClick={() => toast.success(language === "en" ? "Exporting PDF..." : "PDF出力中...")} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/* ─────────── Helper Components ─────────── */

function EmptyChart() {
  const t = useT();
  return (
    <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: C.moss, fontSize: 12 }}>
      {t("データがありません", "No data in this period")}
    </div>
  );
}

function SectionDivider({ jp, en }: { jp: string; en: string }) {
  const t = useT();
  return (
    <div className="flex items-center gap-3" style={{ margin: "24px 0 16px" }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.cafe }}>{t(jp, en)}</div>
      <div style={{ flex: 1, height: 1, background: "color-mix(in oklab, var(--acc-deep) 15.0%, transparent)" }} />
    </div>
  );
}

function NiceTooltip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid color-mix(in oklab, var(--acc-deep) 15.0%, transparent)",
      padding: "8px 12px",
      borderRadius: 12,
      boxShadow: "0 4px 20px color-mix(in oklab, var(--acc-deep) 15.0%, transparent)",
    }}>
      <div style={{ fontSize: 10, color: C.moss, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.cafe }}>
        {payload[0].value.toFixed(1)}{suffix}
      </div>
    </div>
  );
}

function ChartCard({ children, titleJp, titleEn, chipText, chipBg, chipColor, chipBorder, icon, accent }: any) {
  const t = useT();
  return (
    <div style={{ ...glass, padding: "20px 16px", background: "#FFFFFF" }}>
      <div className="flex items-start justify-between" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: chipBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {icon}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.cafe, letterSpacing: "-0.01em" }}>
            {t(titleJp, titleEn)}
          </div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: chipColor,
          background: chipBg,
          padding: "4px 10px", borderRadius: 10,
          border: `1px solid ${chipBorder}`,
        }}>
          {chipText}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─────────── QR & PDF Cards ─────────── */
function QRCard({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <div style={{
      ...glass, borderLeft: `4px solid ${C.kombu}`, padding: 16,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: "color-mix(in oklab, var(--acc-deep) 12.0%, transparent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <QrCode size={28} color={C.kombu} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.cafe, textAlign: "center" }}>
        {t("獣医用QRコード", "Vet QR Code")}
      </div>
      <button
        onClick={onClick}
        style={{
          width: "100%", height: 40, marginTop: "auto",
          background: C.kombu, color: C.bone, fontWeight: 700, fontSize: 13, borderRadius: 12, border: "none",
        }}
      >
        {t("生成", "Generate")}
      </button>
    </div>
  );
}

function PDFCard({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <div style={{
      ...glass, borderLeft: `4px solid ${C.moss}`, padding: 16,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%", background: "color-mix(in oklab, #628B85 18%, #FFFFFF)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <FileDown size={28} color={C.moss} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.cafe, textAlign: "center" }}>
        {t("PDF出力", "PDF Export")}
      </div>
      <button
        onClick={onClick}
        style={{
          width: "100%", height: 40, marginTop: "auto",
          background: `linear-gradient(135deg, ${C.kombu}, ${C.moss})`,
          color: "#FFFFFF", fontWeight: 700, fontSize: 12, borderRadius: 12, border: "none",
        }}
      >
        {t("PDF出力", "Export PDF")}
      </button>
    </div>
  );
}

/* ─────────── Hero Banner ─────────── */
function HeroBanner({ pet }: { pet: PetProfile }) {
  const t = useT();
  const { language } = useLanguage();
  const breedEn = pet.breedEn || "Shiba Inu";
  const breedJp = pet.breedJp || "Shiba Inu";
  const name = pet.name || "your pet";

  return (
    <div
      style={{
        position: "relative", width: "auto", height: 180, margin: "-16px -16px 16px",
        borderRadius: "0 0 32px 32px", overflow: "hidden",
        background: `linear-gradient(90deg, ${C.kombu} 0%, ${C.moss} 100%)`,
        boxShadow: "0 10px 30px color-mix(in oklab, var(--acc-deep) 25.0%, transparent)",
      }}
    >
      <div style={{
        position: "absolute", top: -70, right: -60, width: 220, height: 220,
        borderRadius: "60% 40% 55% 45% / 50% 60% 40% 50%",
        background: "color-mix(in oklab, var(--acc-strong) 20.0%, transparent)", filter: "blur(1px)",
      }} />
      <div style={{
        position: "absolute", bottom: -40, left: -30, width: 140, height: 140,
        borderRadius: "50%", background: "color-mix(in oklab, var(--acc-strong) 20.0%, transparent)",
      }} />
      <div style={{
        position: "relative", zIndex: 1, padding: 24, display: "flex", flexDirection: "column",
        height: "100%", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 11, color: "color-mix(in oklab, var(--acc-soft) 85.0%, transparent)", letterSpacing: "0.12em", fontWeight: 600, textTransform: "uppercase" }}>
            {t("ヘルスレポート", "Health")}
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.bone, lineHeight: 1.1, marginTop: 4, letterSpacing: "-0.01em" }}>
            Sense AI Combine
          </div>
          <div style={{ fontSize: 13, color: "color-mix(in oklab, var(--acc-soft) 75.0%, transparent)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden>🐾</span><span>{name} · {t(breedJp, breedEn)}</span>
          </div>
        </div>
        <div style={{
          alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255, 255, 255, 0.2)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.6)", borderRadius: 20, padding: "4px 12px",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFFFFF", boxShadow: "0 0 8px rgba(255,255,255,0.8)" }} />
          <span style={{ fontSize: 12, color: "#FFFFFF", fontWeight: 600 }}>{t("良好", "Optimal")}</span>
        </div>
      </div>
    </div>
  );
}

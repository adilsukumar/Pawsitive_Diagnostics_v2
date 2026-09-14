import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { Camera, Image as ImageIcon, Sparkles, Send, Droplet, Layers, Palette, Flame, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import AppShell, { TopBar } from "@/components/AppShell";
import { SenseBanner } from "@/components/SenseBanner";
import { useLanguage, useT } from "@/context/LanguageContext";
import { NoData, DASH } from "@/components/NoData";
import { analyzeSkinImage, chatWithGemini, type SkinAnalysisResult } from "@/lib/gemini";


export const Route = createFileRoute("/skin-sense")({ component: SkinSensePage });

/* ---------- Pink palette ---------- */
const C = {
  primary: "var(--acc-pale)",
  deep: "var(--acc-soft)",
  mid: "var(--acc-soft)",
  soft: "var(--acc-pale)",
  pale: "var(--bg-page)",
  accent: "var(--acc-soft)",
  muted: "var(--acc-pale)",
  sakura: "var(--acc-pale)",
  white: "#FFFFFF",
  text: "var(--text-primary)",
  text2: "var(--text-secondary)",
  text3: "var(--text-secondary)",
  ok: "var(--acc-strong)",
  mild: "var(--acc-deep)",
  mod: "var(--acc-deep)",
  sev: "#DC2626",
};

/* ---------- Bilingual helper ---------- */
function Bi({ jp, en, jpStyle, enStyle, as: As = "div" }: {
  jp: ReactNode; en: ReactNode; jpStyle?: CSSProperties; enStyle?: CSSProperties; as?: "div" | "span";
}) {
  const { language } = useLanguage();
  return <As style={enStyle ?? jpStyle}>{en}</As>;
  return (<><As style={jpStyle}>{jp}</As><As style={enStyle}>{en}</As></>);
}

/* ---------- Card wrapper ---------- */
function PinkCard({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{
      background: C.white,
      borderRadius: 24,
      boxShadow: "0 4px 20px color-mix(in oklab, var(--acc-soft) 10.0%, transparent)",
      borderLeft: "4px solid var(--acc-soft)",
      padding: 20,
      marginBottom: 14,
      overflow: "hidden",
      boxSizing: "border-box",
      width: "100%",
      ...style,
    }}>{children}</div>
  );
}

function Label({ jp, en }: { jp: string; en: string }) {
  const t = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--acc-soft)" }} />
      <span style={{ fontSize: 11, color: "var(--acc-soft)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {t(jp, en)}
      </span>
    </div>
  );
}

/* ---------- Severity helpers ---------- */
type Severity = "normal" | "mild" | "moderate" | "severe";
const SEV: Record<Severity, { color: string; bg: string; jp: string; en: string }> = {
  normal:   { color: C.ok,  bg: "var(--acc2-pale)", jp: "正常",   en: "Normal" },
  mild:     { color: C.mild,bg: "var(--acc-soft)", jp: "軽度",   en: "Mild" },
  moderate: { color: C.mod, bg: "var(--acc-pale)", jp: "中度",   en: "Moderate" },
  severe:   { color: C.sev, bg: "var(--acc-pale)", jp: "重度",   en: "Severe" },
};


/* ---------- AI chat canned responses ---------- */
const AI_RESPONSES = [
  { jp: "現在の所見では深刻な兆候は見られません。スコアは94で健康範囲内です。", en: "Based on current findings, no serious signs detected. Score 94 is within healthy range." },
  { jp: "保湿シャンプーを週1回使用し、加湿器で湿度50-60%を保つことをおすすめします。", en: "Use a moisturising shampoo weekly and keep humidity at 50-60% with a humidifier." },
  { jp: "現状の所見では獣医受診の緊急性はありませんが、2週間以上変化がなければ相談を。", en: "No urgent vet visit needed currently. Consult a vet if no change after 2 weeks." },
  { jp: "ブラッシングと栄養バランス、オメガ3サプリで健康な皮膚を保てます。", en: "Brushing, balanced nutrition, and omega-3 supplements help maintain healthy skin." },
];

const QUICK_QS = [
  { jp: "これは深刻ですか？", en: "Is this serious?" },
  { jp: "どう治療しますか？", en: "How to treat?" },
  { jp: "獣医に行くべき？", en: "Should I see a vet?" },
  { jp: "予防方法は？", en: "How to prevent?" },
];

/* ---------- Main page ---------- */
type HistoryItem = { id: string; date: number; image: string; result: SkinAnalysisResult };

function SkinSensePage() {
  const t = useT();
  const [photo, setPhoto] = useState<string | null>(null);
  const [b64Photo, setB64Photo] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const h = localStorage.getItem("skinsense_history");
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  });
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setResult(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setB64Photo(e.target?.result as string);
    reader.readAsDataURL(file);
  }
  
  async function analyze() {
    if (!b64Photo) return;
    setAnalyzing(true);
    try {
      const res = await analyzeSkinImage(b64Photo);
      setResult(res);
      const newItem: HistoryItem = { id: Date.now().toString(), date: Date.now(), image: b64Photo, result: res };
      setHistory(prev => {
        const next = [newItem, ...prev].slice(0, 10);
        localStorage.setItem("skinsense_history", JSON.stringify(next));
        return next;
      });
    } catch (e: any) {
      alert("Error analyzing image: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <AppShell
      noPadding
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <TopBar showBack backTo="/home" menuOpen={menuOpen} onMenuClick={onMenuClick} />
      )}
    >
      <style>{`
        @keyframes ssLive { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.4);opacity:.5} }
        @keyframes ssPetal { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ssScan { 0%{top:0} 50%{top:calc(100% - 2px)} 100%{top:0} }
        @keyframes ssIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ssPulse { 0%,100%{box-shadow:0 6px 20px color-mix(in oklab, var(--acc-soft) 40.0%, transparent)} 50%{box-shadow:0 6px 28px color-mix(in oklab, var(--acc-soft) 65.0%, transparent)} }
        @keyframes ssDot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-6px);opacity:1} }
        .ss-in { animation: ssIn 380ms cubic-bezier(.2,.7,.2,1) both; }
      `}</style>

      <div style={{ background: "var(--bg-page)", minHeight: "100%", paddingBottom: 110 }}>
        {/* ---- HERO ---- */}
        <SenseBanner
          subtitleEn="SkinSense AI"
          titleEn="SkinSense AI"
          descriptorEn="Skin health analysis"
          bgGradient="linear-gradient(135deg,var(--bg-card) 0%,var(--acc-pale) 100%)"
          subtitleColor="var(--acc-soft)"
        />

        {/* ---- Stats card below banner ---- */}
        <div style={{ padding: "0 16px", position: "relative", zIndex: 2, marginTop: -36 }}>
          <div style={{
            background: "#FFFFFF",
            borderRadius: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            padding: "16px 20px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
          }}>
            {[
              { label: t("皮膚スコア", "SKIN SCORE"), value: DASH, color: "var(--acc-soft)" },
              { label: t("最終スキャン", "LAST SCAN"), value: DASH, color: C.text },
              { label: t("状態", "CONDITION"), value: DASH, color: C.ok },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: "center",
                borderLeft: i === 0 ? "none" : `1px solid ${C.soft}`,
                padding: "0 4px",
              }}>
                <div style={{ fontSize: 9, color: C.text3, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>


        {/* ---- Content ---- */}
        <div style={{ padding: "16px", marginTop: 16 }}>
          {/* ===== SECTION 2: SCAN ===== */}
          <PinkCard>
            <Label jp="皮膚スキャン" en="Skin Scan" />

            {!photo ? (
              <div style={{
                position: "relative",
                background: "linear-gradient(135deg, var(--bg-page), var(--acc-pale))",
                border: `1.5px dashed ${C.accent}`,
                borderRadius: 20,
                height: 180,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {/* scanning line */}
                <div style={{
                  position: "absolute", left: 0, right: 0, height: 1.5,
                  background: "linear-gradient(90deg, transparent, color-mix(in oklab, var(--acc-soft) 55.0%, transparent), transparent)",
                  animation: "ssScan 2.5s ease-in-out infinite",
                }} />
                {/* Viewfinder */}
                <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  border: "1px solid color-mix(in oklab, var(--acc-soft) 30.0%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    position: "absolute", width: 65, height: 65, borderRadius: "50%",
                    border: "1px solid color-mix(in oklab, var(--acc-soft) 15.0%, transparent)",
                  }} />
                  <Camera size={28} color="var(--acc-soft)" strokeWidth={1.6} />
                </div>
                <Bi
                  jp="愛犬の皮膚を撮影してください"
                  en="Capture your pet's skin"
                  jpStyle={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500, marginTop: 12, textAlign: "center" }}
                  enStyle={{ fontSize: 11, color: C.text3, marginTop: 4, textAlign: "center" }}
                />
                <Bi
                  jp="AIが皮膚の状態を瞬時に診断します"
                  en="AI diagnoses skin condition instantly"
                  jpStyle={{ fontSize: 11, color: C.text3, marginTop: 6, textAlign: "center" }}
                  enStyle={{ fontSize: 11, color: C.text3, marginTop: 6, textAlign: "center" }}
                />
              </div>
            ) : (
              <div style={{ position: "relative", borderRadius: 20, overflow: "hidden" }}>
                <img src={photo} alt="upload" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                <button
                  onClick={() => { setPhoto(null); setResult(null); }}
                  style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(255,255,255,0.95)", color: "var(--acc-deep)",
                    border: "none", borderRadius: 50, padding: "6px 12px",
                    fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  }}
                >
                  <RotateCcw size={11} /> {t("再撮影", "Retake")}
                </button>
              </div>
            )}

            {/* Hidden file inputs */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden
              onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />
            <input ref={galleryRef} type="file" accept="image/*" hidden
              onChange={(e) => onFile(e.target.files?.[0] ?? undefined)} />

            {!photo ? (
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  onClick={() => cameraRef.current?.click()}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 50,
                    border: `1.5px solid var(--acc-soft)`, color: "var(--acc-soft)", background: "#fff",
                    fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <Camera size={14} /> {t("カメラ", "Camera")}
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 50,
                    background: "linear-gradient(135deg, var(--acc-soft), var(--acc-pale))", color: "var(--acc-deep)",
                    border: "none", fontSize: 13, fontWeight: 600,
                    boxShadow: "0 4px 14px color-mix(in oklab, var(--acc-soft) 30.0%, transparent)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  <ImageIcon size={14} /> {t("ギャラリー", "Gallery")}
                </button>
              </div>
            ) : (
              <button
                onClick={analyze}
                disabled={analyzing}
                style={{
                  marginTop: 14, width: "100%", padding: "14px 0", borderRadius: 50,
                  background: "linear-gradient(135deg, var(--acc-soft), var(--acc-pale))", color: "var(--acc-deep)",
                  border: "none", fontSize: 15, fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  animation: analyzing ? "none" : "ssPulse 2s ease-in-out infinite",
                  opacity: analyzing ? 0.7 : 1,
                }}
              >
                <Sparkles size={16} />
                {analyzing ? t("分析中...", "Analyzing...") : t("AIで診断する", "Analyze with AI")}
              </button>
            )}
          </PinkCard>

          {/* ===== SECTION 3: DIAGNOSIS RESULT ===== */}
          {result && photo && (
            <PinkCard style={{ animation: "ssIn 400ms cubic-bezier(.2,.7,.2,1) both" }}>
              <Label jp="診断結果" en="Diagnosis Result" />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                <img src={photo} alt="scan" style={{ width: 70, height: 70, borderRadius: 16, objectFit: "cover", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--acc-deep)", marginBottom: 4 }}>
                    {result.diseaseName}
                  </div>
                  <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                    {result.description}
                  </div>
                </div>
              </div>

              <div style={{
                background: result.urgency === "high" ? "rgba(220, 38, 38, 0.1)" : result.urgency === "medium" ? "var(--acc-pale)" : "var(--acc2-pale)",
                padding: "10px 14px", borderRadius: 12, marginBottom: 16,
                display: "inline-flex", alignItems: "center", gap: 8
              }}>
                <Flame size={18} color={result.urgency === "high" ? "#DC2626" : result.urgency === "medium" ? "var(--acc-deep)" : "var(--acc2-strong)"} />
                <span style={{ fontSize: 12, fontWeight: 700, color: result.urgency === "high" ? "#DC2626" : result.urgency === "medium" ? "var(--acc-deep)" : "var(--acc2-strong)" }}>
                  {t("緊急度: ", "Urgency: ")}{result.urgency.toUpperCase()}
                </span>
              </div>

              <GuideRow titleJp="対処法" titleEn="What to do" jp="" en={result.whatToDo} />
              <div style={{ marginTop: 12 }}>
                <GuideRow titleJp="避けるべきこと" titleEn="What NOT to do" jp="" en={result.whatNotToDo} />
              </div>
              <div style={{ marginTop: 12 }}>
                <GuideRow titleJp="避けるべき食べ物" titleEn="Foods to avoid" jp="" en={result.foodToAvoid} />
              </div>
            </PinkCard>
          )}

          {/* ===== SECTION 4: AI CHAT ===== */}
          <AIChat b64Photo={b64Photo} result={result} />

          {/* ===== SECTION 5: HISTORY ===== */}
          <PinkCard>
            <Label jp="分析履歴" en="Analysis History" />
            {history.length === 0 ? (
              <NoData
                title={t("履歴はまだありません", "No analyses yet")}
                hint={t("スキャンすると履歴がここに表示されます。", "Your scans and sensor readings will be listed here once recorded.")}
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {history.map((h, i) => (
                  <div key={h.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    paddingBottom: i !== history.length - 1 ? 12 : 0,
                    borderBottom: i !== history.length - 1 ? 1px solid var(--acc-pale) : "none"
                  }}>
                    <img src={h.image} alt="history" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {h.result.diseaseName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                        {new Date(h.date).toLocaleDateString()} • {h.result.urgency.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PinkCard>

          {/* ===== SECTION 6: AI INSIGHT ===== */}
          <AIInsight />
        </div>
      </div>
    </AppShell>
  );
}

/* ---------- Sub components ---------- */

function ScoreRing({ value }: { value: number }) {
  const r = 20, c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <svg width={52} height={52} viewBox="0 0 52 52">
      <defs>
        <linearGradient id="ssRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--acc-soft)" />
          <stop offset="100%" stopColor="var(--acc-pale)" />
        </linearGradient>
      </defs>
      <circle cx={26} cy={26} r={r} fill="none" stroke={C.soft} strokeWidth={5} />
      <circle cx={26} cy={26} r={r} fill="none" stroke="url(#ssRing)" strokeWidth={5}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 26 26)" />
      <text x={26} y={30} textAnchor="middle" fontSize={14} fontWeight={800} fill="var(--acc-soft)">{value}</text>
    </svg>
  );
}

function Metric({ icon, iconBg, iconColor, jp, en, value }: {
  icon: ReactNode; iconBg: string; iconColor: string; jp: string; en: string; value: string;
}) {
  const t = useT();
  return (
    <div style={{
      background: C.pale, borderRadius: 14, padding: 12,
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", background: iconBg, color: iconColor,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6,
      }}>{icon}</div>
      <div style={{ fontSize: 10, color: C.text3, fontWeight: 600 }}>{t(jp, en)}</div>
      <div style={{ fontSize: 13, color: C.text, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}

function DetailedGuide() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "12px 14px", borderRadius: 14,
          background: C.pale, border: `1px solid ${C.soft}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          color: "var(--acc-deep)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
        }}
      >
        <span>● {t("詳細ガイド", "DETAILED GUIDE")}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div style={{ padding: "14px 4px 4px", display: "grid", gap: 12 }}>
          <GuideRow titleJp="この状態の意味" titleEn="What it means"
            jp="現在の皮膚は健康な範囲内です。色素・水分・質感ともに正常値を示しています。"
            en="Skin is within healthy range. Pigment, hydration and texture all show normal values." />
          <GuideRow titleJp="考えられる要因" titleEn="Possible causes"
            jp="バランスの良い食事と適切なケアが維持されています。"
            en="Balanced diet and proper care are being maintained." />
          <GuideRow titleJp="推奨ケア" titleEn="Recommended care"
            jp="現在のケアを継続し、週1回のスキャンで経過観察を続けてください。"
            en="Continue current care and monitor with weekly scans." />
          <GuideRow titleJp="獣医に相談すべき時" titleEn="When to see a vet"
            jp="赤み、強い痒み、脱毛、2週間以上続く変化が見られた場合。"
            en="If redness, intense itching, hair loss, or changes lasting over 2 weeks appear." />
        </div>
      )}
    </div>
  );
}

function GuideRow({ titleJp, titleEn, jp, en }: { titleJp: string; titleEn: string; jp: string; en: string }) {
  return (
    <div>
      <Bi jp={titleJp} en={titleEn}
        jpStyle={{ fontSize: 12, fontWeight: 700, color: "var(--acc-deep)" }}
        enStyle={{ fontSize: 10, color: C.text3, marginTop: 1 }}
      />
      <Bi jp={jp} en={en}
        jpStyle={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.6, marginTop: 4 }}
        enStyle={{ fontSize: 11, color: C.text2, lineHeight: 1.55, marginTop: 4 }}
      />
    </div>
  );
}

/* ---------- AI Chat ---------- */
type ChatMsg = { role: "ai" | "user"; jp: string; en: string };

function AIChat({ b64Photo, result }: { b64Photo: string | null; result: SkinAnalysisResult | null }) {
  const t = useT();
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai",
      jp: "こんにちは！皮膚の状態について何でも質問してください。",
      en: "Hello! Feel free to ask me anything about your pet's skin condition." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function sendText(jp: string, en: string) {
    const newMessages = [...messages, { role: "user" as const, jp, en }];
    setMessages(newMessages);
    setTyping(true);
    
    try {
      // Map to Gemini format
      const geminiMessages = newMessages.map(m => ({ role: m.role, text: m.en }));
      const response = await chatWithGemini(geminiMessages, b64Photo, result);
      setMessages(m => [...m, { role: "ai", jp: response, en: response }]);
    } catch (err: any) {
      setMessages(m => [...m, { role: "ai", jp: "エラーが発生しました。", en: "An error occurred while connecting to AI." }]);
    } finally {
      setTyping(false);
    }
  }

  function handleSend() {
    const v = input.trim();
    if (!v) return;
    sendText(v, v);
    setInput("");
  }

  return (
    <PinkCard>
      <Label jp="AIに質問する" en="Ask AI" />
      <Bi jp="皮膚に関する質問をどうぞ" en="Ask anything about skin health"
        jpStyle={{ fontSize: 12, color: C.text3, marginBottom: 10 }}
        enStyle={{ fontSize: 12, color: C.text3, marginBottom: 10 }}
      />

      {/* Quick chips */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
        {QUICK_QS.map((q, i) => (
          <button key={i}
            onClick={() => sendText(q.jp, q.en)}
            style={{
              flexShrink: 0, background: "var(--acc-pale)", border: "1px solid var(--acc-pale)",
              color: "var(--acc-deep)", borderRadius: 50, padding: "6px 14px",
              fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
            }}
          >{t(q.jp, q.en)}</button>
        ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{
        height: 200, overflowY: "auto", background: C.pale, borderRadius: 16, padding: 12,
        display: "flex", flexDirection: "column", gap: 10,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "ai" ? (
              <div style={{
                background: "#fff", padding: "10px 14px", maxWidth: "82%",
                borderRadius: "16px 16px 16px 4px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <PawIcon color="var(--acc-soft)" size={12} />
                  <span style={{ fontSize: 10, color: "var(--acc-soft)", fontWeight: 700 }}>AI</span>
                </div>
                <Bi jp={m.jp} en={m.en}
                  jpStyle={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6 }}
                  enStyle={{ fontSize: 12, color: C.text2, lineHeight: 1.55, marginTop: 2 }}
                />
              </div>
            ) : (
              <div style={{
                background: "linear-gradient(135deg, var(--acc-soft), var(--acc-pale))", color: "var(--acc-deep)",
                padding: "10px 14px", maxWidth: "82%",
                borderRadius: "16px 16px 4px 16px",
                fontSize: 13, lineHeight: 1.5,
              }}>{t(m.jp, m.en)}</div>
            )}
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex" }}>
            <div style={{
              background: "#fff", padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", gap: 4,
            }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--acc-soft)",
                  animation: `ssDot 1.2s ease-in-out ${i * 0.15}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        marginTop: 10, display: "flex", alignItems: "center", gap: 6,
        background: "#fff", border: `1.5px solid ${C.soft}`, borderRadius: 50,
        padding: "6px 6px 6px 16px",
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder={t("質問を入力...", "Type your question...")}
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: 13, color: "var(--text-primary)", minWidth: 0,
          }}
        />
        <button onClick={handleSend} aria-label="Send" style={{
          width: 36, height: 36, borderRadius: "50%", border: "none",
          background: "linear-gradient(135deg, var(--acc-soft), var(--acc-pale))", color: "var(--acc-deep)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px color-mix(in oklab, var(--acc-soft) 30.0%, transparent)", flexShrink: 0,
        }}><Send size={16} /></button>
      </div>
    </PinkCard>
  );
}

/* ---------- AI Insight ---------- */
function AIInsight() {
  const t = useT();
  return (
    <div style={{
      position: "relative",
      background: "linear-gradient(135deg, var(--acc-soft) 0%, var(--acc-soft) 100%)",
      borderRadius: 26, padding: 22, overflow: "hidden",
      boxShadow: "0 8px 28px color-mix(in oklab, var(--acc-strong) 18.0%, transparent)",
    }}>
      {/* sakura watermarks */}
      {[
        { top: 14, right: 22, size: 26, dur: 26 },
        { top: 70, right: 80, size: 18, dur: 30 },
        { bottom: 16, right: 30, size: 22, dur: 24 },
      ].map((p, i) => (
        <svg key={i} width={p.size} height={p.size} viewBox="0 0 24 24" aria-hidden style={{
          position: "absolute", top: p.top, right: p.right, bottom: p.bottom,
          opacity: 0.5, animation: `ssPetal ${p.dur}s linear infinite`,
        }}>
          <path d="M12 2c2 3 5 5 5 9s-3 7-5 11c-2-4-5-7-5-11s3-6 5-9z" fill="rgba(255,255,255,0.06)" />
        </svg>
      ))}

      <div style={{ position: "relative" }}>
        <div style={{
          fontSize: 11, color: "var(--acc-pale)", fontWeight: 700, letterSpacing: "0.1em",
        }}>AI INSIGHT</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "10px 0 14px" }} />

        <Bi
          jp="ワンちゃんの皮膚は現在健康な状態です。前回のチェックから3ポイント改善しています。引き続き定期的なケアを続けてください。"
          en="Skin condition is healthy. Improved by 3 points since last check. Continue regular care."
          jpStyle={{ fontSize: 14, color: "#fff", lineHeight: 1.8 }}
          enStyle={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, marginTop: 6 }}
        />

        <div style={{ marginTop: 14 }}>
          <span style={{
            display: "inline-block", background: "rgba(255,255,255,0.15)",
            color: "#fff", borderRadius: 50, padding: "6px 14px",
            fontSize: 12, fontWeight: 500,
          }}>
            💡 {t("週1回のスキャンを推奨", "Weekly scan recommended")}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "color-mix(in oklab, var(--acc-deep) 25.0%, transparent)", color: "var(--acc2-soft)",
            borderRadius: 50, padding: "4px 10px",
            fontSize: 11, fontWeight: 700,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--acc2-strong)" }} />
            {t("健康な皮膚 ✓", "Healthy skin ✓")}
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {t("更新 14:32", "Updated 14:32")}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Tiny paw icon ---------- */
function PawIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden>
      <ellipse cx="6" cy="9" rx="2" ry="2.6" />
      <ellipse cx="10" cy="6" rx="2" ry="2.6" />
      <ellipse cx="14" cy="6" rx="2" ry="2.6" />
      <ellipse cx="18" cy="9" rx="2" ry="2.6" />
      <path d="M12 11c-3.2 0-5.6 2.4-5.6 5 0 1.8 1.4 3 3.4 3 1 0 1.4-.4 2.2-.4s1.2.4 2.2.4c2 0 3.4-1.2 3.4-3 0-2.6-2.4-5-5.6-5z" />
    </svg>
  );
}

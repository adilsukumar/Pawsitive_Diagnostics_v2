import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { HamburgerButton } from "@/components/SideDrawer";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera,
  Mic,
  Send,
  Heart,
  Activity,
  MapPin,
  AlertTriangle,
  MoreHorizontal,
  Syringe,
  Thermometer,
  Droplets,
  Moon,
  UtensilsCrossed,
  FileHeart,
  Phone,
  Navigation,
  Calendar,
  Check,
  X,
  ChevronRight,
  Star,
} from "lucide-react";
import { useT, useLanguage } from "@/context/LanguageContext";
import { usePet } from "@/context/PetContext";
import { useCollar } from "@/context/CollarContext";
import { useNearbyVets } from "@/lib/useNearbyVets";
import DogAvatar from "@/components/DogAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { detectIntent, NEARBY_CLINICS, VACCINE_RECORDS, type Intent } from "@/utils/chatResponses";

export const Route = createFileRoute("/ai")({ component: AI });

type CardType =
  | "health"
  | "emergencyConfirm"
  | "emergencyAction"
  | "findVet"
  | "vaccines"
  | "healthFollowup";

type Msg = {
  id: number;
  from: "user" | "ai";
  jp: string;
  en: string;
  card?: CardType;
  time?: string;
};

function nowTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

const QUICK: { jp: string; en: string; icon: typeof Heart; color: string; bg: string; intent: Intent; pulse?: boolean }[] = [
  { jp: "健康確認", en: "Health Check", icon: Heart, color: "var(--accent-sakura)", bg: "var(--accent-sakura-soft)", intent: "healthCheck" },
  { jp: "ワクチン", en: "Vaccines", icon: Syringe, color: "var(--accent-matcha)", bg: "var(--acc-pale)", intent: "vaccines" },
  { jp: "近くの獣医", en: "Find Vet", icon: MapPin, color: "var(--accent-sora)", bg: "var(--acc2-pale)", intent: "findVet" },
  { jp: "緊急", en: "Emergency", icon: AlertTriangle, color: "#E53935", bg: "var(--acc-pale)", intent: "emergency", pulse: true },
];

const SUGGESTIONS = [
  { jp: " うちの犬の健康状態を教えて", en: " Tell me my pet's health status", color: "var(--accent-sakura)" },
  { jp: " 次のワクチンはいつ？", en: " When is the next vaccine?", color: "var(--accent-matcha)" },
  { jp: " 近くの動物病院を探して", en: " Find a nearby veterinary hospital", color: "var(--accent-sora)" },
];

const PAW_PATTERN =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><g fill='%23E8829A' fill-opacity='0.025'><circle cx='12' cy='14' r='2.2'/><circle cx='18' cy='10' r='1.6'/><circle cx='8' cy='10' r='1.6'/><circle cx='15' cy='18' r='1.6'/><ellipse cx='13' cy='22' rx='3.6' ry='3'/></g></svg>`,
  );

function AI() {
  const t = useT();
  const { language } = useLanguage();
  const { pet } = usePet();
  const navigate = useNavigate();
  const name = pet.name || "your pet";
  const suffix = "";
  const { live } = useCollar();
  // Only report values the collar actually sent — never invent numbers.
  const liveText = (k: "temp" | "motion" | "pressure" | "light" | "skin", _jpFallback: string, fallback: string) => {
    const r = live[k];
    return r ? `Current reading: ${r.value}${r.unit ?? ""} (updated ${new Date(r.at).toLocaleTimeString()})` : fallback;
  };

  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      from: "ai",
      jp: `こんにちは！${name}${suffix}の健康についてお手伝いします `,
      en: `Hi! I'm here to help with ${name}'s health `,
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [focused, setFocused] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(100);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = () => ++idRef.current;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const pushUser = (jp: string, en: string) => {
    setMsgs((m) => [...m, { id: nextId(), from: "user", jp, en, time: nowTime() }]);
  };
  const pushAi = (jp: string, en: string, card?: CardType) => {
    setMsgs((m) => [...m, { id: nextId(), from: "ai", jp, en, time: nowTime(), card }]);
  };

  const withTyping = (delay: number, fn: () => void) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      fn();
    }, delay);
  };

  // ===== Intent flows =====

  const runEmergency = useCallback(() => {
    withTyping(900, () => {
      pushAi(
        "緊急事態ですか？SOSを起動しますか？",
        "Is this an emergency? Do you want to activate SOS?",
        "emergencyConfirm",
      );
    });
  }, []);

  const runFindVet = useCallback(() => {
    withTyping(800, () => {
      pushAi("近くの動物病院を検索しています... ", "Searching for nearby clinics... ");
      setTimeout(() => {
        pushAi("", "", "findVet");
        setTimeout(() => {
          pushAi(
            "クリニックページに詳細があります。お役に立てますか？",
            "The clinics page has more details. Can I help with anything else? ",
          );
        }, 900);
      }, 500);
    });
  }, []);

  const runVaccines = useCallback(() => {
    withTyping(900, () => {
      pushAi(
        `${name}${suffix}のワクチン記録を確認しています `,
        `Checking ${name}'s vaccine records `,
      );
      setTimeout(() => {
        pushAi("", "", "vaccines");
        setTimeout(() => {
          pushAi(
            "ワクチン記録はまだありません。",
            "No vaccination records saved yet — add them in your pet's profile or ask your vet to upload them.",
          );
        }, 900);
      }, 500);
    });
  }, [name, suffix]);

  const runHealthCheck = useCallback(() => {
    withTyping(900, () => {
      pushAi(
        `${name}${suffix}の健康状態を確認しています... `,
        `Checking ${name}'s health status... `,
      );
      setTimeout(() => {
        pushAi(`${name}${suffix}の健康サマリーです `, `Here's ${name}'s health summary `, "health");
        setTimeout(() => {
          pushAi("", "", "healthFollowup");
        }, 700);
      }, 500);
    });
  }, [name, suffix]);

  const runGeneral = useCallback(
    (text: string) => {
      const m = text.toLowerCase();
      withTyping(1000, () => {
        if (/food|eat|diet|食事|ごはん/.test(m)) {
          const w = pet.weight ?? 8;
          pushAi(
            `${name}${suffix}の体重${w}kgに適した1日の食事量は約${Math.round(w * 30)}gです。バランスの良い食事を心がけましょう `,
            `For a ${w}kg pet like ${name}, the recommended daily food is about ${Math.round(w * 30)}g. Keep a balanced diet `,
          );
        } else if (/walk|exercise|散歩|運動/.test(m)) {
          pushAi(
            liveText("motion", "運動データはまだありません。首輪を接続してください。", "No activity data yet — connect the collar to start tracking."),
            liveText("motion", "No activity data yet — connect the collar to start tracking.", "No activity data yet — connect the collar to start tracking."),
          );
        } else if (/temperature|fever|体温|熱/.test(m)) {
          pushAi(
            liveText("temp", "体温データはまだありません。首輪を接続してください。", "No temperature reading yet — connect the collar."),
            liveText("temp", "No temperature reading yet — connect the collar.", "No temperature reading yet — connect the collar."),
          );
        } else if (/sleep|tired|眠/.test(m)) {
          pushAi(
            "睡眠センサーはまだありません。",
            "Sleep isn't measured by the collar yet, so there's no data to report.",
          );
        } else {
          pushAi(
            "わんちゃんについて何でも聞いてください！健康チェック、ワクチン、クリニック検索などお手伝いできます ",
            "Feel free to ask anything about your pet! I can help with health checks, vaccines, finding clinics and more ",
          );
        }
      });
    },
    [name, suffix, pet.weight],
  );

  const dispatchIntent = (intent: Intent, text: string) => {
    switch (intent) {
      case "emergency":
        return runEmergency();
      case "findVet":
        return runFindVet();
      case "vaccines":
        return runVaccines();
      case "healthCheck":
        return runHealthCheck();
      default:
        return runGeneral(text);
    }
  };

  const send = (text?: string) => {
    const v = (text ?? input).trim();
    if (!v) return;
    pushUser(v, v);
    setInput("");
    dispatchIntent(detectIntent(v), v);
  };

  const sendChip = (q: (typeof QUICK)[number]) => {
    const jp = q.jp;
    const en = q.en;
    setMsgs((m) => [...m, { id: nextId(), from: "user", jp, en, time: nowTime() }]);
    dispatchIntent(q.intent, en);
  };

  // ===== Card action handlers =====

  const onEmergencyYes = () => {
    pushUser("はい、SOS", "Yes, SOS");
    withTyping(700, () => {
      pushAi(" SOS を起動しています...", " Activating SOS...");
      setSosActive(true);
      setTimeout(() => {
        pushAi("", "", "emergencyAction");
        setTimeout(() => {
          pushAi(
            "SOSが送信されました。助けが来るまで落ち着いてください ",
            "SOS has been sent. Please stay calm until help arrives ",
          );
        }, 900);
      }, 800);
    });
  };
  const onEmergencyNo = () => {
    pushUser("いいえ", "No");
    withTyping(500, () => {
      pushAi(
        "わかりました。何かあればいつでも呼んでください ",
        "Understood. Call me anytime if you need help ",
      );
    });
  };

  const goClinics = () => {
    withTyping(500, () => {
      pushAi("クリニックページに移動します... ", "Taking you to clinics... ");
      setTimeout(() => navigate({ to: "/clinics" }), 600);
    });
  };
  const goReport = () => {
    withTyping(500, () => {
      pushAi("レポートページに移動します... ", "Taking you to your report... ");
      setTimeout(() => navigate({ to: "/report" }), 600);
    });
  };
  const focusInput = () => inputRef.current?.focus();

  const pickText = (m: Msg) => m.en;

  return (
    <AppShell
      fullHeight
      noPadding
      renderTopBar={({ menuOpen, onMenuClick }) => (
        <div
          style={{
            flexShrink: 0,
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <HamburgerButton isOpen={menuOpen} onClick={onMenuClick} />
          <div className="relative shrink-0">
            <div
              className="flex items-center justify-center overflow-hidden"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--acc-pale), var(--acc-pale))",
                border: "2px solid var(--acc2-soft)",
                boxShadow: "0 4px 10px color-mix(in oklab, var(--acc-strong) 20.0%, transparent)",
              }}
            >
              <DogAvatar breed="shiba" size={36} ring={false} showCollar={false} eyeStyle="sparkle" />
            </div>
            <div
              style={{
                position: "absolute", right: -1, bottom: -1, width: 11, height: 11,
                borderRadius: "50%", background: "var(--accent-matcha)", border: "2px solid #FFFFFF",
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 truncate">
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>Pawsitive Diagnostics AI</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative inline-block" style={{ width: 5, height: 5 }}>
                <span className="absolute inset-0 rounded-full" style={{ background: "var(--accent-matcha)" }} />
                <span className="absolute inset-0 rounded-full pulse-dot" style={{ background: "var(--accent-matcha)" }} />
              </span>
              <span style={{ fontSize: 10, color: "var(--accent-matcha)", fontWeight: 600 }}>{t("オンライン", "Online")}</span>
              <span style={{ fontSize: 10, color: "var(--text-placeholder)" }}>·</span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{t("獣医監修", "Vet-supervised")}</span>
            </div>
          </div>
          <button
            className={`shrink-0 flex items-center justify-center ${sosActive ? "sos-pulse" : ""}`}
            style={{
              padding: "0 12px", height: 32, borderRadius: 16,
              background: "#E53935", color: "#FFFFFF",
              fontWeight: 800, fontSize: 11, letterSpacing: "0.05em",
              boxShadow: "0 4px 10px rgba(229,57,53,0.35)",
            }}
            aria-label="SOS"
          >
            SOS
          </button>
        </div>
      )}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: `url("${PAW_PATTERN}") repeat, var(--bg-page)`,
        }}
      >
        {/* CHAT */}
        <div ref={scrollRef} className="px-4 pt-3 space-y-3" style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
          <div className="flex items-center justify-center my-3">
            <div
              style={{
                fontSize: 11,
                color: "var(--accent-sakura)",
                background: "color-mix(in srgb, var(--accent-sakura) calc(0.1 * 100%), transparent)",
                border: "1px solid color-mix(in srgb, var(--accent-sakura) calc(0.2 * 100%), transparent)",
                padding: "4px 16px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {t("今日", "Today")}
            </div>
          </div>


          <AnimatePresence initial={false}>
            {msgs.map((m) => {
              const isUser = m.from === "user";
              const txt = pickText(m);
              const hasCard = !!m.card;
              const hasText = !!(m.jp || m.en);
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: isUser ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex gap-2 ${isUser ? "justify-end" : "justify-start items-end"}`}
                >
                  {!isUser && (
                    <div
                      className="shrink-0 overflow-hidden flex items-center justify-center"
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--acc-pale), var(--acc-pale))",
                        border: "1.5px solid var(--acc2-soft)",
                      }}
                    >
                      <DogAvatar breed="shiba" size={26} ring={false} showCollar={false} />
                    </div>
                  )}

                  <div className={`flex flex-col ${isUser ? "items-end max-w-[75%]" : "items-start max-w-[85%] w-full"}`}>
                    {hasText && (
                      <div
                        style={{
                          padding: "12px 16px",
                          borderRadius: isUser ? "20px 20px 4px 20px" : "4px 20px 20px 20px",
                          background: isUser
                            ? "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))"
                            : "#FFFFFF",
                          color: isUser ? "#FFFFFF" : "var(--text-primary)",
                          fontSize: 15,
                          lineHeight: 1.45,
                          boxShadow: isUser
                            ? "0 4px 12px color-mix(in srgb, var(--accent-sakura) calc(0.3 * 100%), transparent)"
                            : "0 2px 12px rgba(0,0,0,0.07)",
                          border: isUser ? "none" : "1px solid var(--border-subtle)",
                          marginBottom: hasCard ? 8 : 0,
                        }}
                      >
                        {txt !== null ? (
                          txt
                        ) : (
                          <>
                            <span className="block">{m.jp}</span>
                            <span className="block mt-0.5" style={{ fontSize: 12, opacity: 0.75 }}>
                              {m.en}
                            </span>
                          </>
                        )}
                      </div>
                    )}

                    {m.card === "health" && <HealthCard t={t} />}
                    {m.card === "healthFollowup" && (
                      <FollowupChips t={t} onReport={goReport} onClinic={runFindVet} onAsk={focusInput} />
                    )}
                    {m.card === "emergencyConfirm" && (
                      <EmergencyConfirmCard t={t} onYes={onEmergencyYes} onNo={onEmergencyNo} />
                    )}
                    {m.card === "emergencyAction" && <EmergencyActionCard t={t} />}
                    {m.card === "findVet" && <FindVetCard t={t} onAll={goClinics} />}
                    {m.card === "vaccines" && (
                      <VaccinesCard t={t} onBook={goClinics} onReport={goReport} />
                    )}

                    <div
                      className={`flex items-center gap-1 mt-1 px-1 ${isUser ? "justify-end" : "justify-start"}`}
                      style={{ fontSize: 10, color: "var(--text-placeholder)" }}
                    >
                      <span>{m.time}</span>
                      {isUser && <span style={{ color: "var(--accent-matcha)", fontWeight: 700 }}>✓✓</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {msgs.length <= 1 && (
            <WelcomeState t={t} language={language} onPick={(s) => setInput(s)} />
          )}

          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 items-end">
              <div
                className="shrink-0 overflow-hidden"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--acc-pale), var(--acc-pale))",
                  border: "1.5px solid var(--acc2-soft)",
                }}
              >
                <DogAvatar breed="shiba" size={26} ring={false} showCollar={false} />
              </div>
              <div
                className="flex items-center gap-2"
                style={{
                  padding: "12px 16px",
                  borderRadius: "4px 20px 20px 20px",
                  background: "#FFFFFF",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                }}
              >
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="block rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--accent-fuji)",
                        animation: `typingBounce 1.2s ${i * 0.15}s infinite ease-in-out`,
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontStyle: "italic" }}>
                  {t("考え中...", "Thinking...")}
                </span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* COMPOSER */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-subtle)", padding: "10px 16px" }}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.en}
                  onClick={() => sendChip(q)}
                  className={`shrink-0 flex items-center gap-1.5 transition-transform active:scale-95 ${q.pulse ? "pulse-soft" : ""}`}
                  style={{
                    height: 36,
                    border: `1.5px solid ${q.color}`,
                    background: q.bg,
                    color: q.color,
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "0 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                  }}
                >
                  <Icon size={12} strokeWidth={2.5} />
                  {q.en}
                </button>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderTop: "1px solid var(--border-subtle)",
            padding: "10px 16px 20px",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-2">
            <button
              className="shrink-0 flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--acc-pale)", boxShadow: "0 2px 8px color-mix(in oklab, var(--acc-strong) 15.0%, transparent)" }}
              aria-label="Camera"
            >
              <Camera size={18} color="var(--accent-fuji)" />
            </button>
            <button
              className="shrink-0 flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--acc-pale)", boxShadow: "0 2px 8px color-mix(in oklab, var(--acc-strong) 15.0%, transparent)" }}
              aria-label="Mic"
            >
              <Mic size={18} color="var(--accent-matcha)" />
            </button>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 outline-none"
              style={{
                height: 44,
                background: "var(--bg-page)",
                border: focused ? "1.5px solid var(--accent-fuji)" : "1.5px solid var(--border-card)",
                borderRadius: 20,
                padding: "0 16px",
                fontSize: 14,
                color: "var(--text-primary)",
                boxShadow: focused ? "0 0 0 3px color-mix(in oklab, var(--acc-strong) 10.0%, transparent)" : "none",
                transition: "all 0.2s",
              }}
              placeholder={t("メッセージを入力...", "Type a message...")}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="shrink-0 flex items-center justify-center transition-all active:scale-90"
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: input.trim() ? "linear-gradient(135deg, var(--accent-fuji), var(--acc-strong))" : "var(--text-placeholder)",
                color: "#FFFFFF",
                boxShadow: input.trim() ? "0 4px 12px color-mix(in oklab, var(--acc-strong) 30.0%, transparent)" : "none",
              }}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .pulse-soft { animation: pulseSoft 2s infinite; }
        @keyframes pulseSoft {
          0%, 100% { box-shadow: 0 2px 6px rgba(229,57,53,0.15); }
          50% { box-shadow: 0 2px 14px rgba(229,57,53,0.4); }
        }
        .sos-pulse { animation: sosPulse 1.2s infinite; }
        @keyframes sosPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.6); }
          50% { box-shadow: 0 0 0 10px rgba(229,57,53,0); }
        }
        .em-glow { animation: emGlow 1.6s infinite; }
        @keyframes emGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,57,53,0.35); }
          50% { box-shadow: 0 0 0 6px rgba(229,57,53,0); }
        }
        .overdue-pulse { animation: overduePulse 1.6s infinite; }
        @keyframes overduePulse {
          0%, 100% { background: var(--acc-pale); }
          50% { background: var(--acc-pale); }
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </AppShell>
  );
}

function WelcomeState({
  t,
  language,
  onPick,
}: {
  t: (jp: string, en: string) => string;
  language: string;
  onPick: (s: string) => void;
}) {
  return (
    <div className="flex flex-col items-center text-center pt-4 pb-4">
      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 10 }}>
        {t("クイック質問", "Quick questions")}
      </div>
      <div className="w-full space-y-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onPick(s.en)}
            className="w-full text-left transition-transform active:scale-[0.98]"
            style={{
              background: "#FFFFFF",
              borderRadius: 20,
              padding: "12px 16px",
              boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
            }}
          >
            {s.en}
          </button>
        ))}
      </div>
    </div>
  );
}

// ========== Action Cards ==========

function EmergencyConfirmCard({
  t,
  onYes,
  onNo,
}: {
  t: (jp: string, en: string) => string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div
      className="w-full em-glow"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E53935",
        borderRadius: 20,
        padding: 16,
        boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} color="#E53935" strokeWidth={2.5} />
        <span style={{ fontSize: 13, fontWeight: 800, color: "#E53935" }}>
          {t("緊急サポート", "Emergency Support")}
        </span>
      </div>
      <div style={{ fontSize: 13, color: "var(--text-primary)", marginBottom: 12, lineHeight: 1.5 }}>
        {t("SOSボタンを起動しますか？", "Do you want to activate SOS?")}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onYes}
          className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          style={{
            flex: "0 0 60%",
            height: 44,
            background: "#E53935",
            color: "#FFFFFF",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(229,57,53,0.35)",
          }}
        >
          <Check size={16} strokeWidth={3} />
          {t("はい、SOS", "YES, SOS")}
        </button>
        <button
          onClick={onNo}
          className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          style={{
            flex: 1,
            height: 44,
            background: "var(--bg-elevated)",
            color: "var(--text-secondary)",
            borderRadius: 12,
            fontSize: 14,
          }}
        >
          <X size={16} />
          {t("いいえ", "No")}
        </button>
      </div>
    </div>
  );
}

function EmergencyActionCard({ t }: { t: (jp: string, en: string) => string }) {
  const c = NEARBY_CLINICS.find((x) => x.em) ?? NEARBY_CLINICS[0];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.en)}`;
  return (
    <div
      className="w-full"
      style={{
        background: "#FFFFFF",
        border: "1.5px solid #E53935",
        borderRadius: 20,
        padding: 14,
        boxShadow: "0 4px 16px rgba(229,57,53,0.15)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Phone size={16} color="#E53935" strokeWidth={2.5} />
        <span style={{ fontSize: 12, fontWeight: 800, color: "#E53935", letterSpacing: "0.05em" }}>
          {t("緊急連絡", "EMERGENCY CALL")}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
        {t("最寄りの24時間動物病院", "Nearest 24H Veterinary Hospital")}
      </div>
      <div
        style={{
          background: "var(--bg-page)",
          borderRadius: 12,
          padding: 10,
          marginBottom: 10,
          border: "1px solid var(--acc-pale)",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{t(c.jp, c.en)}</div>
        <div className="flex items-center gap-2 mt-1" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          <span className="flex items-center gap-0.5">
            <Star size={10} fill="var(--accent-yuzu)" color="var(--accent-yuzu)" />
            {c.rating}
          </span>
          <span>·</span>
          <span>{c.km}km</span>
          <span>·</span>
          <span style={{ color: "#E53935", fontWeight: 700 }}>Open 24H</span>
        </div>
      </div>
      <div className="flex gap-2">
        <a
          href={`tel:${c.phone}`}
          className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          style={{
            flex: 1,
            height: 44,
            background: "#E53935",
            color: "#FFFFFF",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 12px rgba(229,57,53,0.35)",
          }}
        >
          <Phone size={14} />
          {t("今すぐ電話", "Call Now")}
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
          style={{
            flex: 1,
            height: 44,
            background: "var(--acc-pale)",
            color: "#E53935",
            border: "1.5px solid #E53935",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <Navigation size={14} />
          {t("道案内", "Directions")}
        </a>
      </div>
    </div>
  );
}

function FindVetCard({ t, onAll }: { t: (jp: string, en: string) => string; onAll: () => void }) {
  const { vets, loading } = useNearbyVets();
  const list = vets.slice(0, 3);
  return (
    <div
      className="w-full"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        borderRadius: 20,
        padding: 14,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <MapPin size={16} color="var(--accent-sora)" strokeWidth={2.5} />
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-sora)", letterSpacing: "0.05em" }}>
          {t("近くのクリニック", "NEARBY CLINICS")}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>
        {loading
          ? t("検索中…", "Searching near your location…")
          : t("近くのクリニック", `${vets.length} clinics found near you`)}
      </div>
      <div className="space-y-1.5 mb-3">
        {!loading && list.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {t("結果がありません。", "No clinics found yet — allow location access to search around you.")}
          </div>
        )}
        {list.map((c, i) => {
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lon}`;
          return (
            <a
              key={i}
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 active:scale-[0.99] transition-transform"
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                padding: "8px 10px",
                border: "1px solid var(--acc-pale)",
              }}
            >
              <Star size={11} fill="var(--accent-yuzu)" color="var(--accent-yuzu)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", flex: 1 }}>{t(c.jp, c.en)}</span>
              <span style={{ fontSize: 12, color: "var(--accent-sora)", fontWeight: 600 }}>{c.km.toFixed(1)}km</span>
              <ChevronRight size={14} color="var(--accent-sora)" />
            </a>
          );
        })}
      </div>
      <button
        onClick={onAll}
        className="w-full flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        style={{
          height: 44,
          background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))",
          color: "#FFFFFF",
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 700,
          boxShadow: "0 4px 12px color-mix(in oklab, var(--accent-sakura) 35%, transparent)",
        }}
      >
        <MapPin size={14} />
        {t("クリニック一覧を見る", "View All Clinics")} →
      </button>
    </div>
  );
}

function VaccinesCard({
  t,
  onBook,
  onReport,
}: {
  t: (jp: string, en: string) => string;
  onBook: () => void;
  onReport: () => void;
}) {
  return (
    <div
      className="w-full"
      style={{
        background: "#FFFFFF",
        boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        borderRadius: 20,
        overflow: "hidden",
      }}
    >
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <Syringe size={16} color="var(--accent-sakura)" strokeWidth={2.5} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--accent-sakura)", letterSpacing: "0.05em" }}>
            {t("ワクチン記録", "VACCINE RECORDS")}
          </span>
        </div>
        <div className="space-y-1.5 mb-3">
          {VACCINE_RECORDS.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {t("記録はまだありません。", "No vaccination records saved yet.")}
            </div>
          )}
          {VACCINE_RECORDS.map((v, i) => {
            const overdue = v.status === "overdue";
            return (
              <div
                key={i}
                className={overdue ? "overdue-pulse" : ""}
                style={{
                  borderRadius: 10,
                  padding: "8px 10px",
                  background: overdue ? "var(--acc-pale)" : "var(--bg-elevated)",
                  border: `1px solid ${overdue ? "var(--acc-pale)" : "var(--border-subtle)"}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {overdue ? (
                      <AlertTriangle size={12} color="#E53935" />
                    ) : (
                      <Check size={12} color="var(--accent-matcha)" strokeWidth={3} />
                    )}
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{t(v.jp, v.en)}</span>
                  </div>
                  {overdue ? (
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#E53935" }}>
                      {t("期限切れ", "OVERDUE")}
                    </span>
                  ) : null}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2, paddingLeft: 18 }}>
                  {overdue
                    ? t("すぐに接種が必要です", "Vaccination needed soon")
                    : `${t("次回", "Next")}: ${v.next}`}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onBook}
            className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{
              flex: 1,
              height: 42,
              background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))",
              color: "#FFFFFF",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 4px 10px color-mix(in oklab, var(--accent-sakura) 35%, transparent)",
            }}
          >
            <Calendar size={13} />
            {t("予約する", "Book")}
          </button>
          <button
            onClick={onReport}
            className="flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{
              flex: 1,
              height: 42,
              background: "var(--accent-sakura-soft)",
              color: "var(--accent-sakura)",
              border: "1px solid var(--acc-pale)",
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <FileHeart size={13} />
            {t("全記録", "Full Report")} →
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowupChips({
  t,
  onReport,
  onClinic,
  onAsk,
}: {
  t: (jp: string, en: string) => string;
  onReport: () => void;
  onClinic: () => void;
  onAsk: () => void;
}) {
  const chips = [
    { jp: " 詳細レポート", en: " Full Report", color: "var(--accent-fuji)", bg: "var(--acc-pale)", onClick: onReport },
    { jp: " クリニック", en: " Find Clinic", color: "var(--accent-sora)", bg: "var(--acc2-pale)", onClick: onClinic },
    { jp: " 質問する", en: " Ask Question", color: "var(--accent-sakura)", bg: "var(--accent-sakura-soft)", onClick: onAsk },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((c, i) => (
        <button
          key={i}
          onClick={c.onClick}
          className="active:scale-95 transition-transform"
          style={{
            background: c.bg,
            color: c.color,
            fontSize: 11,
            fontWeight: 700,
            padding: "6px 12px",
            borderRadius: 16,
            border: `1px solid ${c.color}40`,
          }}
        >
          {t(c.jp, c.en)}
        </button>
      ))}
    </div>
  );
}

function HealthCard({ t }: { t: (jp: string, en: string) => string }) {
  const { live, receiving } = useCollar();
  const activeSensors = [live.temp, live.humidity, live.motion].filter(Boolean).length;
  const score = receiving ? Math.round((activeSensors / 3) * 100) : null;
  const fmt = (k: keyof typeof live) => {
    const r = live[k];
    return r ? `${r.value}${r.unit ?? ""}` : "—";
  };
  const metrics = [
    { jp: "体温", en: "Temp", value: fmt("temp"), pct: live.temp ? 100 : 0, color: "var(--acc-strong)", bg: "var(--acc-pale)", Icon: Thermometer },
    { jp: "湿度", en: "Humidity", value: fmt("humidity"), pct: live.humidity ? 100 : 0, color: "var(--accent-matcha)", bg: "var(--acc-pale)", Icon: Droplets },
    { jp: "運動", en: "Activity", value: fmt("motion"), pct: live.motion ? 100 : 0, color: "var(--accent-sora)", bg: "var(--acc2-pale)", Icon: Activity },
    { jp: "圧力", en: "Pressure", value: fmt("pressure"), pct: live.pressure ? 100 : 0, color: "var(--accent-fuji)", bg: "var(--acc-pale)", Icon: Moon },
    { jp: "光", en: "Light", value: fmt("light"), pct: live.light ? 100 : 0, color: "var(--accent-yuzu)", bg: "var(--acc-pale)", Icon: UtensilsCrossed },
  ];

  const points = [22, 18, 20, 14, 16, 10, 8];
  const path = points.map((y, i) => `${i === 0 ? "M" : "L"} ${i * 10} ${y}`).join(" ");

  return (
    <div
      className="w-full"
      style={{
        background: "#FFFFFF",
        borderRadius: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid var(--border-subtle)",
        overflow: "hidden",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <Activity size={16} color="var(--accent-fuji)" strokeWidth={2.5} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, letterSpacing: "0.08em" }}>
            {t("健康スコア", "HEALTH SCORE")}
          </span>
        </div>
        <span
          style={{
            background: "var(--acc-pale)",
            border: "1px solid var(--acc2-soft)",
            color: "var(--accent-matcha)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          {receiving ? `✓ ${t("受信中", "Live")}` : t("データなし", "No data")}
        </span>
      </div>
      <div className="flex items-end justify-between px-4 pb-3">
        <div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.02em" }}>
            {score ?? "—"}
            {score != null && <span style={{ fontSize: 18, color: "var(--text-secondary)", fontWeight: 600 }}>/100</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--accent-matcha)", marginTop: 2 }}>
            {score == null
              ? t("首輪が未接続です", "Collar not connected")
              : t("センサー受信中", `${activeSensors} of 5 sensors reporting`)}
          </div>
        </div>
        <svg width="60" height="30" viewBox="0 -2 65 30" fill="none">
          <path d={path} stroke="var(--accent-matcha)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="60" cy="8" r="2.5" fill="var(--accent-matcha)" />
        </svg>
      </div>
      <div style={{ height: 1, background: "var(--bg-elevated)" }} />
      <div className="grid grid-cols-2 gap-2 p-3">
        {metrics.map((m, i) => {
          const Icon = m.Icon;
          return (
            <div
              key={i}
              style={{
                background: m.bg,
                borderRadius: 12,
                padding: 10,
                height: 70,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={14} color={m.color} strokeWidth={2.5} />
                <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{t(m.jp, m.en)}</span>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{m.value}</div>
                <div
                  className="relative w-full overflow-hidden"
                  style={{ height: 4, borderRadius: 2, background: "rgba(0,0,0,0.08)", marginTop: 4 }}
                >
                  <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 2 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Link
        to="/report"
        className="flex items-center justify-center gap-1.5 w-full transition-opacity active:opacity-90"
        style={{
          background: "linear-gradient(135deg, var(--accent-fuji), var(--acc-strong))",
          color: "#FFFFFF",
          height: 40,
          fontSize: 13,
          fontWeight: 700,
          borderRadius: "0 0 20px 20px",
        }}
      >
        <FileHeart size={14} />
        {t("フルレポートを見る", "View Full Report")} →
      </Link>
    </div>
  );
}

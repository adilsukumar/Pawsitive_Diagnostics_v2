import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Edit3, Check } from "lucide-react";
import { BREEDS } from "@/lib/mock";
import { useT, useLanguage } from "@/context/LanguageContext";
import { usePet } from "@/context/PetContext";
import { PrimaryButton } from "@/components/PrimaryButton";
import DogAvatar, { BREED_KEY_BY_JP, type BreedKey, type EarStyle, type EyeStyle } from "@/components/DogAvatar";
import PhoneFrame from "@/components/PhoneFrame";

export const Route = createFileRoute("/onboarding/avatar")({ component: Step1 });

const FUR: { c: string; jp: string; en: string }[] = [
  { c: "var(--acc-deep)", jp: "茶色", en: "Brown" },
  { c: "var(--acc-soft)", jp: "クリーム", en: "Cream" },
  { c: "var(--acc2-pale)", jp: "白", en: "White" },
  { c: "var(--acc-deep)", jp: "黒", en: "Black" },
  { c: "var(--acc-strong)", jp: "グレー", en: "Gray" },
  { c: "var(--accent-yuzu)", jp: "ゴールド", en: "Gold" },
];
const COLLAR = ["var(--accent-sakura)", "var(--accent-fuji)", "var(--accent-matcha)", "var(--accent-sora)", "var(--accent-yuzu)", "#E53935"];
const EARS: { id: EarStyle; jp: string; en: string }[] = [
  { id: "upright", jp: "立ち耳", en: "Upright" },
  { id: "floppy", jp: "垂れ耳", en: "Floppy" },
  { id: "round", jp: "丸耳", en: "Round" },
];
const EYES: { id: EyeStyle; glyph: string; jp: string; en: string }[] = [
  { id: "round", glyph: "◉◉", jp: "まんまる", en: "Round" },
  { id: "happy", glyph: "◡◡", jp: "ニコニコ", en: "Happy" },
  { id: "sparkle", glyph: "✦✦", jp: "キラキラ", en: "Sparkle" },
  { id: "soft", glyph: "◔◔", jp: "やさしい", en: "Soft" },
];

function Step1() {
  const nav = useNavigate();
  const t = useT();
  const { language } = useLanguage();
  const { pet, updatePet, updateAvatar } = usePet();
  const [breedJp, setBreedJp] = useState(pet.breedJp || "柴犬");
  const [fur, setFur] = useState<string | undefined>(pet.avatar.furColor);
  const [ear, setEar] = useState<EarStyle | undefined>(pet.avatar.earStyle as EarStyle | undefined);
  const [eye, setEye] = useState<EyeStyle>((pet.avatar.eyeStyle as EyeStyle) || "round");
  const [collar, setCollar] = useState(pet.avatar.collarColor || COLLAR[0]);

  const breedKey: BreedKey = BREED_KEY_BY_JP[breedJp] ?? "mixed";

  const selectBreed = (jp: string) => {
    setBreedJp(jp);
    const b = BREEDS.find((x) => x.jp === jp);
    updatePet({
      breedJp: jp,
      breedEn: b?.en ?? jp,
      breed: BREED_KEY_BY_JP[jp] ?? "mixed",
    });
  };
  const selectFur = (c: string) => { setFur(c); updateAvatar({ furColor: c }); };
  const selectEar = (e: EarStyle) => { setEar(e); updateAvatar({ earStyle: e }); };
  const selectEye = (e: EyeStyle) => { setEye(e); updateAvatar({ eyeStyle: e }); };
  const selectCollar = (c: string) => { setCollar(c); updateAvatar({ collarColor: c }); };

  const breedLabel = (jp: string, en: string) =>
    en;

  return (
    <PhoneFrame>
    <div className="min-h-screen pb-32" style={{ background: "var(--bg-page)" }}>
      <div className="px-6 pt-4">
        <TopBar to="/onboarding/dog" />
        <Stepper current={2} path={pet.path} />

        <h1 className="text-[20px] font-bold text-center mt-2" style={{ color: "var(--text-primary)" }}>
          {t("あなたのワンちゃんを作ろう！", "Create Your Pet's Avatar")}
        </h1>

        {/* Avatar preview */}
        <div className="flex flex-col items-center mt-5">
          <DogAvatar
            breed={breedKey}
            furColor={fur}
            earStyle={ear}
            eyeStyle={eye}
            collarColor={collar}
            size={160}
            onTap={() => {}}
          />
          <button className="mt-2 flex items-center gap-1 text-[11px]" style={{ color: "var(--text-placeholder)" }}>
            <Edit3 className="w-3 h-3" />
            {t("タップしてカスタマイズ", "Tap to customize")}
          </button>
        </div>

        {/* Breed selector */}
        <Section title={t("犬種を選ぶ", "Choose Breed")} />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-2 pt-1 mt-2 snap-x">
          {BREEDS.map((b) => {
            const sel = breedJp === b.jp;
            const key = BREED_KEY_BY_JP[b.jp] ?? "mixed";
            return (
              <button
                key={b.jp}
                onClick={() => selectBreed(b.jp)}
                className="shrink-0 flex flex-col items-center justify-start snap-start transition-all px-1.5 pt-2 pb-2"
                style={{
                  width: 80, height: 110,
                  borderRadius: 18,
                  background: sel ? "linear-gradient(135deg, var(--accent-sakura-soft), var(--bg-card))" : "#FFFFFF",
                  border: sel ? "2px solid var(--accent-sakura)" : "2px solid transparent",
                  boxShadow: sel ? "0 4px 16px color-mix(in srgb, var(--accent-sakura) calc(0.2 * 100%), transparent)" : "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <DogAvatar breed={key} size={42} ring={false} showCollar={false} showCheeks={false} />
                <span
                  className="font-bold mt-1 text-center leading-tight"
                  style={{ color: "var(--text-primary)", fontSize: b.jp.length > 8 ? 9 : 11 }}
                >
                  {b.en}
                </span>
              </button>
            );
          })}
        </div>

        {/* Customize panel */}
        <div
          className="mt-5 p-5 rounded-3xl"
          style={{ background: "#FFFFFF", boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
        >
          <h3 className="text-[14px] font-semibold" style={{ color: "var(--text-primary)" }}>
            {t("カスタマイズ", "Customize")}
          </h3>

          <Section title={t("毛色", "Fur Colour")} small />
          <div className="flex flex-wrap gap-3 mt-2">
            {FUR.map((f) => (
              <div key={f.c} className="flex flex-col items-center" style={{ width: 44 }}>
                <Swatch color={f.c} selected={fur === f.c} onClick={() => selectFur(f.c)} />
                <span className="text-[8px] mt-1 text-center leading-tight" style={{ color: "var(--text-secondary)" }}>
                  {breedLabel(f.jp, f.en)}
                </span>
              </div>
            ))}
          </div>

          <Section title={t("耳", "Ears")} small />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {EARS.map((e) => {
              const sel = ear === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => selectEar(e.id)}
                  className="h-12 rounded-xl text-[12px] font-medium transition-all"
                  style={{
                    background: sel ? "var(--accent-sakura-soft)" : "var(--bg-page)",
                    border: sel ? "1.5px solid var(--accent-sakura)" : "1.5px solid var(--border-card)",
                    color: sel ? "var(--accent-sakura)" : "var(--text-primary)",
                  }}
                >
                  {e.en}
                </button>
              );
            })}
          </div>

          <Section title={t("目", "Eyes")} small />
          <div className="grid grid-cols-4 gap-2 mt-2">
            {EYES.map((e) => {
              const sel = eye === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => selectEye(e.id)}
                  className="h-12 rounded-xl text-[14px] font-bold transition-all"
                  style={{
                    background: sel ? "var(--accent-sakura-soft)" : "var(--bg-page)",
                    border: sel ? "1.5px solid var(--accent-sakura)" : "1.5px solid var(--border-card)",
                    color: sel ? "var(--accent-sakura)" : "var(--text-primary)",
                  }}
                  aria-label={e.en}
                >
                  {e.glyph}
                </button>
              );
            })}
          </div>

          <Section title={t("カラーの色", "Collar Colour")} small />
          <div className="flex gap-3 mt-2">
            {COLLAR.map((c) => (
              <Swatch key={c} color={c} selected={collar === c} onClick={() => selectCollar(c)} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 inset-x-0 mx-auto p-4" style={{ maxWidth: 430, background: "linear-gradient(to top, var(--bg-page), color-mix(in oklab, var(--acc-soft) 90.0%, transparent) 70%, transparent)" }}>
        <p className="text-center text-[11px] mb-2" style={{ color: "var(--text-placeholder)" }}>
          {t("あとで変更できます", "You can change this later")}
        </p>
        <PrimaryButton onClick={() => { updatePet({ path: "B" }); nav({ to: "/onboarding/owner" }); }}>
           {t("次へ", "Next")} →
        </PrimaryButton>
      </div>
    </div>
    </PhoneFrame>
  );
}

/* ──────────────────────── Shared onboarding bits ──────────────────────── */

export function TopBar({ to = "/onboarding/welcome" }: { to?: string } = {}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <Link
        to={to}
        className="flex items-center justify-center"
        style={{
          width: 36, height: 36, borderRadius: 999,
          background: "var(--accent-sakura-soft)", color: "var(--accent-sakura)",
          boxShadow: "0 1px 4px color-mix(in oklab, var(--acc-strong) 15.0%, transparent)",
        }}
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>
      <span style={{ width: 36, height: 36 }} />
    </div>
  );
}

export function Stepper({ current, path }: { current: 1 | 2 | 3 | 4; path?: "A" | "B" | null }) {
  const t = useT();
  const labels = [
    t("アートアバターを作る", "Create Your Art Avatar"),
    t("アバターをカスタマイズ", "Customise Avatar"),
    t("ポーズパック", "Pose Pack"),
    t("犬の詳細", "Pet Details"),
  ];
  return (
    <div className="mb-3">
      <div className="flex items-center justify-center gap-0">
        {[1, 2, 3, 4].map((n, i) => {
          const completed = n < current;
          const active = n === current;
          const bg = completed ? "var(--acc2-soft)" : active ? "var(--accent-sakura)" : "var(--border-card)";
          const color = completed || active ? "#FFFFFF" : "var(--text-placeholder)";
          return (
            <div key={n} className="flex items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all relative"
                style={{
                  background: bg,
                  color,
                  border: "none",
                  boxShadow: active ? "0 0 0 4px color-mix(in oklab, var(--acc-strong) 18.0%, transparent)" : "none",
                }}
              >
                {completed ? <Check className="w-4 h-4" strokeWidth={3} /> : n}
              </div>
              {i < 3 && (
                <div
                  className="w-7 h-[2px]"
                  style={{
                    background: n < current ? "var(--acc2-soft)" : "var(--border-card)",
                  }}
                />
              )}
            </div>
          );
        })}

      </div>
      <p className="text-[12px] text-center mt-2" style={{ color: "var(--text-secondary)" }}>
        {t(`ステップ ${current} / 4`, `Step ${current} of 4`)} · {labels[current - 1]}
      </p>
    </div>
  );
}

function Section({ title, small }: { title: string; small?: boolean }) {
  return (
    <h3 className={`font-semibold ${small ? "text-[12px] mt-4" : "text-[13px] mt-6"}`} style={{ color: "var(--text-primary)" }}>
      {title}
    </h3>
  );
}

function Swatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full transition-all"
      style={{
        background: color,
        boxShadow: selected
          ? `0 0 0 3px #FFFFFF, 0 0 0 5px color-mix(in srgb, var(--accent-sakura) calc(0.5 * 100%), transparent)`
          : "0 1px 3px rgba(0,0,0,0.12)",
      }}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";
import AppShell from "@/components/AppShell";
import { usePet } from "@/context/PetContext";
import { useEffect, useMemo, useState, useRef } from "react";
import {
  PenLine,
  ArrowUp,
  MessageCircle,
  Share2,
  Bookmark,
  Flame,
  PawPrint,
  FileText,
  Users as UsersIcon,
  X,
  Camera,
  Image as ImageIcon,
  MapPin,
  Send,
  Link as LinkIcon,
  ShieldCheck,
  Syringe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/context/LanguageContext";
import { PetMatchSection } from "@/components/petmatch/PetMatch";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({ component: Community });

// ── Flair → colour theme ───────────────────────────────────────
type Theme = {
  key: string;
  jp: string;
  en: string;
  accent: string;
  soft: string;
  ring: string;
  gradFrom: string;
  gradTo: string;
  emoji: string;
};

const FLAIR_THEMES: Record<string, Theme> = {
  健康: { key: "健康", jp: "健康", en: "Health", accent: "var(--accent-matcha)", soft: "var(--acc-pale)", ring: "var(--acc2-soft)", gradFrom: "var(--accent-matcha)", gradTo: "var(--acc2-soft)", emoji: "" },
  "獣医Q&A": { key: "獣医Q&A", jp: "獣医Q&A", en: "Vet Q&A", accent: "var(--accent-sora)", soft: "var(--acc2-pale)", ring: "var(--acc2-soft)", gradFrom: "var(--accent-sora)", gradTo: "var(--acc-strong)", emoji: "" },
  迷子: { key: "迷子", jp: "迷子", en: "Lost", accent: "var(--accent-yuzu)", soft: "var(--acc-pale)", ring: "var(--acc-soft)", gradFrom: "var(--accent-yuzu)", gradTo: "var(--acc-strong)", emoji: "" },
  日常: { key: "日常", jp: "日常", en: "Daily", accent: "var(--accent-sakura)", soft: "var(--accent-sakura-soft)", ring: "var(--acc-pale)", gradFrom: "var(--accent-sakura)", gradTo: "var(--acc2-soft)", emoji: "" },
  しつけ: { key: "しつけ", jp: "しつけ", en: "Training", accent: "var(--accent-fuji)", soft: "var(--acc-pale)", ring: "var(--acc-pale)", gradFrom: "var(--accent-fuji)", gradTo: "var(--acc-strong)", emoji: "" },
};

function themeFor(flair: string): Theme {
  return FLAIR_THEMES[flair] ?? FLAIR_THEMES["日常"];
}

// ── Categories ────────────────────────────────────────────────
type Cat = { jp: string; en: string; emoji: string; accent: string; soft: string; gradFrom?: string; gradTo?: string };
const CATS: Cat[] = [
  { jp: "すべて", en: "All", emoji: "", accent: "#FFFFFF", soft: "linear-gradient(135deg,var(--accent-sakura),var(--accent-sakura-dark))", gradFrom: "var(--accent-sakura)", gradTo: "var(--accent-sakura-dark)" },
  { jp: "Indie Club", en: "Indie Club", emoji: "", accent: "var(--accent-sakura)", soft: "var(--accent-sakura-soft)" },
  { jp: "Labrador Club", en: "Labrador Club", emoji: "", accent: "var(--accent-fuji)", soft: "var(--acc-pale)" },
  { jp: "迷子情報", en: "Lost Pets", emoji: "", accent: "var(--accent-yuzu)", soft: "var(--acc-pale)" },
  { jp: "獣医Q&A", en: "Vet Q&A", emoji: "", accent: "var(--accent-matcha)", soft: "var(--acc-pale)" },
  { jp: "Mumbai", en: "Mumbai", emoji: "", accent: "var(--accent-sora)", soft: "var(--acc2-pale)" },
  { jp: "Delhi", en: "Delhi", emoji: "", accent: "var(--accent-sakura)", soft: "var(--accent-sakura-soft)" },
];

// Predicate for a post given a category index
function matchesCat(p: PostT, idx: number): boolean {
  switch (idx) {
    case 0: return true;
    case 1: return p.breed.toLowerCase().includes("pariah") || p.breed.toLowerCase().includes("indie");
    case 2: return p.breed.toLowerCase().includes("labrador");
    case 3: return p.flair === "迷子";
    case 4: return p.flair === "獣医Q&A";
    case 5: return (p.location ?? "").toLowerCase().includes("mumbai");
    case 6: return (p.location ?? "").toLowerCase().includes("delhi");
    default: return true;
  }
}

// ── Username → avatar colour ──────────────────────────────────
function avatarPalette(name: string) {
  const c = (name?.trim()?.[0] ?? "A").toUpperCase().charCodeAt(0);
  if (c >= 65 && c <= 68) return { bg: "var(--bg-card-sakura)", fg: "var(--acc2-strong)" };
  if (c >= 69 && c <= 72) return { bg: "var(--bg-card-lavender)", fg: "var(--acc-strong)" };
  if (c >= 73 && c <= 76) return { bg: "var(--acc-pale)", fg: "var(--acc-deep)" };
  if (c >= 77 && c <= 80) return { bg: "var(--acc-pale)", fg: "var(--acc-deep)" };
  if (c >= 81 && c <= 84) return { bg: "var(--acc2-soft)", fg: "var(--acc2-deep)" };
  if (c >= 85 && c <= 90) return { bg: "var(--acc-pale)", fg: "var(--acc-deep)" };
  const palettes = [
    { bg: "var(--bg-card-sakura)", fg: "var(--acc2-strong)" },
    { bg: "var(--bg-card-lavender)", fg: "var(--acc-strong)" },
    { bg: "var(--acc-pale)", fg: "var(--acc-deep)" },
    { bg: "var(--acc-pale)", fg: "var(--acc-deep)" },
    { bg: "var(--acc2-soft)", fg: "var(--acc2-deep)" },
    { bg: "var(--acc-pale)", fg: "var(--acc-deep)" },
  ];
  return palettes[c % palettes.length];
}

const BREED_EMOJI: Record<string, string> = {
  "Shiba Inu": "", "Toy Poodle": "", "Chihuahua": "", "Pomeranian": "",
  "Golden Retriever": "", "Mini Dachshund": "",
  "French Bulldog": "", "Yorkshire Terrier": "", "Mixed Breed": "",
};

// ── Post / Comment data shapes ────────────────────────────────
type PostT = {
  id: string;
  user: string;
  breed: string;
  time: string;
  titleJp: string;
  titleEn: string;
  body?: string;
  flair: string;
  up: number;
  com: number;
  images?: string[];
  location?: string;
  isNew?: boolean;
};

type CommentT = {
  id: string;
  user: string;
  time: string;
  text: string;
  up: number;
};

// Tags available for posting
const TAGS: { key: string; jp: string; en: string }[] = [
  { key: "健康", jp: "健康", en: "Health" },
  { key: "日常", jp: "日常", en: "Daily" },
  { key: "迷子", jp: "迷子", en: "Lost" },
  { key: "獣医Q&A", jp: "獣医Q&A", en: "VetQA" },
  { key: "しつけ", jp: "しつけ", en: "Tips" },
];

// Current logged-in user (mock)
const ME = { user: "You", userEn: "You", breed: "Shiba Inu" };

// Dog-only community feed.
const DOG_POSTS: PostT[] = [
    { id: "1", user: "Priya & Bruno", breed: "Indian Pariah Dog", time: "3h ago", titleJp: "My Indie's temp seems high", titleEn: "My Indie's temp seems high", flair: "健康", up: 47, com: 12, location: "Bandra, Mumbai" },
    { id: "2", user: "Mumbai Animal Lover", breed: "Indian Spitz", time: "5h ago", titleJp: "Recommended vet in Mumbai?", titleEn: "Recommended vet in Mumbai?", flair: "獣医Q&A", up: 23, com: 34, location: "Andheri, Mumbai" },
    { id: "3", user: "Arjun's Pack", breed: "Labrador Retriever", time: "Yesterday", titleJp: "Our daily walk routine at Marine Drive", titleEn: "Our daily walk routine at Marine Drive", flair: "日常", up: 89, com: 6, location: "Marine Drive, Mumbai" },
    { id: "4", user: "Lost Pet Support", breed: "Mixed Breed", time: "2h ago", titleJp: "Did you see a black Indie near Bandra station?", titleEn: "Did you see a black Indie near Bandra station?", flair: "迷子", up: 156, com: 28, location: "Bandra, Mumbai" },
];

function Community() {
  const t = useT();
  
  const { pet } = usePet();
  const myBreed = pet?.breedEn || "Indian Pariah Dog";
  const [sub, setSub] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [upvoted, setUpvoted] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [burst, setBurst] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostT[]>(() => DOG_POSTS);
  const [composeOpen, setComposeOpen] = useState(false);
  const [shareFor, setShareFor] = useState<string | null>(null);

  // Comments per post id
  const [commentsByPost, setCommentsByPost] = useState<Record<string, CommentT[]>>(() => ({
    "1": [
      { id: "c1", user: "Priya & Bruno", time: "2h ago", text: "Mine had the same thing! The vet said she had a fever.", up: 8 },
      { id: "c2", user: "Mumbai Animal Lover", time: "1h ago", text: "Please take him to the vet right away!", up: 12 },
    ],
  }));

  const post = posts.find((p) => p.id === open) ?? null;
  const trending = useMemo(() => posts.slice().sort((a, b) => b.up - a.up).slice(0, 4), [posts]);
  const filtered = useMemo(() => posts.filter((p) => matchesCat(p, sub)), [posts, sub]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [trendingAll, setTrendingAll] = useState(false);

  function toggleUpvote(id: string) {
    setUpvoted((u) => ({ ...u, [id]: !u[id] }));
    setBurst(id);
    setTimeout(() => setBurst(null), 600);
  }

  function toggleBookmark(id: string) {
    setBookmarked((b) => {
      const next = { ...b, [id]: !b[id] };
      if (next[id]) toast(t("保存しました", "Saved to bookmarks"), { duration: 1500 });
      return next;
    });
  }

  async function sharePost(p: PostT) {
    const title = p.titleEn;
    const text = `${title} — Pawsitive Diagnostics Community`;
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title, text, url: typeof window !== "undefined" ? window.location.href : "" });
        return;
      } catch {
        /* user cancelled — fall through */
        return;
      }
    }
    setShareFor(p.id);
  }

  function addPost(data: { titleJp: string; titleEn: string; body: string; flair: string; images: string[]; location: string }) {
    const newPost: PostT = {
      id: `n-${Date.now()}`,
      user: ME.user,
      breed: myBreed,
      time: t("たった今", "Just now"),
      titleJp: data.titleJp,
      titleEn: data.titleEn || data.titleJp,
      body: data.body,
      flair: data.flair,
      up: 0,
      com: 0,
      images: data.images,
      location: data.location || undefined,
      isNew: true,
    };
    setPosts((arr) => [newPost, ...arr]);
    setComposeOpen(false);
    toast(t("投稿しました！", "Post published!"), {
      duration: 2500,
          style: { background: "var(--text-primary)", color: "var(--primary-foreground)", border: "none" },
    });
  }

  function addComment(postId: string, text: string) {
    const c: CommentT = { id: `c-${Date.now()}`, user: ME.user, time: t("たった今", "Just now"), text, up: 0 };
    setCommentsByPost((m) => ({ ...m, [postId]: [...(m[postId] ?? []), c] }));
    setPosts((arr) => arr.map((p) => (p.id === postId ? { ...p, com: p.com + 1 } : p)));
  }

  return (
    <AppShell noPadding>
      {/* ── Pet Match (signature feature) ────────────────────── */}
      <PetMatchSection />

      {/* ── Dog community header ──────────────────────────────── */}
      <div style={{ margin: "24px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
        <PawPrint size={20} style={{ color: "var(--acc-strong)" }} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
             Dog Community
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
             {t("犬の飼い主さんの投稿", "Posts from fellow dog owners")}
          </div>
        </div>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────── */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 24,
          border: "1px solid var(--border-card)",
          margin: "32px 16px 8px",
          padding: "12px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
          alignItems: "center",
        }}
      >
        {[
          { icon: <UsersIcon size={14} style={{ color: "var(--accent-sakura)" }} />, n: "1,648", jp: "メンバー", en: "Members" },
          { icon: <FileText size={14} style={{ color: "var(--accent-fuji)" }} />, n: "3,420", jp: "投稿", en: "Posts" },
          { icon: <PawPrint size={14} style={{ color: "var(--accent-matcha)" }} />, n: "892", jp: "ワンちゃん", en: "Pets" },
        ].map((s, i, arr) => (
          <span key={s.en} style={{ display: "contents" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {s.icon}
                <span style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }} className="tabular-nums">{s.n}</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{t(s.jp, s.en)}</div>
            </div>
            {i < arr.length - 1 && <div style={{ width: 1, height: 28, background: "var(--border-subtle)" }} />}
          </span>
        ))}
      </div>

      {/* ── Category chips ────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ padding: "12px 16px", scrollSnapType: "x mandatory" }}>
        {CATS.map((c, i) => {
          const active = sub === i;
          const style: React.CSSProperties = active
            ? { background: "linear-gradient(135deg, var(--accent-sakura), var(--accent-sakura-dark))", color: "var(--primary-foreground)", border: "1.5px solid transparent", boxShadow: "0 4px 12px color-mix(in srgb, var(--accent-sakura) calc(0.35 * 100%), transparent)" }
            : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1.5px solid var(--border-card)", boxShadow: "0 2px 6px rgba(22,62,56,0.05)" };
          return (
            <button
              key={c.en}
              onClick={() => setSub(i)}
              className="shrink-0 flex items-center gap-1.5"
              style={{
                ...style,
                borderRadius: 20,
                padding: "8px 14px",
                height: 36,
                fontSize: 13,
                fontWeight: 600,
                scrollSnapAlign: "start",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: 14 }}>{c.emoji}</span>
              <span>{t(c.jp, c.en)}</span>
            </button>
          );
        })}
      </div>

      {/* ── Trending row ─────────────────────────────────────── */}
      <div style={{ padding: "4px 16px 8px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            <Flame size={14} style={{ color: "var(--accent-sakura)" }} />
            {t("トレンド", "Trending")}
          </div>
          <button onClick={() => setTrendingAll(true)} style={{ fontSize: 12, color: "var(--accent-sakura)", fontWeight: 600 }}>
            {t("すべて見る →", "See all →")}
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {trending.map((p) => {
            const th = themeFor(p.flair);
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p.id)}
                className="shrink-0 text-left flex flex-col justify-between"
                style={{
                  width: 160,
                  height: 104,
                  borderRadius: 16,
                  padding: 12,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-card)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div className="flex items-center" style={{ gap: 6 }}>
                  <div className="flex items-center justify-center" style={{ width: 22, height: 22, borderRadius: "50%", background: th.soft }}>
                    <Flame size={11} style={{ color: th.accent }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: th.accent, background: th.soft, padding: "2px 8px", borderRadius: 10 }}>
                    #{th.en}
                  </span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {p.titleEn}
                </div>
                <div className="flex items-center" style={{ fontSize: 10, color: "var(--text-secondary)", gap: 4 }}>
                  <PawPrint size={10} style={{ color: "var(--accent-sakura)" }} />
                  {p.up} {t("いいね", "upvotes")}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Groups & Discussions ─────────────────────────────── */}
      <div style={{ padding: "4px 16px 4px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div className="flex items-center gap-1.5" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            <UsersIcon size={14} style={{ color: "var(--accent-sakura)" }} />
            {t("グループ＆ディスカッション", "Groups & Discussions")}
          </div>
        </div>
        <div className="grid grid-cols-2" style={{ gap: 10 }}>
          {[
            { name: "Indie Parents India", members: "12.4k", accent: "var(--accent-sakura)", soft: "var(--accent-sakura-soft)" },
            { name: "Labrador Club Mumbai", members: "8.1k", accent: "var(--accent-fuji)", soft: "var(--bg-card-lavender)" },
            { name: "Puppy Training 101", members: "5.7k", accent: "var(--accent-matcha)", soft: "var(--acc-pale)" },
            { name: "Vet Q&A Board", members: "9.3k", accent: "var(--accent-sora)", soft: "var(--acc2-pale)" },
          ].map((g) => (
            <button
              key={g.name}
              onClick={() => toast(`Joined "${g.name}"`, { description: "New discussions will appear in your feed.", duration: 1800 })}
              className="text-left active:scale-[0.97] transition-transform"
              style={{
                 background: "var(--bg-card)",
                 borderRadius: 20,
                 border: "1px solid var(--border-card)",
                 boxShadow: "var(--shadow-card)",
                padding: "12px 14px",
              }}
            >
              <span className="flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: "50%", background: g.soft }}>
                <UsersIcon size={14} style={{ color: g.accent }} />
              </span>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginTop: 8, lineHeight: 1.3 }}>{g.name}</div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{g.members} members · Join</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Feed ──────────────────────────────────────────────── */}
      <div style={{ paddingTop: 8, paddingBottom: 24 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={sub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {filtered.length === 0 && (
              <div style={{ padding: "48px 16px", textAlign: "center" }}>
                <PawPrint size={32} style={{ color: "var(--acc-soft)", margin: "0 auto" }} />
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 10 }}>
                  {t("まだ投稿がありません", "No posts yet")}
                </div>
              </div>
            )}

            {filtered.slice(0, visibleCount).map((p) => {
              const th = themeFor(p.flair);
              const pal = avatarPalette(p.user);
              const initial = p.user.trim()[0] ?? "?";
              const breedEmoji = BREED_EMOJI[p.breed] ?? "";
              const isLost = p.flair === "迷子";
              const up = p.up + (upvoted[p.id] ? 1 : 0);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={p.isNew ? { opacity: 0, y: -16 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.99 }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 20,
                    margin: "0 16px 12px",
                    boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >

                  <button onClick={() => setOpen(p.id)} className="w-full text-left" style={{ padding: 16 }}>
                    <div className="flex items-start gap-3">
                      <div
                        className="relative shrink-0 flex items-center justify-center"
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: "50%",
                          background: pal.bg,
                          color: pal.fg,
                          fontSize: 16,
                          fontWeight: 800,
                        }}
                      >
                        {initial}
                        <span
                          style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            fontSize: 10,
                            background: "#fff",
                            borderRadius: "50%",
                            width: 16,
                            height: 16,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }}
                        >
                          {breedEmoji}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{p.user}</div>
                        <div className="flex items-center gap-1.5" style={{ marginTop: 3 }}>
                          <span
                            style={{
                              background: th.soft,
                              color: th.accent,
                              fontSize: 10,
                              fontWeight: 600,
                              borderRadius: 20,
                              padding: "2px 8px",
                            }}
                          >
                            {p.breed}
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-placeholder)" }}>·</span>
                          <span style={{ fontSize: 11, color: "var(--text-placeholder)" }}>{p.time}</span>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-1 shrink-0"
                        style={{
                          background: th.soft,
                          border: `1px solid ${th.ring}`,
                          borderRadius: 20,
                          padding: "4px 10px",
                          color: th.accent,
                          fontSize: 11,
                          fontWeight: 700,
                          boxShadow: `0 2px 6px ${th.accent}1f`,
                        }}
                      >
                        <span>#{th.en}</span>
                      </div>
                    </div>

                    {isLost && (
                      <div
                        className="pulse-red"
                        style={{
                          position: "absolute",
                          top: 14,
                          right: 14,
                          background: "#E53935",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 12,
                          letterSpacing: "0.05em",
                        }}
                      >
                        {t("迷子", "LOST")}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        lineHeight: 1.4,
                        margin: "10px 0 6px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.titleEn}
                    </div>
                  </button>

                  {/* Action bar */}
                  <div style={{ padding: "0 16px 14px" }}>
                    <div style={{ height: 1, background: "var(--bg-elevated)", marginBottom: 12 }} />
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileTap={{ scale: 1.08 }}
                        onClick={(e) => { e.stopPropagation(); toggleUpvote(p.id); }}
                        className="relative flex items-center gap-1.5"
                        style={{
                          background: upvoted[p.id] ? "var(--accent-sakura)" : "var(--accent-sakura-soft)",
                          border: `1px solid ${upvoted[p.id] ? "var(--accent-sakura)" : "var(--acc-pale)"}`,
                          borderRadius: 20,
                          padding: "6px 12px",
                          height: 32,
                          color: upvoted[p.id] ? "#fff" : "var(--accent-sakura)",
                        }}
                      >
                        <ArrowUp size={14} fill={upvoted[p.id] ? "#fff" : "none"} />
                        <motion.span
                          key={up}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          style={{ fontSize: 13, fontWeight: 700 }}
                        >
                          {up}
                        </motion.span>
                        <AnimatePresence>
                          {burst === p.id && (
                            <>
                              {[0, 1, 2].map((i) => (
                                <motion.span
                                  key={i}
                                  initial={{ y: 0, opacity: 1, x: 0 }}
                                  animate={{ y: -28 - i * 4, opacity: 0, x: (i - 1) * 10 }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 0.6 }}
                                  style={{ position: "absolute", left: "50%", top: 0, fontSize: 12, pointerEvents: "none" }}
                                />
                              ))}
                            </>
                          )}
                        </AnimatePresence>
                      </motion.button>

                      <button
                        onClick={(e) => { e.stopPropagation(); setOpen(p.id); }}
                        className="flex items-center gap-1.5"
                        style={{
                          background: "var(--acc2-pale)",
                          border: "1px solid var(--acc2-soft)",
                          borderRadius: 20,
                          padding: "6px 12px",
                          height: 32,
                          color: "var(--accent-sora)",
                        }}
                      >
                        <MessageCircle size={14} />
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{p.com}</span>
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); sharePost(p); }}
                        aria-label="share"
                        className="flex items-center justify-center"
                        style={{
                          background: "var(--bg-elevated)",
                          border: "1px solid var(--border-card)",
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <Share2 size={14} />
                      </button>

                      <div className="flex-1" />

                      <motion.button
                        whileTap={{ scale: 1.2 }}
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(p.id); }}
                        aria-label="bookmark"
                        className="flex items-center justify-center"
                        style={{
                          background: bookmarked[p.id] ? "var(--acc-soft)" : "var(--acc-pale)",
                          border: `1px solid ${bookmarked[p.id] ? "var(--acc-deep)" : "var(--acc-soft)"}`,
                          borderRadius: "50%",
                          width: 32,
                          height: 32,
                          color: bookmarked[p.id] ? "var(--acc-deep)" : "var(--accent-yuzu)",
                        }}
                      >
                        <Bookmark size={14} fill={bookmarked[p.id] ? "var(--acc-deep)" : "none"} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {filtered.length > visibleCount && (
          <div className="flex justify-center" style={{ padding: "8px 16px 16px" }}>
            <button
              onClick={() => setVisibleCount((v) => v + 5)}
              className="flex items-center gap-2 active:scale-95 transition-transform"
              style={{
                background: "#FFFFFF",
                border: "1.5px solid var(--accent-sakura)",
                color: "var(--accent-sakura)",
                borderRadius: 20,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {t("もっと見る", "See More")} · {filtered.length - visibleCount}
            </button>
          </div>
        )}
        {filtered.length > 0 && visibleCount >= filtered.length && filtered.length > 5 && (
          <div style={{ textAlign: "center", padding: "4px 16px 16px", fontSize: 11, color: "var(--text-placeholder)" }}>
            {t("すべて表示しました", "You're all caught up")}
          </div>
        )}
      </div>

      {/* Short disclaimer */}
      <div
        style={{
          margin: "8px 16px 80px",
          background: "#FFFFFF",
          borderRadius: 18,
          boxShadow: "0 2px 20px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
          padding: "12px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <span className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--acc-pale)" }}>
          <ShieldCheck size={15} style={{ color: "var(--accent-matcha)" }} />
        </span>
        <div className="min-w-0">
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>Responsible Breeding</div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.5, marginTop: 2 }}>
            Compatibility scores are guidance, not a guarantee. Always consult a vet before breeding.
          </div>
        </div>
      </div>

      {/* Floating compose button */}
      <button
        onClick={() => setComposeOpen(true)}
        aria-label={t("投稿する", "Create post")}
        className="flex items-center justify-center"
        style={{
          position: "fixed",
          right: 16,
          bottom: 80,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg,var(--accent-sakura),var(--accent-sakura-dark))",
          color: "#fff",
          boxShadow: "0 8px 24px color-mix(in srgb, var(--accent-sakura) calc(0.4 * 100%), transparent)",
          zIndex: 30,
          animation: "pulseRed 2.4s infinite",
        }}
      >
        <PenLine size={22} />
      </button>

      {/* Post detail sheet */}
      <AnimatePresence>
        {post && (
          <PostDetailSheet
            post={post}
            onClose={() => setOpen(null)}
            comments={commentsByPost[post.id] ?? []}
            onAddComment={(txt) => addComment(post.id, txt)}
            upvoted={!!upvoted[post.id]}
            onUpvote={() => toggleUpvote(post.id)}
            bookmarked={!!bookmarked[post.id]}
            onBookmark={() => toggleBookmark(post.id)}
            onShare={() => sharePost(post)}
          />
        )}
      </AnimatePresence>

      {/* Compose sheet */}
      <AnimatePresence>
        {composeOpen && (
          <ComposeSheet breed={myBreed} onClose={() => setComposeOpen(false)} onSubmit={addPost} />
        )}
      </AnimatePresence>

      {/* Trending — see all sheet */}
      <AnimatePresence>
        {trendingAll && (
          <div className="fixed inset-0 z-[120] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setTrendingAll(false)}>
            <motion.div
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="w-full max-w-md mx-auto"
              style={{ background: "var(--bg-page)", maxHeight: "80vh", overflowY: "auto", borderRadius: "28px 28px 0 0", padding: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 16px" }} />
              <div className="flex items-center gap-1.5" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
                <Flame size={16} style={{ color: "var(--accent-sakura)" }} />
                {t("すべてのトレンド", "All Trending Posts")}
              </div>
              {posts.slice().sort((a, b) => b.up - a.up).map((p, i) => {
                const th = themeFor(p.flair);
                return (
                  <button
                    key={p.id}
                    onClick={() => { setTrendingAll(false); setOpen(p.id); }}
                    className="w-full text-left flex items-center"
                    style={{ gap: 12, padding: "12px 10px", borderRadius: 16, background: "#FFFFFF", marginBottom: 8, boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}
                  >
                    <span className="flex items-center justify-center shrink-0" style={{ width: 28, height: 28, borderRadius: "50%", background: th.soft, fontSize: 13, fontWeight: 800, color: th.accent }}>
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {p.titleEn}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent-sakura)", flexShrink: 0 }}>▲ {p.up}</span>
                  </button>
                );
              })}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share fallback sheet */}
      <AnimatePresence>
        {shareFor && (
          <ShareSheet
            onClose={() => setShareFor(null)}
            onCopy={() => {
              const p = posts.find((x) => x.id === shareFor);
              const title = p ? (p.titleEn) : "";
              const url = typeof window !== "undefined" ? window.location.href : "";
              try {
                navigator.clipboard?.writeText(`${title} — ${url}`);
                toast(t("リンクをコピーしました", "Link copied"), { duration: 1500 });
              } catch {}
              setShareFor(null);
            }}
            onLine={() => {
              const p = posts.find((x) => x.id === shareFor);
              const title = p ? (p.titleEn) : "";
              const url = typeof window !== "undefined" ? window.location.href : "";
              const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
              if (typeof window !== "undefined") window.open(lineUrl, "_blank");
              setShareFor(null);
            }}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════════
// Post Detail Sheet
// ═══════════════════════════════════════════════════════════════
function PostDetailSheet({
  post,
  onClose,
  comments,
  onAddComment,
  upvoted,
  onUpvote,
  bookmarked,
  onBookmark,
  onShare,
}: {
  post: PostT;
  onClose: () => void;
  comments: CommentT[];
  onAddComment: (text: string) => void;
  upvoted: boolean;
  onUpvote: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
}) {
  const t = useT();
  
  const th = themeFor(post.flair);
  const pal = avatarPalette(post.user);
  const [text, setText] = useState("");

  function send() {
    const v = text.trim();
    if (!v) return;
    onAddComment(v);
    setText("");
  }

  const up = post.up + (upvoted ? 1 : 0);

  return (
    <div className="fixed inset-0 z-[120] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full max-w-md mx-auto flex flex-col"
        style={{ background: "var(--bg-page)", height: "90vh", borderRadius: "28px 28px 0 0", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px 16px" }}>
          <div style={{ width: 48, height: 5, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 16px" }} />
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, borderRadius: "50%", background: pal.bg, color: pal.fg, border: `2px solid ${th.accent}`, fontWeight: 800 }}
            >
              {post.user.trim()[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{post.user}</div>
              <div style={{ fontSize: 11, color: "var(--text-placeholder)" }}>
                {post.breed} · {post.time} · #{th.en}
              </div>
            </div>
            <button onClick={onClose} aria-label="close" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
              <X size={16} />
            </button>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 14, lineHeight: 1.3 }}>
            {post.titleEn}
          </h2>
          {post.body && (
            <p style={{ fontSize: 14, color: "var(--text-primary)", marginTop: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{post.body}</p>
          )}

          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2" style={{ marginTop: 12 }}>
              {post.images.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: "100%", borderRadius: 12, aspectRatio: "1/1", objectFit: "cover" }} />
              ))}
            </div>
          )}

          {post.location && (
            <div className="inline-flex items-center gap-1" style={{ marginTop: 12, background: "var(--acc2-pale)", color: "var(--accent-sora)", border: "1px solid var(--acc2-soft)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
              <MapPin size={12} />
              {post.location}
            </div>
          )}

          {/* Upvote / Share row */}
          <div className="flex items-center gap-2" style={{ marginTop: 16 }}>
            <button
              onClick={onUpvote}
              className="flex items-center gap-1.5"
              style={{
                background: upvoted ? "var(--accent-sakura)" : "var(--accent-sakura-soft)",
                border: `1px solid ${upvoted ? "var(--accent-sakura)" : "var(--acc-pale)"}`,
                color: upvoted ? "#fff" : "var(--accent-sakura)",
                borderRadius: 20,
                padding: "6px 12px",
                height: 32,
              }}
            >
              <ArrowUp size={14} fill={upvoted ? "#fff" : "none"} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>{up}</span>
            </button>
            <button
              onClick={onShare}
              aria-label="share"
              className="flex items-center justify-center"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-card)", borderRadius: "50%", width: 32, height: 32, color: "var(--text-secondary)" }}
            >
              <Share2 size={14} />
            </button>
            <div className="flex-1" />
            <button
              onClick={onBookmark}
              aria-label="bookmark"
              className="flex items-center justify-center"
              style={{
                background: bookmarked ? "var(--acc-soft)" : "var(--acc-pale)",
                border: `1px solid ${bookmarked ? "var(--acc-deep)" : "var(--acc-soft)"}`,
                borderRadius: "50%",
                width: 32,
                height: 32,
                color: bookmarked ? "var(--acc-deep)" : "var(--accent-yuzu)",
              }}
            >
              <Bookmark size={14} fill={bookmarked ? "var(--acc-deep)" : "none"} />
            </button>
          </div>

          {/* Comments */}
          <h3 style={{ marginTop: 22, fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            {t("コメント", "Comments")} ({comments.length})
          </h3>
          <div style={{ marginTop: 10 }} className="space-y-2">
            {comments.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", padding: "16px 0" }}>
                {t("最初のコメントを投稿しよう", "Be the first to comment")}
              </div>
            )}
            {comments.map((c) => {
              const cp = avatarPalette(c.user);
              return (
                <div key={c.id} style={{ background: "#fff", borderRadius: 14, padding: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-start gap-2">
                    <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: "50%", background: cp.bg, color: cp.fg, fontSize: 14, fontWeight: 800 }}>
                      {c.user.trim()[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{c.user}</div>
                        <span style={{ fontSize: 11, color: "var(--text-placeholder)" }}>· {c.time}</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 4, lineHeight: 1.5 }}>{c.text}</div>
                      <button className="flex items-center gap-1" style={{ marginTop: 6, color: "var(--text-secondary)", fontSize: 11, fontWeight: 600 }}>
                        <ArrowUp size={12} />
                        {c.up}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Comment input */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: "10px 14px",
            background: "#fff",
            borderTop: "1px solid var(--bg-elevated)",
          }}
        >
          <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-card-sakura)", color: "var(--acc2-strong)", fontSize: 13, fontWeight: 800 }}>
            {ME.user[0]}
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder={t("コメントを入力", "Write a comment...")}
            style={{
              flex: 1,
              background: "var(--bg-elevated)",
              borderRadius: 50,
              padding: "8px 14px",
              fontSize: 13,
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
            }}
          />
          <button
            onClick={send}
            aria-label="send"
            disabled={!text.trim()}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: text.trim() ? "linear-gradient(135deg,var(--accent-sakura),var(--accent-sakura-dark))" : "var(--bg-elevated)",
              color: text.trim() ? "#fff" : "var(--text-placeholder)",
              border: "none",
            }}
          >
            <Send size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Compose Sheet
// ═══════════════════════════════════════════════════════════════
function ComposeSheet({
  breed,
  onClose,
  onSubmit,
}: {
  breed: string;
  onClose: () => void;
  onSubmit: (data: { titleJp: string; titleEn: string; body: string; flair: string; images: string[]; location: string }) => void;
}) {
  const t = useT();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [catIdx, setCatIdx] = useState<number | null>(null);
  const [tagKey, setTagKey] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [shake, setShake] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const canPost = title.trim().length > 0;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const arr: string[] = [];
    Array.from(files).slice(0, 4).forEach((f) => {
      arr.push(URL.createObjectURL(f));
    });
    setImages((s) => [...s, ...arr].slice(0, 4));
  }

  function submit() {
    if (!canPost) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      toast.error(t("タイトルを入力してください", "Please enter a title"));
      return;
    }
    const flair = tagKey ?? (catIdx === 3 ? "迷子" : catIdx === 4 ? "獣医Q&A" : "日常");
    onSubmit({
      titleJp: title.trim(),
      titleEn: title.trim(),
      body: body.trim(),
      flair,
      images,
      location,
    });
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full max-w-md mx-auto flex flex-col"
        style={{ background: "#fff", height: "90vh", borderRadius: "24px 24px 0 0", overflow: "hidden" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--border-card)", margin: "10px auto 6px" }} />

        {/* top bar */}
        <div className="flex items-center justify-between" style={{ padding: "8px 16px", borderBottom: "1px solid var(--bg-elevated)" }}>
          <button onClick={onClose} style={{ fontSize: 14, color: "var(--text-secondary)" }}>{t("キャンセル", "Cancel")}</button>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{t("投稿を作成", "Create Post")}</div>
          <button
            onClick={submit}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: canPost ? "var(--acc-deep)" : "var(--text-placeholder)",
              transition: "color 0.2s",
            }}
          >
            {t("投稿", "Post")}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 24px" }}>
          {/* user info */}
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-card-sakura)", color: "var(--acc2-strong)", fontSize: 16, fontWeight: 800 }}>
              {ME.user[0]}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{ME.user}</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{breed}</div>
            </div>
          </div>

          {/* category */}
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>{t("カテゴリー", "Category")}</div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide" style={{ paddingBottom: 4 }}>
            {CATS.map((c, i) => {
              const active = catIdx === i;
              return (
                <button
                  key={c.en}
                  onClick={() => setCatIdx(i)}
                  className="shrink-0"
                  style={{
                    background: active ? "var(--acc-deep)" : "var(--bg-elevated)",
                    color: active ? "#fff" : "var(--text-primary)",
                    border: `1px solid ${active ? "var(--acc-deep)" : "var(--border-card)"}`,
                    borderRadius: 20,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {t(c.jp, c.en)}
                </button>
              );
            })}
          </div>

          {/* tag */}
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: "14px 0 6px" }}>{t("タグ", "Tag")}</div>
          <div className="flex gap-2 flex-wrap">
            {TAGS.map((tag) => {
              const active = tagKey === tag.key;
              return (
                <button
                  key={tag.key}
                  onClick={() => setTagKey(active ? null : tag.key)}
                  style={{
                    background: active ? "var(--acc-deep)" : "var(--accent-sakura-soft)",
                    color: active ? "#fff" : "var(--accent-sakura)",
                    border: `1px solid ${active ? "var(--acc-deep)" : "var(--acc-pale)"}`,
                    borderRadius: 20,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  #{tag.en}
                </button>
              );
            })}
          </div>

          {/* title */}
          <motion.div
            animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
            style={{ marginTop: 18 }}
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder={t("タイトルを入力", "Enter title...")}
              style={{
                width: "100%",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--text-primary)",
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "8px 0",
              }}
            />
            <div className="flex justify-end" style={{ fontSize: 11, color: "var(--text-placeholder)" }}>
              {title.length}/100
            </div>
          </motion.div>

          {/* body */}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={t("詳細を入力（任意）", "Add details (optional)...")}
            style={{
              width: "100%",
              minHeight: 120,
              fontSize: 14,
              color: "var(--text-primary)",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "8px 0",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />

          {/* image thumbnails */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap" style={{ marginTop: 8 }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: "relative", width: 80, height: 80 }}>
                  <img src={src} alt="" style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover" }} />
                  <button
                    onClick={() => setImages((arr) => arr.filter((_, idx) => idx !== i))}
                    aria-label="remove"
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "var(--text-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* location pill */}
          {location && (
            <div className="inline-flex items-center gap-1" style={{ marginTop: 12, background: "var(--acc2-pale)", color: "var(--accent-sora)", border: "1px solid var(--acc2-soft)", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 600 }}>
              <MapPin size={12} />
              {location}
              <button onClick={() => setLocation("")} style={{ marginLeft: 4, color: "var(--accent-sora)" }}>
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* media attachment row */}
        <div style={{ borderTop: "1px solid var(--bg-elevated)", padding: "10px 16px 14px", background: "#fff" }}>
          <div className="flex items-start justify-around">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFiles(e.target.files)} />
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />

            <button onClick={() => cameraRef.current?.click()} className="flex flex-col items-center gap-1">
              <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-card-sakura)", color: "var(--accent-sakura)" }}>
                <Camera size={16} />
              </span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{t("カメラ", "Camera")}</span>
            </button>

            <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1">
              <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-card-lavender)", color: "var(--accent-fuji)" }}>
                <ImageIcon size={16} />
              </span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 600 }}>{t("画像", "Image")}</span>
            </button>

            <button
              onClick={() => setLocation(location ? "" : t("Bandra, Mumbai", "Bandra, Mumbai"))}
              className="flex flex-col items-center gap-1"
            >
              <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: location ? "var(--acc2-pale)" : "var(--bg-elevated)", color: location ? "var(--accent-sora)" : "var(--text-secondary)" }}>
                <MapPin size={16} />
              </span>
              <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>{t("場所", "Location")}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Share fallback sheet
// ═══════════════════════════════════════════════════════════════
function ShareSheet({ onClose, onCopy, onLine }: { onClose: () => void; onCopy: () => void; onLine: () => void }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[120] flex items-end" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        className="w-full max-w-md mx-auto"
        style={{ background: "#fff", borderRadius: "24px 24px 0 0", padding: "12px 16px 24px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--border-card)", margin: "0 auto 12px" }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textAlign: "center", marginBottom: 12 }}>
          {t("共有", "Share")}
        </div>
        <button
          onClick={onCopy}
          className="w-full flex items-center gap-3"
          style={{ padding: "12px 14px", borderRadius: 14, background: "var(--bg-elevated)", marginBottom: 8 }}
        >
          <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-sakura-soft)", color: "var(--accent-sakura)" }}>
            <LinkIcon size={16} />
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("リンクをコピー", "Copy link")}</span>
        </button>
        <button
          onClick={onLine}
          className="w-full flex items-center gap-3"
          style={{ padding: "12px 14px", borderRadius: 14, background: "var(--bg-elevated)" }}
        >
          <span className="flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--acc2-pale)", color: "var(--acc2-deep)", fontWeight: 800, fontSize: 12 }}>
            LINE
          </span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{t("LINEで共有", "Share on LINE")}</span>
        </button>
      </motion.div>
    </div>
  );
}

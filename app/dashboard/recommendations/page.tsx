"use client";
/**
 * /app/dashboard/recommendations/page.tsx
 *
 * Sleek, professional AI-generated health recommendations UI.
 * Theme-aware via ThemeContext — no hardcoded colours.
 * No border-radius (sharp corners throughout).
 * Background is NOT set on the page root — layout handles that.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw, Plus, ChevronDown,
  Utensils, Dumbbell, Brain, Stethoscope,
  Leaf, Activity, AlertTriangle, CheckCircle2,
  Clock, Info, TrendingUp, Zap, Target,
  Award, ListChecks, Sparkles, Check,
  ReceiptText,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import {
  fetchLatestRecommendations,
  parseRecommendationItems,
  type StoredRecommendation,
  type RecommendationItem,
  type RecoCategory,
  type RecoPriority,
} from "@/services/RecommendationService";
import { fetchLatestAssessment } from "@/services/AppwriteService";
import { addUserXp, getUserXp } from "@/services/UserXpService";
import ThemeToggle from "@/components/Themetoggle";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const CAT: Record<
  RecoCategory,
  {
    label: string;
    icon: React.ElementType;
    lightColor: string;
    darkColor: string;
    lightBg: string;
    darkBg: string;
  }
> = {
  nutrition:         { label: "Nutrition",      icon: Utensils,    lightColor: "#16a34a", darkColor: "#4ade80", lightBg: "rgba(22,163,74,0.08)",   darkBg: "rgba(74,222,128,0.1)"   },
  physical_activity: { label: "Exercise",       icon: Dumbbell,    lightColor: "#ea580c", darkColor: "#fb923c", lightBg: "rgba(234,88,12,0.08)",   darkBg: "rgba(251,146,60,0.1)"   },
  stress_sleep:      { label: "Stress & Sleep", icon: Brain,       lightColor: "#7c3aed", darkColor: "#a78bfa", lightBg: "rgba(124,58,237,0.08)",  darkBg: "rgba(167,139,250,0.1)"  },
  medical:           { label: "Medical",        icon: Stethoscope, lightColor: "#dc2626", darkColor: "#f87171", lightBg: "rgba(220,38,38,0.08)",   darkBg: "rgba(248,113,113,0.1)"  },
  lifestyle:         { label: "Lifestyle",      icon: Leaf,        lightColor: "#0d9488", darkColor: "#2dd4bf", lightBg: "rgba(13,148,136,0.08)",  darkBg: "rgba(45,212,191,0.1)"   },
  monitoring:        { label: "Monitoring",     icon: Activity,    lightColor: "#4f46e5", darkColor: "#818cf8", lightBg: "rgba(79,70,229,0.08)",   darkBg: "rgba(129,140,248,0.1)"  },
};

const PRI: Record<RecoPriority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "#ef4444" },
  high:   { label: "High",   color: "#f97316" },
  medium: { label: "Medium", color: "#eab308" },
  low:    { label: "Low",    color: "#22c55e" },
};

const XP_PER_RECOMMENDATION = 5;

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

function saveCompletions(titles: string[]): void {
  try { localStorage.setItem("reco_completed", JSON.stringify(titles)); } catch {}
}

function loadCompletions(): Set<string> {
  try {
    const d = localStorage.getItem("reco_completed");
    return d ? new Set(JSON.parse(d)) : new Set();
  } catch { return new Set(); }
}

// ─── INTERSECTION HOOK ────────────────────────────────────────────────────────

function useInView(threshold = 0.06) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold }
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ─── RECO CARD ────────────────────────────────────────────────────────────────

function RecoCard({
  item,
  isCompleted,
  onComplete,
}: {
  item: RecommendationItem;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const { isDark, surface, accentColor } = useTheme();
  const { ref, vis } = useInView();
  const cat = CAT[item.category];
  const pri = PRI[item.priority];
  const Icon = cat.icon;
  const [expanded, setExpanded] = useState(false);

  const catColor = isDark ? cat.darkColor : cat.lightColor;
  const catBg    = isDark ? cat.darkBg    : cat.lightBg;

  return (
    <div
      ref={ref}
      style={{
        background:   isCompleted
          ? (isDark ? "rgba(34,197,94,0.03)" : "rgba(34,197,94,0.02)")
          : surface.surface,
        border:       `1px solid ${isCompleted ? "rgba(34,197,94,0.15)" : surface.border}`,
        borderRadius: 0,
        overflow:     "hidden",
        opacity:      vis ? 1 : 0,
        transform:    vis ? "translateY(0)" : "translateY(10px)",
        transition:   "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      {/* Clickable header */}
      <div
        onClick={() => setExpanded(x => !x)}
        style={{ padding: "14px 16px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {/* Icon tile */}
          <div style={{
            width: 34, height: 34, borderRadius: 0, flexShrink: 0,
            background: catBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon size={15} color={catColor} strokeWidth={2} />
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title + actions */}
            <div style={{
              display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", gap: 8, marginBottom: 6,
            }}>
              <p style={{
                margin: 0, fontSize: 12.5, fontWeight: 700,
                color: isCompleted ? surface.muted : surface.text,
                lineHeight: 1.4,
                textDecoration: isCompleted ? "line-through" : "none",
              }}>
                {item.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginTop: 1 }}>
                <button
                  onClick={e => { e.stopPropagation(); onComplete(); }}
                  aria-label={isCompleted ? "Mark incomplete" : "Mark complete"}
                  style={{
                    width: 22, height: 22, borderRadius: 0,
                    border: `1.5px solid ${isCompleted ? "#22c55e" : surface.border}`,
                    background: isCompleted ? "#22c55e" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", transition: "all 0.2s ease",
                    flexShrink: 0,
                  }}
                >
                  {isCompleted && <Check size={11} color="#fff" strokeWidth={3} />}
                </button>
                <ChevronDown
                  size={13}
                  style={{
                    color: surface.muted,
                    transform: expanded ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              <span style={{
                padding: "2px 6px", borderRadius: 0,
                fontSize: 10, fontWeight: 600,
                background: catBg, color: catColor,
              }}>
                {cat.label}
              </span>
              <span style={{
                padding: "2px 6px", borderRadius: 0,
                fontSize: 10, fontWeight: 700,
                letterSpacing: "0.04em", textTransform: "uppercase" as const,
                background: `${pri.color}15`, color: pri.color,
              }}>
                {pri.label}
              </span>
              {isCompleted && (
                <span style={{
                  display: "flex", alignItems: "center", gap: 3,
                  padding: "2px 6px", borderRadius: 0,
                  fontSize: 10, fontWeight: 600,
                  background: "rgba(34,197,94,0.1)", color: "#22c55e",
                }}>
                  <CheckCircle2 size={9} strokeWidth={2.5} />
                  +{XP_PER_RECOMMENDATION} XP
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          padding: "14px 16px",
          borderTop: `1px solid ${surface.border}`,
        }}>
          <p style={{
            fontSize: 12, lineHeight: 1.75, color: surface.muted,
            margin: 0, marginBottom: 12,
          }}>
            {item.description}
          </p>

          {/* Action step */}
          <div style={{
            padding: "10px 12px", borderRadius: 0,
            background: surface.surfaceAlt,
            marginBottom:
              item.frequency || item.evidenceBased || item.locallyRelevant ? 12 : 0,
          }}>
            <p style={{
              margin: 0, marginBottom: 4,
              fontSize: 9, fontWeight: 800,
              textTransform: "uppercase" as const, letterSpacing: "0.08em",
              color: catColor,
            }}>
              Action Step
            </p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: surface.text, lineHeight: 1.65 }}>
              {item.action}
            </p>
          </div>

          {/* Meta */}
          {(item.frequency || item.evidenceBased || item.locallyRelevant) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {item.frequency && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: surface.muted }}>
                  <Clock size={11} strokeWidth={2} />
                  {item.frequency}
                </span>
              )}
              {item.evidenceBased && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isDark ? "#4ade80" : "#16a34a" }}>
                  <Award size={11} strokeWidth={2} />
                  Evidence-based
                </span>
              )}
              {item.locallyRelevant && (
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: isDark ? "#2dd4bf" : "#0d9488" }}>
                  <Target size={11} strokeWidth={2} />
                  Locally relevant
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LOADING SKELETON ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const { surface } = useTheme();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            height: 88,
            borderRadius: 0,
            background: surface.surface,
            border: `1px solid ${surface.border}`,
            animationDelay: `${i * 70}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyState({ router }: { router: ReturnType<typeof useRouter> }) {
  const { isDark, surface, accentColor } = useTheme();
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "80px 24px", textAlign: "center", gap: 20,
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 0,
        background: isDark ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.07)",
        border: "1px solid rgba(13,148,136,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Brain size={26} strokeWidth={1.5} style={{ color: accentColor }} />
      </div>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: surface.text, margin: 0, marginBottom: 8, letterSpacing: "-0.02em" }}>
          No Recommendations Yet
        </h2>
        <p style={{ fontSize: 13, color: surface.muted, margin: 0, maxWidth: 320, lineHeight: 1.7 }}>
          Complete a health assessment to receive personalised recommendations tailored to your profile.
        </p>
      </div>
      <button
        onClick={() => router.push("/dashboard/assessment")}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "11px 22px", borderRadius: 0,
          background: accentColor, color: "#fff",
          fontSize: 13, fontWeight: 700,
          border: "none", cursor: "pointer",
          boxShadow: "0 4px 14px rgba(13,148,136,0.25)",
        }}
      >
        <Plus size={15} strokeWidth={2.5} />
        Start Assessment
      </button>
    </div>
  );
}

// ─── GENERATING STATE ─────────────────────────────────────────────────────────

function GeneratingState() {
  const { surface, accentColor } = useTheme();
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const iv = setInterval(() => setDots(d => (d.length >= 3 ? "." : d + ".")), 500);
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "80px 24px", textAlign: "center", gap: 20,
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 0,
          background: "rgba(13,148,136,0.07)",
          border: "1px solid rgba(13,148,136,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "reco-spin 3s linear infinite",
        }}>
          <Sparkles size={22} strokeWidth={1.5} style={{ color: accentColor }} />
        </div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: surface.text, margin: 0, marginBottom: 6, letterSpacing: "-0.015em" }}>
            Generating Recommendations{dots}
          </h2>
          <p style={{ fontSize: 12.5, color: surface.muted, margin: 0, maxWidth: 320, lineHeight: 1.75 }}>
            Our AI is analysing your assessment to create personalised health recommendations.
          </p>
        </div>
      </div>
      <style jsx global>{`
        @keyframes reco-spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

// ─── XP TOAST ─────────────────────────────────────────────────────────────────

function XpToast({ xp }: { xp: number }) {
  const { isDark, surface } = useTheme();
  return (
    <>
      <div style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 100,
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px", borderRadius: 0,
        background: surface.surface,
        border: "1px solid rgba(34,197,94,0.25)",
        boxShadow: `0 8px 30px rgba(0,0,0,${isDark ? 0.5 : 0.1})`,
        animation: "xp-in 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 0,
          background: "rgba(34,197,94,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Zap size={13} style={{ color: "#22c55e" }} />
        </div>
        <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: "#22c55e" }}>
          +{xp} XP earned
        </p>
      </div>
      <style jsx global>{`
        @keyframes xp-in {
          from { transform: translateY(60px) scale(0.95); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function RecommendationsPage() {
  const auth    = useRequireAuth();
  const router  = useRouter();
  const { isDark, surface, accentColor } = useTheme();

  const [reco, setReco]                     = useState<StoredRecommendation | null>(null);
  const [items, setItems]                   = useState<RecommendationItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [hasAssessment, setHasAssessment]   = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [filterCat, setFilterCat]           = useState<RecoCategory | "all">("all");
  const [completed, setCompleted]           = useState<Set<string>>(new Set());
  const [xpNotif, setXpNotif]               = useState<{ id: string; xp: number } | null>(null);
  const [userXp, setUserXp]                 = useState(0);

  const loadData = useCallback(async (uid: string) => {
    try {
      const assessment = await fetchLatestAssessment(uid);
      if (!assessment) {
        setHasAssessment(false);
        setLoading(false);
        return;
      }
      const data = await fetchLatestRecommendations(uid);
      if (data) {
        setReco(data);
        setItems(parseRecommendationItems(data));
      }
      const xpData = await getUserXp(uid);
      if (xpData) setUserXp(xpData.totalXp);
      setCompleted(loadCompletions());
      setError(null);
    } catch {
      setError("Failed to load recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (auth.user) loadData(auth.user.id);
  }, [auth.user, loadData]);

  const handleRefresh = async () => {
    if (!auth.user || refreshing) return;
    setRefreshing(true);
    await loadData(auth.user.id);
    setRefreshing(false);
  };

  const handleComplete = async (title: string) => {
    const next = new Set(completed);
    if (next.has(title)) {
      next.delete(title);
      setCompleted(next);
      saveCompletions(Array.from(next));
    } else {
      next.add(title);
      setCompleted(next);
      saveCompletions(Array.from(next));
      if (auth.user) {
        try {
          await addUserXp(auth.user, XP_PER_RECOMMENDATION);
          setUserXp(p => p + XP_PER_RECOMMENDATION);
          const id = Math.random().toString();
          setXpNotif({ id, xp: XP_PER_RECOMMENDATION });
          setTimeout(() => setXpNotif(null), 2600);
        } catch (e) {
          console.error("XP error:", e);
        }
      }
    }
  };

  if (auth.loading) return null;

  const filtered       = filterCat === "all" ? items : items.filter(i => i.category === filterCat);
  const completedCount = completed.size;

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <DashboardLayout>
      {/* No background set here — DashboardLayout owns the bg */}
      <div style={{ paddingBottom: 48 }}>

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap", gap: 16, marginBottom: 28,
        }}>
          <div>
            <p style={{
              margin: 0, marginBottom: 5,
              fontSize: 10.5, fontWeight: 800,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: accentColor,
            }}>
              Health Plan
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900, color: surface.text,
              letterSpacing: "-0.025em", lineHeight: 1.15,
            }}>
              Your Recommendations
            </h1>
            {reco && (
              <p style={{ margin: 0, marginTop: 5, fontSize: 11, color: surface.subtle }}>
                Generated {fmtDate(reco.generatedAt)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* XP indicator */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 12px", borderRadius: 0,
              background: "rgba(34,197,94,0.07)",
              border: "1px solid rgba(34,197,94,0.18)",
            }}>
              <TrendingUp size={13} style={{ color: "#22c55e" }} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "#22c55e" }}>
                {userXp} XP
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 0,
                background: surface.surface, border: `1px solid ${surface.border}`,
                color: surface.muted, fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "opacity 0.2s",
                opacity: refreshing ? 0.5 : 1,
              }}
            >
              <RefreshCw size={12} strokeWidth={2} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={() => router.push("/dashboard/assessment")}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 0,
                background: accentColor, color: "#fff",
                fontSize: 12, fontWeight: 700,
                border: "none", cursor: "pointer",
                boxShadow: "0 3px 12px rgba(13,148,136,0.25)",
              }}
            >
              <Plus size={13} strokeWidth={2.5} />
              New
            </button>
          </div>
        </div>

        {/* ── Error Banner ────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", marginBottom: 16, borderRadius: 0,
            background: "rgba(239,68,68,0.05)",
            border: "1px solid rgba(239,68,68,0.16)",
          }}>
            <AlertTriangle size={13} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ margin: 0, flex: 1, fontSize: 12, color: "#ef4444" }}>{error}</p>
            <button
              onClick={handleRefresh}
              style={{
                fontSize: 11, fontWeight: 700, color: "#ef4444",
                background: "none", border: "none", cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Loading ─────────────────────────────────────────────────────── */}
        {loading && <LoadingSkeleton />}

        {/* ── No Assessment ────────────────────────────────────────────────── */}
        {!loading && !hasAssessment && (
          <EmptyState router={router} />
        )}

        {/* ── Generating ──────────────────────────────────────────────────── */}
        {!loading && hasAssessment && !reco && (
          <GeneratingState />
        )}

        {/* ── Main Content ─────────────────────────────────────────────────── */}
        {!loading && reco && items.length > 0 && (
          <>
            {/* Stats row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: 10, marginBottom: 20,
            }}>
              {[
                { label: "Total Actions",  value: items.length,                               color: accentColor, Icon: ListChecks   },
                { label: "Completed",      value: completedCount,                             color: "#22c55e",   Icon: CheckCircle2 },
                { label: "XP Earned",      value: completedCount * XP_PER_RECOMMENDATION,     color: "#f97316",   Icon: Zap          },
              ].map(({ label, value, color, Icon }) => (
                <div
                  key={label}
                  style={{
                    padding: "14px 16px", borderRadius: 0,
                    background: surface.surface, border: `1px solid ${surface.border}`,
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 10,
                  }}>
                    <p style={{
                      margin: 0, fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      color: surface.muted,
                    }}>
                      {label}
                    </p>
                    <div style={{
                      width: 26, height: 26, borderRadius: 0,
                      background: `${color}12`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={13} color={color} strokeWidth={2} />
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* AI Summary card */}
            <div style={{
              padding: "18px 20px", marginBottom: 20,
              background: surface.surface,
              border: `1px solid ${surface.border}`,
              borderRadius: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <ReceiptText size={13} style={{ color: accentColor }} strokeWidth={2} />
                <p style={{
                  margin: 0, fontSize: 9.5, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "0.09em",
                  color: accentColor,
                }}>
                  AI Summary
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.8, color: surface.text }}>
                {reco.summary}
              </p>
              {reco.topPriority && (
                <div style={{
                  marginTop: 14, padding: "10px 12px", borderRadius: 0,
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.12)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Target size={11} style={{ color: "#ef4444" }} strokeWidth={2} />
                    <p style={{
                      margin: 0, fontSize: 9, fontWeight: 800,
                      textTransform: "uppercase", letterSpacing: "0.09em",
                      color: "#ef4444",
                    }}>
                      Top Priority
                    </p>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: surface.text, lineHeight: 1.55 }}>
                    {reco.topPriority}
                  </p>
                </div>
              )}
            </div>

            {/* Category filter bar */}
            <div style={{
              display: "flex", gap: 6, marginBottom: 18,
              overflowX: "auto", paddingBottom: 4,
              scrollbarWidth: "none",
            }}>
              <button
                onClick={() => setFilterCat("all")}
                style={{
                  padding: "6px 12px", borderRadius: 0,
                  fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap",
                  flexShrink: 0, cursor: "pointer",
                  background: filterCat === "all" ? accentColor : surface.surface,
                  color:      filterCat === "all" ? "#fff"       : surface.muted,
                  border:     `1px solid ${filterCat === "all" ? accentColor : surface.border}`,
                  transition: "all 0.15s ease",
                }}
              >
                All · {items.length}
              </button>

              {(Object.keys(CAT) as RecoCategory[])
                .filter(c => items.some(i => i.category === c))
                .map(c => {
                  const cfg    = CAT[c];
                  const Icon   = cfg.icon;
                  const color  = isDark ? cfg.darkColor : cfg.lightColor;
                  const bg     = isDark ? cfg.darkBg    : cfg.lightBg;
                  const count  = items.filter(i => i.category === c).length;
                  const active = filterCat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setFilterCat(active ? "all" : c)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "6px 10px", borderRadius: 0,
                        fontSize: 11.5, fontWeight: 600,
                        whiteSpace: "nowrap", flexShrink: 0, cursor: "pointer",
                        background: active ? bg           : surface.surface,
                        color:      active ? color        : surface.muted,
                        border:     `1px solid ${active ? color : surface.border}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Icon size={11} strokeWidth={2} />
                      {cfg.label} · {count}
                    </button>
                  );
                })}
            </div>

            {/* Recommendations grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 10,
            }}>
              {filtered.map((item, i) => (
                <RecoCard
                  key={i}
                  item={item}
                  isCompleted={completed.has(item.title)}
                  onComplete={() => handleComplete(item.title)}
                />
              ))}
            </div>

            {/* Disclaimer footer */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "12px 14px", borderRadius: 0, marginTop: 24,
              background: surface.surface, border: `1px solid ${surface.border}`,
            }}>
              <Info size={12} style={{ color: surface.subtle, flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 11, color: surface.subtle, lineHeight: 1.7 }}>
                AI-generated recommendations based on validated FINDRISC and Framingham risk frameworks.
                Always consult a qualified healthcare provider before making changes to your health regimen.
              </p>
            </div>
          </>
        )}
        <ThemeToggle />
      </div>

      {xpNotif && <XpToast xp={xpNotif.xp} />}
    </DashboardLayout>
  );
}
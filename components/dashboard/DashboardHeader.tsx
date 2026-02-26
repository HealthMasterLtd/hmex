"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, ChevronRight, LogOut, User, Settings, Activity, Zap } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { fetchUserXp, type UserXpRecord } from "@/services/AppwriteService";

const XP_THRESHOLD = 300;

const BREADCRUMB_MAP: Record<string, string> = {
  "/dashboard":               "Overview",
  "/dashboard/history":       "History",
  "/dashboard/profile":       "My Profile",
  "/dashboard/settings":      "Settings",
  "/dashboard/help":          "Help & Support",
  "/dashboard/notifications": "Notifications",
  "/dashboard/assessment":    "New Assessment",
  "/dashboard/review":        "Full Report",
  "/dashboard/recommendations": "Recommendations",
};

// ─── BREADCRUMBS ─────────────────────────────────────────────────────────────
function Breadcrumbs() {
  const pathname = usePathname();
  const { surface: S } = useTheme();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) {
    return <p style={{ fontSize: 13, fontWeight: 600, color: S.text, letterSpacing: "-0.01em", margin: 0 }}>
      {BREADCRUMB_MAP[pathname] || "Dashboard"}
    </p>;
  }

  const crumbs: { label: string; href: string }[] = [];
  let path = "";
  for (const seg of segments) {
    path += `/${seg}`;
    crumbs.push({ label: BREADCRUMB_MAP[path] || seg.charAt(0).toUpperCase() + seg.slice(1), href: path });
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {crumbs.map((c, i) => (
        <React.Fragment key={c.href}>
          {i > 0 && <ChevronRight size={11} strokeWidth={2} color={S.muted} />}
          <span style={{
            fontSize: 12, letterSpacing: "-0.01em",
            color: i === crumbs.length - 1 ? S.text : S.muted,
            fontWeight: i === crumbs.length - 1 ? 700 : 400,
          }}>
            {c.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── XP BADGE ────────────────────────────────────────────────────────────────
function XpBadge({ userId }: { userId: string }) {
  const { surface: S, accentColor, accentFaint, isDark } = useTheme();
  const [xp, setXp] = useState<UserXpRecord | null>(null);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchUserXp(userId).then(setXp).catch(() => {}); }, [userId]);
  useEffect(() => {
    if (!show) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setShow(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [show]);

  const total     = xp?.totalXp ?? 0;
  const redeemed  = xp?.redeemedXp ?? 0;
  const available = total - redeemed;
  const pct       = Math.min((available / XP_THRESHOLD) * 100, 100);
  const unlocked  = available >= XP_THRESHOLD;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setShow(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
          background: unlocked ? accentFaint : S.surfaceAlt,
          border: `1px solid ${unlocked ? accentColor + "50" : S.border}`,
          cursor: "pointer", transition: "all 0.15s",
        }}
        title="Your XP balance"
      >
        <Zap size={12} strokeWidth={2.2}
          color={unlocked ? accentColor : S.muted}
          fill={unlocked ? accentColor : "none"}
        />
        <span style={{ fontSize: 11, fontWeight: 700, color: unlocked ? accentColor : S.muted }}>
          {available.toLocaleString()} XP
        </span>
      </button>

      {show && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
          background: S.surface, border: `1px solid ${S.border}`,
          boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgba(0,0,0,0.14)",
          minWidth: 224, padding: 14,
          animation: "dropIn 0.12s ease",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 26, height: 26, background: accentFaint, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={13} strokeWidth={2} color={accentColor} fill={accentColor} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0 }}>Health XP</p>
              <p style={{ fontSize: 10, color: S.muted, margin: 0 }}>Earned from assessments</p>
            </div>
          </div>

          {/* Numbers */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1px 1fr 1px 1fr", gap: 0,
            background: S.surfaceAlt, padding: "10px 12px", marginBottom: 12,
          }}>
            {[
              { val: available, lbl: "Available", color: accentColor },
              { val: total,     lbl: "Total",     color: S.text },
              { val: redeemed,  lbl: "Redeemed",  color: S.muted },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ width: 1, background: S.border, margin: "0 4px" }} />}
                <div style={{ textAlign: "center", padding: "0 4px" }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: item.color, margin: 0, letterSpacing: "-0.04em" }}>
                    {item.val.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: S.muted, margin: 0, marginTop: 2 }}>
                    {item.lbl}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <p style={{ fontSize: 10, color: S.muted, margin: 0 }}>Free Consultation</p>
              <p style={{ fontSize: 10, fontWeight: 700, color: unlocked ? accentColor : S.text, margin: 0 }}>
                {available} / {XP_THRESHOLD} XP
              </p>
            </div>
            <div style={{ height: 5, background: S.surfaceAlt, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: unlocked
                  ? `linear-gradient(90deg, ${accentColor}, ${accentColor}cc)`
                  : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                transition: "width 0.7s ease",
              }} />
            </div>
          </div>

          {unlocked ? (
            <div style={{ padding: "8px 10px", background: accentFaint, border: `1px solid ${accentColor}30` }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: accentColor, margin: 0 }}>
                🎉 You&apos;ve unlocked a free consultation!
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: S.muted, lineHeight: 1.5, margin: 0 }}>
              Earn <strong style={{ color: S.text }}>{XP_THRESHOLD - available} more XP</strong> to unlock a free doctor consultation.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── USER DROPDOWN ───────────────────────────────────────────────────────────
function UserDropdown() {
  const { surface: S, accentColor, isDark } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const items = [
    { icon: User,     label: "My Profile",     action: () => router.push("/dashboard/profile") },
    { icon: Activity, label: "New Assessment", action: () => router.push("/dashboard/assessment") },
    { icon: Settings, label: "Settings",       action: () => router.push("/dashboard/settings") },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
          background: open ? S.surfaceAlt : "transparent",
          border: `1px solid ${open ? S.border : "transparent"}`,
          cursor: "pointer", transition: "all 0.14s",
        }}
      >
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 900, color: "#fff",
        }}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <span className="hidden sm:block" style={{ fontSize: 12, fontWeight: 600, color: S.text }}>
          {user?.name?.split(" ")[0] || "User"}
        </span>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50,
          background: S.surface, border: `1px solid ${S.border}`,
          boxShadow: isDark ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgba(0,0,0,0.14)",
          minWidth: 180, paddingTop: 6, paddingBottom: 6,
          animation: "dropIn 0.12s ease",
        }}>
          <div style={{ padding: "8px 12px 8px", borderBottom: `1px solid ${S.border}`, marginBottom: 4 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: S.text, margin: 0 }}>{user?.name}</p>
            <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>{user?.email}</p>
          </div>

          {items.map(item => (
            <button key={item.label} onClick={() => { item.action(); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "8px 12px",
                background: "none", border: "none",
                color: S.muted, fontSize: 12, cursor: "pointer",
                transition: "all 0.1s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = S.surfaceAlt; (e.currentTarget as HTMLElement).style.color = S.text; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = S.muted; }}
            >
              <item.icon size={13} strokeWidth={1.8} />
              {item.label}
            </button>
          ))}

          <div style={{ borderTop: `1px solid ${S.border}`, margin: "4px 0" }} />

          <button onClick={() => { logout(); setOpen(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              width: "100%", padding: "8px 12px",
              background: "none", border: "none",
              color: S.muted, fontSize: 12, cursor: "pointer", transition: "all 0.1s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)"; (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = S.muted; }}
          >
            <LogOut size={13} strokeWidth={1.8} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
export default function DashboardHeader({ onMobileMenuOpen }: { onMobileMenuOpen: () => void }) {
  const { surface: S, isDark, accentColor, toggleTheme } = useTheme();
  const { user } = useAuth();

  // Remove theme toggle button from header — ThemeToggle panel handles it
  // But keep a small icon for mobile convenience
  return (
    <>
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 56, flexShrink: 0, zIndex: 30,
        background: S.surface, borderBottom: `1px solid ${S.border}`,
      }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <button
            onClick={onMobileMenuOpen}
            className="lg:hidden"
            style={{
              width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
              background: S.surfaceAlt, border: `1px solid ${S.border}`,
              color: S.muted, cursor: "pointer",
            }}
          >
            <Menu size={14} strokeWidth={2} />
          </button>
          <Breadcrumbs />
        </div>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {user?.id && <XpBadge userId={user.id} />}

          <div style={{ width: 1, height: 20, background: S.border, margin: "0 2px" }} />

          {/* Notifications */}
          <button style={{
            position: "relative", width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: S.surfaceAlt, border: `1px solid ${S.border}`,
            color: S.muted, cursor: "pointer", transition: "all 0.14s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = accentColor; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted; }}
          >
            <Bell size={13} strokeWidth={2} />
            <span style={{
              position: "absolute", top: 5, right: 5, width: 6, height: 6,
              background: accentColor, borderRadius: "50%",
            }} />
          </button>

          <div style={{ width: 1, height: 20, background: S.border, margin: "0 2px" }} />

          <UserDropdown />
        </div>
      </header>

      <style>{`
        @keyframes dropIn {
          from { transform: translateY(-5px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
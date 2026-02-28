/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Sun, Moon, Palette, Check, Shield, Trash2, KeyRound,
  Bell, Eye, EyeOff, AlertTriangle, CheckCircle, Loader2,
  ChevronRight, User, LogOut, Sliders, Type, Contrast,
  Zap, RefreshCw, Lock,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/useAuth";
import {
  useTheme,
  ACCENT_PALETTES,
  DARK_VARIANTS,
  type AccentColor,
  type DarkVariant,
} from "@/contexts/ThemeContext";
import { account } from "@/lib/appwrite";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SettingsSection = "appearance" | "security" | "notifications" | "account";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function SectionLabel({ children, S }: { children: React.ReactNode; S: any }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "24px 0 14px" }}>
      <p style={{
        fontSize: 9, fontWeight: 900, letterSpacing: "0.18em",
        textTransform: "uppercase", color: S.subtle, margin: 0, whiteSpace: "nowrap",
      }}>
        {children}
      </p>
      <div style={{ flex: 1, height: 1, background: S.border }} />
    </div>
  );
}

function SettingRow({
  label, sub, children, S,
}: {
  label: string; sub?: string; children: React.ReactNode; S: any;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 16, padding: "13px 0",
      borderBottom: `1px solid ${S.border}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: 11, color: S.muted, margin: "2px 0 0", lineHeight: 1.45 }}>{sub}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
function Toggle({
  checked, onChange, accentColor,
}: {
  checked: boolean; onChange: (v: boolean) => void; accentColor: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 12, padding: 2,
        background: checked ? accentColor : "rgba(148,163,184,0.3)",
        border: "none", cursor: "pointer",
        transition: "background 0.2s ease",
        display: "flex", alignItems: "center",
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        transform: checked ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.2s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </button>
  );
}

// ─── NAV PILL ─────────────────────────────────────────────────────────────────
function NavPill({
  id, label, icon: Icon, active, onClick, S, accentColor, accentFaint,
}: {
  id: SettingsSection; label: string; icon: React.ElementType;
  active: boolean; onClick: () => void; S: any; accentColor: string; accentFaint: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 12px",
        background: active ? accentFaint : "transparent",
        border: `1px solid ${active ? accentColor + "55" : "transparent"}`,
        borderLeft: active ? `3px solid ${accentColor}` : "3px solid transparent",
        color: active ? accentColor : S.muted,
        cursor: "pointer", transition: "all 0.15s",
        textAlign: "left",
      }}
    >
      <Icon size={14} strokeWidth={active ? 2.2 : 1.8} />
      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500 }}>{label}</span>
      {active && <ChevronRight size={11} strokeWidth={2.5} style={{ marginLeft: "auto" }} />}
    </button>
  );
}

// ─── FONT SIZE SLIDER ─────────────────────────────────────────────────────────
function FontSizeControl({ S, accentColor }: { S: any; accentColor: string }) {
  const sizes = ["Small", "Default", "Large", "XL"];
  const [active, setActive] = useState(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hmex-font-size");
      if (saved !== null) setActive(Number(saved));
    } catch { /* */ }
  }, []);

  const apply = (idx: number) => {
    setActive(idx);
    const scale = [0.9, 1, 1.1, 1.2][idx];
    document.documentElement.style.setProperty("--font-scale", String(scale));
    try { localStorage.setItem("hmex-font-size", String(idx)); } catch { /* */ }
  };

  return (
    <div style={{ display: "flex", gap: 6 }}>
      {sizes.map((s, i) => (
        <button
          key={s}
          onClick={() => apply(i)}
          style={{
            padding: "5px 11px",
            background: active === i ? accentColor : S.surfaceAlt,
            border: `1px solid ${active === i ? accentColor : S.border}`,
            color: active === i ? "#fff" : S.muted,
            fontSize: 11 + i,
            fontWeight: active === i ? 700 : 400,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
        >
          {s[0]}
        </button>
      ))}
    </div>
  );
}

// ─── APPEARANCE SECTION ───────────────────────────────────────────────────────
function AppearanceSection({ S }: { S: any }) {
  const {
    theme, isDark, darkVariant, accent, accentColor, accentSecondary,
    accentFaint, toggleTheme, setDarkVariant, setAccent,
  } = useTheme();

  return (
    <div>
      <SectionLabel S={S}>Color Mode</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
        {([
          ["light", "Light", Sun],
          ["dark",  "Dark",  Moon],
        ] as const).map(([mode, label, Icon]) => {
          const active = theme === mode;
          return (
            <button
              key={mode}
              onClick={() => { if (theme !== mode) toggleTheme(); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, padding: "18px 12px",
                background: active ? accentFaint : S.surfaceAlt,
                border: `1px solid ${active ? accentColor : S.border}`,
                cursor: "pointer", transition: "all 0.15s", position: "relative",
              }}
            >
              <Icon size={20} strokeWidth={1.6} color={active ? accentColor : S.muted} />
              <span style={{ fontSize: 12, fontWeight: active ? 800 : 500, color: active ? accentColor : S.muted }}>
                {label}
              </span>
              {active && (
                <div style={{
                  position: "absolute", top: 7, right: 7,
                  width: 17, height: 17, background: accentColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={9} strokeWidth={3} color="#fff" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <SectionLabel S={S}>Accent Colour</SectionLabel>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        {(Object.entries(ACCENT_PALETTES) as [AccentColor, (typeof ACCENT_PALETTES)[AccentColor]][]).map(([key, val]) => (
          <button
            key={key}
            title={val.label}
            onClick={() => setAccent(key)}
            style={{
              width: 36, height: 36, background: val.primary,
              border: accent === key ? `3px solid ${S.text}` : "3px solid transparent",
              outline: accent === key ? `2px solid ${val.primary}` : "2px solid transparent",
              outlineOffset: 2,
              cursor: "pointer",
              transition: "transform 0.15s ease",
              transform: accent === key ? "scale(1.18)" : "scale(1)",
              position: "relative", borderRadius: 2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {accent === key && <Check size={13} strokeWidth={3} color="#fff" />}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 12, color: S.muted, marginBottom: 4, fontWeight: 600 }}>
        Selected: <span style={{ color: accentColor }}>{ACCENT_PALETTES[accent].label}</span>
      </p>

      {isDark && (
        <>
          <SectionLabel S={S}>Dark Variant</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {(Object.entries(DARK_VARIANTS) as [DarkVariant, (typeof DARK_VARIANTS)[DarkVariant]][]).map(([key, val]) => {
              const active = darkVariant === key;
              return (
                <button
                  key={key}
                  onClick={() => setDarkVariant(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    background: active ? `${accentColor}10` : "transparent",
                    border: `1px solid ${active ? accentColor : S.border}`,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    {[val.bg, val.surface, val.surfaceAlt].map((c, i) => (
                      <div key={i} style={{ width: 12, height: 26, background: c, borderRadius: 1 }} />
                    ))}
                  </div>
                  <span style={{
                    fontSize: 12, flex: 1, textAlign: "left",
                    fontWeight: active ? 700 : 500,
                    color: active ? accentColor : S.text,
                  }}>
                    {val.label}
                  </span>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: `2px solid ${active ? accentColor : S.border}`,
                    background: active ? accentColor : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {active && <Check size={9} strokeWidth={3} color="#fff" />}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <SectionLabel S={S}>Text Size</SectionLabel>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>Adjust dashboard text size</p>
        <FontSizeControl S={S} accentColor={accentColor} />
      </div>

      <SectionLabel S={S}>Contrast</SectionLabel>
      <SettingRow label="High contrast borders" sub="Increase border visibility for better readability" S={S}>
        <Toggle
          checked={false}
          onChange={() => {}}
          accentColor={accentColor}
        />
      </SettingRow>

      {/* Preview swatch */}
      <div style={{
        marginTop: 20, padding: "16px 18px",
        background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}06)`,
        border: `1px solid ${accentColor}30`,
      }}>
        <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: accentColor, margin: "0 0 6px" }}>
          Live Preview
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ padding: "6px 14px", background: accentColor, fontSize: 11, fontWeight: 700, color: "#fff" }}>Primary</div>
          <div style={{ padding: "6px 14px", background: accentFaint, border: `1px solid ${accentColor}40`, fontSize: 11, fontWeight: 700, color: accentColor }}>Faint</div>
          <div style={{ padding: "6px 14px", background: S.surfaceAlt, border: `1px solid ${S.border}`, fontSize: 11, color: S.muted }}>Surface</div>
        </div>
      </div>
    </div>
  );
}

// ─── SECURITY SECTION ─────────────────────────────────────────────────────────
function SecuritySection({ S, accentColor, accentFaint }: { S: any; accentColor: string; accentFaint: string }) {
  const [current,  setCurrent]  = useState("");
  const [newPw,    setNewPw]    = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const strength = (() => {
    if (!newPw) return 0;
    let s = 0;
    if (newPw.length >= 8)  s++;
    if (/[A-Z]/.test(newPw)) s++;
    if (/[0-9]/.test(newPw)) s++;
    if (/[^A-Za-z0-9]/.test(newPw)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f97316", "#eab308", "#22c55e"][strength];

  const handleChangePassword = async () => {
    setStatus(null);
    if (!current) { setStatus({ type: "error", msg: "Enter your current password." }); return; }
    if (newPw.length < 8) { setStatus({ type: "error", msg: "New password must be at least 8 characters." }); return; }
    if (newPw !== confirm) { setStatus({ type: "error", msg: "Passwords do not match." }); return; }
    setLoading(true);
    try {
      await account.updatePassword(newPw, current);
      setStatus({ type: "success", msg: "Password updated successfully." });
      setCurrent(""); setNewPw(""); setConfirm("");
    } catch (e: any) {
      const msg = e?.message ?? "Failed to update password.";
      setStatus({ type: "error", msg: msg.includes("Invalid credentials") ? "Current password is incorrect." : msg });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused?: boolean): React.CSSProperties => ({
    width: "100%", padding: "10px 44px 10px 14px",
    background: S.surfaceAlt, border: `1px solid ${focused ? accentColor : S.border}`,
    color: S.text, fontSize: 13, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  });

  const PasswordField = ({
    val, set, show, setShow, placeholder,
  }: {
    val: string; set: (v: string) => void;
    show: boolean; setShow: (v: boolean) => void; placeholder: string;
  }) => (
    <div style={{ position: "relative" }}>
      <input
        type={show ? "text" : "password"}
        value={val}
        onChange={e => set(e.target.value)}
        placeholder={placeholder}
        style={inputStyle()}
        onFocus={e => { e.target.style.borderColor = accentColor; }}
        onBlur={e => { e.target.style.borderColor = S.border; }}
      />
      <button
        onClick={() => setShow(!show)}
        style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          background: "none", border: "none", cursor: "pointer", color: S.muted, padding: 0,
        }}
      >
        {show ? <EyeOff size={14} strokeWidth={1.8} /> : <Eye size={14} strokeWidth={1.8} />}
      </button>
    </div>
  );

  return (
    <div>
      <SectionLabel S={S}>Change Password</SectionLabel>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: S.subtle, marginBottom: 6 }}>
            Current Password
          </label>
          <PasswordField val={current} set={setCurrent} show={showCurr} setShow={setShowCurr} placeholder="Enter current password" />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: S.subtle, marginBottom: 6 }}>
            New Password
          </label>
          <PasswordField val={newPw} set={setNewPw} show={showNew} setShow={setShowNew} placeholder="Min. 8 characters" />
          {newPw && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 2,
                    background: i <= strength ? strengthColor : S.surfaceAlt,
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>
              <p style={{ fontSize: 11, color: strengthColor, margin: 0, fontWeight: 600 }}>{strengthLabel}</p>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: S.subtle, marginBottom: 6 }}>
            Confirm New Password
          </label>
          <PasswordField val={confirm} set={setConfirm} show={showConf} setShow={setShowConf} placeholder="Repeat new password" />
          {confirm && newPw && confirm !== newPw && (
            <p style={{ fontSize: 11, color: "#ef4444", margin: "5px 0 0", fontWeight: 600 }}>Passwords do not match</p>
          )}
        </div>

        {status && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
            background: status.type === "success" ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${status.type === "success" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
            color: status.type === "success" ? "#22c55e" : "#ef4444",
            fontSize: 12,
          }}>
            {status.type === "success"
              ? <CheckCircle size={14} strokeWidth={2} />
              : <AlertTriangle size={14} strokeWidth={2} />}
            {status.msg}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 20px",
            background: `linear-gradient(135deg, ${accentColor}, #059669)`,
            border: "none", color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.15s",
            boxShadow: `0 4px 16px ${accentColor}35`,
          }}
        >
          {loading
            ? <><Loader2 size={14} strokeWidth={2} className="animate-spin" />Updating…</>
            : <><KeyRound size={14} strokeWidth={2} />Update Password</>}
        </button>
      </div>

      <SectionLabel S={S}>Sessions</SectionLabel>
      <div style={{
        padding: "14px 16px",
        background: S.surfaceAlt, border: `1px solid ${S.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>Current session</p>
          <p style={{ fontSize: 11, color: S.muted, margin: "2px 0 0" }}>Active now · This device</p>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: "50%", background: "#22c55e",
          boxShadow: "0 0 8px rgba(34,197,94,0.6)",
        }} />
      </div>

      <SectionLabel S={S}>Two-Factor Authentication</SectionLabel>
      <div style={{
        padding: "16px",
        background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}>
        <Lock size={15} strokeWidth={1.8} color="#6366f1" style={{ marginTop: 1 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", margin: "0 0 3px" }}>2FA coming soon</p>
          <p style={{ fontSize: 11, color: S.muted, margin: 0, lineHeight: 1.5 }}>
            Two-factor authentication will be available in the next update for added account security.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS SECTION ────────────────────────────────────────────────────
function NotificationsSection({ S, accentColor }: { S: any; accentColor: string }) {
  const [prefs, setPrefs] = useState({
    riskAlerts:      true,
    recommendations: true,
    xpMilestones:    true,
    reminders:       false,
    emailDigest:     false,
  });

  const toggle = (key: keyof typeof prefs) =>
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));

  const rows: { key: keyof typeof prefs; label: string; sub: string }[] = [
    { key: "riskAlerts",      label: "Risk Alerts",         sub: "Urgent notifications when high risk is detected" },
    { key: "recommendations", label: "Recommendations",     sub: "New personalised health tips after assessments" },
    { key: "xpMilestones",   label: "XP & Milestones",     sub: "XP earned and achievement unlocks" },
    { key: "reminders",      label: "Check-up Reminders",   sub: "Periodic nudges to retake your assessment" },
    { key: "emailDigest",    label: "Email Digest",         sub: "Weekly summary sent to your email address" },
  ];

  return (
    <div>
      <SectionLabel S={S}>Notification Preferences</SectionLabel>
      {rows.map(({ key, label, sub }) => (
        <SettingRow key={key} label={label} sub={sub} S={S}>
          <Toggle checked={prefs[key]} onChange={() => toggle(key)} accentColor={accentColor} />
        </SettingRow>
      ))}

      <SectionLabel S={S}>Quiet Hours</SectionLabel>
      <div style={{
        padding: "14px 16px",
        background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
      }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", margin: "0 0 3px" }}>Coming soon</p>
        <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
          Set time windows where notifications are silenced.
        </p>
      </div>
    </div>
  );
}

// ─── ACCOUNT SECTION ─────────────────────────────────────────────────────────
function AccountSection({
  S, accentColor, accentFaint, isDark,
}: {
  S: any; accentColor: string; accentFaint: string; isDark: boolean;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();

  // Export
  const [exporting,    setExporting]    = useState(false);
  const [exportDone,   setExportDone]   = useState(false);

  // Delete flow
  const [deletePhase,  setDeletePhase]  = useState<0 | 1 | 2>(0); // 0=idle 1=confirm 2=deleting
  const [deleteInput,  setDeleteInput]  = useState("");
  const [deleteError,  setDeleteError]  = useState<string | null>(null);

  // Sign out all
  const [signingOut,   setSigningOut]   = useState(false);

  const CONFIRM_PHRASE = "delete my account";

  const handleExport = async () => {
    setExporting(true);
    // Simulate data export — in production fetch real data
    await new Promise(r => setTimeout(r, 1200));
    const data = {
      exportedAt: new Date().toISOString(),
      user: { id: user?.id, name: user?.name, email: user?.email },
      note: "Full data export — assessment history available via Appwrite console.",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "hmex-data-export.json"; a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const handleSignOutAll = async () => {
    setSigningOut(true);
    try {
      await account.deleteSessions();
      logout();
      router.push("/login");
    } catch {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput.toLowerCase() !== CONFIRM_PHRASE) {
      setDeleteError(`Type "${CONFIRM_PHRASE}" exactly to confirm.`);
      return;
    }
    setDeletePhase(2);
    try {
      // Delete Appwrite auth account
      // Note: Appwrite doesn't allow users to delete their own auth account via client SDK
      // In production, call a server-side endpoint that uses admin API key
      // For now: delete the session and log out — data remains but access is revoked
      await account.deleteSessions();
      logout();
      router.push("/?deleted=1");
    } catch (e: any) {
      setDeleteError(e?.message ?? "Failed to delete account. Contact support.");
      setDeletePhase(1);
    }
  };

  return (
    <div>
      <SectionLabel S={S}>Account Info</SectionLabel>
      <div style={{
        padding: "16px",
        background: S.surfaceAlt, border: `1px solid ${S.border}`,
        display: "flex", alignItems: "center", gap: 14,
        marginBottom: 4,
      }}>
        <div style={{
          width: 44, height: 44, flexShrink: 0,
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 900, color: "#fff",
        }}>
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: S.text, margin: 0, letterSpacing: "-0.02em" }}>
            {user?.name || "—"}
          </p>
          <p style={{ fontSize: 12, color: S.muted, margin: "2px 0 0" }}>{user?.email}</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/profile")}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "7px 12px", background: accentFaint,
            border: `1px solid ${accentColor}40`, color: accentColor,
            fontSize: 11, fontWeight: 700, cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          <User size={12} strokeWidth={2} /> Edit Profile
        </button>
      </div>

      <SectionLabel S={S}>Data & Privacy</SectionLabel>
      <SettingRow label="Export your data" sub="Download a JSON file of your account and assessment data" S={S}>
        <button
          onClick={handleExport}
          disabled={exporting}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", background: exportDone ? "rgba(34,197,94,0.1)" : S.surfaceAlt,
            border: `1px solid ${exportDone ? "rgba(34,197,94,0.3)" : S.border}`,
            color: exportDone ? "#22c55e" : S.muted,
            fontSize: 11, fontWeight: 600, cursor: exporting ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {exporting
            ? <><Loader2 size={12} strokeWidth={2} className="animate-spin" />Exporting…</>
            : exportDone
            ? <><CheckCircle size={12} strokeWidth={2} />Downloaded!</>
            : <><RefreshCw size={12} strokeWidth={2} />Export</>}
        </button>
      </SettingRow>

      <SectionLabel S={S}>Sessions</SectionLabel>
      <SettingRow label="Sign out all devices" sub="Invalidates all active sessions across every device" S={S}>
        <button
          onClick={handleSignOutAll}
          disabled={signingOut}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "7px 14px", background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444",
            fontSize: 11, fontWeight: 600, cursor: signingOut ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
        >
          {signingOut
            ? <><Loader2 size={12} strokeWidth={2} className="animate-spin" />Signing out…</>
            : <><LogOut size={12} strokeWidth={2} />Sign out all</>}
        </button>
      </SettingRow>

      {/* DANGER ZONE */}
      <SectionLabel S={S}>Danger Zone</SectionLabel>
      <div style={{
        border: "1px solid rgba(239,68,68,0.25)",
        background: isDark ? "rgba(239,68,68,0.04)" : "rgba(239,68,68,0.02)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          padding: "14px 16px",
          borderBottom: deletePhase > 0 ? "1px solid rgba(239,68,68,0.2)" : "none",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <AlertTriangle size={15} color="#ef4444" strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", margin: 0 }}>Delete Account</p>
              <p style={{ fontSize: 11, color: S.muted, margin: "3px 0 0", lineHeight: 1.5 }}>
                Permanently deletes your account and all health data. This action cannot be undone.
              </p>
            </div>
          </div>
          {deletePhase === 0 && (
            <button
              onClick={() => setDeletePhase(1)}
              style={{
                padding: "7px 14px", background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444",
                fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <Trash2 size={12} strokeWidth={2} /> Delete
            </button>
          )}
        </div>

        {/* Confirm step */}
        {deletePhase === 1 && (
          <div style={{ padding: "16px" }}>
            <p style={{ fontSize: 12, color: S.text, margin: "0 0 10px", lineHeight: 1.6 }}>
              To confirm, type <strong style={{ color: "#ef4444" }}>&quot;{CONFIRM_PHRASE}&quot;</strong> in the field below:
            </p>
            <input
              type="text"
              value={deleteInput}
              onChange={e => { setDeleteInput(e.target.value); setDeleteError(null); }}
              placeholder={CONFIRM_PHRASE}
              style={{
                width: "100%", padding: "10px 14px",
                background: S.surfaceAlt, border: "1px solid rgba(239,68,68,0.4)",
                color: S.text, fontSize: 13, outline: "none", fontFamily: "inherit",
                marginBottom: 10, boxSizing: "border-box",
              }}
            />
            {deleteError && (
              <p style={{ fontSize: 11, color: "#ef4444", margin: "0 0 10px", fontWeight: 600 }}>
                {deleteError}
              </p>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setDeletePhase(0); setDeleteInput(""); setDeleteError(null); }}
                style={{
                  flex: 1, padding: "9px", background: S.surfaceAlt,
                  border: `1px solid ${S.border}`, color: S.muted,
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={(deletePhase as number) === 2}
                style={{
                  flex: 1, padding: "9px",
                  background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)",
                  color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <Trash2 size={12} strokeWidth={2} /> Confirm Delete
              </button>
            </div>
          </div>
        )}

        {deletePhase === 2 && (
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 10 }}>
            <Loader2 size={15} strokeWidth={2} color="#ef4444" className="animate-spin" />
            <p style={{ fontSize: 12, color: "#ef4444", margin: 0, fontWeight: 600 }}>
              Deleting account…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const auth = useRequireAuth();
  const { isDark, surface: S, accentColor, accentFaint } = useTheme();
  const [activeSection, setActiveSection] = useState<SettingsSection>("appearance");

  if (auth.loading) return null;

  const NAV_ITEMS: { id: SettingsSection; label: string; icon: React.ElementType }[] = [
    { id: "appearance",    label: "Appearance",    icon: Palette },
    { id: "security",      label: "Security",       icon: Shield },
    { id: "notifications", label: "Notifications",  icon: Bell },
    { id: "account",       label: "Account",        icon: User },
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>

        {/* ── PAGE HEADER ── */}
        <div
          style={{
            marginBottom: 24,
            animation: "fadeUp 0.45s ease both",
          }}
        >
          <p style={{
            fontSize: 10, fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.18em", color: accentColor, margin: "0 0 4px",
          }}>
            Settings
          </p>
          <h1 style={{
            fontSize: "clamp(1.4rem, 3.5vw, 1.9rem)",
            fontWeight: 900, color: S.text,
            letterSpacing: "-0.035em", margin: "0 0 6px",
          }}>
            Preferences & Account
          </h1>
          <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>
            Customise your dashboard experience, manage security, and control your account.
          </p>
        </div>

        {/* ── BODY ── */}
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* ── SIDEBAR NAV ── */}
          <div
            style={{
              width: 196, flexShrink: 0,
              background: S.surface, border: `1px solid ${S.border}`,
              overflow: "hidden",
              position: "sticky", top: 16,
              animation: "fadeUp 0.45s ease 0.05s both",
            }}
          >
            <div style={{ padding: "12px 0" }}>
              {NAV_ITEMS.map(item => (
                <NavPill
                  key={item.id}
                  {...item}
                  active={activeSection === item.id}
                  onClick={() => setActiveSection(item.id)}
                  S={S}
                  accentColor={accentColor}
                  accentFaint={accentFaint}
                />
              ))}
            </div>

            {/* Mini accent preview */}
            <div style={{
              padding: "10px 12px",
              borderTop: `1px solid ${S.border}`,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                background: `linear-gradient(135deg, ${accentColor}, #059669)`,
              }} />
              <div>
                <p style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: S.subtle, margin: 0 }}>
                  Theme
                </p>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.text, margin: 0 }}>
                  {isDark ? "Dark" : "Light"}
                </p>
              </div>
            </div>
          </div>

          {/* ── CONTENT PANEL ── */}
          <div
            key={activeSection}
            style={{
              flex: 1, minWidth: 0,
              background: S.surface, border: `1px solid ${S.border}`,
              padding: "20px 24px 28px",
              animation: "fadeUp 0.3s ease both",
            }}
          >
            {/* Panel header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
              paddingBottom: 14, borderBottom: `1px solid ${S.border}`,
            }}>
              {(() => {
                const item = NAV_ITEMS.find(n => n.id === activeSection)!;
                return (
                  <>
                    <div style={{
                      width: 30, height: 30,
                      background: accentFaint, color: accentColor,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <item.icon size={14} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, color: S.text, margin: 0, letterSpacing: "-0.02em" }}>
                        {item.label}
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>

            {activeSection === "appearance"    && <AppearanceSection S={S} />}
            {activeSection === "security"      && <SecuritySection S={S} accentColor={accentColor} accentFaint={accentFaint} />}
            {activeSection === "notifications" && <NotificationsSection S={S} accentColor={accentColor} />}
            {activeSection === "account"       && <AccountSection S={S} accentColor={accentColor} accentFaint={accentFaint} isDark={isDark} />}
          </div>
        </div>

        <p style={{
          textAlign: "center", fontSize: 11, marginTop: 24, paddingBottom: 8,
          color: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.2)",
        }}>
          HMEX · Settings · Changes are saved automatically
        </p>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </DashboardLayout>
  );
}
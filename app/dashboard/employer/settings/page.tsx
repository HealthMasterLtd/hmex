/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  useTheme,
  ACCENT_PALETTES,
  DARK_VARIANTS,
  type AccentColor,
  type DarkVariant,
} from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import ThemeToggle from "@/components/Themetoggle";
import {
  getUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getProfileImageUrl,
  type UserProfile,
} from "@/services/userService";
import { getCompanyByOwner, type Company } from "@/services/companyService";
import { account } from "@/lib/appwrite";
import {
  User, Palette, Bell, Lock,
  Building2, Camera, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, Sun, Moon,
  Loader2, RefreshCw, Mail, Phone,
  Briefcase, MapPin, Type, Sliders,
} from "lucide-react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, r = 2 }: { w: string | number; h: number; r?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse" style={{
      width: w, height: h, borderRadius: r,
      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
    }} />
  );
}

function Toast({ msg, type, onClose }: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  const { accentColor } = useTheme();
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 24, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12 }}
      style={{ position: "fixed", bottom: 24, right: 24, zIndex: 999, padding: "12px 20px", background: type === "ok" ? accentColor : "#EF4444", color: "#fff", borderRadius: 2, display: "flex", alignItems: "center", gap: 9, fontSize: 13, fontWeight: 700, boxShadow: "0 8px 28px rgba(0,0,0,0.18)", maxWidth: 360 }}>
      {type === "ok" ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
    </motion.div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  const { surface: c } = useTheme();
  return <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{children}</label>;
}

function Input({ value, onChange, type = "text", placeholder, disabled, style }: {
  value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean; style?: React.CSSProperties;
}) {
  const { surface: c, isDark } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <input type={type} value={value} disabled={disabled} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, background: c.surfaceAlt, border: `1px solid ${focus ? "var(--accent)" : c.border}`, color: c.text, borderRadius: 2, outline: "none", transition: "border-color 0.15s", boxSizing: "border-box", opacity: disabled ? 0.55 : 1, ...style }}
    />
  );
}

function SaveButton({ loading, onClick, label = "Save Changes" }: { loading: boolean; onClick: () => void; label?: string }) {
  const { accentColor } = useTheme();
  return (
    <button onClick={onClick} disabled={loading}
      style={{ padding: "9px 22px", background: accentColor, border: "none", color: "#fff", fontSize: 12, fontWeight: 800, borderRadius: 2, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, opacity: loading ? 0.75 : 1 }}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
      {loading ? "Saving…" : label}
    </button>
  );
}

// ─── TABS CONFIG ──────────────────────────────────────────────────────────────
const TABS = [
  { key: "profile",      label: "Profile",      Icon: User     },
  { key: "appearance",   label: "Appearance",   Icon: Palette  },
  { key: "notifications",label: "Notifications",Icon: Bell     },
  { key: "security",     label: "Security",     Icon: Lock     },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── FONT SIZE OPTIONS ────────────────────────────────────────────────────────
const FONT_SIZES = [
  { key: "sm",  label: "Small",   px: "13px" },
  { key: "md",  label: "Default", px: "14px" },
  { key: "lg",  label: "Large",   px: "15px" },
  { key: "xl",  label: "X-Large", px: "16px" },
] as const;

// ═════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═════════════════════════════════════════════════════════════════════════════
export default function EmployerSettingsPage() {
  const { user }                                          = useAuth();
  const { isDark, surface: c, accentColor, theme, toggleTheme,
          darkVariant, setDarkVariant, accent, setAccent } = useTheme();

  const [tab,       setTab]       = useState<TabKey>("profile");
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [profile,   setProfile]   = useState<UserProfile | null>(null);
  const [company,   setCompany]   = useState<Company | null>(null);
  const [fontSize,  setFontSize]  = useState<"sm" | "md" | "lg" | "xl">("md");
  const avatarRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [fullName,    setFullName]    = useState("");
  const [phone,       setPhone]       = useState("");
  const [occupation,  setOccupation]  = useState("");
  const [bio,         setBio]         = useState("");
  const [location,    setLocation]    = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarUrl,   setAvatarUrl]   = useState<string | null>(null);

  // Password form
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew,     setPwNew]     = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw,    setShowPw]    = useState<"current" | "new" | "confirm" | null>(null);
  const [pwSaving,  setPwSaving]  = useState(false);

  // Notifications form
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush,  setNotifPush]  = useState(false);
  const [notifSms,   setNotifSms]   = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => setToast({ msg, type });

  // ─── LOAD ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [p, co] = await Promise.all([
        getUserProfile(user.id).catch(() => null),
        getCompanyByOwner(user.id).catch(() => null),
      ]);
      if (p) {
        setProfile(p);
        setFullName(p.fullName || "");
        setPhone(p.phone || "");
        setOccupation(p.occupation || "");
        setBio(p.bio || "");
        setLocation(p.location || "");
        setNotifEmail(p.notifications?.email ?? true);
        setNotifPush(p.notifications?.push  ?? false);
        setNotifSms(p.notifications?.sms    ?? false);
        if (p.avatar) setAvatarUrl(getProfileImageUrl(p.avatar));
      }
      setCompany(co);
      setLoading(false);
    })();
  }, [user]);

  // Apply font size to root
  useEffect(() => {
    const px = FONT_SIZES.find(f => f.key === fontSize)?.px || "14px";
    document.documentElement.style.setProperty("--base-font-size", px);
    try { localStorage.setItem("hmex-font-size", fontSize); } catch {}
  }, [fontSize]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("hmex-font-size") as "sm"|"md"|"lg"|"xl"|null;
      if (saved) setFontSize(saved);
    } catch {}
  }, []);

  // ─── SAVE PROFILE ──────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, { fullName, phone, occupation, bio, location } as any);
      showToast("Profile updated successfully");
    } catch {
      showToast("Failed to save profile", "err");
    } finally {
      setSaving(false);
    }
  };

  // ─── AVATAR UPLOAD ─────────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarLoading(true);
    try {
      const fileId = await uploadProfileImage(user.id, file);
      if (fileId) {
        setAvatarUrl(getProfileImageUrl(fileId));
        showToast("Avatar updated");
      }
    } catch (err: any) {
      showToast(err?.message || "Upload failed", "err");
    } finally {
      setAvatarLoading(false);
    }
  };

  // ─── SAVE NOTIFICATIONS ────────────────────────────────────────────────────
  const saveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        notifications: { email: notifEmail, push: notifPush, sms: notifSms },
      } as any);
      showToast("Notification preferences saved");
    } catch {
      showToast("Failed to save preferences", "err");
    } finally {
      setSaving(false);
    }
  };

  // ─── CHANGE PASSWORD ───────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!pwCurrent || !pwNew || !pwConfirm) { showToast("Please fill all fields", "err"); return; }
    if (pwNew !== pwConfirm) { showToast("New passwords don't match", "err"); return; }
    if (pwNew.length < 8) { showToast("Password must be at least 8 characters", "err"); return; }
    setPwSaving(true);
    try {
      await account.updatePassword(pwNew, pwCurrent);
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
      showToast("Password changed successfully");
    } catch (err: any) {
      const msg = err?.message?.includes("Invalid credentials")
        ? "Current password is incorrect"
        : err?.message || "Failed to change password";
      showToast(msg, "err");
    } finally {
      setPwSaving(false);
    }
  };

  // ─── TOGGLE COMPONENT ──────────────────────────────────────────────────────
  const Toggle = ({ on, onChange }: { on: boolean; onChange: () => void }) => (
    <button onClick={onChange} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
      <div style={{ width: 42, height: 23, background: on ? accentColor : isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)", borderRadius: 12, position: "relative", transition: "background 0.2s" }}>
        <div style={{ width: 17, height: 17, background: "#fff", borderRadius: "50%", position: "absolute", top: 3, left: on ? 22 : 3, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
      </div>
    </button>
  );

  // ─── SECTION CARD ──────────────────────────────────────────────────────────
  const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div style={{ padding: "22px 24px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, marginBottom: 14 }}>
      <div style={{ marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${c.border}` }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: c.text }}>{title}</p>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 11, color: c.muted }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 80, maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>Account</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.7rem)", fontWeight: 900, color: c.text, letterSpacing: "-0.03em" }}>Settings</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted }}>
            {profile?.email || user?.email || ""}
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${c.border}`, marginBottom: 24, overflowX: "auto" }}>
          {TABS.map(({ key, label, Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "none", border: "none", borderBottom: tab === key ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: -1, cursor: "pointer", fontSize: 12, fontWeight: tab === key ? 800 : 600, color: tab === key ? accentColor : c.muted, whiteSpace: "nowrap", transition: "color 0.12s" }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROFILE TAB                                                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Avatar + basic info */}
            <Section title="Personal Information" subtitle="Your name and profile picture visible in the dashboard">
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: `${accentColor}20`, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${c.border}` }}>
                    {avatarLoading
                      ? <Loader2 size={24} style={{ color: accentColor }} className="animate-spin" />
                      : avatarUrl
                        ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setAvatarUrl(null)} />
                        : <span style={{ fontSize: 28, fontWeight: 900, color: accentColor }}>
                            {(fullName || "?")[0].toUpperCase()}
                          </span>
                    }
                  </div>
                  <button onClick={() => avatarRef.current?.click()}
                    style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: accentColor, border: `2px solid ${c.surface}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <Camera size={12} color="#fff" />
                  </button>
                  <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  {loading ? <Skeleton w="60%" h={14} /> : (
                    <p style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 900, color: c.text }}>{profile?.fullName || "—"}</p>
                  )}
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: c.muted }}>{profile?.email}</p>
                  {company && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 5 }}>
                      <Building2 size={11} style={{ color: c.muted }} />
                      <span style={{ fontSize: 11, color: c.muted }}>{company.name} · {company.industry}</span>
                    </div>
                  )}
                  <p style={{ margin: "8px 0 0", fontSize: 10, color: c.muted, opacity: 0.7 }}>Click the camera icon to change your photo (max 5MB)</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <FieldLabel><span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={10} />Full Name</span></FieldLabel>
                  {loading ? <Skeleton w="100%" h={38} /> : <Input value={fullName} onChange={setFullName} placeholder="Your full name" />}
                </div>
                <div>
                  <FieldLabel><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Phone size={10} />Phone</span></FieldLabel>
                  {loading ? <Skeleton w="100%" h={38} /> : <Input value={phone} onChange={setPhone} placeholder="+1 234 567 8900" />}
                </div>
                <div>
                  <FieldLabel><span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={10} />Job Title</span></FieldLabel>
                  {loading ? <Skeleton w="100%" h={38} /> : <Input value={occupation} onChange={setOccupation} placeholder="e.g. HR Director" />}
                </div>
                <div>
                  <FieldLabel><span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} />Location</span></FieldLabel>
                  {loading ? <Skeleton w="100%" h={38} /> : <Input value={location} onChange={setLocation} placeholder="City, Country" />}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <FieldLabel>Bio</FieldLabel>
                  {loading ? <Skeleton w="100%" h={68} /> : (
                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="A short description about yourself…"
                      style={{ width: "100%", padding: "9px 12px", fontSize: 13, fontWeight: 500, background: c.surfaceAlt, border: `1px solid ${c.border}`, color: c.text, borderRadius: 2, outline: "none", resize: "vertical", minHeight: 72, boxSizing: "border-box", fontFamily: "inherit" }}
                    />
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.border}` }}>
                <SaveButton loading={saving} onClick={saveProfile} />
              </div>
            </Section>

            {/* Company info (read-only) */}
            {company && (
              <Section title="Company" subtitle="Your company details. Contact support to update these.">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14 }}>
                  {[
                    { label: "Company Name", value: company.name },
                    { label: "Industry",     value: company.industry || "—" },
                    { label: "Size",         value: company.size     || "—" },
                    { label: "Members Invited", value: String(company.inviteCount) },
                  ].map(row => (
                    <div key={row.label}>
                      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</p>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>{row.value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "14px 0 0", fontSize: 11, color: c.muted, opacity: 0.7 }}>
                  To update company details, contact <strong style={{ color: c.text }}>support@hmex.com</strong>
                </p>
              </Section>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* APPEARANCE TAB                                                    */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === "appearance" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

            {/* Light / Dark */}
            <Section title="Theme Mode" subtitle="Choose between light and dark interface">
              <div style={{ display: "flex", gap: 12 }}>
                {(["light", "dark"] as const).map(m => (
                  <button key={m} onClick={() => { if (theme !== m) toggleTheme(); }}
                    style={{ flex: 1, padding: "14px 16px", background: theme === m ? `${accentColor}12` : c.surfaceAlt, border: `2px solid ${theme === m ? accentColor : c.border}`, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.15s" }}>
                    {m === "light" ? <Sun size={16} style={{ color: theme === m ? accentColor : c.muted }} /> : <Moon size={16} style={{ color: theme === m ? accentColor : c.muted }} />}
                    <span style={{ fontSize: 12, fontWeight: 800, color: theme === m ? accentColor : c.muted, textTransform: "capitalize" }}>{m}</span>
                    {theme === m && <CheckCircle size={13} style={{ color: accentColor }} />}
                  </button>
                ))}
              </div>
            </Section>

            {/* Dark variant (only when dark) */}
            <AnimatePresence>
              {isDark && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                  <Section title="Dark Style" subtitle="Pick the dark colour palette that suits you">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(120px,1fr))", gap: 10 }}>
                      {(Object.entries(DARK_VARIANTS) as [DarkVariant, typeof DARK_VARIANTS[DarkVariant]][]).map(([key, v]) => (
                        <button key={key} onClick={() => setDarkVariant(key)}
                          style={{ padding: "12px 10px", background: v.bg, border: `2px solid ${darkVariant === key ? accentColor : v.border}`, borderRadius: 2, cursor: "pointer", textAlign: "left", transition: "border-color 0.15s" }}>
                          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                            {[v.bg, v.surface, v.surfaceAlt].map((col, i) => (
                              <div key={i} style={{ width: 14, height: 14, borderRadius: 2, background: col, border: `1px solid ${v.border}` }} />
                            ))}
                          </div>
                          <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: v.text }}>{v.label}</p>
                          {darkVariant === key && <CheckCircle size={11} style={{ color: accentColor, marginTop: 3 }} />}
                        </button>
                      ))}
                    </div>
                  </Section>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accent colour */}
            <Section title="Accent Colour" subtitle="Personalise your dashboard colour scheme">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(90px,1fr))", gap: 10 }}>
                {(Object.entries(ACCENT_PALETTES) as [AccentColor, typeof ACCENT_PALETTES[AccentColor]][]).map(([key, v]) => (
                  <button key={key} onClick={() => setAccent(key)}
                    style={{ padding: "12px 8px", background: `${v.primary}10`, border: `2px solid ${accent === key ? v.primary : "transparent"}`, borderRadius: 2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, transition: "border-color 0.15s" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${v.primary}, ${v.secondary})`, position: "relative" }}>
                      {accent === key && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CheckCircle size={13} color="#fff" />
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: accent === key ? v.primary : c.muted }}>{v.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Font size */}
            <Section title="Text Size" subtitle="Adjust the base font size across the dashboard">
              <div style={{ display: "flex", gap: 10 }}>
                {FONT_SIZES.map(f => (
                  <button key={f.key} onClick={() => setFontSize(f.key)}
                    style={{ flex: 1, padding: "11px 8px", background: fontSize === f.key ? `${accentColor}12` : c.surfaceAlt, border: `2px solid ${fontSize === f.key ? accentColor : c.border}`, borderRadius: 2, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: f.px, fontWeight: 800, color: fontSize === f.key ? accentColor : c.muted, lineHeight: 1 }}>Aa</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: fontSize === f.key ? accentColor : c.muted }}>{f.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: c.muted }}>Changes apply immediately across the dashboard.</p>
            </Section>

            {/* Preview */}
            <Section title="Preview">
              <div style={{ padding: "16px", background: c.surfaceAlt, borderRadius: 2, border: `1px solid ${c.border}` }}>
                <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: accentColor, letterSpacing: "0.1em", textTransform: "uppercase" }}>Workforce Overview</p>
                <p style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 900, color: c.text, letterSpacing: "-0.02em" }}>Health Dashboard</p>
                <div style={{ display: "flex", gap: 10 }}>
                  {[{ l: "Active", v: "48", c: "#10B981" }, { l: "Assessed", v: "36", c: accentColor }, { l: "High Risk", v: "4", c: "#EF4444" }].map(s => (
                    <div key={s.l} style={{ flex: 1, padding: "10px 12px", background: c.surface, borderRadius: 2, border: `1px solid ${c.border}` }}>
                      <p style={{ margin: "0 0 2px", fontSize: 9, fontWeight: 700, color: c.muted, textTransform: "uppercase" }}>{s.l}</p>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: s.c }}>{s.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* NOTIFICATIONS TAB                                                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === "notifications" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title="Notification Preferences" subtitle="Control how HMEX contacts you about workforce events">
              {loading
                ? [1,2,3].map(i => <div key={i} style={{ marginBottom: 14 }}><Skeleton w="100%" h={48} /></div>)
                : (
                  <div>
                    {[
                      { key: "email" as const, label: "Email Notifications", desc: "Receive employee activity, risk alerts, and summaries by email", Icon: Mail, on: notifEmail, set: setNotifEmail },
                      { key: "push"  as const, label: "In-App Notifications", desc: "Show notification badge and bell alerts inside the dashboard", Icon: Bell, on: notifPush,  set: setNotifPush  },
                      { key: "sms"   as const, label: "SMS Notifications",    desc: "Receive urgent high-risk alerts via text message", Icon: Phone, on: notifSms,   set: setNotifSms   },
                    ].map((item, i, arr) => (
                      <div key={item.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid ${c.border}` : "none" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <div style={{ width: 34, height: 34, background: `${accentColor}10`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <item.Icon size={15} style={{ color: accentColor }} />
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>{item.label}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 11, color: c.muted }}>{item.desc}</p>
                          </div>
                        </div>
                        <Toggle on={item.on} onChange={() => item.set(v => !v)} />
                      </div>
                    ))}

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.border}` }}>
                      <SaveButton loading={saving} onClick={saveNotifications} />
                    </div>
                  </div>
                )
              }
            </Section>

            {/* What triggers notifications */}
            <Section title="What triggers notifications">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
                {[
                  { label: "Employee joins",      desc: "When an invite is accepted" },
                  { label: "Employee removed",    desc: "When you remove a team member" },
                  { label: "Assessment completed",desc: "When an employee submits a health assessment" },
                  { label: "High-risk detected",  desc: "When a high-risk pattern is identified" },
                  { label: "Invite sent",         desc: "Confirmation when you send an invite" },
                  { label: "AI Programs ready",   desc: "When workforce programs are (re)generated" },
                ].map(n => (
                  <div key={n.label} style={{ padding: "10px 13px", background: c.surfaceAlt, borderRadius: 2, border: `1px solid ${c.border}` }}>
                    <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: c.text }}>{n.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: c.muted }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* SECURITY TAB                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === "security" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Section title="Change Password" subtitle="Must be at least 8 characters. Uses your current Appwrite credentials.">
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 420 }}>
                {[
                  { label: "Current Password", val: pwCurrent, set: setPwCurrent, key: "current" as const },
                  { label: "New Password",     val: pwNew,     set: setPwNew,     key: "new"     as const },
                  { label: "Confirm Password", val: pwConfirm, set: setPwConfirm, key: "confirm" as const },
                ].map(f => (
                  <div key={f.key}>
                    <FieldLabel>{f.label}</FieldLabel>
                    <div style={{ position: "relative" }}>
                      <Input type={showPw === f.key ? "text" : "password"} value={f.val} onChange={f.set} placeholder="••••••••" />
                      <button onClick={() => setShowPw(p => p === f.key ? null : f.key)}
                        style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 0, display: "flex" }}>
                        {showPw === f.key ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Strength indicator */}
                {pwNew && (
                  <div>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1,2,3,4].map(i => {
                        const score = [pwNew.length >= 8, /[A-Z]/.test(pwNew), /[0-9]/.test(pwNew), /[^A-Za-z0-9]/.test(pwNew)].filter(Boolean).length;
                        const colors = ["#EF4444","#F97316","#F59E0B","#10B981"];
                        return <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score - 1] || c.border : c.border, transition: "background 0.2s" }} />;
                      })}
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: c.muted }}>
                      {[pwNew.length >= 8, /[A-Z]/.test(pwNew), /[0-9]/.test(pwNew), /[^A-Za-z0-9]/.test(pwNew)].filter(Boolean).length <= 1 ? "Weak" :
                       [pwNew.length >= 8, /[A-Z]/.test(pwNew), /[0-9]/.test(pwNew), /[^A-Za-z0-9]/.test(pwNew)].filter(Boolean).length === 2 ? "Fair" :
                       [pwNew.length >= 8, /[A-Z]/.test(pwNew), /[0-9]/.test(pwNew), /[^A-Za-z0-9]/.test(pwNew)].filter(Boolean).length === 3 ? "Good" : "Strong"} password
                    </p>
                  </div>
                )}

                <div style={{ paddingTop: 4 }}>
                  <SaveButton loading={pwSaving} onClick={changePassword} label="Change Password" />
                </div>
              </div>
            </Section>

            {/* Session info */}
            <Section title="Account Details" subtitle="Read-only information from your Appwrite account">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
                {[
                  { label: "Email",       value: profile?.email || user?.email || "—" },
                  { label: "Account ID",  value: user?.id ? `${user.id.slice(0,12)}…` : "—" },
                  { label: "Role",        value: profile?.role === "employer" ? "Employer" : "User" },
                  { label: "Member Since", value: profile?.$createdAt ? new Date(profile.$createdAt).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "—" },
                ].map(row => (
                  <div key={row.label} style={{ padding: "12px 14px", background: c.surfaceAlt, borderRadius: 2, border: `1px solid ${c.border}` }}>
                    <p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{row.label}</p>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: c.text, fontFamily: row.label === "Account ID" ? "monospace" : "inherit" }}>{row.value}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Danger zone */}
            <div style={{ padding: "18px 20px", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2, background: isDark ? "rgba(239,68,68,0.04)" : "rgba(239,68,68,0.02)" }}>
              <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#EF4444" }}>Account Actions</p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: c.muted }}>
                Need to delete your account or request a data export? Contact us — we process all requests within 30 days.
              </p>
              <a href="mailto:support@hmex.com?subject=Account%20Request"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "transparent", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontSize: 12, fontWeight: 700, borderRadius: 2, textDecoration: "none" }}>
                <Mail size={12} />Contact Support
              </a>
            </div>
          </motion.div>
        )}

        <ThemeToggle />
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </EmployerLayout>
  );
}
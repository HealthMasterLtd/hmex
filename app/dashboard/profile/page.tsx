/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar,
  Heart, Camera, LogOut, Bell, Settings,
  Globe, Check, X, AlertCircle, Edit2, Save,
  Zap, Smartphone, Mail as MailIcon, MessageSquare,
  Info, FileText, BarChart3, Dumbbell, Shield,
  ChevronRight, Activity,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useRequireAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { authService } from "@/services/authService";
import {
  getOrCreateUserProfile,
  updateUserProfile,
  uploadProfileImage,
  getProfileImageUrl,
  updateNotificationPreferences,
  updateUserPreferences,
  type UserProfile,
} from "@/services/userService";
import { getUserXp } from "@/services/UserXpService";
import ThemeToggle from "@/components/Themetoggle";

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

/** Sharp toggle — no rounded corners anywhere */
function Toggle({ on, onChange, accent }: { on: boolean; onChange: () => void; accent: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onChange}
      style={{
        width: 42, height: 22, position: "relative",
        background: on ? accent : "rgba(148,163,184,0.22)",
        border: "none", cursor: "pointer",
        transition: "background 0.2s ease", flexShrink: 0,
        padding: 0,
      }}
    >
      <span style={{
        display: "block",
        position: "absolute", top: 3, left: on ? 21 : 3,
        width: 16, height: 16, background: "#fff",
        transition: "left 0.18s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.28)",
      }} />
    </button>
  );
}

/** Input field — sharp, no border-radius */
function Field({
  label, value, onChange, S, accent, multiline, type, placeholder,
}: {
  label: string; value: string;
  onChange: (v: string) => void;
  S: any; accent: string;
  multiline?: boolean; type?: string; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  const base: React.CSSProperties = {
    width: "100%", padding: "9px 12px",
    background: S.surfaceAlt,
    border: `1px solid ${focused ? accent : S.border}`,
    color: S.text, fontSize: 13,
    fontFamily: "inherit",
    outline: "none", resize: multiline ? "vertical" : undefined,
    transition: "border-color 0.15s ease",
    boxSizing: "border-box",
  };
  return (
    <div>
      <label style={{
        display: "block", fontSize: 9, fontWeight: 800,
        letterSpacing: "0.14em", textTransform: "uppercase",
        color: S.muted, marginBottom: 5,
      }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3} placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={base}
        />
      ) : (
        <input
          type={type || "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={base}
        />
      )}
    </div>
  );
}

/** Row in view mode */
function DataRow({ icon: Icon, label, value, S, accent }: {
  icon: React.ElementType; label: string; value: string; S: any; accent: string;
}) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", gap: 14, padding: "13px 0",
      borderBottom: `1px solid ${S.border}`,
    }}>
      <div style={{
        width: 30, height: 30, flexShrink: 0,
        background: `${accent}10`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={13} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
        <p style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
          textTransform: "uppercase", color: S.muted, margin: "0 0 3px",
        }}>
          {label}
        </p>
        <p style={{
          fontSize: 13, color: S.text, lineHeight: 1.5,
          margin: 0, wordBreak: "break-word",
        }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/** Stat box */
function StatBox({ icon: Icon, label, value, accent, S }: {
  icon: React.ElementType; label: string; value: string | number; accent: string; S: any;
}) {
  return (
    <div style={{
      flex: 1, padding: 16,
      background: S.surfaceAlt,
      border: `1px solid ${S.border}`,
    }}>
      <div style={{
        width: 28, height: 28,
        background: `${accent}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 10,
      }}>
        <Icon size={13} color={accent} />
      </div>
      <p style={{ fontSize: 10, fontWeight: 700, color: S.muted, letterSpacing: "0.08em", margin: "0 0 4px" }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 900, color: S.text, letterSpacing: "-0.04em", margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

/** Save button */
function SaveBtn({ onClick, saving, S, accent }: {
  onClick: () => void; saving: boolean; S: any; accent: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 7, width: "100%", padding: "12px",
        background: accent, border: "none",
        color: "#fff", fontSize: 12, fontWeight: 800,
        cursor: saving ? "not-allowed" : "pointer",
        opacity: saving ? 0.65 : 1,
        letterSpacing: "0.06em", textTransform: "uppercase",
        transition: "opacity 0.2s",
      }}
    >
      {saving ? (
        <>
          <span style={{
            display: "inline-block", width: 13, height: 13,
            border: "2px solid #fff", borderTopColor: "transparent",
            borderRadius: "50%", animation: "spin 0.7s linear infinite",
          }} />
          Saving…
        </>
      ) : (
        <><Save size={13} />Save Changes</>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

type TabId = "profile" | "notifications" | "preferences";

export default function ProfilePage() {
  const auth = useRequireAuth();
  const router = useRouter();
  const { isDark, accentColor, accentSecondary, accentFaint, surface: S } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [userXp, setUserXp] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState<TabId>("profile");

  const [form, setForm] = useState({
    fullName: "", bio: "", location: "", phone: "",
    occupation: "", healthGoals: "", medicalHistory: "",
    dateOfBirth: "", gender: "",
  });
  const [notifs, setNotifs] = useState({ email: true, push: false, sms: false });
  const [prefs, setPrefs] = useState({ language: "en", units: "metric" as "metric" | "imperial" });

  // ── LOAD ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!auth.user) return;
    (async () => {
      try {
        const [p, xp] = await Promise.all([
          getOrCreateUserProfile(auth.user!.id, auth.user!.email, auth.user!.name),
          getUserXp(auth.user!.id),
        ]);
        if (p) {
          setProfile(p);
          setForm({
            fullName: p.fullName, bio: p.bio || "", location: p.location || "",
            phone: p.phone || "", occupation: p.occupation || "",
            healthGoals: p.healthGoals || "", medicalHistory: p.medicalHistory || "",
            dateOfBirth: p.dateOfBirth || "", gender: p.gender || "",
          });
          setNotifs(p.notifications);
          setPrefs({ language: p.preferences.language, units: p.preferences.units });
        }
        if (xp) setUserXp(xp.totalXp);
      } catch { setError("Failed to load profile."); }
      finally  { setLoading(false); }
    })();
  }, [auth.user]);

  // ── HANDLERS ────────────────────────────────────────────────────────────────
  const flash = (msg: string, type: "ok" | "err" = "ok") => {
    if (type === "ok") { setSuccess(msg); setTimeout(() => setSuccess(null), 3200); }
    else setError(msg);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.user) return;
    setUploadingImg(true);
    try {
      await uploadProfileImage(auth.user.id, file);
      const p = await getOrCreateUserProfile(auth.user.id, auth.user.email, auth.user.name);
      if (p) setProfile(p);
      flash("Photo updated");
    } catch (err: any) { flash(err.message || "Upload failed", "err"); }
    finally { setUploadingImg(false); }
  };

  const handleSaveProfile = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const p = await updateUserProfile(auth.user.id, form);
      if (p) { setProfile(p); setEditMode(false); flash("Profile saved"); }
    } catch (err: any) { flash(err.message || "Save failed", "err"); }
    finally { setSaving(false); }
  };

  const handleSaveNotifs = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const p = await updateNotificationPreferences(auth.user.id, notifs);
      if (p) { setProfile(p); flash("Notifications updated"); }
    } catch (err: any) { flash(err.message || "Save failed", "err"); }
    finally { setSaving(false); }
  };

  const handleSavePrefs = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const p = await updateUserPreferences(auth.user.id, {
        ...prefs, theme: isDark ? "dark" : "light",
      });
      if (p) { setProfile(p); flash("Preferences saved"); }
    } catch (err: any) { flash(err.message || "Save failed", "err"); }
    finally { setSaving(false); }
  };

  const handleLogout = async () => {
    try { await authService.logout(); router.push("/login"); }
    catch (err: any) { flash(err.message || "Logout failed", "err"); }
  };

  const f = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (auth.loading || loading) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{
            width: 44, height: 44,
            border: `3px solid ${accentFaint}`,
            borderTopColor: accentColor,
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, minHeight: "60vh", justifyContent: "center" }}>
          <AlertCircle size={36} color="#ef4444" />
          <p style={{ color: S.text, margin: 0 }}>Failed to load profile.</p>
          <button onClick={() => window.location.reload()}
            style={{ padding: "8px 20px", background: accentColor, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const avatarUrl = getProfileImageUrl(profile.avatar);
  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: "profile",       label: "Profile",       Icon: User },
    { id: "notifications", label: "Notifications", Icon: Bell },
    { id: "preferences",   label: "Preferences",   Icon: Settings },
  ];

  return (
    <DashboardLayout>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />

      {/* ── TOASTS ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 100, marginBottom: (error || success) ? 16 : 0 }}>
        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
            background: "rgba(239,68,68,0.08)", borderBottom: "2px solid rgba(239,68,68,0.5)",
            animation: "slideDown 0.22s ease",
          }}>
            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
            <button onClick={() => setError(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}>
              <X size={14} color="#ef4444" />
            </button>
          </div>
        )}
        {success && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "11px 16px",
            background: "rgba(34,197,94,0.07)", borderBottom: "2px solid rgba(34,197,94,0.4)",
            animation: "slideDown 0.22s ease",
          }}>
            <Check size={15} color="#22c55e" style={{ flexShrink: 0 }} />
            <p style={{ flex: 1, fontSize: 13, color: "#22c55e", margin: 0 }}>{success}</p>
          </div>
        )}
      </div>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "flex-start", justifyContent: "space-between",
        marginBottom: 28, gap: 12, flexWrap: "wrap",
      }}>
        <div>
          <p style={{
            fontSize: 9, fontWeight: 900, letterSpacing: "0.22em",
            textTransform: "uppercase", color: accentColor, margin: "0 0 6px",
          }}>
            Account
          </p>
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: S.text,
            letterSpacing: "-0.04em", margin: 0, lineHeight: 1,
          }}>
            Profile
          </h1>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 14px",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.25)",
            color: "#ef4444", fontWeight: 700, fontSize: 12,
            cursor: "pointer", letterSpacing: "0.04em",
            textTransform: "uppercase",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.14)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.07)"; }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>

      {/* ── LAYOUT ──────────────────────────────────────────────────────────── */}
      <div className="profile-layout">

        {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
        <div className="profile-left">

          {/* Identity card */}
          <div style={{
            background: S.surface, border: `1px solid ${S.border}`, overflow: "hidden",
            marginBottom: 16,
          }}>
            {/* Accent stripe */}
            <div style={{ height: 3, background: `linear-gradient(90deg, ${accentColor}, ${accentSecondary})` }} />

            <div style={{ padding: 20 }}>
              {/* Avatar row */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{
                    width: 60, height: 60, overflow: "hidden",
                    background: S.surfaceAlt,
                    border: `2px solid ${accentColor}30`,
                  }}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={profile.fullName}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{
                        width: "100%", height: "100%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <User size={26} color={S.muted} />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingImg}
                    style={{
                      position: "absolute", bottom: -4, right: -4,
                      width: 22, height: 22, background: accentColor,
                      border: `2px solid ${S.surface}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", padding: 0,
                    }}
                  >
                    {uploadingImg
                      ? <span style={{
                          display: "block", width: 9, height: 9,
                          border: "2px solid #fff", borderTopColor: "transparent",
                          borderRadius: "50%", animation: "spin 0.7s linear infinite",
                        }} />
                      : <Camera size={9} color="#fff" />
                    }
                  </button>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{
                    fontSize: 15, fontWeight: 800, color: S.text,
                    letterSpacing: "-0.02em", margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {profile.fullName}
                  </h2>
                  <p style={{
                    fontSize: 11, color: S.muted, margin: "3px 0 0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {profile.email}
                  </p>
                  {profile.occupation && (
                    <p style={{
                      fontSize: 10, color: accentColor, margin: "4px 0 0",
                      fontWeight: 700, letterSpacing: "0.04em",
                    }}>
                      {profile.occupation}
                    </p>
                  )}
                </div>
              </div>

              {/* Stat boxes */}
              <div style={{ display: "flex", gap: 10 }}>
                <StatBox icon={Zap}      label="Total XP"    value={userXp.toLocaleString()} accent="#F59E0B"   S={S} />
                <StatBox icon={Activity} label="Assessments" value={0}                       accent={accentColor} S={S} />
              </div>
            </div>
          </div>

          {/* Quick nav */}
          <div style={{ background: S.surface, border: `1px solid ${S.border}` }}>
            <div style={{
              padding: "11px 16px", borderBottom: `1px solid ${S.border}`,
            }}>
              <p style={{
                fontSize: 9, fontWeight: 800, letterSpacing: "0.18em",
                textTransform: "uppercase", color: accentColor, margin: 0,
              }}>
                Quick Access
              </p>
            </div>
            {[
              { icon: FileText,  label: "Health History",  href: "/dashboard/history" },
              { icon: BarChart3, label: "New Assessment",  href: "/dashboard/assessment" },
              { icon: Dumbbell,  label: "Recommendations", href: "/dashboard/recommendations" },
            ].map((item, i, arr) => (
              <button
                key={i}
                onClick={() => router.push(item.href)}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  justifyContent: "space-between", padding: "11px 16px",
                  background: "none", border: "none",
                  borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : "none",
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = S.surfaceAlt; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <item.icon size={13} color={S.muted} />
                  <span style={{ fontSize: 13, color: S.text, fontWeight: 500 }}>{item.label}</span>
                </div>
                <ChevronRight size={12} color={S.subtle} />
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────────── */}
        <div className="profile-right">

          {/* ── TAB BAR ─────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex", background: S.surface,
            border: `1px solid ${S.border}`,
            marginBottom: 16, overflow: "hidden",
          }}>
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: 6,
                  padding: "12px 6px",
                  background: "none", border: "none",
                  borderBottom: `2px solid ${tab === id ? accentColor : "transparent"}`,
                  color: tab === id ? accentColor : S.muted,
                  fontSize: 12, fontWeight: tab === id ? 800 : 500,
                  cursor: "pointer", transition: "all 0.14s ease",
                  letterSpacing: "0.03em",
                }}
              >
                <Icon size={13} />
                <span className="tab-text">{label}</span>
              </button>
            ))}
          </div>

          {/* ── PROFILE TAB ─────────────────────────────────────────────────── */}
          {tab === "profile" && (
            <div style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              {/* Card header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderBottom: `1px solid ${S.border}`,
                flexWrap: "wrap", gap: 10,
              }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: S.text, margin: "0 0 2px", letterSpacing: "-0.02em" }}>
                    Personal Information
                  </h3>
                  <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                    Manage your personal details
                  </p>
                </div>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "7px 13px",
                      background: accentFaint,
                      border: `1px solid ${accentColor}30`,
                      color: accentColor, fontSize: 12, fontWeight: 700,
                      cursor: "pointer", letterSpacing: "0.04em",
                    }}
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditMode(false)}
                      style={{
                        padding: "7px 13px", background: S.surfaceAlt,
                        border: `1px solid ${S.border}`,
                        color: S.muted, fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 15px", background: accentColor, border: "none",
                        color: "#fff", fontSize: 12, fontWeight: 800,
                        cursor: saving ? "not-allowed" : "pointer",
                        opacity: saving ? 0.65 : 1, letterSpacing: "0.04em",
                      }}
                    >
                      {saving ? (
                        <span style={{
                          display: "inline-block", width: 12, height: 12,
                          border: "2px solid #fff", borderTopColor: "transparent",
                          borderRadius: "50%", animation: "spin 0.7s linear infinite",
                        }} />
                      ) : <Save size={12} />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              {/* Card body */}
              <div style={{ padding: 20 }}>
                {editMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <Field label="Full Name" value={form.fullName} onChange={f("fullName")} S={S} accent={accentColor} />
                    <Field label="Bio" value={form.bio} onChange={f("bio")} S={S} accent={accentColor} multiline placeholder="Tell us about yourself…" />
                    <div className="field-grid">
                      <Field label="Location"    value={form.location}   onChange={f("location")}   S={S} accent={accentColor} />
                      <Field label="Phone"       value={form.phone}      onChange={f("phone")}      S={S} accent={accentColor} type="tel" />
                      <Field label="Occupation"  value={form.occupation} onChange={f("occupation")} S={S} accent={accentColor} />
                      <Field label="Date of Birth" value={form.dateOfBirth} onChange={f("dateOfBirth")} S={S} accent={accentColor} type="date" />
                    </div>
                    <Field label="Health Goals" value={form.healthGoals} onChange={f("healthGoals")} S={S} accent={accentColor} multiline placeholder="e.g. Reduce blood pressure, lose weight…" />
                    <Field label="Medical History" value={form.medicalHistory} onChange={f("medicalHistory")} S={S} accent={accentColor} multiline placeholder="e.g. Diabetes, allergies, hypertension…" />
                  </div>
                ) : (
                  <div>
                    <DataRow icon={User}      label="Full Name"      value={profile.fullName}     S={S} accent={accentColor} />
                    <DataRow icon={Mail}      label="Email"          value={profile.email}        S={S} accent={accentColor} />
                    <DataRow icon={Phone}     label="Phone"          value={profile.phone}        S={S} accent={accentColor} />
                    <DataRow icon={MapPin}    label="Location"       value={profile.location}     S={S} accent={accentColor} />
                    <DataRow icon={Briefcase} label="Occupation"     value={profile.occupation}   S={S} accent={accentColor} />
                    <DataRow icon={Calendar}  label="Date of Birth"
                      value={profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                        : ""}
                      S={S} accent={accentColor}
                    />
                    <DataRow icon={Heart}     label="Health Goals"   value={profile.healthGoals}   S={S} accent={accentColor} />
                    <DataRow icon={Info}      label="Medical History" value={profile.medicalHistory} S={S} accent={accentColor} />

                    {/* Empty state */}
                    {!profile.phone && !profile.location && !profile.occupation && !profile.healthGoals && !profile.medicalHistory && (
                      <div style={{
                        padding: "32px 0", textAlign: "center",
                        borderBottom: `1px solid ${S.border}`,
                      }}>
                        <div style={{
                          width: 44, height: 44, background: accentFaint,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          margin: "0 auto 12px",
                        }}>
                          <User size={20} color={accentColor} />
                        </div>
                        <p style={{ fontSize: 13, color: S.muted, margin: "0 0 14px" }}>
                          Your profile is incomplete.
                        </p>
                        <button
                          onClick={() => setEditMode(true)}
                          style={{
                            padding: "9px 22px", background: accentColor,
                            border: "none", color: "#fff", fontWeight: 800,
                            fontSize: 12, cursor: "pointer", letterSpacing: "0.06em",
                            textTransform: "uppercase",
                          }}
                        >
                          Complete Profile
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ───────────────────────────────────────────── */}
          {tab === "notifications" && (
            <div style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: S.text, margin: "0 0 2px", letterSpacing: "-0.02em" }}>
                  Notification Preferences
                </h3>
                <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                  Choose how you want to be notified
                </p>
              </div>

              <div style={{ padding: 20 }}>
                {[
                  { key: "email" as const, label: "Email Notifications",  Icon: MailIcon,      desc: "Updates and reports to your inbox" },
                  { key: "push"  as const, label: "Push Notifications",   Icon: Smartphone,    desc: "Real-time alerts on your device" },
                  { key: "sms"   as const, label: "SMS Notifications",    Icon: MessageSquare, desc: "Critical alerts via text message" },
                ].map(({ key, label, Icon, desc }, i, arr) => (
                  <div
                    key={key}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, padding: "16px 0",
                      borderBottom: i < arr.length - 1 ? `1px solid ${S.border}` : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                      <div style={{
                        width: 36, height: 36, flexShrink: 0,
                        background: notifs[key] ? accentFaint : S.surfaceAlt,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "background 0.2s",
                      }}>
                        <Icon size={15} color={notifs[key] ? accentColor : S.muted} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: S.text, margin: "0 0 2px" }}>{label}</p>
                        <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>{desc}</p>
                      </div>
                    </div>
                    <Toggle on={notifs[key]} onChange={() => setNotifs(n => ({ ...n, [key]: !n[key] }))} accent={accentColor} />
                  </div>
                ))}

                <div style={{ marginTop: 24 }}>
                  <SaveBtn onClick={handleSaveNotifs} saving={saving} S={S} accent={accentColor} />
                </div>
              </div>
            </div>
          )}

          {/* ── PREFERENCES TAB ─────────────────────────────────────────────── */}
          {tab === "preferences" && (
            <div style={{ background: S.surface, border: `1px solid ${S.border}` }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${S.border}` }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: S.text, margin: "0 0 2px", letterSpacing: "-0.02em" }}>
                  App Preferences
                </h3>
                <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>
                  Customise your experience
                </p>
              </div>

              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 26 }}>
                {/* Units */}
                <div>
                  <p style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: S.muted, marginBottom: 10,
                  }}>
                    Measurement Units
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[
                      { value: "metric",   label: "Metric",   detail: "kg · cm · mmol/L" },
                      { value: "imperial", label: "Imperial", detail: "lbs · in · mg/dL" },
                    ].map(({ value, label, detail }) => (
                      <button
                        key={value}
                        onClick={() => setPrefs(p => ({ ...p, units: value as any }))}
                        style={{
                          padding: "13px 14px", textAlign: "left",
                          background: prefs.units === value ? accentFaint : S.surfaceAlt,
                          border: `1px solid ${prefs.units === value ? accentColor : S.border}`,
                          cursor: "pointer", transition: "all 0.14s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <p style={{ fontSize: 13, fontWeight: 800, color: prefs.units === value ? accentColor : S.text, margin: 0 }}>
                            {label}
                          </p>
                          {prefs.units === value && (
                            <div style={{
                              width: 16, height: 16, background: accentColor,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Check size={9} color="#fff" />
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: S.muted, margin: 0 }}>{detail}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <p style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.16em",
                    textTransform: "uppercase", color: S.muted, marginBottom: 10,
                  }}>
                    Language
                  </p>
                  <div style={{ position: "relative" }}>
                    <Globe size={13} style={{
                      position: "absolute", left: 12, top: "50%",
                      transform: "translateY(-50%)", pointerEvents: "none",
                    }} color={S.muted} />
                    <select
                      value={prefs.language}
                      onChange={e => setPrefs(p => ({ ...p, language: e.target.value }))}
                      style={{
                        width: "100%", padding: "10px 12px 10px 34px",
                        background: S.surfaceAlt, border: `1px solid ${S.border}`,
                        color: S.text, fontSize: 13, cursor: "pointer",
                        appearance: "none", fontFamily: "inherit", outline: "none",
                      }}
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="sw">Swahili</option>
                      <option value="rw">Kinyarwanda</option>
                    </select>
                  </div>
                </div>

                {/* Theme hint */}
                <div style={{
                  display: "flex", gap: 10, padding: "12px 14px",
                  background: accentFaint,
                  border: `1px solid ${accentColor}22`,
                }}>
                  <Shield size={14} color={accentColor} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: S.muted, margin: 0, lineHeight: 1.55 }}>
                    Use the <strong style={{ color: accentColor }}>Theme panel</strong> on the right edge of the screen to change dark mode variant, accent colour, and visual style — available on any page.
                  </p>
                </div>

                <SaveBtn onClick={handleSavePrefs} saving={saving} S={S} accent={accentColor} />
              </div>
            </div>
          )}
        </div>
        <ThemeToggle />
      </div>

      {/* ── GLOBAL STYLES ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Layout */
        .profile-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 860px) {
          .profile-layout {
            grid-template-columns: 260px 1fr;
            gap: 20px;
          }
        }

        /* Field grid inside edit mode */
        .field-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 520px) {
          .field-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        /* Tab label visibility */
        @media (max-width: 380px) {
          .tab-text { display: none; }
        }

        /* Focus states */
        input:focus, textarea:focus, select:focus { outline: none; }
        button:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </DashboardLayout>
  );
}
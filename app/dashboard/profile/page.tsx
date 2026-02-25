/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * /app/dashboard/profile/page.tsx
 *
 * Modern, sleek profile page with glass-morphism design
 * Fully responsive with proper theme integration
 */

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User, Mail, Phone, MapPin, Briefcase, Calendar,
  Heart, Activity, TrendingUp, Award, Target,
  Camera, LogOut, Shield, Bell, Settings,
  Moon, Sun, Globe, Ruler, Check, X,
  AlertCircle, ChevronRight, Edit2, Save,
  Clock, Zap, Smartphone, Mail as MailIcon,
  MessageSquare, Info, Download, Upload,
  FileText, BarChart3, Dumbbell, Brain,
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

// ─── STAT CARD COMPONENT ──────────────────────────────────────────────────────
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  color,
  isDark,
  trend
}: { 
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  isDark: boolean;
  trend?: number;
}) {
  return (
    <div
      className="group relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 16,
        padding: "16px",
      }}
    >
      {/* Gradient overlay on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${color}08, transparent)`,
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div
            className="p-2 rounded-xl"
            style={{
              background: `${color}15`,
            }}
          >
            <Icon size={16} color={color} />
          </div>
          {trend !== undefined && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{
                background: trend >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: trend >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              <TrendingUp size={10} className={trend < 0 ? "rotate-180" : ""} />
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <p className="text-[11px] font-medium mb-1" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
          {label}
        </p>
        <p className="text-lg font-bold" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── INFO ITEM COMPONENT ──────────────────────────────────────────────────────
function InfoItem({
  icon: Icon,
  label,
  value,
  isDark,
  editable,
  onEdit,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  isDark: boolean;
  editable?: boolean;
  onEdit?: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-opacity-50"
      style={{
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
      }}
    >
      <div
        className="p-2 rounded-lg shrink-0"
        style={{
          background: isDark ? "rgba(13,148,136,0.1)" : "rgba(13,148,136,0.08)",
        }}
      >
        <Icon size={14} color="#0d9488" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase mb-1" style={{ color: isDark ? "#6b7a8d" : "#64748b" }}>
          {label}
        </p>
        <p className="text-sm font-medium truncate" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
          {value || "Not set"}
        </p>
      </div>
      {editable && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
          style={{
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
          }}
        >
          <Edit2 size={12} color={isDark ? "#8b9cb5" : "#64748b"} />
        </button>
      )}
    </div>
  );
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────────
function ToggleSwitch({
  enabled,
  onChange,
  isDark,
}: {
  enabled: boolean;
  onChange: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onChange}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none"
      style={{
        background: enabled ? "#0d9488" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      }}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ─── MAIN PROFILE PAGE ────────────────────────────────────────────────────────
export default function ProfilePage() {
  const auth = useRequireAuth();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userXp, setUserXp] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "notifications" | "preferences">("profile");

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    phone: "",
    occupation: "",
    healthGoals: "",
    medicalHistory: "",
    dateOfBirth: "",
    gender: "",
  });

  const [notifPrefs, setNotifPrefs] = useState({
    email: true,
    push: false,
    sms: false,
  });

  const [appPrefs, setAppPrefs] = useState({
    theme: "auto" as "light" | "dark" | "auto",
    language: "en",
    units: "metric" as "metric" | "imperial",
  });

  // Load profile data
  useEffect(() => {
    if (!auth.user) return;

    const loadData = async () => {
      try {
        const [profileData, xpData] = await Promise.all([
          getOrCreateUserProfile(auth.user!.id, auth.user!.email, auth.user!.name),
          getUserXp(auth.user!.id),
        ]);

        if (profileData) {
          setProfile(profileData);
          setFormData({
            fullName: profileData.fullName,
            bio: profileData.bio || "",
            location: profileData.location || "",
            phone: profileData.phone || "",
            occupation: profileData.occupation || "",
            healthGoals: profileData.healthGoals || "",
            medicalHistory: profileData.medicalHistory || "",
            dateOfBirth: profileData.dateOfBirth || "",
            gender: profileData.gender || "",
          });
          setNotifPrefs(profileData.notifications);
          setAppPrefs(profileData.preferences);
        }

        if (xpData) {
          setUserXp(xpData.totalXp);
        }
      } catch (e) {
        setError("Failed to load profile");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth.user]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.user) return;

    setUploadingImage(true);
    try {
      await uploadProfileImage(auth.user.id, file);
      const updated = await getOrCreateUserProfile(
        auth.user.id,
        auth.user.email,
        auth.user.name
      );
      if (updated) {
        setProfile(updated);
        setSuccess("Profile photo updated!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const updated = await updateUserProfile(auth.user.id, formData);
      if (updated) {
        setProfile(updated);
        setSuccess("Profile updated successfully!");
        setEditMode(false);
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Handle notifications save
  const handleSaveNotifications = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const updated = await updateNotificationPreferences(auth.user.id, notifPrefs);
      if (updated) {
        setProfile(updated);
        setSuccess("Notification preferences updated!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  // Handle preferences save
  const handleSavePreferences = async () => {
    if (!auth.user) return;
    setSaving(true);
    try {
      const updated = await updateUserPreferences(auth.user.id, appPrefs);
      if (updated) {
        setProfile(updated);
        setSuccess("Preferences updated!");
      }
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Failed to logout");
    }
  };

  if (auth.loading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="relative">
            {/* Animated gradient spinner */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 animate-spin p-[2px]">
              <div className="w-full h-full rounded-full" style={{ background: isDark ? "#060c18" : "#f8fafc" }} />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <AlertCircle size={40} color="#ef4444" />
          <p style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>Failed to load profile</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg text-sm font-bold"
            style={{
              background: "#0d9488",
              color: "#fff",
            }}
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const avatarUrl = getProfileImageUrl(profile.avatar);
  const accentColor = "#0d9488";

  return (
    <DashboardLayout>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ display: "none" }}
      />

      {/* Main container with glass effect */}
      <div className="relative min-h-screen pb-12">
        {/* Background gradient */}
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: isDark
              ? "radial-gradient(circle at 50% 50%, rgba(13,148,136,0.15) 0%, transparent 50%)"
              : "radial-gradient(circle at 50% 50%, rgba(13,148,136,0.05) 0%, transparent 50%)",
          }}
        />

        {/* Header */}
        <div className="mb-8">
          <p
            className="text-xs font-black uppercase tracking-[0.2em] mb-2"
            style={{ color: accentColor }}
          >
            Account
          </p>
          <div className="flex items-center justify-between">
            <h1
              className="text-3xl font-black"
              style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}
            >
              Profile
            </h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
              }}
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            className="flex items-center gap-3 p-4 mb-6 rounded-xl animate-slideDown"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <AlertCircle size={18} color="#ef4444" />
            <p className="flex-1 text-sm" style={{ color: "#ef4444" }}>{error}</p>
            <button onClick={() => setError(null)} className="p-1">
              <X size={16} color="#ef4444" />
            </button>
          </div>
        )}

        {success && (
          <div
            className="flex items-center gap-3 p-4 mb-6 rounded-xl animate-slideDown"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Check size={18} color="#22c55e" />
            <p className="flex-1 text-sm" style={{ color: "#22c55e" }}>{success}</p>
          </div>
        )}

        {/* Main grid - responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Profile card */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile card with glass effect */}
            <div
              className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl"
              style={{
                background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              {/* Decorative gradient */}
              <div
                className="absolute top-0 left-0 right-0 h-32"
                style={{
                  background: `linear-gradient(135deg, ${accentColor}30, transparent)`,
                }}
              />

              <div className="relative p-6">
                {/* Avatar */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div
                      className="w-28 h-28 rounded-full overflow-hidden ring-4 transition-all duration-300 group-hover:scale-105"
                      style={{
                        borderColor: `${accentColor}40`,
                      }}
                    >
                      {avatarUrl ? (
  <div className="w-28 h-28 rounded-2xl overflow-hidden">
    <img
      src={avatarUrl}
      alt={profile.fullName}
      className="w-full h-full object-cover"
    />
  </div>
) : (
  <div className="w-28 h-28 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
    <User size={40} className="text-gray-400" />
  </div>
)}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="absolute -bottom-1 -right-1 p-2.5 rounded-xl transition-all duration-200 hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}, #059669)`,
                        color: "#fff",
                        boxShadow: `0 4px 12px ${accentColor}60`,
                      }}
                    >
                      {uploadingImage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={14} />
                      )}
                    </button>
                  </div>
                </div>

                {/* User info */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold mb-1" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                    {profile.fullName}
                  </h2>
                  <p className="text-sm" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                    {profile.email}
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    icon={Award}
                    label="Total XP"
                    value={userXp}
                    color="#22c55e"
                    isDark={isDark}
                    trend={12}
                  />
                  <StatCard
                    icon={Activity}
                    label="Assessments"
                    value={0}
                    color="#0d9488"
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <div className="p-4 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                <p className="text-xs font-bold uppercase" style={{ color: accentColor }}>Quick Actions</p>
              </div>
              <div className="p-2">
                {[
                  { icon: FileText, label: "View Health Report", href: "/dashboard/history" },
                  { icon: BarChart3, label: "New Assessment", href: "/dashboard/assessment" },
                  { icon: Dumbbell, label: "Recommendations", href: "/dashboard/recommendations" },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => router.push(action.href)}
                    className="w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 group"
                    style={{
                      background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        }}
                      >
                        <action.icon size={14} color={isDark ? "#8b9cb5" : "#64748b"} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                        {action.label}
                      </span>
                    </div>
                    <ChevronRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: isDark ? "#8b9cb5" : "#64748b" }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section tabs */}
            <div
              className="p-1 rounded-xl inline-flex"
              style={{
                background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              {[
                { id: "profile" as const, label: "Profile", icon: User },
                { id: "notifications" as const, label: "Notifications", icon: Bell },
                { id: "preferences" as const, label: "Preferences", icon: Settings },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    background: activeSection === tab.id ? accentColor : "transparent",
                    color: activeSection === tab.id ? "#fff" : isDark ? "#8b9cb5" : "#64748b",
                  }}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Section */}
            {activeSection === "profile" && (
              <div
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                      Personal Information
                    </h3>
                    <p className="text-xs mt-1" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                      Manage your personal details
                    </p>
                  </div>
                  {!editMode ? (
                    <button
                      onClick={() => setEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                      style={{
                        background: `${accentColor}15`,
                        color: accentColor,
                      }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                          color: isDark ? "#8b9cb5" : "#64748b",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                        style={{
                          background: accentColor,
                          color: "#fff",
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {editMode ? (
                    // Edit form
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            color: isDark ? "#f0f4f8" : "#0f172a",
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                          Bio
                        </label>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2 resize-none"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            color: isDark ? "#f0f4f8" : "#0f172a",
                          }}
                          placeholder="Tell us about yourself..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                            Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                              color: isDark ? "#f0f4f8" : "#0f172a",
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                              color: isDark ? "#f0f4f8" : "#0f172a",
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                            Occupation
                          </label>
                          <input
                            type="text"
                            value={formData.occupation}
                            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                              color: isDark ? "#f0f4f8" : "#0f172a",
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                              background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                              color: isDark ? "#f0f4f8" : "#0f172a",
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                          Health Goals
                        </label>
                        <textarea
                          value={formData.healthGoals}
                          onChange={(e) => setFormData({ ...formData, healthGoals: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            color: isDark ? "#f0f4f8" : "#0f172a",
                          }}
                          placeholder="e.g., Lose weight, Build muscle, Reduce stress"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-2" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                          Medical History
                        </label>
                        <textarea
                          value={formData.medicalHistory}
                          onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            color: isDark ? "#f0f4f8" : "#0f172a",
                          }}
                          placeholder="e.g., Diabetes, High blood pressure, Allergies"
                        />
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="space-y-2">
                      <InfoItem
                        icon={User}
                        label="Full Name"
                        value={profile.fullName}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Mail}
                        label="Email"
                        value={profile.email}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Phone}
                        label="Phone"
                        value={profile.phone}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={MapPin}
                        label="Location"
                        value={profile.location}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Briefcase}
                        label="Occupation"
                        value={profile.occupation}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Calendar}
                        label="Date of Birth"
                        value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : ""}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Heart}
                        label="Health Goals"
                        value={profile.healthGoals}
                        isDark={isDark}
                      />
                      <InfoItem
                        icon={Info}
                        label="Medical History"
                        value={profile.medicalHistory}
                        isDark={isDark}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <div className="p-6 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <h3 className="text-lg font-bold" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                    Notification Preferences
                  </h3>
                  <p className="text-xs mt-1" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                    Choose how you want to be notified
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { key: "email" as const, label: "Email Notifications", icon: MailIcon, desc: "Receive updates via email" },
                      { key: "push" as const, label: "Push Notifications", icon: Smartphone, desc: "Get push notifications on your device" },
                      { key: "sms" as const, label: "SMS Notifications", icon: MessageSquare, desc: "Important alerts via text message" },
                    ].map(({ key, label, icon: Icon, desc }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
                        style={{
                          background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="p-2 rounded-lg"
                            style={{
                              background: `${accentColor}15`,
                            }}
                          >
                            <Icon size={16} color={accentColor} />
                          </div>
                          <div>
                            <p className="text-sm font-bold mb-1" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                              {label}
                            </p>
                            <p className="text-xs" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                              {desc}
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch
                          enabled={notifPrefs[key]}
                          onChange={() => setNotifPrefs({ ...notifPrefs, [key]: !notifPrefs[key] })}
                          isDark={isDark}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: accentColor,
                      color: "#fff",
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Notification Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === "preferences" && (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: isDark ? "rgba(13, 19, 33, 0.7)" : "rgba(255, 255, 255, 0.8)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                }}
              >
                <div className="p-6 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
                  <h3 className="text-lg font-bold" style={{ color: isDark ? "#f0f4f8" : "#0f172a" }}>
                    App Preferences
                  </h3>
                  <p className="text-xs mt-1" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                    Customize your experience
                  </p>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {/* Theme */}
                    <div>
                      <label className="block text-xs font-bold mb-3" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "light", label: "Light", icon: Sun },
                          { value: "dark", label: "Dark", icon: Moon },
                          { value: "auto", label: "Auto", icon: Smartphone },
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setAppPrefs({ ...appPrefs, theme: value as any })}
                            className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200"
                            style={{
                              background: appPrefs.theme === value
                                ? `${accentColor}20`
                                : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"),
                              border: appPrefs.theme === value
                                ? `1px solid ${accentColor}`
                                : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            }}
                          >
                            <Icon size={20} color={appPrefs.theme === value ? accentColor : isDark ? "#8b9cb5" : "#64748b"} />
                            <span className="text-xs font-medium" style={{ color: appPrefs.theme === value ? accentColor : isDark ? "#8b9cb5" : "#64748b" }}>
                              {label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Units */}
                    <div>
                      <label className="block text-xs font-bold mb-3" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                        Measurement Units
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: "metric", label: "Metric", desc: "kg, cm", icon: Ruler },
                          { value: "imperial", label: "Imperial", desc: "lbs, in", icon: Activity },
                        ].map(({ value, label, desc, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setAppPrefs({ ...appPrefs, units: value as any })}
                            className="flex items-center gap-3 p-4 rounded-xl transition-all duration-200"
                            style={{
                              background: appPrefs.units === value
                                ? `${accentColor}20`
                                : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)"),
                              border: appPrefs.units === value
                                ? `1px solid ${accentColor}`
                                : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            }}
                          >
                            <Icon size={16} color={appPrefs.units === value ? accentColor : isDark ? "#8b9cb5" : "#64748b"} />
                            <div className="text-left">
                              <p className="text-sm font-bold" style={{ color: appPrefs.units === value ? accentColor : isDark ? "#f0f4f8" : "#0f172a" }}>
                                {label}
                              </p>
                              <p className="text-[10px]" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>{desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-xs font-bold mb-3" style={{ color: isDark ? "#8b9cb5" : "#64748b" }}>
                        Language
                      </label>
                      <div className="relative">
                        <Globe
                          size={14}
                          className="absolute left-4 top-1/2 -translate-y-1/2"
                          style={{ color: isDark ? "#8b9cb5" : "#64748b" }}
                        />
                        <select
                          value={appPrefs.language}
                          onChange={(e) => setAppPrefs({ ...appPrefs, language: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 rounded-xl text-sm appearance-none cursor-pointer"
                          style={{
                            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
                            color: isDark ? "#f0f4f8" : "#0f172a",
                          }}
                        >
                          <option value="en">English</option>
                          <option value="fr">Français</option>
                          <option value="sw">Swahili</option>
                          <option value="rw">Kinyarwanda</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSavePreferences}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.02]"
                    style={{
                      background: accentColor,
                      color: "#fff",
                      opacity: saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Preferences
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
}
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { SectionHeader } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner,
  getCompanyMembers,
  removeEmployee,
  type Company,
  type EmployeeDashboardRow,
} from "@/services/companyService";
import BulkInviteModal from "@/components/dashboard/BulkInviteModal";
import {
  UserPlus, X, Mail, Send, Shield, Loader2, AlertCircle,
  CheckCircle, Clock, Trash2, Search, RefreshCw, Users, Download,
  Upload,
} from "lucide-react";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ style }: { style?: React.CSSProperties }) {
  return <div className="animate-pulse" style={{ background: "rgba(128,128,128,0.12)", borderRadius: 2, ...style }} />;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
  const ok = type === "success";
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
      style={{
        position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999,
        display: "flex", alignItems: "center", gap: 10, padding: "12px 20px",
        background: ok ? "#0FBB7D" : "#EF4444", color: "#fff",
        minWidth: 280, maxWidth: 440, borderRadius: 0, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      }}
    >
      {ok ? <CheckCircle size={17} style={{ flexShrink: 0 }} /> : <AlertCircle size={17} style={{ flexShrink: 0 }} />}
      <span style={{ fontSize: 13, fontWeight: 600 }}>{message}</span>
      <motion.div initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 4, ease: "linear" }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.4)", transformOrigin: "left" }} />
    </motion.div>
  );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
interface InviteModalProps {
  company: Company;
  currentUserId: string;
  accentColor: string;
  isDark: boolean;
  surface: any;
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

function InviteModal({ company, currentUserId, accentColor, isDark, surface, onClose, onSuccess, onError }: InviteModalProps) {
  const [email,      setEmail]      = useState("");
  const [sending,    setSending]    = useState(false);
  const [focused,    setFocused]    = useState(false);
  const [inviteUrl,  setInviteUrl]  = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [doneMsg,    setDoneMsg]    = useState("");

  const bg       = surface.surface;
  const border   = surface.border;
  const text     = surface.text;
  const muted    = surface.muted;
  const inputBg  = isDark ? "rgba(0,0,0,0.25)" : surface.bg;

  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      onError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/invite-employee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.$id, companyName: company.name, employeeEmail: trimmed, invitedBy: currentUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");

      if (data.isExistingUser) {
        // Already on HMEX — added instantly, no invite link
        setDoneMsg(`${trimmed} already has an HMEX account and has been added to ${company.name}.`);
        setDone(true);
        onSuccess(`${trimmed} added to your company.`);
      } else {
        // New user — show invite link to copy + email was sent
        setInviteUrl(data.inviteUrl);
        setDoneMsg(data.emailSent
          ? `Invite email sent to ${trimmed}. You can also copy the link below to share manually.`
          : `Invite created for ${trimmed}. Email delivery failed — copy the link below to share manually.`
        );
        setDone(true);
        onSuccess(data.emailSent ? `Invite sent to ${trimmed}` : `Invite created — copy link to share`);
      }
    } catch (e: any) {
      onError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{ width: "100%", maxWidth: 440, background: bg, border: `1px solid ${border}`, borderRadius: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}18`, borderRadius: 2 }}>
              <UserPlus size={18} style={{ color: accentColor }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text }}>Invite Employee</p>
              <p style={{ margin: 0, fontSize: 11, color: muted }}>They&apos;ll get a secure link to join {company.name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: muted, background: "transparent", border: "none", cursor: "pointer", borderRadius: 2 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {done ? (
            /* ── Done state ── */
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center", paddingTop: 8 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle size={24} style={{ color: accentColor }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text, lineHeight: 1.6 }}>{doneMsg}</p>

              {/* Copy invite link — only for new users */}
              {inviteUrl && (
                <div style={{ width: "100%", marginTop: 4 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: text }}>Invite Link</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input readOnly value={inviteUrl}
                      style={{ flex: 1, padding: "8px 10px", fontSize: 11, border: `1px solid ${border}`, background: inputBg, color: muted, outline: "none", borderRadius: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />
                    <button onClick={handleCopy}
                      style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, background: copied ? "#0FBB7D" : `${accentColor}18`, color: copied ? "white" : accentColor, border: `1px solid ${copied ? "#0FBB7D" : accentColor}25`, borderRadius: 2, cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Input state ── */
            <>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: text, marginBottom: 8 }}>Employee Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: muted }} />
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !sending) handleSend(); if (e.key === "Escape") onClose(); }}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder="colleague@company.com" disabled={sending} autoFocus
                    style={{ width: "100%", paddingLeft: 36, paddingRight: 16, paddingTop: 11, paddingBottom: 11, fontSize: 13, border: `1px solid ${focused ? accentColor : border}`, background: inputBg, color: text, outline: "none", borderRadius: 2, boxSizing: "border-box", transition: "border-color 0.15s" }}
                  />
                </div>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", alignItems: "flex-start", gap: 10, background: `${accentColor}0D`, border: `1px solid ${accentColor}25`, borderRadius: 2 }}>
                <Shield size={13} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
                <p style={{ margin: 0, fontSize: 11, color: muted, lineHeight: 1.65 }}>
                  Works for new and existing HMEX users. Individual health data stays private — you only see anonymised team insights.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, padding: "0 24px 24px" }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, background: "transparent", border: `1px solid ${border}`, color: muted, borderRadius: 2, cursor: "pointer" }}>
            {done ? "Close" : "Cancel"}
          </button>
          {!done && (
            <button onClick={handleSend} disabled={sending || !email.trim()}
              style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `linear-gradient(135deg, ${accentColor}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: sending || !email.trim() ? "not-allowed" : "pointer", opacity: sending || !email.trim() ? 0.65 : 1, transition: "opacity 0.15s" }}>
              {sending ? <><Loader2 size={13} className="animate-spin" /> Sending…</> : <><Send size={13} /> Send Invite</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active:   { color: "#0FBB7D", label: "Active"   },
    pending:  { color: "#F79009", label: "Pending"  },
    declined: { color: "#EF4444", label: "Declined" },
    removed:  { color: "#9CA3AF", label: "Removed"  },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", background: `${s.color}18`, color: s.color, borderRadius: 2, flexShrink: 0 }}>
      {s.label}
    </span>
  );
}

// ─── Employee Row ─────────────────────────────────────────────────────────────
function EmployeeRow({ member, c, isDark, onRemove, removing }: {
  member: EmployeeDashboardRow; c: any; isDark: boolean;
  onRemove: (memberId: string, userId: string | null) => void; removing: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hovered, setHovered] = useState(false);

  const name = member.fullName || member.email.split("@")[0];
  const initials = name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const joined = new Date(member.$createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${c.border}`, background: hovered ? (isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)") : "transparent", transition: "background 0.15s" }}
    >
      {member.avatar
        ? <img src={member.avatar} alt={name} style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }} />
        : <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${c.primary}, ${c.primary}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white" }}>{initials}</div>
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
        <p style={{ margin: 0, fontSize: 11, color: c.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{member.email}</p>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: c.subtle, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
        <Clock size={11} />{joined}
      </p>
      <StatusBadge status={member.status} />
      <AnimatePresence mode="wait">
        {confirmDelete ? (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={() => { onRemove(member.$id, member.userId); setConfirmDelete(false); }} disabled={removing}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700, background: "#EF4444", color: "white", border: "none", borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              {removing ? <Loader2 size={11} className="animate-spin" /> : "Remove"}
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: c.border, color: c.muted, border: "none", borderRadius: 2, cursor: "pointer" }}>
              Cancel
            </button>
          </motion.div>
        ) : (
          <motion.button key="del" initial={{ opacity: 0 }} animate={{ opacity: hovered ? 1 : 0 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmDelete(true)}
            style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", borderRadius: 2 }}>
            <Trash2 size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ c, isDark, onInvite }: { c: any; isDark: boolean; onInvite: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "64px 24px", textAlign: "center" }}>
      <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(15,187,125,0.1)" : "rgba(15,187,125,0.08)", borderRadius: 2, marginBottom: 20 }}>
        <Users size={30} style={{ color: c.primary }} />
      </div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: c.text, marginBottom: 8, letterSpacing: "-0.02em" }}>No employees yet</p>
      <p style={{ margin: "0 0 24px", fontSize: 12, color: c.muted, lineHeight: 1.7, maxWidth: 280 }}>
        Start building your team. Invite employees via email — their individual health data always stays private.
      </p>
      <button onClick={onInvite}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "11px 22px", fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${c.primary}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: "pointer" }}>
        <UserPlus size={14} /> Invite First Employee
      </button>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EmployerEmployeesPage() {
  const { user } = useAuth();
  const { isDark, surface, accentColor } = useTheme();

  const [company,        setCompany]        = useState<Company | null>(null);
  const [members,        setMembers]        = useState<EmployeeDashboardRow[]>([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [showBulkModal,  setShowBulkModal]  = useState(false);
  const [removingId,     setRemovingId]     = useState<string | null>(null);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [toast,          setToast]          = useState<{ message: string; type: "success" | "error" } | null>(null);
  const dismissToast = useCallback(() => setToast(null), []);

  const c = { text: surface.text, muted: surface.muted, subtle: surface.subtle, border: surface.border, surface: surface.surface, bg: surface.bg, primary: accentColor };

  const loadMembers = useCallback(async (companyId: string) => {
    setLoadingMembers(true);
    const rows = await getCompanyMembers(companyId).catch(() => []);
    setMembers(rows);
    setLoadingMembers(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoadingCompany(true);

    const run = async () => {
      try {
        // 1. Try the companies collection first
        const co = await getCompanyByOwner(user.id).catch(() => null);
        if (co) {
          setCompany(co);
          await loadMembers(co.$id);
          return;
        }

        // 2. Fallback: read companyName/companyId from user profile
        const { getUserProfile } = await import("@/services/userService");
        const profile = await getUserProfile(user.id).catch(() => null);

        if (profile?.companyName) {
          const synthetic = {
            $id:         profile.companyId || user.id,
            $createdAt:  "",
            name:        profile.companyName,
            ownerId:     user.id,
            size:        profile.companySize || "",
            industry:    profile.industry   || "",
            inviteCount: 0,
          } as import("@/services/companyService").Company;
          setCompany(synthetic);
          if (profile.companyId) {
            await loadMembers(profile.companyId);
          }
        }
        // If neither exists, company stays null — modal shows "loading" fallback
      } catch (e) {
        console.error("[EmployeesPage] company load error:", e);
      } finally {
        setLoadingCompany(false);
      }
    };

    run();
  }, [user, loadMembers]);

  const handleRemove = async (memberId: string, userId: string | null) => {
    if (!user || !company) return;
    setRemovingId(memberId);
    try {
      const res = await fetch("/api/remove-employee", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          userId,
          employerId: user.id,
          companyId:  company.$id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.$id !== memberId));
        setToast({ message: "Employee removed.", type: "success" });
      } else {
        setToast({ message: data.error || "Failed to remove employee.", type: "error" });
      }
    } catch {
      setToast({ message: "Failed to remove employee.", type: "error" });
    }
    setRemovingId(null);
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(m => m.email.toLowerCase().includes(q) || (m.fullName?.toLowerCase().includes(q)));
  }, [members, searchQuery]);

  const activeCount  = members.filter(m => m.status === "active").length;
  const pendingCount = members.filter(m => m.status === "pending").length;

  return (
    <EmployerLayout>

      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} onDone={dismissToast} />}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkModal && company && user && (
          <AnimatePresence>
            <BulkInviteModal
              company={company}
              currentUserId={user.id}
              accentColor={accentColor}
              isDark={isDark}
              surface={surface}
              onClose={() => setShowBulkModal(false)}
              onSuccess={(msg) => {
                setToast({ message: msg, type: "success" });
                setShowBulkModal(false);
                if (company) loadMembers(company.$id);
              }}
              onError={(msg) => setToast({ message: msg, type: "error" })}
            />
          </AnimatePresence>
        )}

        {showModal && (
          company && user ? (
            <InviteModal key="modal" company={company} currentUserId={user.id} accentColor={accentColor}
              isDark={isDark} surface={surface}
              onClose={() => setShowModal(false)}
              onSuccess={(msg) => { setToast({ message: msg, type: "success" }); if (company) loadMembers(company.$id); }}
              onError={(msg) => setToast({ message: msg, type: "error" })}
            />
          ) : (
            /* Company still loading — show spinner overlay */
            <motion.div key="modal-loading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: surface.surface, border: `1px solid ${surface.border}`, borderRadius: 2, padding: "32px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}
                onClick={(e) => e.stopPropagation()}
              >
                <Loader2 size={28} className="animate-spin" style={{ color: accentColor }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: surface.text }}>Loading company data…</p>
                <p style={{ margin: 0, fontSize: 11, color: surface.muted }}>If this persists, try refreshing the page.</p>
                <button onClick={() => setShowModal(false)}
                  style={{ fontSize: 12, fontWeight: 600, color: surface.muted, background: "none", border: "none", cursor: "pointer", marginTop: 4 }}>
                  Close
                </button>
              </motion.div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
        <div>
          {loadingCompany
            ? <><Skeleton style={{ width: 200, height: 26, marginBottom: 8 }} /><Skeleton style={{ width: 140, height: 13 }} /></>
            : <SectionHeader title="Employee Roster" subtitle="Employee Management" />
          }
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "transparent", border: `1px solid ${c.border}`, color: c.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 2 }}>
            <Download size={13} /> Export
          </button>
          <button onClick={() => setShowBulkModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "transparent", border: `1px solid ${accentColor}`, color: accentColor, fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 2 }}>
            <Upload size={13} /> Bulk Upload
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", background: `linear-gradient(135deg, ${accentColor}, #0FB6C8)`, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", borderRadius: 2 }}>
            <UserPlus size={13} /> Add Employee
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        {loadingCompany || loadingMembers ? (
          [1, 2, 3].map(i => (
            <div key={i} style={{ padding: 16, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <Skeleton style={{ width: "50%", height: 22, marginBottom: 6 }} />
              <Skeleton style={{ width: "70%", height: 12 }} />
            </div>
          ))
        ) : (
          [
            { value: members.length, label: "Total",   color: accentColor },
            { value: activeCount,    label: "Active",  color: "#0FBB7D"   },
            { value: pendingCount,   label: "Pending", color: "#F79009"   },
          ].map(({ value, label, color }) => (
            <div key={label} style={{ padding: 16, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color, letterSpacing: "-0.04em" }}>{value}</p>
              <p style={{ margin: 0, fontSize: 11, color: c.muted, marginTop: 2 }}>{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Employee Table Card */}
      <div style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>

        {/* Card Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${c.border}`, gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={15} style={{ color: c.primary }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: c.text }}>All Employees</span>
            {members.length > 0 && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", background: `${c.primary}18`, color: c.primary, borderRadius: 2 }}>{members.length}</span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!loadingMembers && members.length > 0 && (
              <button onClick={() => company && loadMembers(company.$id)}
                style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", color: c.muted, background: "transparent", border: "none", cursor: "pointer", borderRadius: 2 }}>
                <RefreshCw size={13} />
              </button>
            )}
            {members.length > 0 && (
              <div style={{ position: "relative" }}>
                <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: c.muted }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search employees…"
                  style={{ paddingLeft: 28, paddingRight: 12, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: `1px solid ${c.border}`, background: isDark ? "rgba(0,0,0,0.2)" : c.bg, color: c.text, outline: "none", borderRadius: 2, width: 180 }} />
              </div>
            )}
          </div>
        </div>

        {/* Card Body */}
        {loadingCompany || loadingMembers ? (
          <div>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 20px", borderBottom: `1px solid ${c.border}` }}>
                <Skeleton style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "42%", height: 13, marginBottom: 6 }} />
                  <Skeleton style={{ width: "29%", height: 11 }} />
                </div>
                <Skeleton style={{ width: 90, height: 13 }} />
                <Skeleton style={{ width: 65, height: 22 }} />
                <Skeleton style={{ width: 30, height: 30 }} />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState c={c} isDark={isDark} onInvite={() => setShowModal(true)} />
        ) : filteredMembers.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 24px", gap: 12 }}>
            <Search size={26} style={{ color: c.subtle }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.muted }}>No results for &quot;{searchQuery}&quot;</p>
            <button onClick={() => setSearchQuery("")} style={{ fontSize: 12, fontWeight: 600, color: c.primary, background: "none", border: "none", cursor: "pointer" }}>Clear search</button>
          </div>
        ) : (
          <AnimatePresence>
            {filteredMembers.map((member) => (
              <EmployeeRow key={member.$id} member={member} c={c} isDark={isDark}
                onRemove={handleRemove} removing={removingId === member.$id} />
            ))}
          </AnimatePresence>
        )}

        {/* Card Footer */}
        {!loadingMembers && members.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderTop: `1px solid ${c.border}` }}>
            <p style={{ margin: 0, fontSize: 11, color: c.subtle }}>{filteredMembers.length} of {members.length} shown</p>
            <button onClick={() => setShowModal(true)}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600, color: c.primary, background: "none", border: "none", cursor: "pointer" }}>
              <UserPlus size={13} /> Invite more
            </button>
          </div>
        )}
      </div>

      <ThemeToggle />
    </EmployerLayout>
  );
}
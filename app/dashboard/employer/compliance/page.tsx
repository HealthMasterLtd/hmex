/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import ThemeToggle from "@/components/Themetoggle";
import {
  getCompanyByOwner, getCompanyMembers,
  type Company, type CompanyMember,
} from "@/services/companyService";
import { fetchLatestAssessment } from "@/services/AppwriteService";
import {
  Shield, Lock, CheckCircle, Clock, AlertTriangle, XCircle,
  Users, Database, Key, FileText, Download, RefreshCw,
  Building2, Calendar, Eye, EyeOff, MessageSquare, Send,
  X, Sparkles, Loader2, UserCheck, UserX, UserMinus,
  ChevronDown, ChevronUp, Info, Printer, Globe,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface MemberComplianceRow extends CompanyMember {
  hasAssessment: boolean;
  assessmentCount: number;
  dataCategories: string[];  // what data HMEX holds for this member
}

interface ComplianceSummary {
  total: number;
  active: number;
  pending: number;
  declined: number;
  removed: number;
  consentRate: number;           // % active out of invited
  assessed: number;
  dataSubjects: number;          // members with any stored data
  totalAssessments: number;
  oldestRecord: string | null;
  newestRecord: string | null;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function Skeleton({ w, h, r = 4 }: { w: string | number; h: number; r?: number }) {
  const { isDark } = useTheme();
  return (
    <div className="animate-pulse" style={{ width: w, height: h, borderRadius: r, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
  );
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function statusConfig(status: string) {
  switch (status) {
    case "active":   return { color: "#10B981", bg: "rgba(16,185,129,0.10)", icon: UserCheck, label: "Active — Consented" };
    case "pending":  return { color: "#F59E0B", bg: "rgba(245,158,11,0.10)",  icon: Clock,     label: "Pending Consent" };
    case "declined": return { color: "#EF4444", bg: "rgba(239,68,68,0.10)",   icon: UserX,     label: "Declined" };
    case "removed":  return { color: "#94A3B8", bg: "rgba(148,163,184,0.10)", icon: UserMinus, label: "Removed" };
    default:         return { color: "#94A3B8", bg: "rgba(148,163,184,0.10)", icon: Clock,     label: status };
  }
}

// ─── GROQ COMPLIANCE AI ───────────────────────────────────────────────────────
async function askComplianceAI(
  question: string,
  summary: ComplianceSummary,
  company: Company | null
): Promise<string> {
  const GROQ_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY!;
  const context = `
Company: ${company?.name || "Unknown"} | Industry: ${company?.industry || "Unknown"}
Total invited members: ${summary.total}
Active (consented): ${summary.active}
Pending: ${summary.pending}
Declined/removed: ${summary.declined + summary.removed}
Consent rate: ${summary.consentRate}%
Members with health assessments stored: ${summary.assessed}
Total assessments in database: ${summary.totalAssessments}
Oldest record: ${fmtDate(summary.oldestRecord)}
Newest record: ${fmtDate(summary.newestRecord)}

HMEX Privacy Model:
- Employers NEVER see individual employee health scores or assessment answers
- Employers only see anonymised, aggregated risk distributions (e.g. "3 employees at high risk")
- Individual data is only visible to the employee who owns it
- Employees can withdraw consent by contacting support
- Data is stored in Appwrite (fra.cloud.appwrite.io) hosted in Frankfurt, EU
- Health data is not sold, shared with insurers, or used for employment decisions
- Employees join via invite link and actively accept before any data is linked
`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a data privacy and compliance expert specialising in workplace health data. You advise employers on GDPR, data ethics, and employee health privacy. Be concise, practical, and honest. Max 3 paragraphs.",
        },
        {
          role: "user",
          content: `COMPANY CONTEXT:\n${context}\n\nEMPLOYER QUESTION: "${question}"`,
        },
      ],
      temperature: 0.6,
      max_tokens: 600,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ─── PRINT / PDF ──────────────────────────────────────────────────────────────
function printComplianceReport(company: Company | null, summary: ComplianceSummary, members: MemberComplianceRow[]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const ts = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const active = members.filter(m => m.status === "active");
  const pending = members.filter(m => m.status === "pending");
  const declined = members.filter(m => m.status === "declined" || m.status === "removed");

  w.document.write(`<!DOCTYPE html><html><head><title>HMEX Privacy & Compliance Report</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; font-size: 13px; color: #0f172a; padding: 40px; }
  h1 { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  h2 { font-size: 13px; font-weight: 800; margin: 28px 0 12px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
  .meta { font-size: 11px; color: #64748b; margin-bottom: 28px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
  .card { padding: 14px 16px; border: 1px solid #e2e8f0; }
  .card-val { font-size: 24px; font-weight: 900; }
  .card-lbl { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { text-align: left; padding: 7px 10px; background: #f8fafc; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  .badge { display: inline-block; padding: 2px 7px; font-size: 10px; font-weight: 700; }
  .active   { background: rgba(16,185,129,0.1); color: #10B981; }
  .pending  { background: rgba(245,158,11,0.1); color: #F59E0B; }
  .declined { background: rgba(239,68,68,0.1); color: #EF4444; }
  .notice { padding: 16px 20px; background: rgba(37,99,235,0.05); border: 1px solid rgba(37,99,235,0.15); margin: 20px 0; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>Privacy & Compliance Report</h1>
<p class="meta">${company?.name || "—"} · ${company?.industry || "—"} · Generated ${ts} · HMEX Workforce Health Platform</p>

<h2>Consent & Participation Summary</h2>
<div class="grid">
  <div class="card"><div class="card-lbl">Total Invited</div><div class="card-val">${summary.total}</div></div>
  <div class="card"><div class="card-lbl">Consented (Active)</div><div class="card-val" style="color:#10B981">${summary.active}</div></div>
  <div class="card"><div class="card-lbl">Pending Consent</div><div class="card-val" style="color:#F59E0B">${summary.pending}</div></div>
  <div class="card"><div class="card-lbl">Consent Rate</div><div class="card-val">${summary.consentRate}%</div></div>
  <div class="card"><div class="card-lbl">Health Assessments</div><div class="card-val">${summary.assessed}</div></div>
  <div class="card"><div class="card-lbl">Total Assessments Stored</div><div class="card-val">${summary.totalAssessments}</div></div>
  <div class="card"><div class="card-lbl">Oldest Record</div><div class="card-val" style="font-size:14px">${fmtDate(summary.oldestRecord)}</div></div>
  <div class="card"><div class="card-lbl">Newest Record</div><div class="card-val" style="font-size:14px">${fmtDate(summary.newestRecord)}</div></div>
</div>

<div class="notice">
  <strong>Privacy Guarantee:</strong> Individual employee health scores and assessment answers are never visible to employers.
  All workforce analytics shown in HMEX dashboards use anonymised, aggregated data only.
  This report contains only participation and consent metadata — no individual health data.
</div>

<h2>Consent Register — Active Members (${active.length})</h2>
<table>
  <tr><th>Email</th><th>Invited</th><th>Consented</th><th>Data Held</th></tr>
  ${active.map(m => `<tr>
    <td>${m.email}</td>
    <td>${fmtDate(m.invitedAt)}</td>
    <td>${fmtDate(m.acceptedAt)}</td>
    <td>${m.hasAssessment ? "Profile + Assessment(s)" : "Profile only"}</td>
  </tr>`).join("")}
</table>

${pending.length > 0 ? `
<h2>Pending Invitations (${pending.length})</h2>
<table>
  <tr><th>Email</th><th>Invited</th><th>Invited By</th><th>Status</th></tr>
  ${pending.map(m => `<tr>
    <td>${m.email}</td>
    <td>${fmtDate(m.invitedAt)}</td>
    <td>${m.invitedBy || "—"}</td>
    <td><span class="badge pending">Awaiting</span></td>
  </tr>`).join("")}
</table>` : ""}

${declined.length > 0 ? `
<h2>Declined / Removed (${declined.length})</h2>
<table>
  <tr><th>Email</th><th>Invited</th><th>Status</th></tr>
  ${declined.map(m => `<tr>
    <td>${m.email}</td>
    <td>${fmtDate(m.invitedAt)}</td>
    <td><span class="badge declined">${m.status}</span></td>
  </tr>`).join("")}
</table>` : ""}

<h2>Data Storage & Processing</h2>
<table>
  <tr><th>Item</th><th>Detail</th></tr>
  <tr><td>Data Processor</td><td>Appwrite (fra.cloud.appwrite.io) — Frankfurt, EU</td></tr>
  <tr><td>Health AI Provider</td><td>Groq (llama-3.3-70b) — US-based, no PII transmitted</td></tr>
  <tr><td>Data Controller</td><td>${company?.name || "Employer"}</td></tr>
  <tr><td>Lawful Basis</td><td>Explicit employee consent via invite acceptance</td></tr>
  <tr><td>Individual data visible to employer?</td><td>No — only anonymised aggregates</td></tr>
  <tr><td>Data sold or shared with insurers?</td><td>No</td></tr>
  <tr><td>Used for employment decisions?</td><td>No</td></tr>
  <tr><td>Employee right to access/delete</td><td>Yes — contact support@hmex.com</td></tr>
</table>

<div class="footer">
  <span>HMEX Workforce Health Platform · hmex.vercel.app</span>
  <span>Confidential — For Internal Compliance Records Only</span>
</div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

// ─── CSV EXPORT ───────────────────────────────────────────────────────────────
function exportConsentCSV(members: MemberComplianceRow[], company: Company | null) {
  const rows: string[][] = [
    ["HMEX Consent Register"],
    ["Company", company?.name || "—"],
    ["Generated", new Date().toLocaleDateString("en-GB")],
    [],
    ["Email", "Status", "Invited At", "Consented At", "Invited By", "Has Assessment", "Data Categories"],
    ...members.map(m => [
      m.email, m.status, fmtDate(m.invitedAt), fmtDate(m.acceptedAt),
      m.invitedBy || "—",
      m.hasAssessment ? "Yes" : "No",
      m.dataCategories.join("; ") || "None",
    ]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `hmex-consent-register-${company?.name?.replace(/\s+/g, "-") || "company"}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ─── AI CHAT PANEL ────────────────────────────────────────────────────────────
function AiComplianceChat({ summary, company, c, accentColor, onClose }: {
  summary: ComplianceSummary; company: Company | null; c: any; accentColor: string; onClose: () => void;
}) {
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: `Hi! I'm your privacy & compliance advisor. Ask me anything about HMEX's data practices, GDPR obligations, consent management, or your ${summary.active} active members' data rights.` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Suggested questions
  const suggestions = [
    "Is HMEX GDPR compliant?",
    "Can I see individual employee health scores?",
    "What data do employees control?",
    "How do I handle a data deletion request?",
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    const q = text || input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const answer = await askComplianceAI(q, summary, company);
      setMessages(m => [...m, { role: "ai", text: answer }]);
    } catch {
      setMessages(m => [...m, { role: "ai", text: "Couldn't reach the AI right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
      style={{ position: "fixed", right: 16, bottom: 80, width: 370, maxHeight: 540, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 4, boxShadow: "0 24px 64px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", zIndex: 100, overflow: "hidden" }}>

      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 8, background: `${accentColor}08` }}>
        <Shield size={14} style={{ color: accentColor }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: c.text, flex: 1 }}>Privacy & Compliance AI</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted }}><X size={15} /></button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "87%", padding: "9px 12px", borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", background: msg.role === "user" ? accentColor : c.bg || "rgba(0,0,0,0.04)", color: msg.role === "user" ? "white" : c.text, fontSize: 12, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: 4, padding: "6px 10px" }}>
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ y: [0,-4,0] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div style={{ padding: "0 14px 8px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)}
              style={{ padding: "5px 10px", fontSize: 10, fontWeight: 600, background: `${accentColor}10`, color: accentColor, border: `1px solid ${accentColor}25`, borderRadius: 2, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${c.border}`, display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask about data privacy, GDPR, consent…"
          style={{ flex: 1, padding: "8px 12px", fontSize: 12, border: `1px solid ${c.border}`, borderRadius: 2, background: "transparent", color: c.text, outline: "none" }} />
        <button onClick={() => send(input)} disabled={!input.trim() || loading}
          style={{ padding: "8px 12px", background: accentColor, border: "none", borderRadius: 2, cursor: "pointer", color: "white" }}>
          <Send size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployerCompliancePage() {
  const { user }                         = useAuth();
  const { isDark, surface, accentColor } = useTheme();
  const c = surface;

  const [company,  setCompany]  = useState<Company | null>(null);
  const [members,  setMembers]  = useState<MemberComplianceRow[]>([]);
  const [summary,  setSummary]  = useState<ComplianceSummary | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<"overview" | "consent" | "audit" | "data">("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const [showEmails, setShowEmails] = useState(false);   // privacy toggle for email column
  const [exportOpen, setExportOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [consentFilter, setConsentFilter] = useState<"all" | "active" | "pending" | "declined" | "removed">("all");

  // ─── LOAD ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      let co = await getCompanyByOwner(uid).catch(() => null);
      if (!co) {
        const { getUserProfile } = await import("@/services/userService");
        const p = await getUserProfile(uid).catch(() => null);
        if (p?.companyName) co = { $id: p.companyId || uid, $createdAt: "", name: p.companyName, ownerId: uid, size: p.companySize || "", industry: p.industry || "", inviteCount: 0 } as Company;
      }
      setCompany(co);
      if (!co) { setLoading(false); return; }

      // Get all members including removed
      const { USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID } = await import("@/services/companyService");
      const { Client, Databases, Query } = await import("appwrite");
      const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);
      const db = new Databases(client);

      const res = await db.listDocuments(USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
        Query.equal("companyId", co.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ]);

      // Enrich with assessment data
      let totalAssessments = 0;
      const enriched: MemberComplianceRow[] = await Promise.all(
        res.documents.map(async (doc) => {
          const m = doc as unknown as CompanyMember;
          let hasAssessment = false;
          let assessmentCount = 0;
          const dataCategories: string[] = ["Invite record"];

          if (m.status === "active" && m.userId) {
            dataCategories.push("User profile");
            const a = await fetchLatestAssessment(m.userId).catch(() => null);
            if (a) {
              hasAssessment = true;
              dataCategories.push("Health assessment(s)");
              // Get total count from fetchUserAssessments
              try {
                const { fetchUserAssessments } = await import("@/services/AppwriteService");
                const all = await fetchUserAssessments(m.userId).catch(() => []);
                assessmentCount = all.length;
                totalAssessments += assessmentCount;
              } catch { assessmentCount = 1; totalAssessments += 1; }
            }
          }

          return { ...m, hasAssessment, assessmentCount, dataCategories };
        })
      );

      setMembers(enriched);

      // Compute summary
      const active   = enriched.filter(m => m.status === "active");
      const pending  = enriched.filter(m => m.status === "pending");
      const declined = enriched.filter(m => m.status === "declined");
      const removed  = enriched.filter(m => m.status === "removed");
      const assessed = active.filter(m => m.hasAssessment);
      const allDates = enriched.map(m => m.$createdAt).filter(Boolean).sort();

      setSummary({
        total:            enriched.length,
        active:           active.length,
        pending:          pending.length,
        declined:         declined.length,
        removed:          removed.length,
        consentRate:      enriched.length > 0 ? Math.round((active.length / enriched.length) * 100) : 0,
        assessed:         assessed.length,
        dataSubjects:     active.length,
        totalAssessments,
        oldestRecord:     allDates[0] || null,
        newestRecord:     allDates[allDates.length - 1] || null,
      });
    } catch (e) {
      console.error("[Compliance] load error:", e);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => { if (user) loadData(user.id); }, [user]);

  // Filtered members
  const filtered = members.filter(m => consentFilter === "all" || m.status === consentFilter);
  const maskEmail = (email: string) => showEmails ? email : email.replace(/(.{2}).*(@.*)/, "$1***$2");

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 80 }} onClick={() => setExportOpen(false)}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: accentColor, letterSpacing: "0.12em", textTransform: "uppercase" }}>Data Protection</p>
            <h1 style={{ margin: 0, fontSize: "clamp(1.35rem,3vw,1.7rem)", fontWeight: 900, color: c.text, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Privacy & Compliance
            </h1>
            {company && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: c.muted, display: "flex", alignItems: "center", gap: 5 }}>
                <Building2 size={12} />{company.name}
                {lastRefresh && <span style={{ fontSize: 10, opacity: 0.5 }}>· {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => user && loadData(user.id)} disabled={loading}
              style={{ padding: "8px 13px", background: "transparent", border: `1px solid ${c.border}`, color: c.muted, borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 600 }}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />Refresh
            </button>

            {/* Export dropdown */}
            <div style={{ position: "relative" }}>
              <button onClick={() => setExportOpen(v => !v)} disabled={!summary}
                style={{ padding: "8px 16px", background: accentColor, border: "none", color: "white", borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700 }}>
                <Download size={13} />Export <ChevronDown size={11} />
              </button>
              <AnimatePresence>
                {exportOpen && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    style={{ position: "absolute", right: 0, top: "calc(100%+6px)", zIndex: 50, background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, overflow: "hidden", minWidth: 190, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", marginTop: 4 }}>
                    {[
                      { icon: <Printer size={13} color={accentColor} />, label: "Print / Save PDF", action: () => { setExportOpen(false); summary && printComplianceReport(company, summary, members); } },
                      { icon: <FileText size={13} color={accentColor} />, label: "Export Consent CSV", action: () => { setExportOpen(false); exportConsentCSV(members, company); } },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action}
                        style={{ width: "100%", padding: "10px 16px", background: "none", border: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: c.text }}
                        onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* ── Summary Stats ─────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { icon: <Users size={15} />,        label: "Total Invited",   value: summary?.total ?? "—",              color: accentColor },
            { icon: <UserCheck size={15} />,    label: "Consented",       value: summary?.active ?? "—",             color: "#10B981" },
            { icon: <Clock size={15} />,        label: "Pending",         value: summary?.pending ?? "—",            color: "#F59E0B" },
            { icon: <Key size={15} />,          label: "Consent Rate",    value: `${summary?.consentRate ?? 0}%`,    color: "#8B5CF6" },
            { icon: <Database size={15} />,     label: "Data Subjects",   value: summary?.dataSubjects ?? "—",       color: "#0EA5E9" },
            { icon: <FileText size={15} />,     label: "Assessments",     value: summary?.totalAssessments ?? "—",  color: "#EC4899" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              style={{ padding: "14px 16px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                <span style={{ color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span>
              </div>
              {loading ? <Skeleton w="55%" h={24} /> : <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: c.text }}>{s.value}</p>}
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${c.border}`, marginBottom: 22 }}>
          {([
            { key: "overview", label: "Overview",        icon: <Shield size={13} /> },
            { key: "consent",  label: "Consent Register", icon: <UserCheck size={13} /> },
            { key: "audit",    label: "Audit Log",        icon: <Clock size={13} /> },
            { key: "data",     label: "Data Held",        icon: <Database size={13} /> },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ padding: "8px 16px", background: "none", border: "none", borderBottom: tab === t.key ? `2px solid ${accentColor}` : "2px solid transparent", marginBottom: -1, cursor: "pointer", fontSize: 12, fontWeight: tab === t.key ? 800 : 600, color: tab === t.key ? accentColor : c.muted, display: "flex", alignItems: "center", gap: 5 }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: OVERVIEW                                                      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Privacy-first guarantee banner */}
            <div style={{ padding: "18px 20px", background: isDark ? `${accentColor}0A` : `${accentColor}06`, border: `1px solid ${accentColor}22`, borderRadius: 2, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, background: `${accentColor}18`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={18} style={{ color: accentColor }} />
              </div>
              <div>
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800, color: c.text }}>Privacy-First by Design</p>
                <p style={{ margin: 0, fontSize: 12, color: c.muted, lineHeight: 1.7 }}>
                  Individual employee health scores, assessment answers, and risk levels are <strong style={{ color: c.text }}>never visible to employers</strong>.
                  You only see anonymised, aggregated workforce distributions. Employees own their health data and can request deletion at any time.
                </p>
              </div>
            </div>

            {/* Consent breakdown */}
            <div style={{ padding: "18px 20px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 800, color: c.text }}>Consent Status Breakdown</p>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} w="100%" h={38} />)}
                </div>
              ) : summary && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { label: "Active — Consented",   value: summary.active,   total: summary.total, color: "#10B981" },
                    { label: "Pending invitation",    value: summary.pending,  total: summary.total, color: "#F59E0B" },
                    { label: "Declined",              value: summary.declined, total: summary.total, color: "#EF4444" },
                    { label: "Removed",               value: summary.removed,  total: summary.total, color: "#94A3B8" },
                  ].map(row => {
                    const pct = summary.total > 0 ? Math.round((row.value / summary.total) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>{row.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: row.color }}>{row.value} <span style={{ fontWeight: 400, color: c.muted }}>({pct}%)</span></span>
                        </div>
                        <div style={{ height: 6, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 3 }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ height: "100%", background: row.color, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Data practices grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
              {[
                { icon: <Globe size={16} />, title: "Data Location", body: "All data stored in Appwrite Frankfurt (EU) — fully GDPR-compliant jurisdiction.", color: "#0EA5E9" },
                { icon: <Lock size={16} />, title: "Individual Privacy", body: "Employers see aggregate risk distributions only. No individual scores are ever exposed.", color: "#10B981" },
                { icon: <Key size={16} />, title: "Lawful Basis", body: "Explicit consent via invite acceptance. Employees choose to join — no passive data collection.", color: "#8B5CF6" },
                { icon: <XCircle size={16} />, title: "No Data Selling", body: "Health data is never sold, shared with insurers, or used in employment decisions.", color: "#EF4444" },
                { icon: <UserCheck size={16} />, title: "Right to Delete", body: "Employees can request full data deletion at any time via support@hmex.com.", color: "#F59E0B" },
                { icon: <Shield size={16} />, title: "AI Processing", body: "AI risk analysis uses Groq (llama-3.3-70b). No personally identifiable data is sent to Groq.", color: accentColor },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  style={{ padding: "16px 18px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 2, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: item.color }}>{item.icon}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: c.text }}>{item.title}</p>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: c.muted, lineHeight: 1.65 }}>{item.body}</p>
                </motion.div>
              ))}
            </div>

            {/* Data timeline */}
            {summary && !loading && (
              <div style={{ padding: "16px 20px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2, display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Oldest Record</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>{fmtDate(summary.oldestRecord)}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Most Recent</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>{fmtDate(summary.newestRecord)}</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Data Subjects</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>{summary.dataSubjects} employees</p>
                </div>
                <div>
                  <p style={{ margin: "0 0 2px", fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>Stored Assessments</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.text }}>{summary.totalAssessments} records</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: CONSENT REGISTER                                              */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === "consent" && (
          <div>
            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(["all","active","pending","declined","removed"] as const).map(f => (
                  <button key={f} onClick={() => setConsentFilter(f)}
                    style={{ padding: "5px 12px", fontSize: 11, fontWeight: 700, borderRadius: 2, border: `1px solid ${consentFilter === f ? accentColor : c.border}`, background: consentFilter === f ? `${accentColor}12` : "transparent", color: consentFilter === f ? accentColor : c.muted, cursor: "pointer", textTransform: "capitalize" }}>
                    {f} {f !== "all" && `(${members.filter(m => m.status === f).length})`}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowEmails(v => !v)}
                style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: c.muted, background: "none", border: `1px solid ${c.border}`, padding: "5px 10px", borderRadius: 2, cursor: "pointer" }}>
                {showEmails ? <EyeOff size={12} /> : <Eye size={12} />}
                {showEmails ? "Mask emails" : "Show emails"}
              </button>
            </div>

            {/* Table header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 90px", gap: 8, padding: "8px 14px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 2, fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              <span>Employee</span><span>Status</span><span>Invited</span><span>Consented</span><span style={{ textAlign: "right" }}>Data</span>
            </div>

            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: "12px 14px", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 10, alignItems: "center" }}>
                  <Skeleton w="35%" h={12} /><Skeleton w="15%" h={18} /><Skeleton w="15%" h={12} /><Skeleton w="15%" h={12} /><Skeleton w="10%" h={12} />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 13, color: c.muted }}>No members match this filter</p>
              </div>
            ) : (
              filtered.map((m, i) => {
                const sc = statusConfig(m.status);
                const StatusIcon = sc.icon;
                return (
                  <motion.div key={m.$id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ display: "grid", gridTemplateColumns: "1fr 100px 120px 120px 90px", gap: 8, padding: "11px 14px", borderBottom: `1px solid ${c.border}`, alignItems: "center", fontSize: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 600, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskEmail(m.email)}</p>
                      {m.invitedBy && <p style={{ margin: "1px 0 0", fontSize: 10, color: c.muted }}>by {m.invitedBy}</p>}
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 2, background: sc.bg, color: sc.color, fontSize: 10, fontWeight: 700, width: "fit-content" }}>
                      <StatusIcon size={10} />{m.status}
                    </span>
                    <span style={{ fontSize: 11, color: c.muted }}>{fmtDate(m.invitedAt)}</span>
                    <span style={{ fontSize: 11, color: c.muted }}>{m.acceptedAt ? fmtDate(m.acceptedAt) : <span style={{ color: "#94A3B8" }}>—</span>}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: m.hasAssessment ? "#10B981" : c.muted, textAlign: "right" }}>
                      {m.hasAssessment ? `${m.assessmentCount} assess.` : m.status === "active" ? "Profile" : "None"}
                    </span>
                  </motion.div>
                );
              })
            )}
            <p style={{ margin: "10px 0 0", fontSize: 11, color: c.muted }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: AUDIT LOG                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === "audit" && (
          <div>
            <p style={{ margin: "0 0 16px", fontSize: 12, color: c.muted }}>Chronological record of all membership events derived from Appwrite records.</p>
            {loading ? (
              [1,2,3,4,5,6].map(i => (
                <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${c.border}`, display: "flex", gap: 12 }}>
                  <Skeleton w={8} h={8} r={4} /><Skeleton w="70%" h={14} />
                </div>
              ))
            ) : (
              <div style={{ position: "relative" }}>
                {/* Timeline line */}
                <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 1, background: c.border }} />

                {[...members]
                  // Build events from real data
                  .flatMap(m => {
                    const events: { date: string; label: string; email: string; type: string }[] = [];
                    events.push({ date: m.invitedAt || m.$createdAt, label: "invited", email: m.email, type: "invite" });
                    if (m.acceptedAt) events.push({ date: m.acceptedAt, label: "accepted invitation", email: m.email, type: "accept" });
                    if (m.status === "declined") events.push({ date: m.$createdAt, label: "declined invitation", email: m.email, type: "decline" });
                    if (m.status === "removed") events.push({ date: m.$createdAt, label: "was removed", email: m.email, type: "remove" });
                    return events;
                  })
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 50)
                  .map((ev, i) => {
                    const typeColors: Record<string, string> = { invite: accentColor, accept: "#10B981", decline: "#EF4444", remove: "#94A3B8" };
                    const col = typeColors[ev.type] || c.muted;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                        style={{ display: "flex", gap: 16, padding: "12px 0 12px 36px", borderBottom: `1px solid ${c.border}`, position: "relative" }}>
                        {/* Dot */}
                        <div style={{ position: "absolute", left: 10, top: 17, width: 10, height: 10, borderRadius: "50%", background: col, border: `2px solid ${c.surface}`, zIndex: 1 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: c.text }}>{maskEmail(ev.email)}</span>
                            <span style={{ fontSize: 12, color: c.muted }}>{ev.label}</span>
                          </div>
                          <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                            <span style={{ fontSize: 10, color: c.muted }}>{fmtDateTime(ev.date)}</span>
                            <span style={{ fontSize: 10, color: c.muted, opacity: 0.6 }}>{timeSince(ev.date)}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                }
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: DATA HELD                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === "data" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* What HMEX stores — explanation */}
            <div style={{ padding: "18px 20px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 800, color: c.text }}>What HMEX Stores Per Employee</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10 }}>
                {[
                  { category: "Invite record", who: "All invited", detail: "Email, invite date, invited-by, token. Always stored.", color: accentColor },
                  { category: "User profile", who: "Active members only", detail: "Name, email, role, company link, avatar. Stored on signup.", color: "#0EA5E9" },
                  { category: "Health assessment", who: "Assessed members only", detail: "Risk scores, questionnaire answers, AI analysis. Employee-owned.", color: "#8B5CF6" },
                  { category: "XP record", who: "Assessed members only", detail: "Points earned from assessments. No health data.", color: "#F59E0B" },
                ].map((item, i) => (
                  <div key={i} style={{ padding: "14px 16px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)", borderRadius: 2, border: `1px solid ${item.color}20` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color }} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: c.text }}>{item.category}</span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: item.color }}>{item.who}</p>
                    <p style={{ margin: 0, fontSize: 11, color: c.muted, lineHeight: 1.5 }}>{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-member breakdown */}
            <div style={{ padding: "16px 20px 8px", background: c.surface, border: `1px solid ${c.border}`, borderRadius: 2 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: c.text }}>Data Held Per Member</p>
                <button onClick={() => setShowEmails(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: c.muted, background: "none", border: `1px solid ${c.border}`, padding: "4px 9px", borderRadius: 2, cursor: "pointer" }}>
                  {showEmails ? <EyeOff size={11} /> : <Eye size={11} />}{showEmails ? "Mask" : "Show"} emails
                </button>
              </div>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr", gap: 8, padding: "6px 0", borderBottom: `1px solid ${c.border}`, fontSize: 10, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                <span>Employee</span><span>Status</span><span>Data Categories</span>
              </div>
              {loading ? [1,2,3].map(i => <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${c.border}` }}><Skeleton w="100%" h={14} /></div>)
                : members.filter(m => m.status !== "removed").map((m, i) => {
                  const sc = statusConfig(m.status);
                  return (
                    <div key={m.$id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 1fr", gap: 8, padding: "10px 0", borderBottom: `1px solid ${c.border}`, alignItems: "center", fontSize: 12 }}>
                      <span style={{ color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{maskEmail(m.email)}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sc.color }}>{m.status}</span>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {m.dataCategories.map((cat, j) => (
                          <span key={j} style={{ padding: "2px 7px", borderRadius: 2, background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", fontSize: 10, fontWeight: 600, color: c.muted }}>{cat}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* Deletion request info */}
            <div style={{ padding: "14px 18px", background: isDark ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 2, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Info size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: "0 0 3px", fontSize: 12, fontWeight: 700, color: c.text }}>Employee Right to Deletion</p>
                <p style={{ margin: 0, fontSize: 11, color: c.muted, lineHeight: 1.6 }}>
                  Any employee can request deletion of all their data by contacting <strong style={{ color: c.text }}>support@hmex.com</strong>. 
                  Deletion removes their profile, assessment records, and XP from the database within 30 days.
                  Invite records (email + dates only) may be retained for audit purposes.
                </p>
              </div>
            </div>
          </div>
        )}

        <ThemeToggle />
      </div>

      {/* ── Floating AI Chat ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatOpen && summary && (
          <AiComplianceChat summary={summary} company={company} c={c} accentColor={accentColor} onClose={() => setChatOpen(false)} />
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
        onClick={() => setChatOpen(v => !v)}
        title="Ask compliance AI"
        style={{ position: "fixed", bottom: 24, right: 24, width: 52, height: 52, borderRadius: "50%", background: accentColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${accentColor}55`, zIndex: 99 }}>
        {chatOpen ? <X size={20} color="white" /> : <Shield size={20} color="white" />}
      </motion.button>
    </EmployerLayout>
  );
}
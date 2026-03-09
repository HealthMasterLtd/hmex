// components/dashboard/BulkInviteModal.tsx
"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Upload, FileSpreadsheet, AlertCircle, CheckCircle,
  Users, UserCheck, Clock, Link2, Copy, Check, Loader2,
  Download, ChevronDown, ChevronUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkEntry { email: string; name?: string; }

interface BulkResult {
  email:         string;
  name?:         string;
  result:        "added_active" | "added_pending" | "already_member" | "invalid_email" | "error";
  errorMessage?: string;
}

interface Summary {
  addedActive:  number;
  addedPending: number;
  skipped:      number;
  errors:       number;
  total:        number;
}

interface Company {
  $id:  string;
  name: string;
}

interface BulkInviteModalProps {
  company:       Company;
  currentUserId: string;
  accentColor:   string;
  isDark:        boolean;
  surface:       { text: string; muted: string; subtle: string; border: string; surface: string; bg: string; };
  onClose:       () => void;
  onSuccess:     (msg: string) => void;
  onError:       (msg: string) => void;
}

// ─── CSV / Excel Parser ───────────────────────────────────────────────────────

async function parseFile(file: File): Promise<BulkEntry[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCSV(await file.text());
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buf  = await file.arrayBuffer();
    const wb   = XLSX.read(buf, { type: "array" });
    const ws   = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
    return normaliseRows(rows);
  }

  throw new Error("Unsupported file type. Please upload a CSV or Excel (.xlsx) file.");
}

function parseCSV(text: string): BulkEntry[] {
  const lines  = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z]/g, ""));
  const rows: Record<string, string>[] = lines.slice(1).map((line) => {
    const cols: Record<string, string> = {};
    // Handle quoted fields
    const parts = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || line.split(",");
    header.forEach((h, i) => { cols[h] = (parts[i] || "").replace(/^"|"$/g, "").trim(); });
    return cols;
  });
  return normaliseRows(rows);
}

function normaliseRows(rows: Record<string, string>[]): BulkEntry[] {
  return rows
    .map((row) => {
      // Accept common column name variations
      const email = row["email"] || row["emailaddress"] || row["mail"] || row["e-mail"] || "";
      const name  = row["name"]  || row["fullname"]     || row["full_name"] || row["employeename"] || row["firstname"] || "";
      return { email: email.trim(), name: name.trim() || undefined };
    })
    .filter((e) => e.email.length > 0);
}

// ─── Step components ──────────────────────────────────────────────────────────

type Step = "upload" | "preview" | "processing" | "done";

const resultLabel: Record<BulkResult["result"], string> = {
  added_active:  "Added",
  added_pending: "Pending",
  already_member: "Already member",
  invalid_email:  "Invalid email",
  error:          "Error",
};
const resultColor: Record<BulkResult["result"], string> = {
  added_active:   "#0FBB7D",
  added_pending:  "#F79009",
  already_member: "#94A3B8",
  invalid_email:  "#EF4444",
  error:          "#EF4444",
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function BulkInviteModal({
  company, currentUserId, accentColor, isDark, surface, onClose, onSuccess, onError,
}: BulkInviteModalProps) {
  const [step,          setStep]          = useState<Step>("upload");
  const [entries,       setEntries]       = useState<BulkEntry[]>([]);
  const [fileName,      setFileName]      = useState<string>("");
  const [parseError,    setParseError]    = useState<string | null>(null);
  const [dragging,      setDragging]      = useState(false);
  const [processing,    setProcessing]    = useState(false);
  const [summary,       setSummary]       = useState<Summary | null>(null);
  const [results,       setResults]       = useState<BulkResult[]>([]);
  const [shareableLink, setShareableLink] = useState<string>("");
  const [copied,        setCopied]        = useState(false);
  const [showErrors,    setShowErrors]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const bg     = surface.surface;
  const border = surface.border;
  const text   = surface.text;
  const muted  = surface.muted;
  const inputBg = isDark ? "rgba(0,0,0,0.25)" : surface.bg;

  // ── File handling ──────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setParseError(null);
    setEntries([]);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) { setParseError("No valid rows found. Make sure your file has an 'email' column."); return; }
      if (parsed.length > 1000) { setParseError("Maximum 1000 employees per upload. Please split your file."); return; }
      setFileName(file.name);
      setEntries(parsed);
      setStep("preview");
    } catch (e: any) {
      setParseError(e.message || "Failed to parse file.");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    setProcessing(true);
    setStep("processing");
    try {
      const res  = await fetch("/api/bulk-invite", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          entries,
          companyId:   company.$id,
          companyName: company.name,
          invitedBy:   currentUserId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk invite failed.");
      setSummary(data.summary);
      setResults(data.results);
      setShareableLink(data.shareableLink);
      setStep("done");
      onSuccess(`${data.summary.addedActive + data.summary.addedPending} employees added to ${company.name}`);
    } catch (e: any) {
      onError(e.message || "Something went wrong.");
      setStep("preview");
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const downloadTemplate = () => {
    const csv  = "name,email\nJane Smith,jane@company.com\nJohn Doe,john@company.com";
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "hmex-bulk-invite-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── Invalid entries ──────────────────────────────────────────────────────
  const invalidCount   = entries.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email)).length;
  const validCount     = entries.length - invalidCount;
  const errorResults   = results.filter((r) => r.result === "invalid_email" || r.result === "error");

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && step !== "processing") onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: "spring", stiffness: 380, damping: 32 }}
        style={{ width: "100%", maxWidth: step === "done" ? 520 : 560, background: bg, border: `1px solid ${border}`, borderRadius: 2, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px 16px", borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}18`, borderRadius: 2 }}>
              <FileSpreadsheet size={18} style={{ color: accentColor }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: text }}>Bulk Upload Employees</p>
              <p style={{ margin: 0, fontSize: 11, color: muted }}>
                {step === "upload"     && "Upload a CSV or Excel file"}
                {step === "preview"    && `${validCount} employees ready to add${invalidCount > 0 ? ` · ${invalidCount} invalid` : ""}`}
                {step === "processing" && "Adding employees…"}
                {step === "done"       && `${company.name} · Done`}
              </p>
            </div>
          </div>
          {step !== "processing" && (
            <button onClick={onClose} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: muted, background: "transparent", border: "none", cursor: "pointer", borderRadius: 2 }}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          <AnimatePresence mode="wait">

            {/* ── UPLOAD STEP ── */}
            {step === "upload" && (
              <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragging ? accentColor : border}`,
                    borderRadius: 2, padding: "40px 24px", textAlign: "center", cursor: "pointer",
                    background: dragging ? `${accentColor}08` : inputBg,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ width: 56, height: 56, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", background: `${accentColor}12`, borderRadius: 2 }}>
                    <Upload size={24} style={{ color: accentColor }} />
                  </div>
                  <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700, color: text }}>
                    Drop your file here or <span style={{ color: accentColor }}>browse</span>
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: muted }}>CSV or Excel (.xlsx) · Max 1,000 employees</p>
                  <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={onFileInput} style={{ display: "none" }} />
                </div>

                {parseError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ marginTop: 12, padding: "10px 12px", display: "flex", gap: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 2 }}>
                    <AlertCircle size={14} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
                    <p style={{ margin: 0, fontSize: 12, color: "#EF4444" }}>{parseError}</p>
                  </motion.div>
                )}

                {/* Format hint */}
                <div style={{ marginTop: 20, padding: "14px 16px", background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 2 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: text }}>Required format</p>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: muted, fontFamily: "monospace" }}>
                    name, email
                  </p>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: muted, fontFamily: "monospace" }}>
                    Jane Smith, jane@company.com
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: muted }}>
                    The <strong>email</strong> column is required. <strong>name</strong> is optional.
                  </p>
                </div>

                <button onClick={downloadTemplate}
                  style={{ marginTop: 12, width: "100%", padding: "9px 16px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: `1px solid ${border}`, color: muted, borderRadius: 2, cursor: "pointer" }}>
                  <Download size={13} /> Download template CSV
                </button>
              </motion.div>
            )}

            {/* ── PREVIEW STEP ── */}
            {step === "preview" && (
              <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Total",   value: entries.length,  color: accentColor },
                    { label: "Valid",   value: validCount,       color: "#0FBB7D"   },
                    { label: "Invalid", value: invalidCount,     color: invalidCount > 0 ? "#EF4444" : muted },
                  ].map((s) => (
                    <div key={s.label} style={{ flex: 1, padding: "12px", background: `${s.color}0D`, border: `1px solid ${s.color}25`, borderRadius: 2, textAlign: "center" }}>
                      <p style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</p>
                      <p style={{ margin: 0, fontSize: 11, color: muted }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Preview table */}
                <div style={{ border: `1px solid ${border}`, borderRadius: 2, overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${border}` }}>#</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${border}` }}>Name</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${border}` }}>Email</th>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: muted, fontWeight: 600, fontSize: 11, borderBottom: `1px solid ${border}` }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice(0, 200).map((e, i) => {
                        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email);
                        return (
                          <tr key={i} style={{ borderBottom: `1px solid ${border}`, background: !valid ? "rgba(239,68,68,0.04)" : "transparent" }}>
                            <td style={{ padding: "7px 12px", color: muted }}>{i + 1}</td>
                            <td style={{ padding: "7px 12px", color: text }}>{e.name || "—"}</td>
                            <td style={{ padding: "7px 12px", color: text, fontFamily: "monospace", fontSize: 11 }}>{e.email}</td>
                            <td style={{ padding: "7px 12px" }}>
                              {valid
                                ? <span style={{ fontSize: 10, fontWeight: 700, color: "#0FBB7D" }}>✓ Valid</span>
                                : <span style={{ fontSize: 10, fontWeight: 700, color: "#EF4444" }}>✗ Invalid</span>}
                            </td>
                          </tr>
                        );
                      })}
                      {entries.length > 200 && (
                        <tr><td colSpan={4} style={{ padding: "8px 12px", color: muted, fontSize: 11, textAlign: "center" }}>
                          + {entries.length - 200} more rows
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {invalidCount > 0 && (
                  <p style={{ margin: "10px 0 0", fontSize: 11, color: "#F79009" }}>
                    ⚠ {invalidCount} invalid email{invalidCount > 1 ? "s" : ""} will be skipped.
                  </p>
                )}

                {/* Info box */}
                <div style={{ marginTop: 14, padding: "10px 12px", display: "flex", gap: 8, background: `${accentColor}08`, border: `1px solid ${accentColor}20`, borderRadius: 2 }}>
                  <AlertCircle size={13} style={{ color: accentColor, flexShrink: 0, marginTop: 1 }} />
                  <p style={{ margin: 0, fontSize: 11, color: muted, lineHeight: 1.65 }}>
                    Employees already on HMEX will be added instantly. Others will be marked pending — share the company link after uploading so they can sign up and join automatically.
                  </p>
                </div>

                <button onClick={() => { setStep("upload"); setEntries([]); setFileName(""); }}
                  style={{ marginTop: 12, fontSize: 11, color: muted, background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                  ← Upload a different file ({fileName})
                </button>
              </motion.div>
            )}

            {/* ── PROCESSING STEP ── */}
            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${accentColor}22` }} />
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid transparent`, borderTopColor: accentColor }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={20} style={{ color: accentColor }} />
                  </div>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: text }}>Processing {entries.length} employees…</p>
                  <p style={{ margin: 0, fontSize: 12, color: muted }}>Checking existing accounts and creating records</p>
                </div>
              </motion.div>
            )}

            {/* ── DONE STEP ── */}
            {step === "done" && summary && (
              <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: <UserCheck size={16} />, label: "Added active",  value: summary.addedActive,  color: "#0FBB7D", desc: "Already on HMEX" },
                    { icon: <Clock size={16} />,     label: "Pending",       value: summary.addedPending, color: "#F79009", desc: "Need to sign up" },
                    { icon: <Users size={16} />,     label: "Already member",value: summary.skipped,      color: accentColor, desc: "Skipped" },
                    { icon: <AlertCircle size={16} />,label: "Errors",       value: summary.errors,       color: summary.errors > 0 ? "#EF4444" : muted, desc: "Invalid / failed" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "14px 16px", background: `${s.color}0D`, border: `1px solid ${s.color}22`, borderRadius: 2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: s.color }}>{s.icon}</div>
                      <p style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
                      <p style={{ margin: "0 0 1px", fontSize: 11, fontWeight: 700, color: text }}>{s.label}</p>
                      <p style={{ margin: 0, fontSize: 10, color: muted }}>{s.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Shareable link — for pending employees */}
                {summary.addedPending > 0 && (
                  <div style={{ marginBottom: 16, padding: "14px 16px", background: `${accentColor}08`, border: `1px solid ${accentColor}25`, borderRadius: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <Link2 size={13} style={{ color: accentColor }} />
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: text }}>Share this link with your employees</p>
                    </div>
                    <p style={{ margin: "0 0 10px", fontSize: 11, color: muted, lineHeight: 1.6 }}>
                      Send this to your {summary.addedPending} pending employee{summary.addedPending > 1 ? "s" : ""} via WhatsApp, Slack, or email. When they sign up using this link, they&apos;ll automatically join {company.name}.
                    </p>
                    <div style={{ display: "flex", gap: 6 }}>
                      <input readOnly value={shareableLink}
                        style={{ flex: 1, padding: "8px 10px", fontSize: 11, border: `1px solid ${border}`, background: inputBg, color: muted, outline: "none", borderRadius: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />
                      <button onClick={handleCopy}
                        style={{ padding: "8px 14px", fontSize: 11, fontWeight: 700, background: copied ? "#0FBB7D" : `${accentColor}18`, color: copied ? "white" : accentColor, border: `1px solid ${copied ? "#0FBB7D" : accentColor}25`, borderRadius: 2, cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                        {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error details — collapsible */}
                {errorResults.length > 0 && (
                  <div style={{ border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 2, overflow: "hidden" }}>
                    <button onClick={() => setShowErrors(!showErrors)}
                      style={{ width: "100%", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(239,68,68,0.06)", border: "none", cursor: "pointer", color: "#EF4444" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{errorResults.length} failed entries</span>
                      {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <AnimatePresence>
                      {showErrors && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                          <div style={{ maxHeight: 160, overflowY: "auto" }}>
                            {errorResults.map((r, i) => (
                              <div key={i} style={{ padding: "7px 14px", borderTop: `1px solid ${border}`, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                <span style={{ color: text, fontFamily: "monospace" }}>{r.email}</span>
                                <span style={{ color: "#EF4444" }}>{r.errorMessage || resultLabel[r.result]}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: "0 24px 24px", flexShrink: 0, display: "flex", gap: 10 }}>
          {step === "upload" && (
            <button onClick={onClose}
              style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, background: "transparent", border: `1px solid ${border}`, color: muted, borderRadius: 2, cursor: "pointer" }}>
              Cancel
            </button>
          )}
          {step === "preview" && (
            <>
              <button onClick={() => setStep("upload")}
                style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, background: "transparent", border: `1px solid ${border}`, color: muted, borderRadius: 2, cursor: "pointer" }}>
                Back
              </button>
              <button onClick={handleUpload} disabled={validCount === 0}
                style={{ flex: 2, padding: "10px 16px", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `linear-gradient(135deg, ${accentColor}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: validCount === 0 ? "not-allowed" : "pointer", opacity: validCount === 0 ? 0.6 : 1 }}>
                <Upload size={13} /> Add {validCount} Employee{validCount !== 1 ? "s" : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <button onClick={onClose}
              style={{ flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${accentColor}, #0FB6C8)`, color: "white", border: "none", borderRadius: 2, cursor: "pointer" }}>
              Done
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
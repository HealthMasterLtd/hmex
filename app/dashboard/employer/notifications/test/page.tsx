"use client";
/**
 * /app/dashboard/employer/notifications/test/page.tsx
 *
 * DROP THIS PAGE IN TEMPORARILY to test the notification pipeline.
 * Visit /dashboard/employer/notifications/test while logged in as the employer.
 * DELETE after confirming everything works.
 */

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getCompanyByOwner } from "@/services/companyService";
import {
  createEmployerNotification,
  fetchEmployerNotifications,
} from "@/services/employerNotificationsService";

type LogLine = { ts: string; level: "info" | "ok" | "error"; msg: string };

export default function NotifTestPage() {
  const { user } = useAuth();
  const [logs, setLogs]     = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);

  const log = (level: LogLine["level"], msg: string) =>
    setLogs((p) => [...p, { ts: new Date().toLocaleTimeString(), level, msg }]);

  const runTests = async () => {
    if (!user) { log("error", "No user — are you logged in?"); return; }
    setLogs([]);
    setRunning(true);

    // ── 1. Check user ──────────────────────────────────────────────────────
    log("info", `User ID: ${user.id}`);
    log("info", `User name: ${user.name}`);
    log("info", `User role: ${user.role}`);

    // ── 2. Resolve company ─────────────────────────────────────────────────
    log("info", "Fetching company by owner...");
    const company = await getCompanyByOwner(user.id).catch((e) => {
      log("error", `getCompanyByOwner threw: ${e}`);
      return null;
    });
    if (!company) { log("error", "No company found for this user. Cannot proceed."); setRunning(false); return; }
    log("ok", `Company: ${company.name} | ID: ${company.$id}`);

    // ── 3. Hit /api/employer-notify directly ──────────────────────────────
    log("info", "POSTing directly to /api/employer-notify...");
    try {
      const res = await fetch("/api/employer-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId:   company.$id,
          employerId:  user.id,
          type:        "test_direct_api",
          title:       "Direct API Test",
          message:     "This notification was created by hitting /api/employer-notify directly.",
          priority:    "low",
          category:    "system",
          actionUrl:   "/dashboard/employer/notifications",
          actionLabel: "View",
        }),
      });
      const data = await res.json();
      if (res.ok) log("ok", `API route created doc ID: ${data.id}`);
      else         log("error", `API route returned ${res.status}: ${JSON.stringify(data)}`);
    } catch (e) {
      log("error", `fetch /api/employer-notify threw: ${e}`);
    }

    // ── 4. Call createEmployerNotification (the service function) ─────────
    log("info", "Calling createEmployerNotification()...");
    const created = await createEmployerNotification({
      companyId:   company.$id,
      employerId:  user.id,
      type:        "test_service_fn",
      title:       "Service Function Test",
      message:     "This was created via createEmployerNotification() in the service.",
      priority:    "medium",
      category:    "system",
    });
    if (created) log("ok", `createEmployerNotification returned ID: ${created.$id}`);
    else          log("error", "createEmployerNotification returned null — check console for details");

    // ── 5. Read back notifications ─────────────────────────────────────────
    log("info", "Fetching notifications from Appwrite...");
    const notifs = await fetchEmployerNotifications(user.id, 10).catch((e) => {
      log("error", `fetchEmployerNotifications threw: ${e}`);
      return [] as never[];
    });
    log("ok", `Fetched ${notifs.length} notification(s) for employerId=${user.id}`);
    notifs.slice(0, 5).forEach((n, i) =>
      log("info", `  [${i}] type=${n.type} | isRead=${n.isRead} | title=${n.title}`)
    );

    if (notifs.length === 0) {
      log("error", "0 notifications found — either write failed OR Appwrite collection missing OR employerId mismatch.");
      log("info", "Check: does employer_notifications collection exist in hmex_db?");
      log("info", "Check: does the collection have an index on 'employerId'?");
      log("info", "Check: collection permissions must allow ANY user to read (or at least the logged-in user).");
    }

    setRunning(false);
  };

  const bg   = "#0f172a";
  const card = "#1e293b";
  const border = "#334155";

  return (
    <div style={{ minHeight: "100vh", background: bg, padding: 32, fontFamily: "monospace" }}>
      <h1 style={{ color: "#f1f5f9", fontSize: 18, marginBottom: 4 }}>Notification Pipeline Debug</h1>
      <p style={{ color: "#94a3b8", fontSize: 12, marginBottom: 24 }}>
        Delete this page after testing. Visit while logged in as the employer.
      </p>

      <button
        onClick={runTests}
        disabled={running}
        style={{
          padding: "10px 24px", background: running ? "#334155" : "#6366f1",
          color: "#fff", border: "none", borderRadius: 4, cursor: running ? "not-allowed" : "pointer",
          fontSize: 13, fontWeight: 700, marginBottom: 24,
        }}
      >
        {running ? "Running..." : "Run All Tests"}
      </button>

      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 6, padding: 20, minHeight: 200 }}>
        {logs.length === 0 && (
          <p style={{ color: "#475569", fontSize: 12 }}>Press &quot;Run All Tests&quot; to start.</p>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: 4 }}>
            <span style={{ color: "#475569", fontSize: 11, flexShrink: 0 }}>{l.ts}</span>
            <span style={{
              fontSize: 11, flexShrink: 0, fontWeight: 700,
              color: l.level === "ok" ? "#22c55e" : l.level === "error" ? "#ef4444" : "#94a3b8",
            }}>
              {l.level === "ok" ? "✓" : l.level === "error" ? "✗" : "·"}
            </span>
            <span style={{
              fontSize: 12,
              color: l.level === "ok" ? "#22c55e" : l.level === "error" ? "#ef4444" : "#e2e8f0",
            }}>
              {l.msg}
            </span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, background: card, border: `1px solid ${border}`, borderRadius: 6, padding: 20 }}>
        <p style={{ color: "#94a3b8", fontSize: 12, margin: "0 0 8px", fontWeight: 700 }}>CHECKLIST IF TESTS FAIL:</p>
        {[
          "1. employer_notifications collection exists in Appwrite hmex_db",
          "2. Collection has all required attributes (companyId, employerId, type, title, message, isRead, priority, category)",
          "3. Collection has index on 'employerId' (type: key, order: ASC)",
          "4. APPWRITE_API_KEY is set in .env.local (server-side, no NEXT_PUBLIC_ prefix)",
          "5. node-appwrite is installed: npm install node-appwrite",
          "6. NEXT_PUBLIC_APP_URL is set in .env.local if running in prod (e.g. https://yourapp.com)",
          "7. Collection read permissions: allow role:all OR the logged-in user to read",
        ].map((item, i) => (
          <p key={i} style={{ color: "#64748b", fontSize: 11, margin: "4px 0" }}>{item}</p>
        ))}
      </div>
    </div>
  );
}
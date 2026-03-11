/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * NotificationsService.ts
 *
 * Handles the notifications system for HMEX.
 * Creates, fetches, marks as read, and manages notification lifecycle.
 *
 * Appwrite Collection: "notifications" in "hmex_db"
 *
 * WRITE STRATEGY:
 *   - Assessment / XP / reminder notifications:  client SDK (user is logged in,
 *     so their own session has write permission on their own documents).
 *   - Team / program notifications:              POST /api/employee-notify
 *     These are triggered by employer-side actions. The logged-in user at that
 *     moment is the EMPLOYER, not the employee being notified, so the client
 *     session has no write permission for the target userId's documents.
 *     The server route uses APPWRITE_API_KEY and bypasses permissions entirely.
 */

import { Client, Databases, ID, Query } from "appwrite";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const NOTIF_DB_ID         = "hmex_db";
export const NOTIF_COLLECTION_ID = "notifications";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const db     = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export type NotificationCategory =
  | "risk_alert"     // AI-detected high risk
  | "recommendation" // New personalised recommendation
  | "xp"             // XP earned / milestone
  | "milestone"      // Assessment count milestones
  | "reminder"       // Periodic check-up reminders
  | "system"         // System / onboarding messages
  | "team"           // Team / organisation events (added, removed)
  | "program";       // Wellness program broadcast from employer

export interface AppNotification {
  $id:          string;
  $createdAt:   string;
  userId:       string;
  type:         string;
  title:        string;
  message:      string;
  isRead:       boolean;
  priority:     NotificationPriority;
  category:     NotificationCategory;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    string; // JSON
  expiresAt?:   string;
}

export interface CreateNotificationInput {
  userId:       string;
  type:         string;
  title:        string;
  message:      string;
  priority:     NotificationPriority;
  category:     NotificationCategory;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    Record<string, any>;
  expiresAt?:   string;
}

// ─── SERVER-SIDE NOTIFICATION (via API route) ─────────────────────────────────
// Used whenever we need to notify a DIFFERENT user than the one currently
// logged in — e.g. employer action notifying an employee.
// Routes through /api/employee-notify which uses APPWRITE_API_KEY.

async function createNotificationViaServer(
  input: CreateNotificationInput
): Promise<boolean> {
  try {
    const base = typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

    const res = await fetch(`${base}/api/employee-notify`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        userId:      input.userId,
        type:        input.type,
        title:       input.title,
        message:     input.message,
        priority:    input.priority,
        category:    input.category,
        actionUrl:   input.actionUrl   ?? null,
        actionLabel: input.actionLabel ?? null,
        metadata:    input.metadata    ?? null,
        expiresAt:   input.expiresAt   ?? null,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("[NotificationsService] server notify failed:", res.status, err);
      return false;
    }

    const data = await res.json();
    console.log("[NotificationsService] server notify created:", data.id, "type:", input.type, "for user:", input.userId);
    return true;
  } catch (e) {
    console.error("[NotificationsService] createNotificationViaServer error:", e);
    return false;
  }
}

// ─── TEAM / ORGANISATION NOTIFICATIONS ───────────────────────────────────────
// These route through the server API because the caller (employer session)
// does not have client-SDK write permission on the employee's notifications.

/**
 * Fired when an employer adds an employee to their team.
 * Routes through /api/employee-notify (server API key).
 */
export async function notifyEmployeeAddedToTeam(
  userId:      string,
  companyName: string,
  companyId:   string,
): Promise<boolean> {
  return createNotificationViaServer({
    userId,
    type:        "team_added",
    title:       `You've been added to ${companyName}`,
    message:     `${companyName} has added you to their workforce on HMEX. You can now view your team and any wellness programs they share with you.`,
    priority:    "medium",
    category:    "team",
    actionUrl:   "/dashboard/teams",
    actionLabel: "View My Teams",
    metadata:    { companyName, companyId },
  });
}

/**
 * Fired when an employee is removed from a company's team.
 * Routes through /api/employee-notify (server API key).
 */
export async function notifyEmployeeRemovedFromTeam(
  userId:      string,
  companyName: string,
  companyId:   string,
): Promise<boolean> {
  return createNotificationViaServer({
    userId,
    type:        "team_removed",
    title:       `Removed from ${companyName}`,
    message:     `You have been removed from ${companyName}'s workforce on HMEX. Your personal health data remains private and is not affected.`,
    priority:    "medium",
    category:    "team",
    actionUrl:   "/dashboard/teams",
    actionLabel: "View My Teams",
    metadata:    { companyName, companyId },
    expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Fired when an employer broadcasts a wellness program to the team.
 * Routes through /api/employee-notify (server API key).
 */
export async function notifyEmployeeProgramBroadcast(
  userId:       string,
  companyName:  string,
  companyId:    string,
  programTitle: string,
  programId:    string,
): Promise<boolean> {
  return createNotificationViaServer({
    userId,
    type:        "program_broadcast",
    title:       `New wellness program from ${companyName}`,
    message:     `${companyName} has shared a wellness program with you: "${programTitle}". Open My Teams to view details and enrol.`,
    priority:    "medium",
    category:    "program",
    actionUrl:   "/dashboard/teams",
    actionLabel: "View Program",
    metadata:    { companyName, companyId, programTitle, programId },
    expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

// ─── ASSESSMENT NOTIFICATIONS ─────────────────────────────────────────────────
// These use the client SDK — the logged-in user is writing their own notification.

export async function createAssessmentNotifications(
  userId:            string,
  diabetesLevel:     string,
  hypertensionLevel: string,
  assessmentNumber:  number,
  xpEarned:          number
): Promise<void> {
  const notifications: CreateNotificationInput[] = [];

  // ── XP Earned ──
  notifications.push({
    userId,
    type:        "xp_earned",
    title:       `+${xpEarned} XP Earned`,
    message:     `You earned ${xpEarned} Health XP for completing assessment #${assessmentNumber}. Keep going to unlock a free consultation!`,
    priority:    "low",
    category:    "xp",
    actionUrl:   "/dashboard",
    actionLabel: "View Dashboard",
    metadata:    { xpEarned, assessmentNumber },
  });

  // ── High Diabetes Risk ──
  if (diabetesLevel === "high" || diabetesLevel === "very-high") {
    notifications.push({
      userId,
      type:        "risk_alert_diabetes",
      title:       `⚠️ Elevated Diabetes Risk Detected`,
      message:     `Your assessment #${assessmentNumber} shows a ${diabetesLevel.replace("-", " ")} risk for diabetes. We strongly recommend scheduling a clinical screening within the next 2–4 weeks.`,
      priority:    diabetesLevel === "very-high" ? "urgent" : "high",
      category:    "risk_alert",
      actionUrl:   "/dashboard/review",
      actionLabel: "View Full Report",
      metadata:    { diabetesLevel, assessmentNumber },
    });
  } else if (diabetesLevel === "moderate") {
    notifications.push({
      userId,
      type:        "risk_alert_diabetes_moderate",
      title:       `Moderate Diabetes Risk — Take Action`,
      message:     `Your assessment shows a moderate diabetes risk. Now is the perfect time to make targeted lifestyle changes before risk escalates.`,
      priority:    "medium",
      category:    "risk_alert",
      actionUrl:   "/dashboard/recommendations",
      actionLabel: "See Recommendations",
      metadata:    { diabetesLevel, assessmentNumber },
    });
  }

  // ── High Hypertension Risk ──
  if (hypertensionLevel === "high" || hypertensionLevel === "very-high") {
    notifications.push({
      userId,
      type:        "risk_alert_hypertension",
      title:       `⚠️ Elevated Blood Pressure Risk Detected`,
      message:     `Your assessment #${assessmentNumber} indicates ${hypertensionLevel.replace("-", " ")} hypertension risk. Please have your blood pressure checked by a healthcare provider soon.`,
      priority:    hypertensionLevel === "very-high" ? "urgent" : "high",
      category:    "risk_alert",
      actionUrl:   "/dashboard/review",
      actionLabel: "View Full Report",
      metadata:    { hypertensionLevel, assessmentNumber },
    });
  } else if (hypertensionLevel === "moderate") {
    notifications.push({
      userId,
      type:        "risk_alert_hypertension_moderate",
      title:       `Moderate Hypertension Risk Flagged`,
      message:     `Your blood pressure risk is in the moderate range. Reducing salt intake and increasing physical activity can significantly lower this risk.`,
      priority:    "medium",
      category:    "risk_alert",
      actionUrl:   "/dashboard/recommendations",
      actionLabel: "View Recommendations",
      metadata:    { hypertensionLevel, assessmentNumber },
    });
  }

  // ── Both Low Risk ──
  if (diabetesLevel === "low" && hypertensionLevel === "low") {
    notifications.push({
      userId,
      type:        "low_risk_positive",
      title:       `🟢 Great Results — Low Risk`,
      message:     `Assessment #${assessmentNumber} shows low risk for both diabetes and hypertension. Keep up your healthy habits and schedule your next check-in in 3 months.`,
      priority:    "low",
      category:    "recommendation",
      actionUrl:   "/dashboard",
      actionLabel: "View Dashboard",
      metadata:    { diabetesLevel, hypertensionLevel, assessmentNumber },
    });
  }

  // ── Milestone: 1st ──
  if (assessmentNumber === 1) {
    notifications.push({
      userId,
      type:        "milestone_first_assessment",
      title:       `🏆 First Assessment Complete!`,
      message:     `Welcome to HMEX! You've completed your first health screening. Your personalised risk profile and recommendations are ready.`,
      priority:    "medium",
      category:    "milestone",
      actionUrl:   "/dashboard/recommendations",
      actionLabel: "See Your Recommendations",
      metadata:    { assessmentNumber: 1 },
    });
  }

  // ── Milestone: 5th ──
  if (assessmentNumber === 5) {
    notifications.push({
      userId,
      type:        "milestone_5_assessments",
      title:       `🌟 5 Assessments Completed!`,
      message:     `You've been consistently tracking your health. Your trend data is now rich enough to show meaningful patterns. Great commitment!`,
      priority:    "medium",
      category:    "milestone",
      actionUrl:   "/dashboard/history",
      actionLabel: "View Your Trend",
      metadata:    { assessmentNumber: 5 },
    });
  }

  // ── New Recommendations (2nd+) ──
  if (assessmentNumber >= 2) {
    notifications.push({
      userId,
      type:        "new_recommendations",
      title:       `📋 New Personalised Recommendations Ready`,
      message:     `Based on your latest assessment, we've updated your health recommendations. Check what actions will have the most impact for you right now.`,
      priority:    "medium",
      category:    "recommendation",
      actionUrl:   "/dashboard/recommendations",
      actionLabel: "View Recommendations",
      metadata:    { assessmentNumber },
    });
  }

  await Promise.allSettled(notifications.map(n => createNotification(n)));
}

// ─── CREATE (client SDK — user writing their own data) ────────────────────────

export async function createNotification(
  input: CreateNotificationInput
): Promise<AppNotification | null> {
  try {
    const doc = await db.createDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, ID.unique(), {
      userId:      input.userId,
      type:        input.type,
      title:       input.title,
      message:     input.message,
      isRead:      false,
      priority:    input.priority,
      category:    input.category,
      actionUrl:   input.actionUrl   ?? null,
      actionLabel: input.actionLabel ?? null,
      metadata:    input.metadata ? JSON.stringify(input.metadata) : null,
      expiresAt:   input.expiresAt ?? null,
    });
    return doc as unknown as AppNotification;
  } catch (e) {
    console.error("[NotificationsService] createNotification error:", e);
    return null;
  }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

export async function fetchNotifications(
  userId: string,
  limit = 30
): Promise<AppNotification[]> {
  try {
    const now = new Date().toISOString();
    const res = await db.listDocuments(NOTIF_DB_ID, NOTIF_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(limit),
    ]);
    return (res.documents as unknown as AppNotification[]).filter(
      n => !n.expiresAt || n.expiresAt > now
    );
  } catch (e) {
    console.error("[NotificationsService] fetchNotifications error:", e);
    return [];
  }
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  try {
    const res = await db.listDocuments(NOTIF_DB_ID, NOTIF_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.equal("isRead", false),
      Query.limit(100),
    ]);
    return (res as any).total ?? res.documents.length;
  } catch {
    return 0;
  }
}

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await db.updateDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, notificationId, { isRead: true });
    return true;
  } catch (e) {
    console.error("[NotificationsService] markAsRead error:", e);
    return false;
  }
}

export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const unread = await db.listDocuments(NOTIF_DB_ID, NOTIF_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.equal("isRead", false),
      Query.limit(100),
    ]);
    await Promise.allSettled(
      unread.documents.map(doc =>
        db.updateDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, doc.$id, { isRead: true })
      )
    );
    return true;
  } catch (e) {
    console.error("[NotificationsService] markAllAsRead error:", e);
    return false;
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    await db.deleteDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, notificationId);
    return true;
  } catch (e) {
    console.error("[NotificationsService] deleteNotification error:", e);
    return false;
  }
}

export async function clearReadNotifications(userId: string): Promise<boolean> {
  try {
    const read = await db.listDocuments(NOTIF_DB_ID, NOTIF_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.equal("isRead", true),
      Query.limit(100),
    ]);
    await Promise.allSettled(
      read.documents.map(doc =>
        db.deleteDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, doc.$id)
      )
    );
    return true;
  } catch (e) {
    console.error("[NotificationsService] clearReadNotifications error:", e);
    return false;
  }
}

// ─── SYSTEM NOTIFICATIONS ────────────────────────────────────────────────────

export async function createRetakeReminder(
  userId: string,
  daysSinceLastAssessment: number
): Promise<AppNotification | null> {
  return createNotification({
    userId,
    type:        "retake_reminder",
    title:       `📅 Time for Your Next Health Check`,
    message:     `It's been ${daysSinceLastAssessment} days since your last assessment. Regular monitoring helps you catch changes early and track the impact of your lifestyle choices.`,
    priority:    daysSinceLastAssessment >= 90 ? "high" : "medium",
    category:    "reminder",
    actionUrl:   "/dashboard/assessment",
    actionLabel: "Take Assessment Now",
    metadata:    { daysSinceLastAssessment },
    expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

export async function createXpUnlockedNotification(
  userId: string,
  totalXp: number
): Promise<AppNotification | null> {
  return createNotification({
    userId,
    type:        "xp_consultation_unlocked",
    title:       `🎉 Free Consultation Unlocked!`,
    message:     `Congratulations! You've earned ${totalXp} Health XP — enough for a FREE doctor consultation via WhatsApp. Claim it now!`,
    priority:    "high",
    category:    "xp",
    actionUrl:   "https://wa.me/250789399765",
    actionLabel: "Claim Free Consultation",
    metadata:    { totalXp },
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function parseNotificationMetadata(metadata?: string): Record<string, any> {
  if (!metadata) return {};
  try { return JSON.parse(metadata); }
  catch { return {}; }
}

export function getNotificationColor(n: AppNotification): string {
  if (n.priority === "urgent")         return "#ef4444";
  if (n.priority === "high")           return "#f97316";
  if (n.category === "xp")             return "#0FBB7D";
  if (n.category === "milestone")      return "#8b5cf6";
  if (n.category === "recommendation") return "#6366f1";
  if (n.category === "team")           return "#3b82f6";
  if (n.category === "program")        return "#0d9488";
  return "#64748b";
}

export function getNotificationIcon(n: AppNotification): string {
  switch (n.category) {
    case "risk_alert":     return n.priority === "urgent" ? "🚨" : "⚠️";
    case "recommendation": return "💡";
    case "xp":             return "⚡";
    case "milestone":      return "🏆";
    case "reminder":       return "📅";
    case "team":           return "🏢";
    case "program":        return "🎯";
    case "system":         return "🔔";
    default:               return "📩";
  }
}
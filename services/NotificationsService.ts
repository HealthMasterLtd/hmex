/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * NotificationsService.ts
 *
 * Handles the notifications system for HMEX.
 * Creates, fetches, marks as read, and manages notification lifecycle.
 *
 * Appwrite Collection: "notifications" in "hmex_db"
 * Required attributes:
 *   - userId       (string, required)
 *   - type         (string, required) — see NotificationType
 *   - title        (string, required)
 *   - message      (string, required)
 *   - isRead       (boolean, default: false)
 *   - priority     (string, required) — "low" | "medium" | "high" | "urgent"
 *   - category     (string, required) — "risk_alert" | "recommendation" | "xp" | "milestone" | "reminder" | "system"
 *   - actionUrl    (string, optional)
 *   - actionLabel  (string, optional)
 *   - metadata     (string, optional) — JSON string for extra data
 *   - expiresAt    (string, optional) — ISO timestamp
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
  | "system";        // System / onboarding messages

export interface AppNotification {
  $id:         string;
  $createdAt:  string;
  userId:      string;
  type:        string;
  title:       string;
  message:     string;
  isRead:      boolean;
  priority:    NotificationPriority;
  category:    NotificationCategory;
  actionUrl?:  string;
  actionLabel?: string;
  metadata?:   string; // JSON
  expiresAt?:  string;
}

// What you pass to create a notification
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

// ─── NOTIFICATION TEMPLATES ──────────────────────────────────────────────────

/**
 * Auto-generate notifications after a completed assessment.
 * Call this right after saveAssessment() succeeds.
 */
export async function createAssessmentNotifications(
  userId:      string,
  diabetesLevel:    string,
  hypertensionLevel: string,
  assessmentNumber: number,
  xpEarned:    number
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

  // ── High Diabetes Risk Alert ──
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
  }

  // ── Moderate Diabetes Risk ──
  else if (diabetesLevel === "moderate") {
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

  // ── High Hypertension Risk Alert ──
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
  }

  // ── Moderate Hypertension Risk ──
  else if (hypertensionLevel === "moderate") {
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

  // ── Both Low Risk — Positive Reinforcement ──
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

  // ── Milestone: 1st Assessment ──
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

  // ── Milestone: 5th Assessment ──
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

  // ── Recommendation Reminder (after 2nd+ assessment) ──
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

  // Save all in parallel
  await Promise.allSettled(notifications.map(n => createNotification(n)));
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createNotification(
  input: CreateNotificationInput
): Promise<AppNotification | null> {
  try {
    const doc = await db.createDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, ID.unique(), {
      userId:       input.userId,
      type:         input.type,
      title:        input.title,
      message:      input.message,
      isRead:       false,
      priority:     input.priority,
      category:     input.category,
      actionUrl:    input.actionUrl   ?? null,
      actionLabel:  input.actionLabel ?? null,
      metadata:     input.metadata ? JSON.stringify(input.metadata) : null,
      expiresAt:    input.expiresAt ?? null,
    });
    return doc as unknown as AppNotification;
  } catch (e) {
    console.error("[NotificationsService] createNotification error:", e);
    return null;
  }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

/** All notifications for a user, newest first */
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
    // Filter out expired notifications client-side
    return (res.documents as unknown as AppNotification[]).filter(
      n => !n.expiresAt || n.expiresAt > now
    );
  } catch (e) {
    console.error("[NotificationsService] fetchNotifications error:", e);
    return [];
  }
}

/** Count of unread notifications */
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

/** Mark a single notification as read */
export async function markAsRead(notificationId: string): Promise<boolean> {
  try {
    await db.updateDocument(NOTIF_DB_ID, NOTIF_COLLECTION_ID, notificationId, {
      isRead: true,
    });
    return true;
  } catch (e) {
    console.error("[NotificationsService] markAsRead error:", e);
    return false;
  }
}

/** Mark ALL notifications for a user as read */
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

/** Delete all read notifications for a user (housekeeping) */
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

/** Send a reminder to users who haven't taken an assessment in 30+ days */
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
    expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // expires in 14 days
  });
}

/** Notify when XP threshold is reached for a free consultation */
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

/** Get a colour for a notification's priority/category */
export function getNotificationColor(n: AppNotification): string {
  if (n.priority === "urgent") return "#ef4444";
  if (n.priority === "high")   return "#f97316";
  if (n.category === "xp")     return "#0FBB7D";
  if (n.category === "milestone") return "#8b5cf6";
  if (n.category === "recommendation") return "#6366f1";
  return "#64748b";
}

/** Get an emoji icon for a notification category */
export function getNotificationIcon(n: AppNotification): string {
  switch (n.category) {
    case "risk_alert":     return n.priority === "urgent" ? "🚨" : "⚠️";
    case "recommendation": return "💡";
    case "xp":             return "⚡";
    case "milestone":      return "🏆";
    case "reminder":       return "📅";
    case "system":         return "🔔";
    default:               return "📩";
  }
}
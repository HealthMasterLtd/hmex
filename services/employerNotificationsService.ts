/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * employerNotificationsService.ts
 *
 * Handles the employer notifications system for HMEX.
 * Notifications are triggered by real events:
 *   - New employee joins / accepts invite
 *   - Employee completes a health assessment
 *   - High-risk employee detected
 *   - AI programs refreshed
 *   - Assessment rate crosses a threshold
 *   - Weekly workforce summary
 *
 * Appwrite Collection: "employer_notifications" in "hmex_db"
 * Required attributes:
 *   - companyId     (string, required)
 *   - employerId    (string, required)  — the employer's userId
 *   - type          (string, required)
 *   - title         (string, required)
 *   - message       (string, required)
 *   - isRead        (boolean, default: false)
 *   - priority      (string, required)  — "low" | "medium" | "high" | "urgent"
 *   - category      (string, required)  — see EmployerNotificationCategory
 *   - actionUrl     (string, optional)
 *   - actionLabel   (string, optional)
 *   - metadata      (string, optional)  — JSON string
 *   - expiresAt     (string, optional)  — ISO timestamp
 */

import { Client, Databases, ID, Query } from "appwrite";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const EMPLOYER_NOTIF_DB_ID         = "hmex_db";
export const EMPLOYER_NOTIF_COLLECTION_ID = "employer_notifications";

const client = new Client()
  .setEndpoint(ENDPOINT.replace(/\/$/, ""))
  .setProject(PROJECT_ID);
const db = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type EmployerNotificationPriority = "low" | "medium" | "high" | "urgent";

export type EmployerNotificationCategory =
  | "employee_activity"   // Employee joined, left, completed assessment
  | "risk_alert"          // High-risk employee detected
  | "programs"            // AI programs generated / refreshed
  | "assessment_rate"     // Assessment completion milestones
  | "workforce_summary"   // Weekly / periodic summaries
  | "compliance"          // Privacy or compliance events
  | "system";             // Onboarding, billing, system messages

export interface EmployerNotification {
  $id:          string;
  $createdAt:   string;
  companyId:    string;
  employerId:   string;
  type:         string;
  title:        string;
  message:      string;
  isRead:       boolean;
  priority:     EmployerNotificationPriority;
  category:     EmployerNotificationCategory;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    string; // JSON
  expiresAt?:   string;
}

export interface CreateEmployerNotificationInput {
  companyId:    string;
  employerId:   string;
  type:         string;
  title:        string;
  message:      string;
  priority:     EmployerNotificationPriority;
  category:     EmployerNotificationCategory;
  actionUrl?:   string;
  actionLabel?: string;
  metadata?:    Record<string, any>;
  expiresAt?:   string;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createEmployerNotification(
  input: CreateEmployerNotificationInput
): Promise<EmployerNotification | null> {
  try {
    const doc = await db.createDocument(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      ID.unique(),
      {
        companyId:    input.companyId,
        employerId:   input.employerId,
        type:         input.type,
        title:        input.title,
        message:      input.message,
        isRead:       false,
        priority:     input.priority,
        category:     input.category,
        actionUrl:    input.actionUrl   ?? null,
        actionLabel:  input.actionLabel ?? null,
        metadata:     input.metadata ? JSON.stringify(input.metadata) : null,
        expiresAt:    input.expiresAt   ?? null,
      }
    );
    return doc as unknown as EmployerNotification;
  } catch (e) {
    console.error("[EmployerNotif] createEmployerNotification error:", e);
    return null;
  }
}

// ─── FETCH ────────────────────────────────────────────────────────────────────

/** All notifications for an employer, newest first */
export async function fetchEmployerNotifications(
  employerId: string,
  limit = 40
): Promise<EmployerNotification[]> {
  try {
    const now = new Date().toISOString();
    const res = await db.listDocuments(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      [
        Query.equal("employerId", employerId),
        Query.orderDesc("$createdAt"),
        Query.limit(limit),
      ]
    );
    return (res.documents as unknown as EmployerNotification[]).filter(
      (n) => !n.expiresAt || n.expiresAt > now
    );
  } catch (e) {
    console.error("[EmployerNotif] fetchEmployerNotifications error:", e);
    return [];
  }
}

/** Unread count for badge display */
export async function fetchEmployerUnreadCount(employerId: string): Promise<number> {
  try {
    const res = await db.listDocuments(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      [
        Query.equal("employerId", employerId),
        Query.equal("isRead", false),
        Query.limit(100),
      ]
    );
    return (res as any).total ?? res.documents.length;
  } catch {
    return 0;
  }
}

// ─── MARK AS READ ─────────────────────────────────────────────────────────────

export async function markEmployerNotifAsRead(notificationId: string): Promise<boolean> {
  try {
    await db.updateDocument(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      notificationId,
      { isRead: true }
    );
    return true;
  } catch (e) {
    console.error("[EmployerNotif] markAsRead error:", e);
    return false;
  }
}

export async function markAllEmployerNotifsAsRead(employerId: string): Promise<boolean> {
  try {
    const unread = await db.listDocuments(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      [
        Query.equal("employerId", employerId),
        Query.equal("isRead", false),
        Query.limit(100),
      ]
    );
    await Promise.allSettled(
      unread.documents.map((doc) =>
        db.updateDocument(
          EMPLOYER_NOTIF_DB_ID,
          EMPLOYER_NOTIF_COLLECTION_ID,
          doc.$id,
          { isRead: true }
        )
      )
    );
    return true;
  } catch (e) {
    console.error("[EmployerNotif] markAllAsRead error:", e);
    return false;
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteEmployerNotification(notificationId: string): Promise<boolean> {
  try {
    await db.deleteDocument(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      notificationId
    );
    return true;
  } catch (e) {
    console.error("[EmployerNotif] deleteNotification error:", e);
    return false;
  }
}

export async function clearReadEmployerNotifications(employerId: string): Promise<boolean> {
  try {
    const read = await db.listDocuments(
      EMPLOYER_NOTIF_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      [
        Query.equal("employerId", employerId),
        Query.equal("isRead", true),
        Query.limit(100),
      ]
    );
    await Promise.allSettled(
      read.documents.map((doc) =>
        db.deleteDocument(EMPLOYER_NOTIF_DB_ID, EMPLOYER_NOTIF_COLLECTION_ID, doc.$id)
      )
    );
    return true;
  } catch (e) {
    console.error("[EmployerNotif] clearRead error:", e);
    return false;
  }
}

// ─── EVENT TRIGGERS ───────────────────────────────────────────────────────────
// Call these from other services at the point of the real event.

/**
 * Fired when a new employee accepts an invite and becomes active.
 * Call from: companyService after reconcilePendingMembers activates a member,
 *            or after addExistingEmployee.
 */
export async function notifyEmployeeJoined(
  companyId:    string,
  employerId:   string,
  employeeName: string,
  totalActive:  number
): Promise<void> {
  await createEmployerNotification({
    companyId,
    employerId,
    type:        "employee_joined",
    title:       "New Employee Joined",
    message:     `${employeeName} has accepted their invitation and joined your workforce. You now have ${totalActive} active employee${totalActive !== 1 ? "s" : ""}.`,
    priority:    "medium",
    category:    "employee_activity",
    actionUrl:   "/dashboard/employer/employees",
    actionLabel: "View Team",
    metadata:    { employeeName, totalActive },
  });
}

/**
 * Fired when an employee completes a health assessment.
 * Call from: the assessment submission flow, after fetchLatestAssessment confirms new data.
 */
export async function notifyEmployeeAssessmentCompleted(
  companyId:        string,
  employerId:       string,
  employeeName:     string,
  diabetesLevel:    string,
  hypertensionLevel: string,
  assessedCount:    number,
  totalActive:      number
): Promise<void> {
  const isHighRisk =
    diabetesLevel === "high" ||
    diabetesLevel === "very-high" ||
    hypertensionLevel === "high" ||
    hypertensionLevel === "very-high";

  const rate = totalActive > 0 ? Math.round((assessedCount / totalActive) * 100) : 0;

  // Main assessment notification
  await createEmployerNotification({
    companyId,
    employerId,
    type:        isHighRisk ? "employee_high_risk_assessment" : "employee_assessment_completed",
    title:       isHighRisk
      ? "High-Risk Employee Assessment Completed"
      : "Employee Assessment Completed",
    message:     isHighRisk
      ? `${employeeName} completed their assessment and has been flagged at ${diabetesLevel !== "low" ? `${diabetesLevel} diabetes` : ""} ${hypertensionLevel !== "low" ? `& ${hypertensionLevel} hypertension` : ""} risk. Review the workforce dashboard for intervention recommendations.`
      : `${employeeName} completed their health assessment. Assessment rate is now ${rate}% (${assessedCount}/${totalActive} employees).`,
    priority:    isHighRisk ? "high" : "low",
    category:    isHighRisk ? "risk_alert" : "employee_activity",
    actionUrl:   isHighRisk
      ? "/dashboard/employer"
      : "/dashboard/employer/employees",
    actionLabel: isHighRisk ? "View Workforce Overview" : "View Team",
    metadata:    { employeeName, diabetesLevel, hypertensionLevel, assessedCount, totalActive, rate },
  });

  // Milestone: first assessment
  if (assessedCount === 1) {
    await createEmployerNotification({
      companyId,
      employerId,
      type:        "assessment_rate_first",
      title:       "First Assessment Completed",
      message:     "Your first employee has completed a health assessment. Keep growing your participation rate to unlock richer workforce insights.",
      priority:    "medium",
      category:    "assessment_rate",
      actionUrl:   "/dashboard/employer",
      actionLabel: "View Dashboard",
      metadata:    { assessedCount, totalActive },
    });
  }

  // Milestone: 50% assessment rate
  if (rate >= 50 && rate < 55 && assessedCount > 1) {
    await createEmployerNotification({
      companyId,
      employerId,
      type:        "assessment_rate_50pct",
      title:       "50% Assessment Rate Reached",
      message:     `Half your workforce has now completed health assessments. Your AI program recommendations are becoming significantly more accurate.`,
      priority:    "medium",
      category:    "assessment_rate",
      actionUrl:   "/dashboard/employer/programs",
      actionLabel: "View AI Programs",
      metadata:    { rate, assessedCount, totalActive },
    });
  }

  // Milestone: 80% assessment rate
  if (rate >= 80 && rate < 85 && assessedCount > 1) {
    await createEmployerNotification({
      companyId,
      employerId,
      type:        "assessment_rate_80pct",
      title:       "80% Assessment Rate — Excellent Engagement",
      message:     `${rate}% of your workforce has completed health assessments. Your insights are now highly representative. AI programs can be fully optimised.`,
      priority:    "medium",
      category:    "assessment_rate",
      actionUrl:   "/dashboard/employer/programs",
      actionLabel: "Review Programs",
      metadata:    { rate, assessedCount, totalActive },
    });
  }
}

/**
 * Fired when high-risk employees are detected during workforce analysis.
 * Call from: employerProgramsAiService.generateAndSave / getOrGenerateAnalysis.
 */
export async function notifyHighRiskDetected(
  companyId:      string,
  employerId:     string,
  highRiskCount:  number,
  diabetesHigh:   number,
  hypertensionHigh: number
): Promise<void> {
  if (highRiskCount === 0) return;
  await createEmployerNotification({
    companyId,
    employerId,
    type:        "workforce_high_risk_detected",
    title:       `${highRiskCount} High-Risk Employee${highRiskCount > 1 ? "s" : ""} Identified`,
    message:     `Workforce analysis detected ${diabetesHigh} employee${diabetesHigh !== 1 ? "s" : ""} at high diabetes risk and ${hypertensionHigh} at high hypertension risk. Immediate structured intervention is recommended.`,
    priority:    highRiskCount >= 5 ? "urgent" : "high",
    category:    "risk_alert",
    actionUrl:   "/dashboard/employer/programs",
    actionLabel: "View AI Programs",
    metadata:    { highRiskCount, diabetesHigh, hypertensionHigh },
    expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  });
}

/**
 * Fired when AI programs are successfully generated or refreshed.
 * Call from: employerProgramsAiService.generateAndSave.
 */
export async function notifyProgramsGenerated(
  companyId:    string,
  employerId:   string,
  programCount: number,
  isRefresh:    boolean
): Promise<void> {
  await createEmployerNotification({
    companyId,
    employerId,
    type:        isRefresh ? "programs_refreshed" : "programs_generated",
    title:       isRefresh
      ? "AI Health Programs Refreshed"
      : "AI Health Programs Ready",
    message:     isRefresh
      ? `Your ${programCount} workforce health programs have been updated based on the latest employee data. Review the updated recommendations.`
      : `${programCount} personalised health programs have been generated for your workforce. Based on your current risk profile and assessment data.`,
    priority:    "medium",
    category:    "programs",
    actionUrl:   "/dashboard/employer/programs",
    actionLabel: "View Programs",
    metadata:    { programCount, isRefresh },
    expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
  });
}

/**
 * Fired when a new employee invite is sent.
 * Call from: inviteEmployee in companyService.
 */
export async function notifyInviteSent(
  companyId:     string,
  employerId:    string,
  invitedEmail:  string,
  totalInvited:  number
): Promise<void> {
  await createEmployerNotification({
    companyId,
    employerId,
    type:        "invite_sent",
    title:       "Invitation Sent",
    message:     `An invitation has been sent to ${invitedEmail}. You have sent ${totalInvited} invitation${totalInvited !== 1 ? "s" : ""} in total.`,
    priority:    "low",
    category:    "employee_activity",
    actionUrl:   "/dashboard/employer/employees",
    actionLabel: "Manage Team",
    metadata:    { invitedEmail, totalInvited },
    expiresAt:   new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
  });
}

/**
 * Fired when an employee is removed.
 */
export async function notifyEmployeeRemoved(
  companyId:    string,
  employerId:   string,
  employeeName: string,
  totalActive:  number
): Promise<void> {
  await createEmployerNotification({
    companyId,
    employerId,
    type:        "employee_removed",
    title:       "Employee Removed",
    message:     `${employeeName} has been removed from your workforce. You now have ${totalActive} active employee${totalActive !== 1 ? "s" : ""}.`,
    priority:    "low",
    category:    "employee_activity",
    actionUrl:   "/dashboard/employer/employees",
    actionLabel: "View Team",
    metadata:    { employeeName, totalActive },
    expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

/**
 * Onboarding welcome notification — fire once when employer first creates a company.
 */
export async function notifyEmployerWelcome(
  companyId:   string,
  employerId:  string,
  companyName: string
): Promise<void> {
  await createEmployerNotification({
    companyId,
    employerId,
    type:        "welcome",
    title:       `Welcome to HMEX Employer, ${companyName}`,
    message:     "Your employer portal is set up. Start by inviting employees, then generate AI health programs once assessments are completed.",
    priority:    "medium",
    category:    "system",
    actionUrl:   "/dashboard/employer/employees",
    actionLabel: "Invite Employees",
    metadata:    { companyName },
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function parseEmployerNotifMetadata(metadata?: string): Record<string, any> {
  if (!metadata) return {};
  try { return JSON.parse(metadata); }
  catch { return {}; }
}

/** Returns a theme color based on the notification priority and category */
export function getEmployerNotifColor(n: EmployerNotification): string {
  if (n.priority === "urgent") return "#EF4444";
  if (n.priority === "high")   return "#F97316";
  if (n.category === "programs")          return "#8B5CF6";
  if (n.category === "assessment_rate")   return "#0FBB7D";
  if (n.category === "employee_activity") return "#3B82F6";
  if (n.category === "workforce_summary") return "#0D9488";
  if (n.category === "compliance")        return "#6366F1";
  return "#64748B";
}
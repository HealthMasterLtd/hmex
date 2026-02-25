/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Databases, ID, Query } from "appwrite";
import type { DualRiskAssessment } from "./GroqService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const DB_ID         = "hmex_db";
export const COLLECTION_ID = "assessments";

// Collection: user_xp (tracks cumulative XP per user)
export const XP_COLLECTION_ID = "user_xp";

// localStorage key used for the pending (pre-auth) assessment
const PENDING_KEY = "hmex_pending_assessment";

// ─── CLIENT ───────────────────────────────────────────────────────────────────
const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const db     = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────
export interface StoredAssessment {
  $id:        string;
  $createdAt: string;
  userId:            string;
  sessionId:         string;
  assessmentNumber:  number;   // 1st, 2nd, 3rd attempt for this user
  isRetake:          boolean;  // true if assessmentNumber > 1
  xpEarned:          number;   // XP awarded for this assessment session
  diabetesLevel:     string;
  diabetesScore:     number;
  diabetesPct:       string;
  hypertensionLevel: string;
  hypertensionScore: number;
  hypertensionPct:   string;
  summary:           string;
  keyFindings:       string;   // JSON string[]
  recommendations:   string;  // JSON string[]
  urgentActions:     string;  // JSON string[]
  detailedAnalysis:  string;
  profileAge:        string;
  profileGender:     string;
  profileBmi:        string;
  profileWaist:      string;
  answersSnapshot:   string;  // JSON Answer[]
}

// XP record per user
export interface UserXpRecord {
  $id:            string;
  $createdAt:     string;
  userId:         string;
  totalXp:        number;
  assessmentsTaken: number;
  redeemedXp:     number;      // XP already spent on consultations
  lastEarnedAt:   string;      // ISO timestamp
}

// What we store in localStorage while waiting for signup
interface PendingAssessment {
  sessionId:   string;
  assessment:  DualRiskAssessment;
  answers:     any[];
  xpEarned:    number;
  completedAt: string;
}

// ─── STAGE 1: HOLD IN LOCALSTORAGE (pre-auth) ────────────────────────────────
export function holdAssessmentLocally(
  assessment: DualRiskAssessment,
  answers:    any[],
  xpEarned:  number = 0
): string {
  const sessionId = `hmex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pending: PendingAssessment = {
    sessionId,
    assessment,
    answers,
    xpEarned,
    completedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch { /* SSR / private mode */ }
  return sessionId;
}

export function getPendingAssessment(): PendingAssessment | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAssessment;
  } catch { return null; }
}

export function clearPendingAssessment(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* */ }
}

// ─── STAGE 2: CLAIM PENDING (post-auth) ──────────────────────────────────────
export async function claimPendingAssessment(
  userId: string
): Promise<StoredAssessment | null> {
  const pending = getPendingAssessment();
  if (!pending) return null;
  try {
    const doc = await saveAssessment(
      userId,
      pending.assessment,
      pending.answers,
      pending.xpEarned,
      pending.sessionId
    );
    clearPendingAssessment();
    return doc;
  } catch (e) {
    console.error("Failed to claim pending assessment:", e);
    return null;
  }
}

// ─── COUNT USER ASSESSMENTS ───────────────────────────────────────────────────
/**
 * Returns how many assessments this user has already saved.
 * Used to set assessmentNumber on new saves.
 */
export async function countUserAssessments(userId: string): Promise<number> {
  try {
    const res = await db.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.limit(1),
      Query.select(["$id"]),
    ]);
    // Appwrite v1 returns total in the response
    return (res as any).total ?? res.documents.length;
  } catch {
    return 0;
  }
}

// ─── CORE SAVE ───────────────────────────────────────────────────────────────
/**
 * Save a completed assessment to Appwrite.
 * Automatically computes assessmentNumber and isRetake.
 * Also updates the user's cumulative XP record.
 *
 * Call directly when user is already logged in.
 * Call via claimPendingAssessment when user just signed up.
 */
export async function saveAssessment(
  userId:     string,
  assessment: DualRiskAssessment,
  answers:    any[],
  xpEarned:  number = 0,
  sessionId?: string
): Promise<StoredAssessment> {
  // Get current count to set assessmentNumber
  const existingCount = await countUserAssessments(userId);
  const assessmentNumber = existingCount + 1;
  const isRetake = assessmentNumber > 1;

  const doc = await db.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
    userId,
    sessionId:         sessionId ?? `direct_${Date.now()}`,
    assessmentNumber,
    isRetake,
    xpEarned,
    diabetesLevel:     assessment.diabetesRisk.level,
    diabetesScore:     String(Math.round(assessment.diabetesRisk.score)),
    diabetesPct:       assessment.diabetesRisk.percentage,
    hypertensionLevel: assessment.hypertensionRisk.level,
    hypertensionScore: String(Math.round(assessment.hypertensionRisk.score)),
    hypertensionPct:   assessment.hypertensionRisk.percentage,
    summary:           assessment.summary,
    keyFindings:       JSON.stringify(assessment.keyFindings),
    recommendations:   JSON.stringify(assessment.recommendations),
    urgentActions:     JSON.stringify(assessment.urgentActions ?? []),
    detailedAnalysis:  assessment.detailedAnalysis ?? "",
    profileAge:        assessment.profile?.ageCategory   ?? "",
    profileGender:     assessment.profile?.gender        ?? "",
    profileBmi:        assessment.profile?.bmiCategory   ?? "",
    profileWaist:      assessment.profile?.waistCategory ?? "",
    answersSnapshot:   JSON.stringify(answers),
  });

  // Update XP asynchronously — don't block the return
  updateUserXp(userId, xpEarned).catch(console.error);

  return doc as unknown as StoredAssessment;
}

// ─── XP MANAGEMENT ───────────────────────────────────────────────────────────
/**
 * Upsert the user's XP record.
 * Creates it if first time, increments if exists.
 */
export async function updateUserXp(
  userId:  string,
  xpToAdd: number
): Promise<UserXpRecord | null> {
  try {
    // Try to find existing record
    const res = await db.listDocuments(DB_ID, XP_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) {
      // Update existing
      const existing = res.documents[0] as unknown as UserXpRecord;
      const updated = await db.updateDocument(DB_ID, XP_COLLECTION_ID, existing.$id, {
        totalXp:          (existing.totalXp ?? 0) + xpToAdd,
        assessmentsTaken: (existing.assessmentsTaken ?? 0) + 1,
        lastEarnedAt:     new Date().toISOString(),
      });
      return updated as unknown as UserXpRecord;
    } else {
      // Create new
      const created = await db.createDocument(DB_ID, XP_COLLECTION_ID, ID.unique(), {
        userId,
        totalXp:          xpToAdd,
        assessmentsTaken: 1,
        redeemedXp:       0,
        lastEarnedAt:     new Date().toISOString(),
      });
      return created as unknown as UserXpRecord;
    }
  } catch (e) {
    console.error("Failed to update XP:", e);
    return null;
  }
}

/**
 * Fetch a user's current XP record.
 */
export async function fetchUserXp(userId: string): Promise<UserXpRecord | null> {
  try {
    const res = await db.listDocuments(DB_ID, XP_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as UserXpRecord) ?? null;
  } catch {
    return null;
  }
}

/**
 * Redeem XP for a consultation.
 * Deducts from totalXp, adds to redeemedXp.
 * Returns null if insufficient XP.
 */
export async function redeemXpForConsultation(
  userId:       string,
  xpCost:       number = 500
): Promise<{ success: boolean; remaining: number; message: string }> {
  try {
    const res = await db.listDocuments(DB_ID, XP_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    if (!res.documents.length) {
      return { success: false, remaining: 0, message: "No XP record found." };
    }
    const record = res.documents[0] as unknown as UserXpRecord;
    const available = (record.totalXp ?? 0) - (record.redeemedXp ?? 0);
    if (available < xpCost) {
      return {
        success:   false,
        remaining: available,
        message:   `You need ${xpCost} XP. You have ${available} available.`,
      };
    }
    await db.updateDocument(DB_ID, XP_COLLECTION_ID, record.$id, {
      redeemedXp: (record.redeemedXp ?? 0) + xpCost,
    });
    return {
      success:   true,
      remaining: available - xpCost,
      message:   "Consultation unlocked! 🎉",
    };
  } catch (e) {
    console.error("XP redemption error:", e);
    return { success: false, remaining: 0, message: "Redemption failed. Try again." };
  }
}

// ─── FETCH ───────────────────────────────────────────────────────────────────
/** All assessments for a user, newest first */
export async function fetchUserAssessments(userId: string): Promise<StoredAssessment[]> {
  const res = await db.listDocuments(DB_ID, COLLECTION_ID, [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ]);
  return res.documents as unknown as StoredAssessment[];
}

/** Most recent assessment for a user */
export async function fetchLatestAssessment(
  userId: string
): Promise<StoredAssessment | null> {
  try {
    const res = await db.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as StoredAssessment) ?? null;
  } catch {
    return null;
  }
}

/** Single assessment by Appwrite doc ID */
export async function fetchAssessmentById(
  docId: string
): Promise<StoredAssessment | null> {
  try {
    const doc = await db.getDocument(DB_ID, COLLECTION_ID, docId);
    return doc as unknown as StoredAssessment;
  } catch {
    return null;
  }
}

// ─── PARSE BACK TO DualRiskAssessment ────────────────────────────────────────
export function parseStoredAssessment(s: StoredAssessment): DualRiskAssessment {
  return {
    diabetesRisk: {
      level:           s.diabetesLevel    as any,
      score:           Number(s.diabetesScore),
      percentage:      s.diabetesPct,
      pointsBreakdown: {},
    },
    hypertensionRisk: {
      level:           s.hypertensionLevel as any,
      score:           Number(s.hypertensionScore),
      percentage:      s.hypertensionPct,
      pointsBreakdown: {},
    },
    summary:         s.summary,
    keyFindings:     JSON.parse(s.keyFindings     || "[]"),
    recommendations: JSON.parse(s.recommendations || "[]"),
    urgentActions:   JSON.parse(s.urgentActions   || "[]"),
    detailedAnalysis: s.detailedAnalysis || undefined,
    profile: {
      ageCategory:      s.profileAge    as any,
      gender:           s.profileGender as any,
      bmiCategory:      s.profileBmi    as any,
      waistCategory:    s.profileWaist  as any,
      riskLevel:        "low",
      specificProfiles: [],
    },
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Client, Databases, ID, Query } from "appwrite";
import type { DualRiskAssessment } from "./GroqService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const DB_ID         = "hmex_db";
export const COLLECTION_ID = "assessments";

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
  diabetesLevel:     string;
  diabetesScore:     number;
  diabetesPct:       string;
  hypertensionLevel: string;
  hypertensionScore: number;
  hypertensionPct:   string;
  summary:           string;
  keyFindings:       string; // JSON string[]
  recommendations:   string; // JSON string[]
  urgentActions:     string; // JSON string[]
  detailedAnalysis:  string;
  profileAge:        string;
  profileGender:     string;
  profileBmi:        string;
  profileWaist:      string;
  answersSnapshot:   string; // JSON Answer[]
}

// What we store in localStorage while waiting for signup
interface PendingAssessment {
  sessionId:    string; // random ID so we can match it later if needed
  assessment:   DualRiskAssessment;
  answers:      any[];
  completedAt:  string; // ISO timestamp
}

// ─── STAGE 1: HOLD IN LOCALSTORAGE (pre-auth) ────────────────────────────────
/**
 * Call this immediately when the review page loads (assessment just completed).
 * Stores everything in localStorage — no Appwrite call yet.
 * Returns the temporary sessionId so you can display it or use it for linking.
 */
export function holdAssessmentLocally(
  assessment: DualRiskAssessment,
  answers:    any[]
): string {
  const sessionId = `hmex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pending: PendingAssessment = {
    sessionId,
    assessment,
    answers,
    completedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  } catch {
    // localStorage unavailable (SSR or private mode) — silently fail
  }
  return sessionId;
}

/**
 * Read the pending assessment from localStorage.
 * Returns null if nothing is stored.
 */
export function getPendingAssessment(): PendingAssessment | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingAssessment;
  } catch { return null; }
}

/**
 * Clear the pending assessment from localStorage.
 * Call this after successfully saving to Appwrite.
 */
export function clearPendingAssessment(): void {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* */ }
}

// ─── STAGE 2: SAVE TO APPWRITE (post-auth) ───────────────────────────────────
/**
 * Call this immediately after the user signs up or logs in.
 * Reads the pending assessment from localStorage and writes it to Appwrite
 * with the real userId. Then clears localStorage.
 *
 * Usage in your signup/login success handler:
 *   const saved = await claimPendingAssessment(newUser.$id);
 *   if (saved) console.log('Assessment saved:', saved.$id);
 */
export async function claimPendingAssessment(
  userId: string
): Promise<StoredAssessment | null> {
  const pending = getPendingAssessment();
  if (!pending) return null;

  try {
    const doc = await saveAssessment(userId, pending.assessment, pending.answers, pending.sessionId);
    clearPendingAssessment();
    return doc;
  } catch (e) {
    console.error("Failed to claim pending assessment:", e);
    return null;
  }
}

// ─── CORE SAVE ───────────────────────────────────────────────────────────────
/**
 * Write a completed assessment to Appwrite.
 * Usually called via claimPendingAssessment — but can be called directly
 * if the user is already logged in when they complete the assessment.
 */
export async function saveAssessment(
  userId:     string,
  assessment: DualRiskAssessment,
  answers:    any[],
  sessionId?: string
): Promise<StoredAssessment> {
  const doc = await db.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
    userId,
    sessionId:         sessionId ?? `direct_${Date.now()}`,
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
    detailedAnalysis:  assessment.detailedAnalysis ?? '',
    profileAge:        assessment.profile?.ageCategory    ?? '',
    profileGender:     assessment.profile?.gender         ?? '',
    profileBmi:        assessment.profile?.bmiCategory    ?? '',
    profileWaist:      assessment.profile?.waistCategory  ?? '',
    answersSnapshot:   JSON.stringify(answers),
  });

  return doc as unknown as StoredAssessment;
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
export async function fetchLatestAssessment(userId: string): Promise<StoredAssessment | null> {
  try {
    const res = await db.listDocuments(DB_ID, COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as StoredAssessment) ?? null;
  } catch { return null; }
}

/** Single assessment by Appwrite doc ID */
export async function fetchAssessmentById(docId: string): Promise<StoredAssessment | null> {
  try {
    const doc = await db.getDocument(DB_ID, COLLECTION_ID, docId);
    return doc as unknown as StoredAssessment;
  } catch { return null; }
}

// ─── PARSE BACK TO DualRiskAssessment ────────────────────────────────────────
export function parseStoredAssessment(s: StoredAssessment): DualRiskAssessment {
  return {
    diabetesRisk: {
      level:           s.diabetesLevel as any,
      score: Number(s.diabetesScore),
      percentage:      s.diabetesPct,
      pointsBreakdown: {},
    },
    hypertensionRisk: {
      level:           s.hypertensionLevel as any,
      score: Number(s.diabetesScore),
      percentage:      s.hypertensionPct,
      pointsBreakdown: {},
    },
    summary:         s.summary,
    keyFindings:     JSON.parse(s.keyFindings     || "[]"),
    recommendations: JSON.parse(s.recommendations || "[]"),
    urgentActions:   JSON.parse(s.urgentActions   || "[]"),
    detailedAnalysis: s.detailedAnalysis || undefined,
    profile: {
      ageCategory:      s.profileAge   as any,
      gender:           s.profileGender as any,
      bmiCategory:      s.profileBmi   as any,
      waistCategory:    s.profileWaist as any,
      riskLevel:        "low",
      specificProfiles: [],
    },
  };
}
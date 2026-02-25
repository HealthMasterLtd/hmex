/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RecommendationsService.ts
 *
 * Two flows:
 *
 * 1. PRE-LOGIN (public assessment):
 *    - holdRecommendationsLocally(assessment, answers)
 *        → calls Groq AI, stores result in localStorage as "hmex_pending_recommendations"
 *    - claimPendingRecommendations(userId, assessmentId)
 *        → called from signup page after claimPendingAssessment() resolves
 *        → reads localStorage, posts to Appwrite, clears localStorage
 *
 * 2. LOGGED-IN (dashboard assessment):
 *    - generateAndSaveRecommendations(storedAssessment, userId)
 *        → calls Groq AI, saves directly to Appwrite (no localStorage involved)
 *
 * APPWRITE SCHEMA NOTE:
 *   The `items` attribute in the "recommendations" collection must be:
 *   - Type: string
 *   - Array: ✅ enabled
 *   - Size: 16000
 *   Each array element is a JSON-stringified RecommendationItem.
 *   parseRecommendationItems() handles both the array format (Appwrite)
 *   and the legacy single-string format for backward compatibility.
 */

import { Client, Databases, ID, Query } from "appwrite";
import type { StoredAssessment } from "./AppwriteService";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const GROQ_KEY   = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export const RECO_DB_ID         = "hmex_db";
export const RECO_COLLECTION_ID = "recommendations";

// localStorage key for pending (pre-login) recommendations
const PENDING_RECO_KEY = "hmex_pending_recommendations";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const db     = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type RecoCategory =
  | "nutrition"
  | "physical_activity"
  | "stress_sleep"
  | "medical"
  | "lifestyle"
  | "monitoring";

export type RecoPriority = "urgent" | "high" | "medium" | "low";

export interface RecommendationItem {
  title:           string;
  description:     string;       // 1-2 sentence explanation
  action:          string;       // concrete, single-sentence step
  frequency?:      string;       // e.g. "Daily", "3x per week"
  category:        RecoCategory;
  priority:        RecoPriority;
  icon:            string;       // emoji
  evidenceBased:   boolean;
  locallyRelevant: boolean;      // references East African context
}

export interface StoredRecommendation {
  $id:               string;
  $createdAt:        string;
  userId:            string;
  assessmentId:      string;      // linked to StoredAssessment.$id
  diabetesLevel:     string;
  hypertensionLevel: string;
  generatedAt:       string;      // ISO timestamp
  aiModel:           string;
  items:             string[];    // Appwrite string[] — each element is JSON-stringified RecommendationItem
  summary:           string;      // personalised intro paragraph
  topPriority:       string;      // single most important action
  totalItems:        number;
  urgentCount:       number;
}

// What we hold in localStorage until signup
interface PendingRecommendations {
  items:             RecommendationItem[];
  summary:           string;
  topPriority:       string;
  totalItems:        number;
  urgentCount:       number;
  diabetesLevel:     string;
  hypertensionLevel: string;
  generatedAt:       string;
}

// ─── INTERNAL HELPER ─────────────────────────────────────────────────────────

/**
 * Converts RecommendationItem[] into the string[] format Appwrite expects
 * for an array attribute. Each element is a JSON-stringified item object.
 */
function itemsToAppwriteArray(items: RecommendationItem[]): string[] {
  return items.map(item => JSON.stringify(item));
}

// ─── PRE-LOGIN: HOLD IN LOCALSTORAGE ─────────────────────────────────────────

/**
 * Call this right after holdAssessmentLocally() in the pre-login assessment page.
 * Generates AI recommendations NOW and stores them in localStorage.
 * No Appwrite write happens here — that happens in claimPendingRecommendations().
 *
 * Returns the generated items so the review page can display them immediately
 * without waiting for an Appwrite round-trip.
 */
export async function holdRecommendationsLocally(
    assessment: any, // Accept any type (DualRiskAssessment or StoredAssessment)
    answers: any[],
    overrides?: {
      diabetesLevel:     string;
      hypertensionLevel: string;
      diabetesScore:     number | string;
      hypertensionScore: number | string;
      diabetesPct:       string;
      hypertensionPct:   string;
      summary:           string;
      profileAge:        string;
      profileGender:     string;
      profileBmi:        string;
      profileWaist:      string;
    }
  ): Promise<RecommendationItem[]> {
  // Build a shape that callGroqForRecommendations can consume
  const shape: StoredAssessment = assessment ?? ({
    $id:              "pending",
    $createdAt:       new Date().toISOString(),
    userId:           "pending",
    sessionId:        "pending",
    assessmentNumber: 1,
    isRetake:         false,
    xpEarned:         0,
    answersSnapshot:  JSON.stringify(answers),
    keyFindings:      "[]",
    recommendations:  "[]",
    urgentActions:    "[]",
    detailedAnalysis: "",
    ...overrides,
  } as any);

  const items   = await callGroqForRecommendations(shape, answers);
  const summary = await callGroqForSummary(shape);

  const urgentCount = items.filter(i => i.priority === "urgent").length;
  const topPriority =
    items.find(i => i.priority === "urgent")?.action ??
    items.find(i => i.priority === "high")?.action ??
    items[0]?.action ??
    "";

  const pending: PendingRecommendations = {
    items,
    summary,
    topPriority,
    totalItems:        items.length,
    urgentCount,
    diabetesLevel:     shape.diabetesLevel,
    hypertensionLevel: shape.hypertensionLevel,
    generatedAt:       new Date().toISOString(),
  };

  try {
    localStorage.setItem(PENDING_RECO_KEY, JSON.stringify(pending));
  } catch { /* SSR / private mode */ }

  return items;
}

/**
 * Read pending recommendations from localStorage.
 */
export function getPendingRecommendations(): PendingRecommendations | null {
  try {
    const raw = localStorage.getItem(PENDING_RECO_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingRecommendations;
  } catch { return null; }
}

/**
 * Clear pending recommendations from localStorage.
 */
export function clearPendingRecommendations(): void {
  try { localStorage.removeItem(PENDING_RECO_KEY); } catch { /* */ }
}

/**
 * Call this AFTER claimPendingAssessment() resolves in the signup page.
 * Takes the pre-generated recommendations from localStorage and posts them
 * to Appwrite with the real userId and assessmentId.
 *
 * Usage in signup success handler:
 *   const savedAssessment = await claimPendingAssessment(userId);
 *   if (savedAssessment) {
 *     await claimPendingRecommendations(userId, savedAssessment.$id);
 *   }
 */
export async function claimPendingRecommendations(
  userId:       string,
  assessmentId: string
): Promise<StoredRecommendation | null> {
  const pending = getPendingRecommendations();
  if (!pending) return null;

  try {
    const doc = await db.createDocument(
      RECO_DB_ID,
      RECO_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        assessmentId,
        diabetesLevel:     pending.diabetesLevel,
        hypertensionLevel: pending.hypertensionLevel,
        generatedAt:       pending.generatedAt,
        aiModel:           GROQ_MODEL,
        items:             itemsToAppwriteArray(pending.items),
        summary:           pending.summary,
        topPriority:       pending.topPriority,
        totalItems:        pending.totalItems,
        urgentCount:       pending.urgentCount,
      }
    );
    clearPendingRecommendations();
    console.log("[Recommendations] Claimed to Appwrite:", doc.$id);
    return doc as unknown as StoredRecommendation;
  } catch (e) {
    console.error("[Recommendations] claimPendingRecommendations failed:", e);
    return null;
  }
}

// ─── LOGGED-IN: GENERATE + SAVE DIRECTLY ─────────────────────────────────────

/**
 * Call this immediately after saveAssessment() in the dashboard assessment.
 * Generates AI recommendations and saves directly to Appwrite.
 * Fire-and-forget safe — catches all errors.
 */
export async function generateAndSaveRecommendations(
  assessment: StoredAssessment,
  userId:     string
): Promise<StoredRecommendation | null> {
  try {
    let answers: any[] = [];
    try { answers = JSON.parse(assessment.answersSnapshot || "[]"); } catch { /* */ }

    const items = await callGroqForRecommendations(assessment, answers);
    if (!items || items.length === 0) return null;

    const summary     = await callGroqForSummary(assessment);
    const urgentCount = items.filter(i => i.priority === "urgent").length;
    const topPriority =
      items.find(i => i.priority === "urgent")?.action ??
      items.find(i => i.priority === "high")?.action ??
      items[0]?.action ??
      "";

    const doc = await db.createDocument(
      RECO_DB_ID,
      RECO_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        assessmentId:      assessment.$id,
        diabetesLevel:     assessment.diabetesLevel,
        hypertensionLevel: assessment.hypertensionLevel,
        generatedAt:       new Date().toISOString(),
        aiModel:           GROQ_MODEL,
        items:             itemsToAppwriteArray(items),
        summary,
        topPriority,
        totalItems:        items.length,
        urgentCount,
      }
    );

    return doc as unknown as StoredRecommendation;
  } catch (e) {
    console.error("[RecommendationsService] generateAndSaveRecommendations failed:", e);
    return null;
  }
}

// ─── GROQ: RECOMMENDATIONS ────────────────────────────────────────────────────

async function callGroqForRecommendations(
  assessment: StoredAssessment,
  answers:    any[]
): Promise<RecommendationItem[]> {
  if (!GROQ_KEY) return buildFallbackRecommendations(assessment);

  const answersText = answers
    .map((a: any) => `• ${a.question}: "${a.value}"`)
    .join("\n");

  const prompt = `You are a clinical AI specialised in diabetes and hypertension prevention for East African populations (Rwanda/Kenya).

PATIENT ASSESSMENT RESULTS:
- Age category: ${assessment.profileAge}
- Gender: ${assessment.profileGender}
- BMI category: ${assessment.profileBmi}
- Waist: ${assessment.profileWaist}
- Diabetes risk level: ${assessment.diabetesLevel} (score: ${assessment.diabetesScore}, ${assessment.diabetesPct})
- Hypertension risk level: ${assessment.hypertensionLevel} (score: ${assessment.hypertensionScore}, ${assessment.hypertensionPct})
- Summary: ${assessment.summary}

PATIENT ANSWERS:
${answersText || "(baseline data only)"}

Generate exactly 12 highly personalised, evidence-based health recommendations for this specific patient.
Distribute across these 6 categories (2 per category):
1. nutrition
2. physical_activity
3. stress_sleep
4. medical
5. lifestyle
6. monitoring

Rules:
- Be HIGHLY SPECIFIC to their risk levels, BMI, waist, age, and answers
- Reference East African food staples where relevant (ugali, beans, matoke, sweet potatoes, leafy greens, sorghum, sukuma wiki)
- Be warm, practical, and achievable — not clinical jargon
- For urgent/high priority items, be direct about urgency
- Each action must be a concrete, single sentence the patient can do this week
- Set locallyRelevant: true when you mention local foods, health centres, or cultural context
- Set evidenceBased: true for all clinically validated recommendations

Respond ONLY with a valid JSON array. No markdown. No explanation. Format:
[
  {
    "title": "Short title (3-5 words)",
    "description": "1-2 sentences explaining why this matters for them.",
    "action": "Specific single sentence of what to do.",
    "frequency": "Daily",
    "category": "nutrition",
    "priority": "high",
    "icon": "🥗",
    "evidenceBased": true,
    "locallyRelevant": true
  }
]`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You output ONLY valid JSON arrays. No other text, no markdown, no backticks.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens:  2800,
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}`);
    const data  = await res.json();
    const raw: string = data.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/gi, "").trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");
    const parsed = JSON.parse(match[0]) as RecommendationItem[];
    return parsed.slice(0, 12).map(item => ({
      ...item,
      category: validateCategory(item.category),
      priority: validatePriority(item.priority),
    }));
  } catch (e) {
    console.error("[RecommendationsService] Groq recommendations error:", e);
    return buildFallbackRecommendations(assessment);
  }
}

// ─── GROQ: SUMMARY ────────────────────────────────────────────────────────────

async function callGroqForSummary(assessment: StoredAssessment): Promise<string> {
  if (!GROQ_KEY) return buildFallbackSummary(assessment);

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: `Write a warm, 2-sentence personalised intro for a ${assessment.profileAge} ${assessment.profileGender} with ${assessment.diabetesLevel} diabetes risk and ${assessment.hypertensionLevel} hypertension risk in East Africa.
Tone: encouraging, clinical but human. Acknowledge their risk level and introduce that these recommendations are tailored for them.
Max 60 words. Output ONLY the paragraph text, nothing else.`,
          },
        ],
        temperature: 0.6,
        max_tokens:  120,
      }),
    });
    if (!res.ok) throw new Error("summary call failed");
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch {
    return buildFallbackSummary(assessment);
  }
}

// ─── FETCH FROM APPWRITE ──────────────────────────────────────────────────────

/** Most recent recommendations for a user */
export async function fetchLatestRecommendations(
  userId: string
): Promise<StoredRecommendation | null> {
  try {
    const res = await db.listDocuments(RECO_DB_ID, RECO_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as StoredRecommendation) ?? null;
  } catch {
    return null;
  }
}

/** Recommendations linked to a specific assessment */
export async function fetchRecommendationsByAssessment(
  assessmentId: string
): Promise<StoredRecommendation | null> {
  try {
    const res = await db.listDocuments(RECO_DB_ID, RECO_COLLECTION_ID, [
      Query.equal("assessmentId", assessmentId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    return (res.documents[0] as unknown as StoredRecommendation) ?? null;
  } catch {
    return null;
  }
}

/** All recommendation records for a user, newest first */
export async function fetchAllUserRecommendations(
  userId: string
): Promise<StoredRecommendation[]> {
  try {
    const res = await db.listDocuments(RECO_DB_ID, RECO_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(20),
    ]);
    return res.documents as unknown as StoredRecommendation[];
  } catch {
    return [];
  }
}

// ─── PARSE ────────────────────────────────────────────────────────────────────

/**
 * Converts a StoredRecommendation back into RecommendationItem[].
 *
 * Handles two formats:
 *  - string[]  → current Appwrite array attribute format
 *               Each element is a JSON-stringified RecommendationItem.
 *  - string    → legacy format (old documents stored as one big JSON string)
 */
export function parseRecommendationItems(
  stored: StoredRecommendation
): RecommendationItem[] {
  try {
    if (Array.isArray(stored.items)) {
      return (stored.items as string[]).map(s => JSON.parse(s) as RecommendationItem);
    }
    // Legacy fallback: single JSON string e.g. "[{...},{...}]"
    return JSON.parse((stored.items as unknown as string) || "[]") as RecommendationItem[];
  } catch {
    return [];
  }
}

// ─── VALIDATORS ───────────────────────────────────────────────────────────────

function validateCategory(c: string): RecoCategory {
  const valid: RecoCategory[] = [
    "nutrition",
    "physical_activity",
    "stress_sleep",
    "medical",
    "lifestyle",
    "monitoring",
  ];
  return valid.includes(c as RecoCategory) ? (c as RecoCategory) : "lifestyle";
}

function validatePriority(p: string): RecoPriority {
  const valid: RecoPriority[] = ["urgent", "high", "medium", "low"];
  return valid.includes(p as RecoPriority) ? (p as RecoPriority) : "medium";
}

// ─── STATIC FALLBACKS ────────────────────────────────────────────────────────

function buildFallbackSummary(a: StoredAssessment): string {
  const dHigh = a.diabetesLevel === "high" || a.diabetesLevel === "very-high";
  const hHigh = a.hypertensionLevel === "high" || a.hypertensionLevel === "very-high";
  if (dHigh && hHigh)
    return "Your assessment shows elevated risk for both diabetes and hypertension — these recommendations are tailored specifically to help you take meaningful, sustainable action starting today.";
  if (dHigh)
    return "Your diabetes risk is elevated, and these personalised recommendations are designed to help you reduce it through practical, evidence-based steps.";
  if (hHigh)
    return "Your hypertension risk warrants attention, and the recommendations below are specifically curated to support your cardiovascular health.";
  return "Your risk levels are currently in a healthy range. These recommendations will help you maintain and strengthen your metabolic health over time.";
}

function buildFallbackRecommendations(a: StoredAssessment): RecommendationItem[] {
  const dHigh = a.diabetesLevel === "high" || a.diabetesLevel === "very-high";
  const hHigh = a.hypertensionLevel === "high" || a.hypertensionLevel === "very-high";

  return [
    {
      title:           "Daily 30-min Walk",
      description:     "Regular walking is one of the most powerful tools to lower both blood sugar and blood pressure. Even a brisk 30-minute walk each day produces measurable improvements within weeks.",
      action:          "Walk briskly for 30 minutes every morning before breakfast, 5 days this week.",
      frequency:       "Daily",
      category:        "physical_activity",
      priority:        dHigh || hHigh ? "urgent" : "high",
      icon:            "🚶",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Reduce Ugali Portions",
      description:     "High-glycaemic staples like ugali, white rice, and posho raise blood sugar rapidly. Replacing half your portion with beans or vegetables significantly reduces metabolic load.",
      action:          "Replace half your ugali or white rice serving with beans, lentils, or steamed vegetables at lunch and dinner.",
      frequency:       "Every meal",
      category:        "nutrition",
      priority:        dHigh ? "urgent" : "high",
      icon:            "🍛",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Cut Sugary Drinks",
      description:     "Sodas, sweetened uji, and energy drinks contribute directly to insulin resistance and weight gain. Replacing them with water or unsweetened tea has immediate benefits.",
      action:          "Replace all sodas and sweetened drinks with water, black tea, or lemon water this week.",
      frequency:       "Daily",
      category:        "nutrition",
      priority:        "high",
      icon:            "💧",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Reduce Salt Intake",
      description:     "Excess salt is the leading dietary driver of hypertension. Most East African diets are high in salt through processed snacks and table salt.",
      action:          "Remove the salt shaker from the table and avoid adding extra salt to cooked food.",
      frequency:       "Daily",
      category:        "nutrition",
      priority:        hHigh ? "urgent" : "high",
      icon:            "🧂",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Book a Blood Pressure Check",
      description:     "Getting a professional blood pressure reading at your nearest health centre takes less than 5 minutes and gives you a critical baseline.",
      action:          "Visit your nearest health centre or pharmacy to get a blood pressure reading this week.",
      frequency:       "Once (then monthly)",
      category:        "medical",
      priority:        hHigh ? "urgent" : "high",
      icon:            "🏥",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Fasting Blood Sugar Test",
      description:     "A simple fasting glucose test can confirm or rule out diabetes or prediabetes. Early detection is the most powerful tool you have.",
      action:          "Ask your doctor for a fasting blood glucose test at your next visit.",
      frequency:       "Once (then annually)",
      category:        "medical",
      priority:        dHigh ? "urgent" : "medium",
      icon:            "🩸",
      evidenceBased:   true,
      locallyRelevant: false,
    },
    {
      title:           "7-8 Hours of Sleep",
      description:     "Poor sleep directly raises cortisol, blood sugar, and blood pressure. Improving sleep quality is one of the most underestimated metabolic interventions.",
      action:          "Set a consistent bedtime and wake time, aiming for 7-8 hours with no screens in the last 30 minutes.",
      frequency:       "Nightly",
      category:        "stress_sleep",
      priority:        "medium",
      icon:            "😴",
      evidenceBased:   true,
      locallyRelevant: false,
    },
    {
      title:           "Stress Reduction Routine",
      description:     "Chronic stress elevates cortisol, which raises blood sugar and constricts blood vessels. Even 10 minutes of calm daily reduces this burden measurably.",
      action:          "Spend 10 minutes each evening in quiet rest, prayer, or deep breathing before bed.",
      frequency:       "Daily",
      category:        "stress_sleep",
      priority:        "medium",
      icon:            "🧘",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Eat More Leafy Greens",
      description:     "Vegetables like sukuma wiki, spinach, and amaranth are rich in magnesium, potassium, and fibre — all protective against both diabetes and hypertension.",
      action:          "Add a serving of dark leafy greens (sukuma wiki, spinach, or amaranth) to at least one meal daily.",
      frequency:       "Daily",
      category:        "nutrition",
      priority:        "medium",
      icon:            "🥬",
      evidenceBased:   true,
      locallyRelevant: true,
    },
    {
      title:           "Monthly Weight Check",
      description:     "Tracking your weight monthly helps you catch upward trends early. Even a 5-10% weight loss significantly reduces risk for both conditions.",
      action:          "Weigh yourself on the same scale every first Monday of the month and log the result.",
      frequency:       "Monthly",
      category:        "monitoring",
      priority:        "medium",
      icon:            "⚖️",
      evidenceBased:   true,
      locallyRelevant: false,
    },
    {
      title:           "Limit Alcohol",
      description:     "Alcohol raises blood pressure and adds empty calories that worsen insulin resistance. Even moderate reduction has measurable cardiovascular benefits.",
      action:          "Limit alcohol to no more than 1-2 drinks per week, or eliminate entirely if your risk is high.",
      frequency:       "Weekly",
      category:        "lifestyle",
      priority:        "medium",
      icon:            "🚫",
      evidenceBased:   true,
      locallyRelevant: false,
    },
    {
      title:           "Annual Comprehensive Check",
      description:     "A full metabolic panel including blood glucose, blood pressure, cholesterol, and kidney function gives your doctor the full picture to guide your care.",
      action:          "Schedule a comprehensive metabolic health check-up at your nearest hospital or health centre.",
      frequency:       "Annually",
      category:        "monitoring",
      priority:        "low",
      icon:            "📋",
      evidenceBased:   true,
      locallyRelevant: true,
    },
  ];
}
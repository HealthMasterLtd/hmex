/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * employerProgramsAiService.ts
 *
 * Groq-powered AI service for employer health program suggestions.
 * Programs are cached in Appwrite `programs` collection.
 * AI is only called on first generation or when manually refreshed (rate-limited).
 */

import { Client, Databases, Query, ID } from "appwrite";

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY!;
const MODEL        = "llama-3.3-70b-versatile";

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

const client = new Client()
  .setEndpoint(ENDPOINT.replace(/\/$/, ""))
  .setProject(PROJECT_ID);

const db = new Databases(client);

export const PROGRAMS_DB_ID         = "hmex_db";
export const PROGRAMS_COLLECTION_ID = "programs"; // create this in Appwrite

// Rate limit: how many ms must pass before a manual refresh is allowed
const REFRESH_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3 hours

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface WorkforceSnapshot {
  companyName:          string;
  industry:             string;
  totalEmployees:       number;
  activeEmployees:      number;
  assessedEmployees:    number;
  assessmentRate:       number;
  avgDiabetesScore:     number;
  avgHypertensionScore: number;
  diabetesBreakdown:    { low: number; medium: number; high: number; none: number };
  hypertensionBreakdown: { low: number; medium: number; high: number; none: number };
  highRiskCount:        number;
  genderBreakdown:      Record<string, number>;
  ageBreakdown:         Record<string, number>;
  bmiBreakdown:         Record<string, number>;
}

export type ProgramCategory =
  | "screening" | "fitness" | "nutrition" | "education"
  | "mental_health" | "chronic_disease" | "preventive";

export type ProgramPriority = "critical" | "high" | "medium" | "low";

export interface AiProgramSuggestion {
  id:              string;
  title:           string;
  tagline:         string;
  description:     string;
  category:        ProgramCategory;
  priority:        ProgramPriority;
  iconName:        string;   // Lucide icon name
  color:           string;
  targetGroup:     string;
  estimatedImpact: string;
  duration:        string;
  steps: {
    week:        string;
    action:      string;
    responsible: string;
  }[];
  kpis:          string[];
  resources:     string[];
  evidenceBased: boolean;
  urgency:       string;
}

export interface AiInterventionTip {
  title:      string;
  body:       string;
  iconName:   string;  // Lucide icon name
  category:   string;
  actionable: string;
}

export interface AiEngagementStrategy {
  title:    string;
  why:      string;
  how:      string[];
  metric:   string;
  iconName: string;  // Lucide icon name
}

export interface ProgramsAiResponse {
  headline:      string;
  urgentMessage: string | null;
  programs:      AiProgramSuggestion[];
  interventions: AiInterventionTip[];
  engagement:    AiEngagementStrategy[];
  generatedAt:   string;
}

// Stored in Appwrite `programs` collection
export interface StoredProgramsDoc {
  $id:         string;
  $createdAt:  string;
  companyId:   string;
  generatedAt: string;
  data:        string; // JSON stringified ProgramsAiResponse
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function safe(obj: any): string {
  try { return JSON.stringify(obj, null, 2); } catch { return "{}"; }
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    const clean = raw.replace(/```json|```/gi, "").trim();
    const match = clean.match(/[\[{][\s\S]*[\]}]/);
    if (!match) throw new Error("no json");
    return JSON.parse(match[0]) as T;
  } catch (e) {
    console.error("[ProgramsAI] JSON parse error:", e);
    return fallback;
  }
}

async function callGroq(
  systemPrompt: string,
  userPrompt:   string,
  maxTokens   = 3200
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model:    MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens:  maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ─── APPWRITE CACHE LAYER ─────────────────────────────────────────────────────

async function loadFromAppwrite(companyId: string): Promise<ProgramsAiResponse | null> {
  try {
    const res = await db.listDocuments(PROGRAMS_DB_ID, PROGRAMS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    const doc = res.documents[0];
    return JSON.parse(doc.data) as ProgramsAiResponse;
  } catch (e) {
    console.error("[ProgramsAI] loadFromAppwrite error:", e);
    return null;
  }
}

async function saveToAppwrite(
  companyId: string,
  response:  ProgramsAiResponse
): Promise<void> {
  try {
    // Delete old record first
    const existing = await db.listDocuments(PROGRAMS_DB_ID, PROGRAMS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.limit(5),
    ]);
    await Promise.all(
      existing.documents.map(d =>
        db.deleteDocument(PROGRAMS_DB_ID, PROGRAMS_COLLECTION_ID, d.$id).catch(() => {})
      )
    );

    await db.createDocument(PROGRAMS_DB_ID, PROGRAMS_COLLECTION_ID, ID.unique(), {
      companyId,
      generatedAt: response.generatedAt,
      data: JSON.stringify(response),
    });
    console.log("[ProgramsAI] Saved to Appwrite for company:", companyId);
  } catch (e) {
    console.error("[ProgramsAI] saveToAppwrite error:", e);
  }
}

/**
 * Returns the last generatedAt timestamp from Appwrite for rate-limit checking.
 */
async function getLastGeneratedAt(companyId: string): Promise<Date | null> {
  try {
    const res = await db.listDocuments(PROGRAMS_DB_ID, PROGRAMS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.orderDesc("$createdAt"),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    return new Date(res.documents[0].generatedAt);
  } catch {
    return null;
  }
}

/**
 * Check if a manual refresh is allowed.
 * Returns { allowed: boolean; nextAllowedAt: Date | null }
 */
export async function checkRefreshEligibility(
  companyId: string
): Promise<{ allowed: boolean; nextAllowedAt: Date | null }> {
  const last = await getLastGeneratedAt(companyId);
  if (!last) return { allowed: true, nextAllowedAt: null };
  const nextAllowedAt = new Date(last.getTime() + REFRESH_COOLDOWN_MS);
  const allowed       = Date.now() >= nextAllowedAt.getTime();
  return { allowed, nextAllowedAt: allowed ? null : nextAllowedAt };
}

// ─── MAIN SERVICE ─────────────────────────────────────────────────────────────

class EmployerProgramsAiService {

  /**
   * Load from Appwrite cache first.
   * If no cache exists, generate via AI and save.
   */
  async getOrGenerateAnalysis(
    companyId: string,
    snapshot:  WorkforceSnapshot
  ): Promise<ProgramsAiResponse> {
    const cached = await loadFromAppwrite(companyId);
    if (cached) {
      console.log("[ProgramsAI] Loaded from Appwrite cache.");
      return cached;
    }
    console.log("[ProgramsAI] No cache found — generating via AI.");
    return this.generateAndSave(companyId, snapshot);
  }

  /**
   * Force regenerate via AI (called on manual refresh button click).
   * Rate-limiting is enforced by the caller via checkRefreshEligibility.
   */
  async generateAndSave(
    companyId: string,
    snapshot:  WorkforceSnapshot
  ): Promise<ProgramsAiResponse> {
    const result = await this.generateFullAnalysis(snapshot);
    await saveToAppwrite(companyId, result);
    return result;
  }

  /**
   * Generate complete AI analysis: programs + interventions + engagement
   */
  async generateFullAnalysis(snapshot: WorkforceSnapshot): Promise<ProgramsAiResponse> {
    console.log("[ProgramsAI] Generating full analysis for:", snapshot.companyName);

    const [programs, interventions, engagement] = await Promise.all([
      this.suggestPrograms(snapshot),
      this.generateInterventions(snapshot),
      this.generateEngagementStrategies(snapshot),
    ]);

    const dHighPct = snapshot.assessedEmployees > 0
      ? Math.round((snapshot.diabetesBreakdown.high / snapshot.assessedEmployees) * 100) : 0;
    const hHighPct = snapshot.assessedEmployees > 0
      ? Math.round((snapshot.hypertensionBreakdown.high / snapshot.assessedEmployees) * 100) : 0;

    const urgentMessage = snapshot.highRiskCount > 0
      ? `${snapshot.highRiskCount} employee${snapshot.highRiskCount > 1 ? "s are" : " is"} at high risk — ${dHighPct}% for diabetes, ${hHighPct}% for hypertension. Immediate structured intervention is recommended.`
      : null;

    return {
      headline:      this.buildHeadline(snapshot),
      urgentMessage,
      programs,
      interventions,
      engagement,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── PROGRAM SUGGESTIONS ────────────────────────────────────────────────────

  async suggestPrograms(snapshot: WorkforceSnapshot): Promise<AiProgramSuggestion[]> {
    const prompt = `
You are an occupational health strategist helping employers design effective workforce health programs.

WORKFORCE DATA:
${safe(snapshot)}

TASK: Generate exactly 5 highly specific, evidence-based health program recommendations.
Base them on the actual risk distribution above.

Rules:
- Programs must directly address the dominant risk factors
- Steps must be concrete and actionable
- If high-risk count > 0, at least 2 programs must address those employees
- If assessment rate < 60%, include one program to boost participation
- Use realistic durations (4-12 weeks for interventions)
- Prioritise programs by clinical urgency and impact
- Each program must have exactly 4-6 implementation steps
- steps.responsible must be one of: "HR", "Health Coach", "Manager", "Employee", "Medical Team"
- Colors must be valid hex codes: #2563eb, #0d9488, #10B981, #F59E0B, #EF4444, #8B5CF6, #EC4899, #0EA5E9
- iconName must be a valid Lucide React icon name (e.g. "Heart", "Activity", "Stethoscope", "Brain", "Apple", "Dumbbell", "ShieldCheck", "TrendingUp", "Users", "Clipboard", "FlaskConical", "Scale", "Wind", "Salad", "Bike", "PersonStanding", "Pill", "Thermometer", "Eye", "Smile")

Respond ONLY with a valid JSON array of 5 program objects:
[
  {
    "id": "prog_1",
    "title": "Program Name",
    "tagline": "Short hook (max 8 words)",
    "description": "2-3 sentences explaining the program and its clinical rationale for this specific workforce.",
    "category": "screening|fitness|nutrition|education|mental_health|chronic_disease|preventive",
    "priority": "critical|high|medium|low",
    "iconName": "Heart",
    "color": "#2563eb",
    "targetGroup": "Who this targets specifically",
    "estimatedImpact": "Realistic impact statement",
    "duration": "X weeks",
    "steps": [
      { "week": "Week 1", "action": "Specific action", "responsible": "HR" }
    ],
    "kpis": ["Metric 1", "Metric 2", "Metric 3"],
    "resources": ["Resource 1", "Resource 2"],
    "evidenceBased": true,
    "urgency": "Why this program should start now"
  }
]`;

    try {
      const raw    = await callGroq("You output ONLY valid JSON arrays. No markdown, no explanation, no backticks.", prompt, 3600);
      const parsed = parseJson<AiProgramSuggestion[]>(raw, []);
      if (parsed.length === 0) throw new Error("empty");
      return parsed;
    } catch (e) {
      console.error("[ProgramsAI] suggestPrograms error:", e);
      return this.fallbackPrograms(snapshot);
    }
  }

  // ─── INTERVENTION TIPS ──────────────────────────────────────────────────────

  async generateInterventions(snapshot: WorkforceSnapshot): Promise<AiInterventionTip[]> {
    const prompt = `
You are an occupational health coach. Generate 6 quick intervention tips for HR and managers.

WORKFORCE CONTEXT:
- Company: ${snapshot.companyName} (${snapshot.industry})
- ${snapshot.activeEmployees} active employees, ${snapshot.assessedEmployees} assessed
- High diabetes risk: ${snapshot.diabetesBreakdown.high} | Avg diabetes score: ${snapshot.avgDiabetesScore}/100
- High hypertension risk: ${snapshot.hypertensionBreakdown.high} | Avg hypertension score: ${snapshot.avgHypertensionScore}/100
- Assessment completion: ${snapshot.assessmentRate}%

Mix categories: workplace changes, manager behaviours, environment, policy tweaks.
iconName must be a valid Lucide icon name (e.g. "Droplets", "PersonStanding", "Salad", "Brain", "Ban", "Trophy", "Coffee", "Moon", "Bike", "Heart", "Smile", "Wind", "FlaskConical", "Apple", "Pill").

Respond ONLY with a valid JSON array:
[
  {
    "title": "Short title (4-5 words)",
    "body": "2-sentence explanation of why this works for this specific workforce.",
    "iconName": "Droplets",
    "category": "environment|policy|behaviour|nutrition|movement|mental_health",
    "actionable": "One specific sentence: what the manager/HR does TODAY."
  }
]`;

    try {
      const raw = await callGroq("You output ONLY valid JSON arrays. No markdown, no explanation.", prompt, 1800);
      return parseJson<AiInterventionTip[]>(raw, this.fallbackInterventions());
    } catch {
      return this.fallbackInterventions();
    }
  }

  // ─── ENGAGEMENT STRATEGIES ──────────────────────────────────────────────────

  async generateEngagementStrategies(snapshot: WorkforceSnapshot): Promise<AiEngagementStrategy[]> {
    const prompt = `
You are a workforce engagement specialist. Current health assessment participation: ${snapshot.assessmentRate}%.
Company: ${snapshot.companyName}, Industry: ${snapshot.industry}, ${snapshot.activeEmployees} active employees.

Generate 4 creative, practical engagement strategies to improve health program participation.
iconName must be a valid Lucide icon name (e.g. "Trophy", "Users", "Star", "Megaphone", "Gift", "Target", "Zap", "Award", "Handshake", "Heart").

Respond ONLY with a valid JSON array:
[
  {
    "title": "Strategy name (3-5 words)",
    "why": "1 sentence — why this works psychologically for this workforce.",
    "how": ["Step 1", "Step 2", "Step 3"],
    "metric": "How to measure success (one KPI)",
    "iconName": "Trophy"
  }
]`;

    try {
      const raw = await callGroq("You output ONLY valid JSON arrays. No markdown, no explanation.", prompt, 1400);
      return parseJson<AiEngagementStrategy[]>(raw, this.fallbackEngagement());
    } catch {
      return this.fallbackEngagement();
    }
  }

  // ─── CHAT / Q&A ──────────────────────────────────────────────────────────────

  async askAboutWorkforce(question: string, snapshot: WorkforceSnapshot): Promise<string> {
    const prompt = `
You are an occupational health expert advising an employer about their workforce health.

WORKFORCE DATA:
${safe(snapshot)}

EMPLOYER QUESTION: "${question}"

Answer in 2-3 SHORT paragraphs maximum. Be specific to their actual data. Be practical.
Reference their actual numbers where relevant. Keep the total response under 200 words.`;

    try {
      return await callGroq(
        "You are a concise, helpful occupational health expert. Keep all responses under 200 words. Plain English only.",
        prompt,
        500
      );
    } catch {
      return "Unable to generate AI response. Please check your connection and try again.";
    }
  }

  // ─── HEADLINE ────────────────────────────────────────────────────────────────

  private buildHeadline(s: WorkforceSnapshot): string {
    if (s.assessedEmployees === 0) return `${s.totalEmployees} employees invited — start with a health assessment drive to unlock insights.`;
    const dH = s.diabetesBreakdown.high;
    const hH = s.hypertensionBreakdown.high;
    if (dH > 0 || hH > 0) return `${s.highRiskCount} high-risk employees identified across ${s.companyName} — targeted intervention recommended now.`;
    if (s.assessmentRate < 50) return `Only ${s.assessmentRate}% of employees assessed — boosting participation will unlock fuller insights.`;
    return `${s.assessedEmployees} employees assessed · avg diabetes score ${s.avgDiabetesScore} · avg BP score ${s.avgHypertensionScore}. Your workforce health baseline is set.`;
  }

  // ─── FALLBACKS ────────────────────────────────────────────────────────────────

  private fallbackPrograms(s: WorkforceSnapshot): AiProgramSuggestion[] {
    return [
      {
        id:    "prog_fallback_1",
        title: "Workplace Blood Pressure & Glucose Screening",
        tagline: "Know your numbers, protect your future",
        description: `With ${s.hypertensionBreakdown.high + s.diabetesBreakdown.high} employees at high risk, on-site screening enables early intervention before serious complications develop.`,
        category: "screening",
        priority: "critical",
        iconName: "Stethoscope",
        color:    "#EF4444",
        targetGroup:     "All active employees, priority to high-risk",
        estimatedImpact: "Identify undiagnosed conditions in ~15% of workforce",
        duration: "2 weeks",
        steps: [
          { week: "Week 1", action: "Partner with a local clinic or mobile health unit for on-site screening", responsible: "HR" },
          { week: "Week 1", action: "Communicate screening dates via email, team meetings, and posters",       responsible: "Manager" },
          { week: "Week 2", action: "Run 2-hour screening slots across all departments",                       responsible: "Medical Team" },
          { week: "Week 2", action: "Follow up with high-risk employees with referral letters",                responsible: "Health Coach" },
        ],
        kpis:          ["% employees screened", "New diagnoses identified", "Referrals completed"],
        resources:     ["Mobile health unit or clinic partner", "Private screening space", "Referral pathway to local hospital"],
        evidenceBased: true,
        urgency:       "Early detection reduces treatment costs and prevents serious complications.",
      },
      {
        id:    "prog_fallback_2",
        title: "10,000 Steps Workplace Challenge",
        tagline: "Move more, risk less — together",
        description: "Physical inactivity is a top modifiable risk factor for both diabetes and hypertension. A team steps challenge creates accountability and makes movement social.",
        category: "fitness",
        priority: "high",
        iconName: "PersonStanding",
        color:    "#10B981",
        targetGroup:     "All employees, especially sedentary desk workers",
        estimatedImpact: "Regular walking can reduce diabetes risk by up to 30%",
        duration: "6 weeks",
        steps: [
          { week: "Week 1",    action: "Launch challenge via company email with team sign-up form",  responsible: "HR" },
          { week: "Week 1",    action: "Create department teams for friendly competition",            responsible: "Manager" },
          { week: "Weeks 2-5", action: "Post weekly leaderboard and celebrate top teams",            responsible: "HR" },
          { week: "Week 6",    action: "Award top team with recognition and small prizes",           responsible: "Manager" },
        ],
        kpis:          ["Participation rate", "Avg daily steps per participant", "Week-over-week improvement"],
        resources:     ["Step tracking app (free: Google Fit, Apple Health)", "Weekly email updates", "Small recognition budget"],
        evidenceBased: true,
        urgency:       "Low cost, high engagement — can start immediately.",
      },
    ];
  }

  private fallbackInterventions(): AiInterventionTip[] {
    return [
      { title: "Add Water Stations",         body: "Hydration reduces blood pressure and blood sugar. Most offices are chronically under-hydrated.",                          iconName: "Droplets",       category: "environment",  actionable: "Place a water dispenser in every common area this week." },
      { title: "Walking Meeting Policy",     body: "Replacing one seated meeting with a walking meeting adds 20+ minutes of activity effortlessly.",                         iconName: "PersonStanding", category: "behaviour",    actionable: "Announce a walking meetings policy for 1-on-1 calls starting Monday." },
      { title: "Remove Sugary Vending",      body: "Workplace food environments shape dietary patterns. Replacing sugary options reduces daily glucose spikes.",              iconName: "Salad",          category: "environment",  actionable: "Contact your vending supplier to replace 50% of sugary snacks with healthier options." },
      { title: "Stress Check-In Template",   body: "Chronic workplace stress raises cortisol, which directly raises blood sugar and blood pressure over time.",               iconName: "Brain",          category: "mental_health", actionable: "Add a 2-minute stress check-in question to every weekly team standup." },
      { title: "Salt-Free Lunch Day",        body: "Designating one day per week as low-sodium raises awareness and builds habit without feeling restrictive.",               iconName: "Apple",          category: "nutrition",    actionable: "Coordinate with your kitchen or caterer to run a low-salt Friday lunch this week." },
      { title: "Health Champion Program",    body: "Peer influence is more powerful than top-down mandates. Empowering volunteer champions drives organic adoption.",         iconName: "Trophy",         category: "behaviour",    actionable: "Send an email today asking for 2-3 volunteer health champions per department." },
    ];
  }

  private fallbackEngagement(): AiEngagementStrategy[] {
    return [
      {
        title:    "Team Health Challenges",
        why:      "Social accountability and friendly competition dramatically increase participation rates.",
        how:      ["Create department-level teams", "Post weekly leaderboards", "Celebrate wins publicly"],
        metric:   "% of team completing monthly health check-in",
        iconName: "Trophy",
      },
      {
        title:    "Manager Health Pledges",
        why:      "When managers model health behaviours, employees are 3x more likely to participate.",
        how:      ["Ask managers to complete assessments first", "Share manager commitments in team meetings", "Hold monthly manager health huddles"],
        metric:   "Manager assessment completion rate",
        iconName: "Users",
      },
    ];
  }
}

export const employerProgramsAiService = new EmployerProgramsAiService();
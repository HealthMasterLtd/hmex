/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * employerProgramsAiService.ts
 *
 * Groq-powered AI service for employer health program suggestions.
 * Uses real workforce analytics to generate tailored program recommendations,
 * intervention strategies, and employee engagement tips.
 */

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY!;
const MODEL = "llama-3.3-70b-versatile";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface WorkforceSnapshot {
  companyName:         string;
  industry:            string;
  totalEmployees:      number;
  activeEmployees:     number;
  assessedEmployees:   number;
  assessmentRate:      number;      // %
  avgDiabetesScore:    number;      // 0-100
  avgHypertensionScore: number;     // 0-100
  diabetesBreakdown:   { low: number; medium: number; high: number; none: number };
  hypertensionBreakdown: { low: number; medium: number; high: number; none: number };
  highRiskCount:       number;
  genderBreakdown:     Record<string, number>;
  ageBreakdown:        Record<string, number>;
  bmiBreakdown:        Record<string, number>;
}

export type ProgramCategory =
  | "screening"
  | "fitness"
  | "nutrition"
  | "education"
  | "mental_health"
  | "chronic_disease"
  | "preventive";

export type ProgramPriority = "critical" | "high" | "medium" | "low";

export interface AiProgramSuggestion {
  id:          string;
  title:       string;
  tagline:     string;
  description: string;
  category:    ProgramCategory;
  priority:    ProgramPriority;
  icon:        string;
  color:       string;
  targetGroup: string;          // e.g. "High-risk employees (diabetes)"
  estimatedImpact: string;      // e.g. "Could reduce high-risk count by ~30%"
  duration:    string;          // e.g. "8 weeks"
  steps: {
    week:        string;
    action:      string;
    responsible: string;        // "HR" | "Manager" | "Health Coach" | "Employee"
  }[];
  kpis: string[];               // key metrics to track
  resources:   string[];        // what you need to run this
  evidenceBased: boolean;
  urgency:     string;          // why now
}

export interface AiInterventionTip {
  title:       string;
  body:        string;
  icon:        string;
  category:    string;
  actionable:  string;          // one-line "do this today"
}

export interface AiEngagementStrategy {
  title:    string;
  why:      string;
  how:      string[];
  metric:   string;
  icon:     string;
}

export interface ProgramsAiResponse {
  headline:      string;         // 1-line overall summary
  urgentMessage: string | null;  // shown if high-risk count is significant
  programs:      AiProgramSuggestion[];
  interventions: AiInterventionTip[];
  engagement:    AiEngagementStrategy[];
  generatedAt:   string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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

async function callGroq(systemPrompt: string, userPrompt: string, maxTokens = 3200): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// ─── MAIN SERVICE ─────────────────────────────────────────────────────────────

class EmployerProgramsAiService {

  /**
   * Generate complete AI analysis: program suggestions + interventions + engagement
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

    const headline = this.buildHeadline(snapshot);

    return { headline, urgentMessage, programs, interventions, engagement, generatedAt: new Date().toISOString() };
  }

  // ─── PROGRAM SUGGESTIONS ────────────────────────────────────────────────────

  async suggestPrograms(snapshot: WorkforceSnapshot): Promise<AiProgramSuggestion[]> {
    const prompt = `
You are an occupational health strategist helping employers design effective workforce health programs.

WORKFORCE DATA:
${safe(snapshot)}

TASK: Generate exactly 5 highly specific, evidence-based health program recommendations for this workforce.
Base them on the actual risk distribution above.

Rules:
- Programs must directly address the dominant risk factors in this workforce
- Steps must be concrete and actionable — not vague advice
- If high-risk count > 0, at least 2 programs must address those employees specifically
- If assessment rate < 60%, include one program to boost participation
- Use realistic durations (4-12 weeks for interventions, ongoing for screenings)
- Prioritise programs by clinical urgency and estimated impact
- Each program must have exactly 4-6 implementation steps
- steps.responsible must be one of: "HR", "Health Coach", "Manager", "Employee", "Medical Team"
- Colors must be valid hex codes — use: #2563eb, #0d9488, #10B981, #F59E0B, #EF4444, #8B5CF6, #EC4899, #0EA5E9
- icons must be single emoji

Respond ONLY with a valid JSON array of 5 program objects:
[
  {
    "id": "prog_1",
    "title": "Program Name",
    "tagline": "Short hook (max 8 words)",
    "description": "2-3 sentences explaining the program and its clinical rationale for this specific workforce.",
    "category": "screening|fitness|nutrition|education|mental_health|chronic_disease|preventive",
    "priority": "critical|high|medium|low",
    "icon": "🩺",
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
      const raw = await callGroq(
        "You output ONLY valid JSON arrays. No markdown, no explanation, no backticks.",
        prompt,
        3600
      );
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
    const dHigh = snapshot.diabetesBreakdown.high;
    const hHigh = snapshot.hypertensionBreakdown.high;
    const avgD  = snapshot.avgDiabetesScore;
    const avgH  = snapshot.avgHypertensionScore;

    const prompt = `
You are an occupational health coach. The employer needs 6 quick intervention tips for their managers and HR team.

WORKFORCE CONTEXT:
- Company: ${snapshot.companyName} (${snapshot.industry})
- ${snapshot.activeEmployees} active employees, ${snapshot.assessedEmployees} assessed
- High diabetes risk: ${dHigh} employees | Avg diabetes score: ${avgD}/100
- High hypertension risk: ${hHigh} employees | Avg hypertension score: ${avgH}/100
- Assessment completion: ${snapshot.assessmentRate}%

Generate 6 intervention tips that managers/HR can act on immediately.
Each tip should be specific to the risk data above.
Mix categories: workplace changes, manager behaviours, environmental nudges, policy tweaks.

Respond ONLY with a valid JSON array:
[
  {
    "title": "Short title (4-5 words)",
    "body": "2-sentence explanation of why this works clinically for this specific workforce.",
    "icon": "single emoji",
    "category": "environment|policy|behaviour|nutrition|movement|mental_health",
    "actionable": "One specific sentence: what the manager/HR does TODAY."
  }
]`;

    try {
      const raw = await callGroq(
        "You output ONLY valid JSON arrays. No markdown, no explanation.",
        prompt,
        1800
      );
      return parseJson<AiInterventionTip[]>(raw, this.fallbackInterventions());
    } catch {
      return this.fallbackInterventions();
    }
  }

  // ─── ENGAGEMENT STRATEGIES ──────────────────────────────────────────────────

  async generateEngagementStrategies(snapshot: WorkforceSnapshot): Promise<AiEngagementStrategy[]> {
    const rate = snapshot.assessmentRate;
    const prompt = `
You are a workforce engagement specialist. Current health assessment participation: ${rate}%.
Company: ${snapshot.companyName}, Industry: ${snapshot.industry}, ${snapshot.activeEmployees} active employees.

Generate 4 creative, practical engagement strategies to improve health program participation and assessment completion.
These should be tailored to a ${snapshot.industry} company with ${snapshot.activeEmployees} employees.

Respond ONLY with a valid JSON array:
[
  {
    "title": "Strategy name (3-5 words)",
    "why": "1 sentence — why this works psychologically for this type of workforce.",
    "how": ["Step 1", "Step 2", "Step 3"],
    "metric": "How to measure success (one KPI)",
    "icon": "single emoji"
  }
]`;

    try {
      const raw = await callGroq(
        "You output ONLY valid JSON arrays. No markdown, no explanation.",
        prompt,
        1400
      );
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

Answer in 2-4 concise paragraphs. Be specific to their actual data. Be practical and evidence-based.
Do not use generic advice — reference their actual numbers (e.g. "${snapshot.highRiskCount} high-risk employees").`;

    try {
      return await callGroq(
        "You are a helpful, concise occupational health expert. Respond in plain English.",
        prompt,
        800
      );
    } catch {
      return "Unable to generate AI response. Please check your connection and try again.";
    }
  }

  // ─── HEADLINE ────────────────────────────────────────────────────────────────

  private buildHeadline(s: WorkforceSnapshot): string {
    if (s.assessedEmployees === 0) return `${s.totalEmployees} employees invited — start with a health assessment drive to unlock insights.`;
    const rate = s.assessmentRate;
    const dH = s.diabetesBreakdown.high;
    const hH = s.hypertensionBreakdown.high;
    if (dH > 0 || hH > 0) return `${s.highRiskCount} high-risk employees identified across ${s.companyName} — targeted intervention recommended now.`;
    if (rate < 50) return `Only ${rate}% of employees assessed — boosting participation will unlock fuller insights.`;
    return `${s.assessedEmployees} employees assessed · avg diabetes score ${s.avgDiabetesScore} · avg BP score ${s.avgHypertensionScore}. Your workforce health baseline is set.`;
  }

  // ─── FALLBACKS ────────────────────────────────────────────────────────────────

  private fallbackPrograms(s: WorkforceSnapshot): AiProgramSuggestion[] {
    return [
      {
        id: "prog_fallback_1",
        title: "Workplace Blood Pressure & Glucose Screening",
        tagline: "Know your numbers, protect your future",
        description: `With ${s.hypertensionBreakdown.high + s.diabetesBreakdown.high} employees at high risk, on-site screening enables early intervention before serious complications develop.`,
        category: "screening",
        priority: "critical",
        icon: "🩺",
        color: "#EF4444",
        targetGroup: "All active employees, priority to high-risk",
        estimatedImpact: "Identify undiagnosed conditions in ~15% of workforce",
        duration: "2 weeks",
        steps: [
          { week: "Week 1", action: "Partner with a local clinic or mobile health unit for on-site screening", responsible: "HR" },
          { week: "Week 1", action: "Communicate screening dates via email, team meetings, and posters", responsible: "Manager" },
          { week: "Week 2", action: "Run 2-hour screening slots across all departments", responsible: "Medical Team" },
          { week: "Week 2", action: "Follow up with high-risk employees with referral letters", responsible: "Health Coach" },
        ],
        kpis: ["% employees screened", "New diagnoses identified", "Referrals completed"],
        resources: ["Mobile health unit or clinic partner", "Private screening space", "Referral pathway to local hospital"],
        evidenceBased: true,
        urgency: "Early detection reduces treatment costs and prevents serious complications.",
      },
      {
        id: "prog_fallback_2",
        title: "10,000 Steps Workplace Challenge",
        tagline: "Move more, risk less — together",
        description: "Physical inactivity is a top modifiable risk factor for both diabetes and hypertension. A team steps challenge creates accountability and makes movement social.",
        category: "fitness",
        priority: "high",
        icon: "🚶",
        color: "#10B981",
        targetGroup: "All employees, especially sedentary desk workers",
        estimatedImpact: "Regular walking can reduce diabetes risk by up to 30%",
        duration: "6 weeks",
        steps: [
          { week: "Week 1", action: "Launch challenge via company email with team sign-up form", responsible: "HR" },
          { week: "Week 1", action: "Create department teams for friendly competition", responsible: "Manager" },
          { week: "Weeks 2-5", action: "Post weekly leaderboard and celebrate top teams", responsible: "HR" },
          { week: "Week 6", action: "Award top team with recognition and small prizes", responsible: "Manager" },
        ],
        kpis: ["Participation rate", "Avg daily steps per participant", "Week-over-week improvement"],
        resources: ["Step tracking app (free options: Google Fit, Apple Health)", "Weekly email updates", "Small recognition budget"],
        evidenceBased: true,
        urgency: "Low cost, high engagement — can start immediately.",
      },
    ];
  }

  private fallbackInterventions(): AiInterventionTip[] {
    return [
      {
        title: "Add Water Stations",
        body: "Hydration reduces blood pressure and blood sugar. Most offices are chronically under-hydrated.",
        icon: "💧",
        category: "environment",
        actionable: "Place a water dispenser or large pitcher in every common area this week.",
      },
      {
        title: "Walking Meeting Policy",
        body: "Replacing one seated meeting per day with a walking meeting adds 20+ minutes of physical activity effortlessly.",
        icon: "🚶",
        category: "behaviour",
        actionable: "Announce a 'walking meetings encouraged' policy for 1-on-1 calls starting Monday.",
      },
      {
        title: "Remove Sugary Vending",
        body: "Workplace food environments directly shape employee dietary patterns. Replacing sugary options reduces daily glucose spikes.",
        icon: "🥗",
        category: "environment",
        actionable: "Contact your catering/vending supplier to replace at least 50% of sugary snacks with nuts, fruit, or seeds.",
      },
      {
        title: "Stress Check-In Template",
        body: "Chronic workplace stress elevates cortisol, which directly raises blood sugar and blood pressure over time.",
        icon: "🧠",
        category: "mental_health",
        actionable: "Add a 2-minute 'stress check-in' question to every weekly team standup meeting.",
      },
      {
        title: "Salt-Free Lunch Day",
        body: "Designating one day per week as low-sodium raises awareness and builds habit without feeling restrictive.",
        icon: "🧂",
        category: "nutrition",
        actionable: "Coordinate with the office kitchen or caterer to run a low-salt Friday lunch this week.",
      },
      {
        title: "Health Champion Program",
        body: "Peer influence is more powerful than top-down mandates. Empowering volunteer champions drives organic adoption.",
        icon: "🏆",
        category: "behaviour",
        actionable: "Send an email today asking for 2-3 volunteer health champions per department.",
      },
    ];
  }

  private fallbackEngagement(): AiEngagementStrategy[] {
    return [
      {
        title: "Team Health Challenges",
        why: "Social accountability and friendly competition dramatically increase participation rates.",
        how: ["Create department-level teams", "Post weekly leaderboards", "Celebrate wins publicly"],
        metric: "% of team completing monthly health check-in",
        icon: "🏆",
      },
      {
        title: "Manager Health Pledges",
        why: "When managers model health behaviours, employees are 3x more likely to participate.",
        how: ["Ask managers to complete assessments first", "Share manager commitments in team meetings", "Hold monthly manager health huddles"],
        metric: "Manager assessment completion rate",
        icon: "👔",
      },
    ];
  }
}

export const employerProgramsAiService = new EmployerProgramsAiService();
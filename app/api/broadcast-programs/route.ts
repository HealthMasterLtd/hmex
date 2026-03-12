/**
 * /app/api/broadcast-programs/route.ts
 *
 * Broadcasts AI-generated wellness programs to the right employees
 * based on their assessed risk levels. The employer never sees which
 * specific employee has which risk — routing happens entirely server-side.
 *
 * Flow:
 *   1. Employer clicks "Send to Team" on a program card
 *   2. POST /api/broadcast-programs with { companyId, sentBy, program }
 *   3. Route fetches all active company members
 *   4. For each member with a userId, fetches their latest assessment
 *   5. Infers targetRisk from program content
 *   6. Matches employee risk to targetRisk
 *   7. Creates team_programs record + program_enrollments per employee
 *      (now storing full plan: steps, kpis, resources, etc.)
 *   8. Fires employee notification per recipient
 *   9. Returns { sent: N, skipped: N } — employer never sees who got what
 */

import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY    = process.env.APPWRITE_API_KEY!;

const DB_ID                         = "hmex_db";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const ASSESSMENTS_COLLECTION_ID     = "Assessments";
const TEAM_PROGRAMS_COLLECTION_ID   = "team_programs";
const ENROLLMENTS_COLLECTION_ID     = "program_enrollments";
const NOTIFICATIONS_COLLECTION_ID   = "notifications";

const serverClient = new Client()
  .setEndpoint(ENDPOINT.replace(/\/$/, ""))
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const db = new Databases(serverClient);

// ─── TYPES ────────────────────────────────────────────────────────────────────

type TargetRisk =
  | "high_diabetes"
  | "high_hypertension"
  | "high_any"
  | "moderate"
  | "all";

interface ProgramStep {
  week:        string;
  action:      string;
  responsible: string;
}

interface IncomingProgram {
  id:              string;   // AI program ref e.g. "prog_1"
  title:           string;
  description:     string;
  category:        string;
  priority:        string;
  tagline?:        string;
  targetGroup?:    string;
  estimatedImpact?: string;
  duration?:       string;
  urgency?:        string;
  iconName?:       string;
  color?:          string;
  steps?:          ProgramStep[];
  kpis?:           string[];
  resources?:      string[];
  evidenceBased?:  boolean;
}

interface BroadcastRequest {
  companyId:   string;
  companyName: string;
  sentBy:      string;  // employer userId
  program:     IncomingProgram;
}

// ─── RISK INFERENCE ───────────────────────────────────────────────────────────

function inferTargetRisk(program: IncomingProgram): TargetRisk {
  const haystack = [
    program.title,
    program.description,
    program.tagline    ?? "",
    program.targetGroup ?? "",
    program.category,
  ]
    .join(" ")
    .toLowerCase();

  const diabetesKeywords     = ["diabetes", "glucose", "blood sugar", "insulin", "glycaemic", "glycemic", "hba1c", "hyperglycaemi", "prediabet"];
  const hypertensionKeywords = ["hypertension", "blood pressure", "bp ", "cardiovascular", "systolic", "diastolic", "stroke risk", "heart disease", "sodium", "salt intake"];
  const moderateKeywords     = ["moderate risk", "moderate-risk", "lifestyle change", "early intervention", "moderate"];

  const matchesDiabetes     = diabetesKeywords.some(k    => haystack.includes(k));
  const matchesHypertension = hypertensionKeywords.some(k => haystack.includes(k));
  const matchesModerate     = moderateKeywords.some(k    => haystack.includes(k));

  if (matchesDiabetes && matchesHypertension) return "high_any";
  if (matchesDiabetes)     return "high_diabetes";
  if (matchesHypertension) return "high_hypertension";

  if ((program.priority === "critical" || program.priority === "high") && !matchesModerate) {
    return "high_any";
  }

  if (matchesModerate) return "moderate";

  const universalCategories = ["screening", "preventive", "fitness", "nutrition", "education", "mental_health"];
  if (universalCategories.includes(program.category)) return "all";

  return "all";
}

// ─── EMPLOYEE RISK MATCHING ───────────────────────────────────────────────────

function employeeMatchesRisk(
  targetRisk:        TargetRisk,
  diabetesLevel:     string,
  hypertensionLevel: string
): boolean {
  const dHigh = diabetesLevel    === "high" || diabetesLevel    === "very-high";
  const hHigh = hypertensionLevel === "high" || hypertensionLevel === "very-high";
  const dMod  = diabetesLevel    === "medium" || diabetesLevel    === "moderate";
  const hMod  = hypertensionLevel === "medium" || hypertensionLevel === "moderate";

  switch (targetRisk) {
    case "high_diabetes":     return dHigh;
    case "high_hypertension": return hHigh;
    case "high_any":          return dHigh || hHigh;
    case "moderate":          return (dMod || hMod) && !dHigh && !hHigh;
    case "all":               return true;
    default:                  return true;
  }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as BroadcastRequest;
    const { companyId, companyName, sentBy, program } = body;

    if (!companyId || !sentBy || !program?.id || !program?.title) {
      return NextResponse.json(
        { error: "companyId, sentBy, and program (id, title) are required." },
        { status: 400 }
      );
    }

    // ── Check: has this exact program already been broadcast? ────────────────
    const existing = await db.listDocuments(DB_ID, TEAM_PROGRAMS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.equal("programRef", program.id),
      Query.limit(1),
    ]).catch(() => null);

    if (existing && existing.documents.length > 0) {
      return NextResponse.json(
        { error: "This program has already been sent to your team." },
        { status: 409 }
      );
    }

    // ── Infer target risk from program content ───────────────────────────────
    const targetRisk = inferTargetRisk(program);
    console.log(`[broadcast-programs] program "${program.title}" → targetRisk: ${targetRisk}`);

    // ── Serialize full plan data for storage ─────────────────────────────────
    // We store steps, kpis, resources as JSON strings so they survive in Appwrite
    const stepsJson     = JSON.stringify(program.steps     || []);
    const kpisJson      = JSON.stringify(program.kpis      || []);
    const resourcesJson = JSON.stringify(program.resources || []);

    // ── Create team_programs record ──────────────────────────────────────────
    const teamProgramDoc = await db.createDocument(
      DB_ID, TEAM_PROGRAMS_COLLECTION_ID, ID.unique(),
      {
        companyId,
        programTitle:    program.title,
        programDesc:     program.description,
        programCategory: program.category,
        programPriority: program.priority,
        programRef:      program.id,
        targetRisk,
        sentAt:          new Date().toISOString(),
        sentBy,
        enrolledCount:   0,
      }
    );

    const teamProgramId = teamProgramDoc.$id;

    // ── Fetch all active company members ─────────────────────────────────────
    const membersRes = await db.listDocuments(DB_ID, COMPANY_MEMBERS_COLLECTION_ID, [
      Query.equal("companyId", companyId),
      Query.equal("status", "active"),
      Query.limit(500),
    ]).catch(() => null);

    if (!membersRes || membersRes.documents.length === 0) {
      return NextResponse.json({ success: true, sent: 0, skipped: 0, targetRisk });
    }

    const members = membersRes.documents.filter(m => !!m.userId);

    let sent    = 0;
    let skipped = 0;

    // ── Process each member ──────────────────────────────────────────────────
    await Promise.allSettled(
      members.map(async (member) => {
        const userId = member.userId as string;

        try {
          let diabetesLevel    = "low";
          let hypertensionLevel = "low";

          if (targetRisk !== "all") {
            const assessRes = await db.listDocuments(DB_ID, ASSESSMENTS_COLLECTION_ID, [
              Query.equal("userId", userId),
              Query.orderDesc("$createdAt"),
              Query.limit(1),
            ]).catch(() => null);

            if (!assessRes || assessRes.documents.length === 0) {
              skipped++;
              return;
            }

            const assessment  = assessRes.documents[0];
            diabetesLevel     = ((assessment.diabetesLevel    as string) || "low").toLowerCase();
            hypertensionLevel = ((assessment.hypertensionLevel as string) || "low").toLowerCase();
          }

          if (!employeeMatchesRisk(targetRisk, diabetesLevel, hypertensionLevel)) {
            skipped++;
            return;
          }

          // Check: already enrolled?
          const enrolledCheck = await db.listDocuments(DB_ID, ENROLLMENTS_COLLECTION_ID, [
            Query.equal("programId", teamProgramId),
            Query.equal("userId", userId),
            Query.limit(1),
          ]).catch(() => null);

          if (enrolledCheck && enrolledCheck.documents.length > 0) {
            skipped++;
            return;
          }

          // ── Create enrollment record with full plan data ───────────────────
          // IMPORTANT: Your Appwrite `program_enrollments` collection needs these
          // additional string attributes added:
          //   programTagline    (string, optional, size 500)
          //   programTargetGroup (string, optional, size 500)
          //   programImpact     (string, optional, size 500)
          //   programDuration   (string, optional, size 100)
          //   programUrgency    (string, optional, size 500)
          //   programIconName   (string, optional, size 100)
          //   programColor      (string, optional, size 20)
          //   programSteps      (string, optional, size 5000)  ← JSON
          //   programKpis       (string, optional, size 2000)  ← JSON
          //   programResources  (string, optional, size 2000)  ← JSON
          //   evidenceBased     (boolean, optional)
          //
          // If these attributes don't exist yet, add them in Appwrite console
          // before deploying this route.

          await db.createDocument(DB_ID, ENROLLMENTS_COLLECTION_ID, ID.unique(), {
            programId:         teamProgramId,
            companyId,
            userId,
            programTitle:      program.title,
            programDesc:       program.description,
            programCategory:   program.category,
            programPriority:   program.priority,
            targetRisk,
            enrolledAt:        new Date().toISOString(),
            status:            "active",
            // ── Full plan fields ────────────────────────────────────────────
            programTagline:    program.tagline     || "",
            programTargetGroup: program.targetGroup || "",
            programImpact:     program.estimatedImpact || "",
            programDuration:   program.duration    || "",
            programUrgency:    program.urgency      || "",
            programIconName:   program.iconName     || "Sparkles",
            programColor:      program.color        || "#0d9488",
            programSteps:      stepsJson,
            programKpis:       kpisJson,
            programResources:  resourcesJson,
            evidenceBased:     program.evidenceBased ?? true,
          });

          // ── Fire in-app notification to employee ───────────────────────────
          await db.createDocument(DB_ID, NOTIFICATIONS_COLLECTION_ID, ID.unique(), {
            userId,
            type:        "program_broadcast",
            title:       `New wellness program from ${companyName}`,
            message:     `${companyName} has shared a wellness program with you: "${program.title}". View it in My Teams.`,
            isRead:      false,
            priority:    program.priority === "critical" ? "high" : "medium",
            category:    "program",
            actionUrl:   "/dashboard/teams",
            actionLabel: "View Program",
            metadata:    JSON.stringify({ companyName, companyId, programTitle: program.title, programId: teamProgramId }),
            expiresAt:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          }).catch((e) =>
            console.error("[broadcast-programs] notification failed for", userId, e)
          );

          sent++;

          await db.updateDocument(DB_ID, TEAM_PROGRAMS_COLLECTION_ID, teamProgramId, {
            enrolledCount: sent,
          }).catch(() => {});

        } catch (e) {
          console.error("[broadcast-programs] error processing member", userId, e);
          skipped++;
        }
      })
    );

    console.log(`[broadcast-programs] done — sent: ${sent}, skipped: ${skipped}, targetRisk: ${targetRisk}`);

    return NextResponse.json({
      success:   true,
      sent,
      skipped,
      targetRisk,
      programId: teamProgramId,
    });

  } catch (err: unknown) {
    console.error("[broadcast-programs] Error:", err);
    const message = err instanceof Error ? err.message : "Broadcast failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
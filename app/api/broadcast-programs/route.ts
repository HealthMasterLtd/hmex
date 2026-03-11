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

interface IncomingProgram {
  id:          string;   // AI program ref e.g. "prog_1"
  title:       string;
  description: string;
  category:    string;
  priority:    string;
  tagline?:    string;
  targetGroup?: string;
}

interface BroadcastRequest {
  companyId:   string;
  companyName: string;
  sentBy:      string;  // employer userId
  program:     IncomingProgram;
}

// ─── RISK INFERENCE ───────────────────────────────────────────────────────────
// Reads program content and returns the appropriate targetRisk tag.
// No ML needed — keyword matching on title + description + targetGroup is
// reliable enough because the AI prompts use consistent terminology.

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

  const diabetesKeywords    = ["diabetes", "glucose", "blood sugar", "insulin", "glycaemic", "glycemic", "hba1c", "hyperglycaemi", "prediabet"];
  const hypertensionKeywords = ["hypertension", "blood pressure", "bp ", "cardiovascular", "systolic", "diastolic", "stroke risk", "heart disease", "sodium", "salt intake"];
  const moderateKeywords    = ["moderate risk", "moderate-risk", "lifestyle change", "early intervention", "moderate"];

  const matchesDiabetes    = diabetesKeywords.some(k    => haystack.includes(k));
  const matchesHypertension = hypertensionKeywords.some(k => haystack.includes(k));
  const matchesModerate    = moderateKeywords.some(k    => haystack.includes(k));

  // Both conditions mentioned → high_any (anyone with any high risk gets it)
  if (matchesDiabetes && matchesHypertension) return "high_any";
  if (matchesDiabetes)    return "high_diabetes";
  if (matchesHypertension) return "high_hypertension";

  // Critical/high priority programs with no specific condition → high_any
  if ((program.priority === "critical" || program.priority === "high") && !matchesModerate) {
    return "high_any";
  }

  if (matchesModerate) return "moderate";

  // Screening, preventive, fitness, nutrition → send to everyone
  const universalCategories = ["screening", "preventive", "fitness", "nutrition", "education", "mental_health"];
  if (universalCategories.includes(program.category)) return "all";

  // Safe default
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
    case "high_diabetes":    return dHigh;
    case "high_hypertension": return hHigh;
    case "high_any":         return dHigh || hHigh;
    case "moderate":         return (dMod || hMod) && !dHigh && !hHigh;
    case "all":              return true;
    default:                 return true;
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
          // If targetRisk is "all", skip assessment lookup
          let diabetesLevel    = "low";
          let hypertensionLevel = "low";

          if (targetRisk !== "all") {
            // Fetch latest assessment for this employee
            const assessRes = await db.listDocuments(DB_ID, ASSESSMENTS_COLLECTION_ID, [
              Query.equal("userId", userId),
              Query.orderDesc("$createdAt"),
              Query.limit(1),
            ]).catch(() => null);

            if (!assessRes || assessRes.documents.length === 0) {
              // No assessment → skip for risk-targeted programs
              skipped++;
              return;
            }

            const assessment = assessRes.documents[0];
            diabetesLevel    = ((assessment.diabetesLevel    as string) || "low").toLowerCase();
            hypertensionLevel = ((assessment.hypertensionLevel as string) || "low").toLowerCase();
          }

          // Check if employee's risk matches the target
          if (!employeeMatchesRisk(targetRisk, diabetesLevel, hypertensionLevel)) {
            skipped++;
            return;
          }

          // Check: already enrolled in this team program?
          const enrolledCheck = await db.listDocuments(DB_ID, ENROLLMENTS_COLLECTION_ID, [
            Query.equal("programId", teamProgramId),
            Query.equal("userId", userId),
            Query.limit(1),
          ]).catch(() => null);

          if (enrolledCheck && enrolledCheck.documents.length > 0) {
            skipped++;
            return;
          }

          // ── Create enrollment record ───────────────────────────────────────
          await db.createDocument(DB_ID, ENROLLMENTS_COLLECTION_ID, ID.unique(), {
            programId:       teamProgramId,
            companyId,
            userId,
            programTitle:    program.title,
            programDesc:     program.description,
            programCategory: program.category,
            programPriority: program.priority,
            targetRisk,
            enrolledAt:      new Date().toISOString(),
            status:          "active",
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

          // ── Increment enrolledCount on team_programs ───────────────────────
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
      success:    true,
      sent,
      skipped,
      targetRisk, // returned so UI can show "sent to high-risk employees" etc without leaking who
      programId:  teamProgramId,
    });

  } catch (err: unknown) {
    console.error("[broadcast-programs] Error:", err);
    const message = err instanceof Error ? err.message : "Broadcast failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
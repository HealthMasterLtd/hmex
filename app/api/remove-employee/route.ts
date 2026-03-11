// app/api/remove-employee/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID, Query } from "node-appwrite";

const USERS_DB_ID                   = "hmex_db";
const USERS_COLLECTION_ID           = "users";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const EMPLOYER_NOTIF_COLLECTION_ID  = "employer_notifications";
const EMPLOYEE_NOTIF_COLLECTION_ID  = "notifications";

const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/\/$/, ""))
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const db = new Databases(serverClient);

export async function POST(req: NextRequest) {
  try {
    const { memberId, userId, employerId, companyId } = await req.json();

    if (!memberId || !employerId || !companyId) {
      return NextResponse.json(
        { error: "memberId, employerId, companyId required." },
        { status: 400 }
      );
    }

    // ── Grab details before removing ─────────────────────────────────────────
    let employeeName = "An employee";
    let companyName  = "";

    if (userId) {
      const profile = await db.getDocument(
        USERS_DB_ID, USERS_COLLECTION_ID, userId
      ).catch(() => null);
      if (profile) {
        employeeName = (profile.fullName as string) || (profile.email as string) || employeeName;
        companyName  = (profile.companyName as string) || "";
      }
    }

    // Also try to get companyName from the member record if profile didn't have it
    if (!companyName) {
      const memberDoc = await db.getDocument(
        USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId
      ).catch(() => null);
      companyName = (memberDoc?.companyName as string) || "";
    }

    // ── Mark member as removed ───────────────────────────────────────────────
    await db.updateDocument(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, memberId,
      { status: "removed" }
    );

    // ── Unlink user profile from company ─────────────────────────────────────
    if (userId) {
      await db.updateDocument(
        USERS_DB_ID, USERS_COLLECTION_ID, userId,
        { companyId: "", companyName: "" }
      ).catch((e) => console.error("[remove-employee] profile unlink failed:", e));
    }

    // ── Count remaining active members ───────────────────────────────────────
    const activeRes = await db.listDocuments(
      USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
      [
        Query.equal("companyId", companyId),
        Query.equal("status", "active"),
        Query.limit(100),
      ]
    ).catch(() => null);
    const totalActive = activeRes ? activeRes.documents.length : 0;

    // ── Notify EMPLOYER ───────────────────────────────────────────────────────
    await db.createDocument(
      USERS_DB_ID,
      EMPLOYER_NOTIF_COLLECTION_ID,
      ID.unique(),
      {
        companyId,
        employerId,
        type:        "employee_removed",
        title:       "Employee Removed",
        message:     `${employeeName} has been removed from your workforce. You now have ${totalActive} active employee${totalActive !== 1 ? "s" : ""}.`,
        isRead:      false,
        priority:    "low",
        category:    "employee_activity",
        actionUrl:   "/dashboard/employer/employees",
        actionLabel: "View Team",
        metadata:    JSON.stringify({ employeeName, totalActive }),
        expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ).catch((e) => console.error("[remove-employee] employer notification failed:", e));

    // ── Notify EMPLOYEE they were removed ─────────────────────────────────────
    if (userId) {
      await db.createDocument(
        USERS_DB_ID,
        EMPLOYEE_NOTIF_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          type:        "team_removed",
          title:       companyName
            ? `Removed from ${companyName}`
            : "Removed from a team",
          message:     companyName
            ? `You have been removed from ${companyName}'s workforce on HMEX. Your personal health data remains private and is not affected.`
            : "You have been removed from a company's workforce on HMEX. Your personal health data remains private and is not affected.",
          isRead:      false,
          priority:    "medium",
          category:    "team",
          actionUrl:   "/dashboard/teams",
          actionLabel: "View My Teams",
          metadata:    JSON.stringify({ companyName, companyId }),
          expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ).catch((e) => console.error("[remove-employee] employee notification failed:", e));
    }

    console.log("[remove-employee] removed member:", memberId, "notified employer:", employerId, userId ? `and employee: ${userId}` : "(no userId)");
    return NextResponse.json({ success: true });

  } catch (err: unknown) {
    console.error("[remove-employee] Error:", err);
    const message = err instanceof Error ? err.message : "Failed to remove employee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
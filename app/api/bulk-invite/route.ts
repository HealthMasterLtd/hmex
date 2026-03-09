// app/api/bulk-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, Query, ID } from "node-appwrite";

const USERS_DB_ID                   = "hmex_db";
const USERS_COLLECTION_ID           = "users";
const COMPANY_MEMBERS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COMPANY_MEMBERS_COLLECTION_ID!;
const COMPANIES_COLLECTION_ID       = process.env.NEXT_PUBLIC_APPWRITE_COMPANIES_COLLECTION_ID!;
const APP_URL                       = process.env.NEXT_PUBLIC_APP_URL || "https://hmex.vercel.app";

const serverClient = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/\/$/, ""))
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const serverDb = new Databases(serverClient);

export interface BulkInviteEntry {
  email: string;
  name?: string;
}

export interface BulkInviteResult {
  email:         string;
  name?:         string;
  result:        "added_active" | "added_pending" | "already_member" | "invalid_email" | "error";
  errorMessage?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { entries, companyId, companyName, invitedBy } = await req.json() as {
      entries:     BulkInviteEntry[];
      companyId:   string;
      companyName: string;
      invitedBy:   string;
    };

    if (!entries?.length || !companyId || !companyName || !invitedBy) {
      return NextResponse.json({ error: "entries, companyId, companyName, invitedBy are required." }, { status: 400 });
    }

    if (entries.length > 1000) {
      return NextResponse.json({ error: "Maximum 1000 employees per upload." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const results: BulkInviteResult[] = [];
    let addedActive  = 0;
    let addedPending = 0;
    let skipped      = 0;
    let errors       = 0;

    // ── Get or create a company-wide invite token ─────────────────────────────
    // This single token is shared with all bulk-invited employees.
    // When they click it and sign up, reconcile auto-activates them.
    let companyInviteToken: string;
    const companyDoc = await serverDb.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId).catch(() => null);

    if (companyDoc?.bulkInviteToken) {
      companyInviteToken = companyDoc.bulkInviteToken as string;
    } else {
      companyInviteToken = crypto.randomUUID();
      // Store on company doc if bulkInviteToken column exists — fail silently if not
      serverDb.updateDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId, {
        bulkInviteToken: companyInviteToken,
      }).catch(() => {});
    }

    const shareableLink = `${APP_URL}/register?company=${companyId}&ref=bulk`;

    // ── Process in batches of 50 to avoid Appwrite query limits ──────────────
    const BATCH = 50;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);

      await Promise.all(batch.map(async (entry) => {
        const email = entry.email?.toLowerCase().trim();
        const name  = entry.name?.trim() || undefined;

        // Validate email
        if (!email || !emailRegex.test(email)) {
          results.push({ email: entry.email || "", name, result: "invalid_email", errorMessage: "Invalid email format" });
          errors++;
          return;
        }

        try {
          // ── Already a member? ─────────────────────────────────────────────
          const existingMember = await serverDb.listDocuments(
            USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID,
            [Query.equal("companyId", companyId), Query.equal("email", email), Query.notEqual("status", "removed"), Query.limit(1)]
          ).catch(() => null);

          if (existingMember && existingMember.documents.length > 0) {
            results.push({ email, name, result: "already_member" });
            skipped++;
            return;
          }

          // ── Existing HMEX user? ───────────────────────────────────────────
          const existingUser = await serverDb.listDocuments(
            USERS_DB_ID, USERS_COLLECTION_ID,
            [Query.equal("email", email), Query.limit(1)]
          ).catch(() => null);

          const userDoc        = existingUser?.documents?.[0] ?? null;
          const isExistingUser = !!userDoc;
          const userId         = userDoc?.$id ?? null;
          const now            = new Date().toISOString();
          const status         = isExistingUser ? "active" : "pending";
          const acceptedAt     = isExistingUser ? now      : null;
          const inviteToken    = crypto.randomUUID(); // unique per member for individual tracking
          const docId          = crypto.randomUUID().replace(/-/g, "").slice(0, 20);

          await serverDb.createDocument(
            USERS_DB_ID, COMPANY_MEMBERS_COLLECTION_ID, docId,
            { companyId, companyName, email, userId, status, inviteToken, invitedAt: now, acceptedAt, invitedBy, resendMsgId: null }
          );

          // Link existing user's profile
          if (isExistingUser && userId) {
            await serverDb.updateDocument(USERS_DB_ID, USERS_COLLECTION_ID, userId, {
              companyId, companyName,
            }).catch((e) => console.error("[bulk-invite] profile link failed:", e));
            addedActive++;
            results.push({ email, name, result: "added_active" });
          } else {
            addedPending++;
            results.push({ email, name, result: "added_pending" });
          }
        } catch (e: any) {
          console.error("[bulk-invite] error for", email, e);
          results.push({ email, name, result: "error", errorMessage: e?.message || "Unknown error" });
          errors++;
        }
      }));
    }

    // Update invite count on company
    serverDb.getDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId)
      .then((co) => serverDb.updateDocument(USERS_DB_ID, COMPANIES_COLLECTION_ID, companyId, {
        inviteCount: ((co.inviteCount as number) || 0) + addedActive + addedPending,
      }))
      .catch(() => {});

    return NextResponse.json({
      success:      true,
      shareableLink,
      summary: { addedActive, addedPending, skipped, errors, total: entries.length },
      results,
    });

  } catch (err: any) {
    console.error("[bulk-invite API] Error:", err);
    return NextResponse.json({ error: err?.message || "Bulk invite failed." }, { status: 500 });
  }
}
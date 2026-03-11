/**
 * /app/api/employee-notify/route.ts
 *
 * Server-side endpoint for creating employee (user) notifications.
 * Uses APPWRITE_API_KEY to bypass collection permission rules.
 * Called by invite-employee and remove-employee routes, and any
 * future server-side flow that needs to notify an individual employee.
 */

import { NextRequest, NextResponse } from "next/server";
import { Client, Databases, ID } from "node-appwrite";

const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const API_KEY    = process.env.APPWRITE_API_KEY!;

const DB_ID         = "hmex_db";
const COLLECTION_ID = "notifications"; // employee notifications collection

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      type,
      title,
      message,
      priority,
      category,
      actionUrl,
      actionLabel,
      metadata,
      expiresAt,
    } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: "userId, type, title, and message are required" },
        { status: 400 }
      );
    }

    const client = new Client()
      .setEndpoint(ENDPOINT.replace(/\/$/, ""))
      .setProject(PROJECT_ID)
      .setKey(API_KEY);

    const db  = new Databases(client);
    const doc = await db.createDocument(DB_ID, COLLECTION_ID, ID.unique(), {
      userId,
      type,
      title,
      message,
      isRead:      false,
      priority:    priority    ?? "medium",
      category:    category    ?? "system",
      actionUrl:   actionUrl   ?? null,
      actionLabel: actionLabel ?? null,
      metadata:    metadata    ? JSON.stringify(metadata) : null,
      expiresAt:   expiresAt   ?? null,
    });

    console.log("[/api/employee-notify] Created notification:", doc.$id, "for user:", userId, "type:", type);
    return NextResponse.json({ success: true, id: doc.$id });
  } catch (e: unknown) {
    console.error("[/api/employee-notify] Error:", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
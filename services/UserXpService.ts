/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UserXpService.ts
 *
 * Handles user XP management in Appwrite.
 * Provides methods to add XP, get user XP stats, and update user XP records.
 */

import { Client, Databases, ID, Query } from "appwrite";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const XP_DB_ID         = "hmex_db";
export const XP_COLLECTION_ID = "user_xp";

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID);
const db     = new Databases(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface UserXpRecord {
  $id:             string;
  $createdAt:      string;
  $updatedAt:      string;
  userId:          string;
  totalXp:         number;
  assessmentsTaken: number;
  redeemedXp:      number;
  lastEarnedAt:    string;
}

// ─── GET USER XP ──────────────────────────────────────────────────────────────

/**
 * Fetch user's XP record. Creates one if it doesn't exist.
 */
export async function getUserXp(userId: string): Promise<UserXpRecord | null> {
  try {
    const res = await db.listDocuments(XP_DB_ID, XP_COLLECTION_ID, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);

    if (res.documents.length > 0) {
      return res.documents[0] as unknown as UserXpRecord;
    }

    // Create new record if doesn't exist
    const newRecord = await db.createDocument(
      XP_DB_ID,
      XP_COLLECTION_ID,
      ID.unique(),
      {
        userId,
        totalXp:          0,
        assessmentsTaken: 0,
        redeemedXp:       0,
        lastEarnedAt:     new Date().toISOString(),
      }
    );

    return newRecord as unknown as UserXpRecord;
  } catch (e) {
    console.error("[UserXpService] getUserXp error:", e);
    return null;
  }
}

// ─── ADD USER XP ──────────────────────────────────────────────────────────────

/**
 * Add XP to user's record.
 * Creates the record if it doesn't exist.
 *
 * @param userId User ID (can be string or object with .id property)
 * @param xpAmount Amount of XP to add
 * @returns Updated UserXpRecord or null on error
 */
export async function addUserXp(userId: string | { id: string }, xpAmount: number): Promise<UserXpRecord | null> {
  try {
    const uid = typeof userId === "string" ? userId : userId.id;
    const record = await getUserXp(uid);
    if (!record) return null;

    const updated = await db.updateDocument(
      XP_DB_ID,
      XP_COLLECTION_ID,
      record.$id,
      {
        totalXp:      record.totalXp + xpAmount,
        lastEarnedAt: new Date().toISOString(),
      }
    );

    console.log(`[UserXpService] Added ${xpAmount} XP to user ${uid}. New total: ${(updated as any).totalXp}`);
    return updated as unknown as UserXpRecord;
  } catch (e) {
    console.error("[UserXpService] addUserXp error:", e);
    return null;
  }
}

// ─── INCREMENT ASSESSMENTS ────────────────────────────────────────────────────

/**
 * Increment the assessmentsTaken counter when user completes an assessment.
 */
export async function incrementAssessmentCount(userId: string): Promise<UserXpRecord | null> {
  try {
    const record = await getUserXp(userId);
    if (!record) return null;

    const updated = await db.updateDocument(
      XP_DB_ID,
      XP_COLLECTION_ID,
      record.$id,
      {
        assessmentsTaken: record.assessmentsTaken + 1,
      }
    );

    return updated as unknown as UserXpRecord;
  } catch (e) {
    console.error("[UserXpService] incrementAssessmentCount error:", e);
    return null;
  }
}

// ─── REDEEM XP ────────────────────────────────────────────────────────────────

/**
 * Redeem (subtract) XP from user's balance.
 * Useful for rewards shop or premium features.
 */
export async function redeemXp(userId: string, xpAmount: number): Promise<UserXpRecord | null> {
  try {
    const record = await getUserXp(userId);
    if (!record || record.totalXp < xpAmount) return null;

    const updated = await db.updateDocument(
      XP_DB_ID,
      XP_COLLECTION_ID,
      record.$id,
      {
        totalXp:    record.totalXp - xpAmount,
        redeemedXp: record.redeemedXp + xpAmount,
      }
    );

    console.log(`[UserXpService] Redeemed ${xpAmount} XP for user ${userId}`);
    return updated as unknown as UserXpRecord;
  } catch (e) {
    console.error("[UserXpService] redeemXp error:", e);
    return null;
  }
}

// ─── GET LEADERBOARD ──────────────────────────────────────────────────────────

/**
 * Get top users by XP (for leaderboard/stats page)
 */
export async function getTopUsersByXp(limit: number = 10): Promise<UserXpRecord[]> {
  try {
    const res = await db.listDocuments(XP_DB_ID, XP_COLLECTION_ID, [
      Query.orderDesc("totalXp"),
      Query.limit(limit),
    ]);

    return res.documents as unknown as UserXpRecord[];
  } catch (e) {
    console.error("[UserXpService] getTopUsersByXp error:", e);
    return [];
  }
}

// ─── BATCH XP UPDATE ──────────────────────────────────────────────────────────

/**
 * Bulk add XP to multiple users (for admin/event rewards)
 */
export async function bulkAddXp(
  userIds: string[],
  xpAmount: number
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await addUserXp(userId, xpAmount);
    if (result) success++;
    else failed++;
  }

  console.log(`[UserXpService] Bulk XP added: ${success} success, ${failed} failed`);
  return { success, failed };
}
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * UserService.ts
 *
 * Handles user profile data management in Appwrite.
 * Provides methods to create, fetch, and update user profiles.
 * Integrates with profile image bucket for avatar uploads.
 *
 * NOTE: Appwrite stores arrays as string arrays (notifications[])
 * We store JSON as strings and parse/stringify on the fly.
 */

import { Client, Databases, Storage, ID, Query } from "appwrite";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const USERS_DB_ID         = "hmex_db";
export const USERS_COLLECTION_ID = "users";
export const PROFILES_BUCKET_ID  = "profile_images";

// Remove trailing slash from endpoint if present
const cleanEndpoint = ENDPOINT.replace(/\/$/, "");
const client  = new Client().setEndpoint(cleanEndpoint).setProject(PROJECT_ID);
const db      = new Databases(client);
const storage = new Storage(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "employer";

export interface UserProfile {
  $id:            string;
  $createdAt:     string;
  $updatedAt:     string;
  userId:         string;
  fullName:       string;
  email:          string;
  role:           UserRole;
  avatar:         string | null;
  bio:            string;
  location:       string;
  dateOfBirth:    string | null;
  gender:         string;
  phone:          string;
  occupation:     string;
  // user-only fields (employers will have empty strings for these)
  healthGoals:    string;
  medicalHistory: string;
  // employer-only fields
  companyName:    string;
  companySize:    string;
  industry:       string;
  // company link (set when user joins a company)
  companyId:      string;
  notifications:  {
    email: boolean;
    push:  boolean;
    sms:   boolean;
  };
  preferences: {
    theme:    "light" | "dark" | "auto";
    language: string;
    units:    "metric" | "imperial";
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseNotifications(notificationsArray: string[] | string | any): {
  email: boolean; push: boolean; sms: boolean;
} {
  try {
    if (Array.isArray(notificationsArray) && notificationsArray.length > 0)
      return JSON.parse(notificationsArray[0]);
    if (typeof notificationsArray === "string")
      return JSON.parse(notificationsArray);
    if (typeof notificationsArray === "object")
      return notificationsArray;
  } catch {
    console.warn("[UserService] Failed to parse notifications, using defaults");
  }
  return { email: true, push: false, sms: false };
}

function parsePreferences(preferencesData: string | any): {
  theme: "light" | "dark" | "auto"; language: string; units: "metric" | "imperial";
} {
  try {
    if (typeof preferencesData === "string") return JSON.parse(preferencesData);
    if (typeof preferencesData === "object") return preferencesData;
  } catch {
    console.warn("[UserService] Failed to parse preferences, using defaults");
  }
  return { theme: "auto", language: "en", units: "metric" };
}

function serializeNotifications(notif: { email: boolean; push: boolean; sms: boolean }): string[] {
  return [JSON.stringify(notif)];
}

function serializePreferences(prefs: {
  theme: "light" | "dark" | "auto"; language: string; units: "metric" | "imperial";
}): string {
  return JSON.stringify(prefs);
}

// ─── PARSE USER PROFILE ───────────────────────────────────────────────────────

function parseUserProfile(doc: any): UserProfile {
  return {
    $id:            doc.$id,
    $createdAt:     doc.$createdAt,
    $updatedAt:     doc.$updatedAt,
    userId:         doc.userId,
    fullName:       doc.fullName,
    email:          doc.email,
    role:           (doc.role as UserRole) || "user",
    avatar:         doc.avatar || null,
    bio:            doc.bio || "",
    location:       doc.location || "",
    dateOfBirth:    doc.dateOfBirth || null,
    gender:         doc.gender || "",
    phone:          doc.phone || "",
    occupation:     doc.occupation || "",
    healthGoals:    doc.healthGoals || "",
    medicalHistory: doc.medicalHistory || "",
    companyName:    doc.companyName || "",
    companySize:    doc.companySize || "",
    industry:       doc.industry || "",
    companyId:      doc.companyId || "",
    notifications:  parseNotifications(doc.notifications),
    preferences:    parsePreferences(doc.preferences),
  };
}

// ─── CREATE USER PROFILE ──────────────────────────────────────────────────────

export async function createUserProfile(
  userId:   string,
  email:    string,
  fullName: string,
  role:     UserRole = "user"
): Promise<UserProfile | null> {
  try {
    const doc = await db.createDocument(
      USERS_DB_ID,
      USERS_COLLECTION_ID,
      userId,
      {
        userId,
        fullName,
        email,
        role,
        avatar:         null,
        bio:            "",
        location:       "",
        dateOfBirth:    null,
        gender:         "",
        phone:          "",
        occupation:     "",
        healthGoals:    "",
        medicalHistory: "",
        companyName:    "",
        companySize:    "",
        industry:       "",
        companyId:      "",
        notifications:  serializeNotifications({ email: true, push: false, sms: false }),
        preferences:    serializePreferences({ theme: "auto", language: "en", units: "metric" }),
      }
    );
    console.log("[UserService] Created profile for user:", userId, "| role:", role);
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] createUserProfile error:", e);
    return null;
  }
}

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const doc = await db.getDocument(USERS_DB_ID, USERS_COLLECTION_ID, userId);
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] getUserProfile error:", e);
    return null;
  }
}

// ─── GET USER BY EMAIL ────────────────────────────────────────────────────────

/**
 * Queries the users collection for an exact email match.
 * Used by the employer dashboard "instant add existing user" flow.
 */
export async function getUserByEmail(email: string): Promise<UserProfile | null> {
  try {
    const res = await db.listDocuments(USERS_DB_ID, USERS_COLLECTION_ID, [
      Query.equal("email", email.toLowerCase().trim()),
      Query.limit(1),
    ]);
    if (res.documents.length === 0) return null;
    return parseUserProfile(res.documents[0]);
  } catch (e) {
    console.error("[UserService] getUserByEmail error:", e);
    return null;
  }
}

// ─── GET OR CREATE USER PROFILE ───────────────────────────────────────────────

export async function getOrCreateUserProfile(
  userId:   string,
  email:    string,
  fullName: string,
  role:     UserRole = "user"
): Promise<UserProfile | null> {
  try {
    let profile = await getUserProfile(userId);
    if (!profile) profile = await createUserProfile(userId, email, fullName, role);
    return profile;
  } catch (e) {
    console.error("[UserService] getOrCreateUserProfile error:", e);
    return null;
  }
}

// ─── UPDATE USER PROFILE ──────────────────────────────────────────────────────

export async function updateUserProfile(
  userId:  string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    const { $id, $createdAt, $updatedAt, ...safeUpdates } = updates as any;
    const processedUpdates: any = { ...safeUpdates };

    if (processedUpdates.notifications)
      processedUpdates.notifications = serializeNotifications(processedUpdates.notifications);
    if (processedUpdates.preferences)
      processedUpdates.preferences = serializePreferences(processedUpdates.preferences);

    const doc = await db.updateDocument(USERS_DB_ID, USERS_COLLECTION_ID, userId, processedUpdates);
    console.log("[UserService] Updated profile:", userId);
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] updateUserProfile error:", e);
    return null;
  }
}

// ─── UPLOAD PROFILE IMAGE ─────────────────────────────────────────────────────

export async function uploadProfileImage(userId: string, file: File): Promise<string | null> {
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error("File too large. Max 5MB.");
    if (!file.type.startsWith("image/")) throw new Error("Only image files allowed.");

    const profile = await getUserProfile(userId);
    if (profile?.avatar) {
      try { await storage.deleteFile(PROFILES_BUCKET_ID, profile.avatar); } catch { /* ok */ }
    }

    const response = await storage.createFile(PROFILES_BUCKET_ID, ID.unique(), file);
    console.log("[UserService] Uploaded profile image:", response.$id);
    await updateUserProfile(userId, { avatar: response.$id } as any);
    return response.$id;
  } catch (e) {
    console.error("[UserService] uploadProfileImage error:", e);
    throw e;
  }
}

// ─── DELETE PROFILE IMAGE ─────────────────────────────────────────────────────

export async function deleteProfileImage(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile?.avatar) return true;
    await storage.deleteFile(PROFILES_BUCKET_ID, profile.avatar);
    await updateUserProfile(userId, { avatar: null } as any);
    console.log("[UserService] Deleted profile image:", userId);
    return true;
  } catch (e) {
    console.error("[UserService] deleteProfileImage error:", e);
    return false;
  }
}

// ─── GET PROFILE IMAGE URL ────────────────────────────────────────────────────

export function getProfileImageUrl(fileId: string | null): string | null {
  if (!fileId) return null;
  return `${cleanEndpoint}/storage/buckets/${PROFILES_BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
}

// ─── GET PROFILE IMAGE SIGNED URL ────────────────────────────────────────────

export async function getProfileImageSignedUrl(
  fileId: string,
  _expiryHours: number = 24
): Promise<string | null> {
  try {
    const url = await storage.getFileDownload(PROFILES_BUCKET_ID, fileId);
    return url.toString();
  } catch (e) {
    console.error("[UserService] getProfileImageSignedUrl error:", e);
    return null;
  }
}

// ─── UPDATE NOTIFICATION PREFERENCES ─────────────────────────────────────────

export async function updateNotificationPreferences(
  userId: string,
  preferences: { email?: boolean; push?: boolean; sms?: boolean }
): Promise<UserProfile | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;
    return await updateUserProfile(userId, {
      notifications: {
        email: preferences.email !== undefined ? preferences.email : profile.notifications.email,
        push:  preferences.push  !== undefined ? preferences.push  : profile.notifications.push,
        sms:   preferences.sms   !== undefined ? preferences.sms   : profile.notifications.sms,
      },
    } as any);
  } catch (e) {
    console.error("[UserService] updateNotificationPreferences error:", e);
    return null;
  }
}

// ─── UPDATE USER PREFERENCES ──────────────────────────────────────────────────

export async function updateUserPreferences(
  userId: string,
  preferences: { theme?: "light" | "dark" | "auto"; language?: string; units?: "metric" | "imperial" }
): Promise<UserProfile | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;
    return await updateUserProfile(userId, {
      preferences: {
        theme:    preferences.theme    !== undefined ? preferences.theme    : profile.preferences.theme,
        language: preferences.language !== undefined ? preferences.language : profile.preferences.language,
        units:    preferences.units    !== undefined ? preferences.units    : profile.preferences.units,
      },
    } as any);
  } catch (e) {
    console.error("[UserService] updateUserPreferences error:", e);
    return null;
  }
}

// ─── SEARCH USERS ─────────────────────────────────────────────────────────────

export async function searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
  try {
    console.log(`[UserService] Searching for: ${query}`);
    return [];
  } catch (e) {
    console.error("[UserService] searchUsers error:", e);
    return [];
  }
}

// ─── GET USER STATS ───────────────────────────────────────────────────────────

export async function getUserStats(userId: string): Promise<{
  assessmentsTaken: number;
  recommendationsCompleted: number;
  totalXp: number;
  level: number;
  streakDays: number;
} | null> {
  try {
    return { assessmentsTaken: 0, recommendationsCompleted: 0, totalXp: 0, level: 1, streakDays: 0 };
  } catch (e) {
    console.error("[UserService] getUserStats error:", e);
    return null;
  }
}

// ─── UPSERT USER ──────────────────────────────────────────────────────────────

/**
 * Called after email signup, email login, and Google OAuth redirect.
 * role is only used on first creation — if profile exists, role is NOT overwritten.
 * companyId and companyName are never overwritten here.
 */
export async function upsertUser(authUser: {
  id:    string;
  name:  string;
  email: string;
  role?: UserRole;
}): Promise<UserProfile | null> {
  try {
    const existing = await getUserProfile(authUser.id);

    if (existing) {
      // Patch fullName if blank (Google OAuth edge case)
      if (!existing.fullName && authUser.name) {
        return await updateUserProfile(authUser.id, { fullName: authUser.name } as any);
      }
      return existing;
    }

    return await createUserProfile(
      authUser.id,
      authUser.email,
      authUser.name || "",
      authUser.role || "user"
    );
  } catch (e) {
    console.error("[UserService] upsertUser error:", e);
    return null;
  }
}

// ─── ROLE REDIRECT HELPER ─────────────────────────────────────────────────────

/**
 * Returns the correct dashboard path based on user role.
 * Usage: router.push(getDashboardPath(profile.role))
 */
export function getDashboardPath(role: UserRole): string {
  return role === "employer" ? "/dashboard/employer" : "/dashboard";
}
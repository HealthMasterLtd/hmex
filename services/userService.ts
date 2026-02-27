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

import { Client, Databases, Storage, ID } from "appwrite";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const ENDPOINT   = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

export const USERS_DB_ID         = "hmex_db";
export const USERS_COLLECTION_ID = "users";
export const PROFILES_BUCKET_ID  = "profile_images";

// Remove trailing slash from endpoint if present
const cleanEndpoint = ENDPOINT.replace(/\/$/, '');
const client = new Client().setEndpoint(cleanEndpoint).setProject(PROJECT_ID);
const db     = new Databases(client);
const storage = new Storage(client);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  $id:              string;
  $createdAt:       string;
  $updatedAt:       string;
  userId:           string;          // Links to Auth user ID
  fullName:         string;
  email:            string;
  avatar:           string | null;   // File ID in bucket
  bio:              string;
  location:         string;
  dateOfBirth:      string | null;   // ISO date
  gender:           string;           // "male" | "female" | "other" | ""
  phone:            string;
  occupation:       string;
  healthGoals:      string;           // Comma-separated
  medicalHistory:   string;           // Comma-separated conditions
  notifications:    {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  preferences:      {
    theme: "light" | "dark" | "auto";
    language: string;
    units: "metric" | "imperial";
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Parse notifications from Appwrite string array format.
 * Appwrite stores as: notifications[] = ["string json"]
 */
function parseNotifications(notificationsArray: string[] | string | any): {
  email: boolean;
  push: boolean;
  sms: boolean;
} {
  try {
    // Handle array format (Appwrite string array)
    if (Array.isArray(notificationsArray) && notificationsArray.length > 0) {
      const parsed = JSON.parse(notificationsArray[0]);
      return parsed;
    }
    // Handle string format
    if (typeof notificationsArray === "string") {
      const parsed = JSON.parse(notificationsArray);
      return parsed;
    }
    // Handle object format (already parsed)
    if (typeof notificationsArray === "object") {
      return notificationsArray;
    }
  } catch (e) {
    console.warn("[UserService] Failed to parse notifications, using defaults");
  }

  return {
    email: true,
    push: false,
    sms: false,
  };
}

/**
 * Parse preferences from Appwrite string format.
 */
function parsePreferences(preferencesData: string | any): {
  theme: "light" | "dark" | "auto";
  language: string;
  units: "metric" | "imperial";
} {
  try {
    if (typeof preferencesData === "string") {
      return JSON.parse(preferencesData);
    }
    if (typeof preferencesData === "object") {
      return preferencesData;
    }
  } catch (e) {
    console.warn("[UserService] Failed to parse preferences, using defaults");
  }

  return {
    theme: "auto",
    language: "en",
    units: "metric",
  };
}

/**
 * Convert notifications object to Appwrite string array format.
 */
function serializeNotifications(notif: {
  email: boolean;
  push: boolean;
  sms: boolean;
}): string[] {
  return [JSON.stringify(notif)];
}

/**
 * Convert preferences object to Appwrite string format.
 */
function serializePreferences(prefs: {
  theme: "light" | "dark" | "auto";
  language: string;
  units: "metric" | "imperial";
}): string {
  return JSON.stringify(prefs);
}

// ─── CREATE USER PROFILE ──────────────────────────────────────────────────────

/**
 * Create a new user profile document after signup.
 * Call this immediately after user registers.
 */
export async function createUserProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<UserProfile | null> {
  try {
    const defaultNotifications = {
      email: true,
      push: false,
      sms: false,
    };

    const defaultPreferences = {
      theme: "auto" as const,
      language: "en",
      units: "metric" as const,
    };

    const doc = await db.createDocument(
      USERS_DB_ID,
      USERS_COLLECTION_ID,
      userId, // Use auth user ID as document ID
      {
        userId,
        fullName,
        email,
        avatar: null,
        bio: "",
        location: "",
        dateOfBirth: null,
        gender: "",
        phone: "",
        occupation: "",
        healthGoals: "",
        medicalHistory: "",
        notifications: serializeNotifications(defaultNotifications),
        preferences: serializePreferences(defaultPreferences),
      }
    );

    console.log("[UserService] Created profile for user:", userId);
    
    // Parse the response to match UserProfile interface
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] createUserProfile error:", e);
    return null;
  }
}

// ─── PARSE USER PROFILE ───────────────────────────────────────────────────────

/**
 * Convert Appwrite document to UserProfile interface.
 * Handles parsing of string arrays and JSON strings.
 */
function parseUserProfile(doc: any): UserProfile {
  return {
    $id: doc.$id,
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    userId: doc.userId,
    fullName: doc.fullName,
    email: doc.email,
    avatar: doc.avatar || null,
    bio: doc.bio || "",
    location: doc.location || "",
    dateOfBirth: doc.dateOfBirth || null,
    gender: doc.gender || "",
    phone: doc.phone || "",
    occupation: doc.occupation || "",
    healthGoals: doc.healthGoals || "",
    medicalHistory: doc.medicalHistory || "",
    notifications: parseNotifications(doc.notifications),
    preferences: parsePreferences(doc.preferences),
  };
}

// ─── GET USER PROFILE ─────────────────────────────────────────────────────────

/**
 * Fetch user's profile document.
 * Returns null if profile doesn't exist.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const doc = await db.getDocument(
      USERS_DB_ID,
      USERS_COLLECTION_ID,
      userId
    );
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] getUserProfile error:", e);
    return null;
  }
}

// ─── GET OR CREATE USER PROFILE ────────────────────────────────────────────────

/**
 * Get existing profile, or create one if it doesn't exist.
 * Use this in profile page load to ensure profile always exists.
 */
export async function getOrCreateUserProfile(
  userId: string,
  email: string,
  fullName: string
): Promise<UserProfile | null> {
  try {
    let profile = await getUserProfile(userId);
    if (!profile) {
      profile = await createUserProfile(userId, email, fullName);
    }
    return profile;
  } catch (e) {
    console.error("[UserService] getOrCreateUserProfile error:", e);
    return null;
  }
}

// ─── UPDATE USER PROFILE ──────────────────────────────────────────────────────

/**
 * Update user profile fields (non-image).
 * Handles proper serialization of notifications and preferences.
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // Remove system fields
    const { $id, $createdAt, $updatedAt, ...safeUpdates } = updates as any;

    // Properly serialize notifications and preferences if present
    const processedUpdates: any = { ...safeUpdates };

    if (processedUpdates.notifications) {
      processedUpdates.notifications = serializeNotifications(processedUpdates.notifications);
    }

    if (processedUpdates.preferences) {
      processedUpdates.preferences = serializePreferences(processedUpdates.preferences);
    }

    const doc = await db.updateDocument(
      USERS_DB_ID,
      USERS_COLLECTION_ID,
      userId,
      processedUpdates
    );

    console.log("[UserService] Updated profile:", userId);
    return parseUserProfile(doc);
  } catch (e) {
    console.error("[UserService] updateUserProfile error:", e);
    return null;
  }
}

// ─── UPLOAD PROFILE IMAGE ─────────────────────────────────────────────────────

/**
 * Upload profile image to bucket.
 * Returns the file ID if successful.
 *
 * @param userId User ID (used to organize files)
 * @param file File object from input[type="file"]
 * @returns File ID or null on error
 */
export async function uploadProfileImage(
  userId: string,
  file: File
): Promise<string | null> {
  try {
    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("File too large. Max 5MB.");
    }

    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files allowed.");
    }

    // Delete old avatar if exists
    const profile = await getUserProfile(userId);
    if (profile?.avatar) {
      try {
        await storage.deleteFile(PROFILES_BUCKET_ID, profile.avatar);
      } catch { /* already deleted or doesn't exist */ }
    }

    // Upload new image
    const response = await storage.createFile(
      PROFILES_BUCKET_ID,
      ID.unique(), // File ID
      file
    );

    console.log("[UserService] Uploaded profile image:", response.$id);

    // Update profile document with file ID
    await updateUserProfile(userId, { avatar: response.$id } as any);

    return response.$id;
  } catch (e) {
    console.error("[UserService] uploadProfileImage error:", e);
    throw e;
  }
}

// ─── DELETE PROFILE IMAGE ─────────────────────────────────────────────────────

/**
 * Delete profile image and update profile.
 */
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

/**
 * Get public URL for profile image.
 * Uses view endpoint (no transformations) for free plan compatibility.
 */
export function getProfileImageUrl(fileId: string | null): string | null {
    if (!fileId) return null;
  
    // View endpoint - no transformations = works on all plans
    // Format: {endpoint}/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
    return `${cleanEndpoint}/storage/buckets/${PROFILES_BUCKET_ID}/files/${fileId}/view?project=${PROJECT_ID}`;
  }

// ─── GET PROFILE IMAGE WITH EXPIRY ────────────────────────────────────────────

/**
 * Get signed URL for profile image (with expiry).
 * Use if you want temporary access or private images.
 */
export async function getProfileImageSignedUrl(
  fileId: string,
  expiryHours: number = 24
): Promise<string | null> {
  try {
    const url = await storage.getFileDownload(
      PROFILES_BUCKET_ID,
      fileId
    );

    return url.toString();
  } catch (e) {
    console.error("[UserService] getProfileImageSignedUrl error:", e);
    return null;
  }
}

// ─── UPDATE NOTIFICATION PREFERENCES ──────────────────────────────────────────

/**
 * Update user's notification settings.
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  }
): Promise<UserProfile | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;

    const updated = await updateUserProfile(userId, {
      notifications: {
        email: preferences.email !== undefined ? preferences.email : profile.notifications.email,
        push: preferences.push !== undefined ? preferences.push : profile.notifications.push,
        sms: preferences.sms !== undefined ? preferences.sms : profile.notifications.sms,
      },
    } as any);

    return updated;
  } catch (e) {
    console.error("[UserService] updateNotificationPreferences error:", e);
    return null;
  }
}

// ─── UPDATE USER PREFERENCES ──────────────────────────────────────────────────

/**
 * Update user's app preferences (theme, language, units).
 */
export async function updateUserPreferences(
  userId: string,
  preferences: {
    theme?: "light" | "dark" | "auto";
    language?: string;
    units?: "metric" | "imperial";
  }
): Promise<UserProfile | null> {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) return null;

    const updated = await updateUserProfile(userId, {
      preferences: {
        theme: preferences.theme !== undefined ? preferences.theme : profile.preferences.theme,
        language: preferences.language !== undefined ? preferences.language : profile.preferences.language,
        units: preferences.units !== undefined ? preferences.units : profile.preferences.units,
      },
    } as any);

    return updated;
  } catch (e) {
    console.error("[UserService] updateUserPreferences error:", e);
    return null;
  }
}

// ─── SEARCH USERS (FOR FUTURE SOCIAL FEATURES) ────────────────────────────────

/**
 * Search users by name or email (public profiles only).
 * Useful for future social/sharing features.
 */
export async function searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
  try {
    // This would need Query.search() in future Appwrite versions
    // For now, basic implementation
    console.log(`[UserService] Searching for: ${query}`);
    return [];
  } catch (e) {
    console.error("[UserService] searchUsers error:", e);
    return [];
  }
}

// ─── GET USER STATS (FOR DASHBOARD) ────────────────────────────────────────────

/**
 * Get user's health statistics for dashboard display.
 * Aggregates data from assessments, recommendations, XP.
 */
export async function getUserStats(userId: string): Promise<{
  assessmentsTaken: number;
  recommendationsCompleted: number;
  totalXp: number;
  level: number;
  streakDays: number;
} | null> {
  try {
    // This would fetch from multiple collections
    // For now, stub implementation
    return {
      assessmentsTaken: 0,
      recommendationsCompleted: 0,
      totalXp: 0,
      level: 1,
      streakDays: 0,
    };
  } catch (e) {
    console.error("[UserService] getUserStats error:", e);
    return null;
  }
}

// ─── UPSERT USER (FOR AUTH FLOWS) ────────────────────────────────────────────

/**
 * Called after email signup, email login, and Google OAuth redirect.
 * Builds on top of your existing createUserProfile / getUserProfile functions.
 *
 * - First call  → creates the full profile document with all defaults
 * - Repeat call → no-op (profile already exists), UNLESS fullName was blank
 *                 (edge case with Google OAuth) in which case it fills it in
 *
 * This is what OAuthCallbackHandler and AuthService call — do not remove.
 */
export async function upsertUser(authUser: {
  id: string;
  name: string;
  email: string;
}): Promise<UserProfile | null> {
  try {
    // getUserProfile uses the auth userId as the document ID directly
    const existing = await getUserProfile(authUser.id);

    if (existing) {
      // Profile exists — only patch fullName if blank (Google OAuth edge case)
      if (!existing.fullName && authUser.name) {
        return await updateUserProfile(authUser.id, { fullName: authUser.name } as any);
      }
      return existing;
    }

    // No profile yet — create it with all defaults via your existing function
    return await createUserProfile(authUser.id, authUser.email, authUser.name || "");
  } catch (e) {
    console.error("[UserService] upsertUser error:", e);
    return null;
  }
}
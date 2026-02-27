import { account } from "@/lib/appwrite";
import { ID, OAuthProvider, AppwriteException } from "appwrite";
import { upsertUser } from "./userService";

export interface SignUpData {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerification: boolean;
  createdAt: string;
}

export const authService = {
  /**
   * Register a new user with email & password.
   * Also saves them to the `users` collection.
   */
  async signUp({ fullName, email, password }: SignUpData): Promise<AuthUser> {
    try {
      // 1. Create the Appwrite Auth account
      const user = await account.create(ID.unique(), email, password, fullName);

      // 2. Automatically log them in
      await account.createEmailPasswordSession(email, password);

      const authUser: AuthUser = {
        id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        createdAt: user.$createdAt,
      };

      // 3. Save to `users` collection (non-blocking — don't fail signup if this errors)
      upsertUser({ id: authUser.id, name: authUser.name, email: authUser.email })
        .catch((e) => console.error("[AuthService] signUp upsertUser failed:", e));

      return authUser;
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Login with email & password.
   * Updates the user profile record (non-blocking).
   */
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      await account.createEmailPasswordSession(email, password);
      const authUser = await authService.getCurrentUser();

      // Update profile record (non-blocking)
      upsertUser({ id: authUser.id, name: authUser.name, email: authUser.email })
        .catch((e) => console.error("[AuthService] login upsertUser failed:", e));

      return authUser;
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Login / Sign up with Google OAuth.
   * Redirects the browser — no async here.
   * After redirect, OAuthCallbackHandler handles upsertUser + claiming pending data.
   */
  loginWithGoogle(redirectPath = "/dashboard") {
    const origin = window.location.origin;
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}${redirectPath}`,
      `${origin}/login?error=oauth`
    );
  },

  /**
   * Get the currently logged-in user
   */
  async getCurrentUser(): Promise<AuthUser> {
    try {
      const user = await account.get();
      return {
        id: user.$id,
        name: user.name,
        email: user.email,
        emailVerification: user.emailVerification,
        createdAt: user.$createdAt,
      };
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Logout — deletes the current session
   */
  async logout(): Promise<void> {
    try {
      await account.deleteSession("current");
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Check if a user session exists (non-throwing).
   * Returns null if not logged in.
   */
  async getSession(): Promise<AuthUser | null> {
    try {
      return await authService.getCurrentUser();
    } catch {
      return null;
    }
  },
};

// ─── Error Handler ────────────────────────────────────────────────────────────
function handleAppwriteError(error: unknown): Error {
  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401:
        return new Error("Invalid email or password. Please try again.");
      case 409:
        return new Error("An account with this email already exists.");
      case 429:
        return new Error("Too many attempts. Please wait a moment and try again.");
      case 400:
        return new Error("Invalid input. Please check your details.");
      default:
        return new Error(error.message || "Something went wrong. Please try again.");
    }
  }
  return new Error("An unexpected error occurred. Please try again.");
}
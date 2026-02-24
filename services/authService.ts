import { account } from "@/lib/appwrite";
import { ID, OAuthProvider, AppwriteException } from "appwrite";

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
   * Register a new user with email & password
   */
  async signUp({ fullName, email, password }: SignUpData): Promise<AuthUser> {
    try {
      // 1. Create the account
      const user = await account.create(ID.unique(), email, password, fullName);

      // 2. Automatically log them in after registration
      await account.createEmailPasswordSession(email, password);

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
   * Login with email & password
   */
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      await account.createEmailPasswordSession(email, password);
      return await authService.getCurrentUser();
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Login / Sign up with Google OAuth
   * Redirects the browser — call this on button click
   */
  loginWithGoogle(redirectPath = "/dashboard") {
    const origin = window.location.origin;
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}${redirectPath}`,      // success redirect
      `${origin}/login?error=oauth`    // failure redirect
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
   * Check if a user session exists (non-throwing)
   * Returns null if not logged in
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
    // Map Appwrite error codes to user-friendly messages
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
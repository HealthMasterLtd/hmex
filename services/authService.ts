import { account } from "@/lib/appwrite";
import { ID, OAuthProvider, AppwriteException } from "appwrite";
import { upsertUser, getUserProfile, updateUserProfile, getDashboardPath, type UserRole } from "./userService";
import { createCompany, claimInvite } from "./companyService";

export interface SignUpData {
  fullName:     string;
  email:        string;
  password:     string;
  role:         UserRole;
  // invite-link signup
  inviteToken?: string;
  // employer-only
  companyName?: string;
  companySize?: string;
  industry?:    string;
}

export interface AuthUser {
  id:                string;
  name:              string;
  email:             string;
  emailVerification: boolean;
  createdAt:         string;
  role:              UserRole;
}

export const authService = {
  /**
   * Register a new user with email & password.
   * - Employer role: creates a company record and links it to the user profile.
   * - Invite-link signup: claims the invite and auto-links to the company.
   */
  async signUp({ fullName, email, password, role, inviteToken, companyName, companySize, industry }: SignUpData): Promise<AuthUser> {
    try {
      // 1. Create the Appwrite Auth account
      const user = await account.create(ID.unique(), email, password, fullName);

      // 2. Automatically log them in
      await account.createEmailPasswordSession(email, password);

      // 3. Save to `users` collection — role stored on first creation
      await upsertUser({ id: user.$id, name: user.name, email: user.email, role })
        .catch((e) => console.error("[AuthService] signUp upsertUser failed:", e));

      // 4a. Employer signup → create the company and link it to the user profile
      if (role === "employer" && companyName) {
        const company = await createCompany({
          name:     companyName,
          ownerId:  user.$id,
          size:     companySize,
          industry: industry,
        });
        if (company) {
          await updateUserProfile(user.$id, {
            companyName: company.name,
            companyId:   company.$id,
          } as never).catch((e) => console.error("[AuthService] employer profile link failed:", e));
        }
      }

      // 4b. Invite-link signup → claim the invite and auto-link to the company
      if (inviteToken) {
        await claimInvite(inviteToken, user.$id)
          .catch((e) => console.error("[AuthService] claimInvite failed:", e));
      }

      return {
        id:                user.$id,
        name:              user.name,
        email:             user.email,
        emailVerification: user.emailVerification,
        createdAt:         user.$createdAt,
        role,
      };
    } catch (error) {
      throw handleAppwriteError(error);
    }
  },

  /**
   * Login with email & password.
   * Role is fetched from the users collection after successful login.
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
   * Login / Sign up with Google OAuth.
   * redirectPath is determined AFTER the OAuth callback by reading the role
   * from the users collection in OAuthCallbackHandler.
   * We always redirect to /auth/callback so the handler can pick the right dashboard.
   */
  loginWithGoogle() {
    const origin = window.location.origin;
    account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}/auth/callback`,
      `${origin}/login?error=oauth`
    );
  },

  /**
   * Get the currently logged-in user + resolve role from users collection.
   */
  async getCurrentUser(): Promise<AuthUser> {
    try {
      const user = await account.get();

      // Fetch role from the users collection
      const profile = await getUserProfile(user.$id);
      const role: UserRole = profile?.role ?? "user";

      // Non-blocking upsert to keep the record fresh
      upsertUser({ id: user.$id, name: user.name, email: user.email, role })
        .catch((e) => console.error("[AuthService] getCurrentUser upsertUser failed:", e));

      return {
        id:                user.$id,
        name:              user.name,
        email:             user.email,
        emailVerification: user.emailVerification,
        createdAt:         user.$createdAt,
        role,
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

  /**
   * Convenience: returns the dashboard path for the current user's role.
   */
  getDashboard(role: UserRole): string {
    return getDashboardPath(role);
  },
};

// ─── Error Handler ────────────────────────────────────────────────────────────
function handleAppwriteError(error: unknown): Error {
  if (error instanceof AppwriteException) {
    switch (error.code) {
      case 401: return new Error("Invalid email or password. Please try again.");
      case 409: return new Error("An account with this email already exists.");
      case 429: return new Error("Too many attempts. Please wait a moment and try again.");
      case 400: return new Error("Invalid input. Please check your details.");
      default:  return new Error(error.message || "Something went wrong. Please try again.");
    }
  }
  return new Error("An unexpected error occurred. Please try again.");
}
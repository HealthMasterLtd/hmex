"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import type { AuthUser, SignUpData } from "@/services/authService";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signUp: (data: SignUpData) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────
export const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authService.getSession().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  /**
   * signUp — returns the new AuthUser so the register page can read the $id.
   * Throws on failure so the page can catch and show a toast.
   * Does NOT redirect here — the register page handles its own success screen + redirect.
   */
  const signUp = useCallback(
    async (data: SignUpData): Promise<AuthUser> => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await authService.signUp(data);
        setUser(newUser);
        return newUser;
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        throw err; // re-throw so register page can catch and show toast
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * login — sets user state, then throws on failure so the login page
   * can catch and show a toast instead of relying on the context error state.
   * Does NOT redirect here — the login page handles role-based redirect.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const loggedInUser = await authService.login(email, password);
        setUser(loggedInUser);
        // No router.push here — the login page watches `user` and redirects
        // based on the resolved role from the users collection.
      } catch (err) {
        const msg = (err as Error).message;
        setError(msg);
        throw err; // re-throw so login page can catch and show toast
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * loginWithGoogle — kicks off OAuth flow.
   * authService.loginWithGoogle() takes no arguments; it always redirects
   * to /auth/callback where OAuthCallbackHandler resolves the correct dashboard.
   */
  const loginWithGoogle = useCallback(() => {
    authService.loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      router.push("/login");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, error, signUp, login, loginWithGoogle, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}
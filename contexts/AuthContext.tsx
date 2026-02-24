// contexts/AuthContext.tsx
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
  signUp: (data: SignUpData) => Promise<void>;
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

  const signUp = useCallback(
    async (data: SignUpData) => {
      setLoading(true);
      setError(null);
      try {
        const newUser = await authService.signUp(data);
        setUser(newUser);
        router.push("/dashboard");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const loggedInUser = await authService.login(email, password);
        setUser(loggedInUser);
        router.push("/dashboard");
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const loginWithGoogle = useCallback(() => {
    authService.loginWithGoogle("/dashboard");
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
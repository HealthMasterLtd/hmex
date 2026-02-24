// hooks/useAuth.ts
"use client";

import { useContext , useEffect} from "react";
import { useRouter } from "next/navigation";
import { AuthContext, type AuthContextType } from "@/contexts/AuthContext";

// ─── useAuth hook ─────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ─── useRequireAuth — redirects to /login if not authenticated ────────────────
export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.loading && !auth.user) router.push("/login");
  }, [auth.loading, auth.user, router]);

  return auth;
}
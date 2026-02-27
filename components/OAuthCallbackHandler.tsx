/* eslint-disable @typescript-eslint/no-explicit-any *//* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/**
 * OAuthCallbackHandler.tsx
 *
 * Drop this component into your /dashboard page and /login page layouts.
 * It runs silently after a Google OAuth redirect and:
 *  1. Upserts the user into the `users` Appwrite collection
 *  2. Claims any pending assessment from localStorage → Appwrite
 *  3. Claims any pending recommendations from localStorage → Appwrite
 *
 * No UI changes — this is purely logic.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { claimPendingAssessment, getPendingAssessment } from "@/services/AppwriteService";
import {
  claimPendingRecommendations,
  getPendingRecommendations,
} from "@/services/RecommendationService";
import { upsertUser } from "@/services/userService";

export default function OAuthCallbackHandler() {
  const { user } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (!user || handledRef.current) return;
    handledRef.current = true;

    const handle = async () => {
      const userId = (user as any).$id || (user as any).id;
      if (!userId) return;

      // 1. Upsert user into `users` collection (safe to call multiple times)
      try {
        await upsertUser({
          id:    userId,
          name:  (user as any).name  || "",
          email: (user as any).email || "",
        });
      } catch (e) {
        console.error("[OAuthCallbackHandler] upsertUser failed:", e);
      }

      // 2. Claim pending assessment
      const pendingAssessment = getPendingAssessment();
      if (!pendingAssessment) return;

      let savedAssessmentId: string | null = null;
      try {
        const saved = await claimPendingAssessment(userId);
        if (saved) {
          savedAssessmentId = saved.$id;
          console.log("[OAuthCallbackHandler] Assessment claimed:", savedAssessmentId);
        }
      } catch (e) {
        console.error("[OAuthCallbackHandler] claimPendingAssessment failed:", e);
      }

      // 3. Claim pending recommendations
      const pendingReco = getPendingRecommendations();
      if (!pendingReco) return;

      try {
        await claimPendingRecommendations(userId, savedAssessmentId ?? "unlinked");
        console.log("[OAuthCallbackHandler] Recommendations claimed");
      } catch (e) {
        console.error("[OAuthCallbackHandler] claimPendingRecommendations failed:", e);
      }
    };

    handle();
  }, [user]);

  return null; // No UI
}
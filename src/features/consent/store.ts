"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ConsentChoice = "accepted" | "rejected";

interface ConsentState {
  /** null until the visitor chooses */
  choice: ConsentChoice | null;
  decidedAt: string | null;
  bannerOpen: boolean;
  decide: (choice: ConsentChoice) => void;
  reopen: () => void;
}

/**
 * Cookie consent (UK GDPR / PECR). Only optional analytics depend on it; the basket
 * and admin sign-in are strictly necessary and work without consent.
 * Bump `version` if the cookie policy changes, so everyone is asked again.
 */
export const useConsent = create<ConsentState>()(
  persist(
    (set) => ({
      choice: null,
      decidedAt: null,
      bannerOpen: false,
      decide: (choice) => set({ choice, decidedAt: new Date().toISOString(), bannerOpen: false }),
      reopen: () => set({ bannerOpen: true }),
    }),
    {
      name: "ym-consent",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ choice: s.choice, decidedAt: s.decidedAt }),
    },
  ),
);

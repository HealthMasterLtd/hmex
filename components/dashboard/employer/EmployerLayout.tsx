/* eslint-disable react-hooks/set-state-in-effect */
"use client";
/**
 * /components/dashboard/employer/EmployerLayout.tsx
 */

import React, { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import EmployerSidebar from "./EmployerSidebar";
import EmployerHeader from "./EmployerHeader"; // ← employer-specific header (no XP)

// ─── LAYOUT CONTEXT ──────────────────────────────────────────────────────────
interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}
const LayoutContext = createContext<LayoutContextType | null>(null);
export function useEmployerLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useEmployerLayoutContext must be inside EmployerLayout");
  return ctx;
}

// ─── EMPLOYER LAYOUT ─────────────────────────────────────────────────────────
export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const { isDark, surface: S } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hmex-employer-sidebar-collapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("hmex-employer-sidebar-collapsed", String(next));
  };

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!mounted) {
    return <div style={{ display: "flex", height: "100vh", background: S.bg }} />;
  }

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }}>
      <div style={{
        display: "flex", height: "100vh", overflow: "hidden",
        padding: 8, gap: 8, background: S.bg,
      }}>
        {/* Employer Sidebar */}
        <EmployerSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main column */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden",
          background: S.surface,
          boxShadow: isDark
            ? `0 0 0 1px ${S.border}, 0 8px 40px rgba(0,0,0,0.45)`
            : `0 0 0 1px ${S.border}, 0 4px 24px rgba(0,0,0,0.07)`,
        }}>
          {/* Employer-specific header — no XP badge, employer notification bell */}
          <EmployerHeader onMobileMenuOpen={() => setMobileOpen(true)} />

          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "transparent" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 24px" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

// ─── LAYOUT CONTEXT ──────────────────────────────────────────────────────────
interface LayoutContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}
const LayoutContext = createContext<LayoutContextType | null>(null);
export function useLayoutContext() {
  const ctx = useContext(LayoutContext);
  if (!ctx) throw new Error("useLayoutContext must be inside DashboardLayout");
  return ctx;
}

// ─── LAYOUT ──────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDark, surface: S } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen,       setMobileOpen]       = useState(false);
  const [mounted,          setMounted]          = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hmex-sidebar-collapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
    setMounted(true);
  }, []);

  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("hmex-sidebar-collapsed", String(next));
  };

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Page bg: uses surface.bg (outermost layer — slightly darker/lighter than surface)
  const pageBg = S.bg;
  // Main column bg: surface (one level up from page)
  const mainBg = S.surface;

  if (!mounted) {
    return <div style={{ display: "flex", height: "100vh", background: pageBg }} />;
  }

  return (
    <LayoutContext.Provider value={{ sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }}>
      <div style={{
        display: "flex", height: "100vh", overflow: "hidden",
        padding: 8, gap: 8, background: pageBg,
      }}>
        {/* Sidebar */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* Main column */}
        <div style={{
          display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden",
          borderRadius: 16, background: mainBg,
          boxShadow: isDark
            ? `0 0 0 1px ${S.border}, 0 8px 40px rgba(0,0,0,0.45)`
            : `0 0 0 1px ${S.border}, 0 4px 24px rgba(0,0,0,0.07)`,
        }}>
          <DashboardHeader onMobileMenuOpen={() => setMobileOpen(true)} />
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "transparent" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

// ─── LAYOUT CONTEXT (so child pages can read collapsed state if needed) ────────
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

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDark } = useTheme();

  // Sidebar collapse — persisted in localStorage
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // On mount, restore sidebar state
  useEffect(() => {
    const saved = localStorage.getItem("hmex-sidebar-collapsed");
    if (saved !== null) setSidebarCollapsed(saved === "true");
    setMounted(true);
  }, []);

  // Persist sidebar state
  const handleToggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("hmex-sidebar-collapsed", String(next));
  };

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pageBg = isDark ? "#080c16" : "#f1f5f9";

  // Prevent layout flash before mount
  if (!mounted) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ background: pageBg }}
      />
    );
  }

  return (
    <LayoutContext.Provider
      value={{ sidebarCollapsed, setSidebarCollapsed, mobileOpen, setMobileOpen }}
    >
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: pageBg }}
      >
        {/* ── SIDEBAR ── */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* ── MAIN COLUMN ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Header */}
          <DashboardHeader onMobileMenuOpen={() => setMobileOpen(true)} />

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ background: pageBg }}
          >
            <div
              className="mx-auto px-5 py-6 lg:px-7 lg:py-7"
              style={{ maxWidth: 1280 }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
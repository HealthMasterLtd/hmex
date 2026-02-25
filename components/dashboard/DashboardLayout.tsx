/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

// ─── LAYOUT CONTEXT ────────────────────────────────────────────────────────────
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Page bg — slightly different from sidebar so curves are visible
  const pageBg = isDark ? "#080c16" : "#eef2f7";

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
      {/*
        Outer wrapper: the "page bg" colour shows around the sidebar's
        rounded corners (top-right and bottom-left), giving that inset
        curved look without breaking the layout.
      */}
      <div
        className="flex h-screen overflow-hidden p-2 gap-2"
        style={{ background: pageBg }}
      >
        {/* ── SIDEBAR — gets border-radius top-right + bottom-left ── */}
        <DashboardSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleCollapse}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        {/* ── MAIN COLUMN — also rounded to match aesthetic ── */}
        <div
          className="flex flex-col flex-1 min-w-0 overflow-hidden"
          style={{
            borderRadius: 16,
            background: isDark ? "#0b1120" : "#ffffff",
            boxShadow: isDark
              ? "0 0 0 1px rgba(255,255,255,0.05), 0 8px 40px rgba(0,0,0,0.4)"
              : "0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Header */}
          <DashboardHeader onMobileMenuOpen={() => setMobileOpen(true)} />

          {/* Page content */}
          <main
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ background: "transparent" }}
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
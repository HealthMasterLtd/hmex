/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const navItems = [
  { label: "Home",            href: "/"               },
  { label: "Risk Assessment", href: "/risk-assesment" },
  { label: "About",           href: "/about"          },
  { label: "How It Works",    href: "/how-it-works"   },
  { label: "Corporate",       href: "/corporate"      },
  { label: "Contact",         href: "/contact"        },
];

// ── Custom animated hamburger icon ──────────────────────────────────────────
function HamburgerIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <motion.rect
        x="3" y="5" width="14" height="1.5" rx="0.75" fill={color}
        animate={open ? { rotate: 45, y: 4, x: 0 } : { rotate: 0, y: 0, x: 0 }}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.rect
        x="3" y="9.25" width="14" height="1.5" rx="0.75" fill={color}
        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
        style={{ originX: "50%", transformBox: "fill-box" }}
        transition={{ duration: 0.18 }}
      />
      <motion.rect
        x="3" y="13.5" width={open ? "14" : "10"} height="1.5" rx="0.75" fill={color}
        animate={open ? { rotate: -45, y: -4, x: 0 } : { rotate: 0, y: 0, x: 0 }}
        style={{ originX: "50%", originY: "50%", transformBox: "fill-box" }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  );
}

// ── Animated sun/moon theme toggle ─────────────────────────────────────────
function ThemeToggle() {
  const { isDark, toggleTheme, accentColor, surface: S } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: S.surfaceAlt,
        border: `1px solid ${S.border}`,
        borderRadius: 8,
        cursor: "pointer",
        flexShrink: 0,
        position: "relative",
        overflow: "hidden",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          // Moon icon
          <motion.svg
            key="moon"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
              fill={accentColor}
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        ) : (
          // Sun icon
          <motion.svg
            key="sun"
            width="15" height="15" viewBox="0 0 24 24" fill="none"
            initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <circle cx="12" cy="12" r="4" fill={accentColor} />
            <g stroke={accentColor} strokeWidth="1.5" strokeLinecap="round">
              <line x1="12" y1="2"  x2="12" y2="5"  />
              <line x1="12" y1="19" x2="12" y2="22" />
              <line x1="2"  y1="12" x2="5"  y2="12" />
              <line x1="19" y1="12" x2="22" y2="12" />
              <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34"  />
              <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
              <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66" />
              <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22"  />
            </g>
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();
  const { isDark, accentColor, accentSecondary, surface: S } = useTheme();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 50,
          background: scrolled
            ? isDark ? "rgba(14,17,23,.94)" : "rgba(255,255,255,.94)"
            : S.surface,
          borderBottom: `1px solid ${scrolled ? S.border : "transparent"}`,
          backdropFilter: scrolled ? "blur(18px)" : "none",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        {/* ── DESKTOP layout ── */}
        <div className="desktop-nav-row" style={{
          margin: "0 auto", maxWidth: 1280,
          height: 60, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 20px",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, overflow: "hidden", borderRadius: "50%" }}>
              <Image src="/white logo.png" alt="HMEX" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: S.text }}>
              H<span style={{ color: accentColor }}>mex</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.label} href={item.href} style={{ position: "relative", padding: "8px 14px", textDecoration: "none" }}>
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      style={{ position: "absolute", bottom: 4, left: 14, right: 14, height: 2, borderRadius: 9999, background: accentColor }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: active ? S.text : S.muted, transition: "color 0.15s" }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Theme toggle — desktop */}
            <ThemeToggle />

            <Link href="/login">
              <button style={{ height: 32, padding: "0 16px", fontSize: 13, fontWeight: 600, color: S.text, border: `1px solid ${S.border}`, background: S.surfaceAlt, borderRadius: 8, cursor: "pointer" }}>Log in</button>
            </Link>
            <Link href="/register">
              <button style={{ height: 32, padding: "0 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fff", border: "none", background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`, boxShadow: `0 2px 10px ${accentColor}40`, borderRadius: 8, cursor: "pointer" }}>
                Sign up <ArrowRight size={12} />
              </button>
            </Link>
          </div>
        </div>

        {/* ── MOBILE layout ── */}
        <div className="mobile-nav-row" style={{
          display: "none",
          margin: "0 auto", maxWidth: 1280,
          height: 60, alignItems: "center",
          justifyContent: "space-between", padding: "0 20px",
        }}>
          <button
            type="button"
            onClick={() => setIsOpen(prev => !prev)}
            style={{
              width: 38, height: 38,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: isOpen ? `${accentColor}18` : S.surfaceAlt,
              border: `1.5px solid ${isOpen ? accentColor : S.border}`,
              borderRadius: 10, cursor: "pointer", flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            aria-label="Toggle menu"
          >
            <HamburgerIcon open={isOpen} color={isOpen ? accentColor : S.text} />
          </button>

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, overflow: "hidden", borderRadius: "50%" }}>
              <Image src="/white logo.png" alt="HMEX" width={30} height={30} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: S.text }}>
              H<span style={{ color: accentColor }}>mex</span>
            </span>
          </Link>

          {/* Theme toggle — mobile top bar */}
          <ThemeToggle />
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: "fixed", inset: 0, zIndex: 9998,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(6px)",
              }}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              style={{
                position: "fixed", top: 0, left: 0, bottom: 0,
                width: "78vw", maxWidth: 300,
                zIndex: 9999,
                background: S.surface,
                borderRight: `1px solid ${S.border}`,
                boxShadow: isDark ? "28px 0 70px rgba(0,0,0,0.75)" : "28px 0 70px rgba(0,0,0,0.18)",
                display: "flex", flexDirection: "column",
                overflowY: "auto",
              }}
            >
              {/* Drawer header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: `1px solid ${S.border}`,
                flexShrink: 0, height: 60,
              }}>
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }} onClick={() => setIsOpen(false)}>
                  <div style={{ width: 28, height: 28, overflow: "hidden", borderRadius: "50%" }}>
                    <Image src="/white logo.png" alt="HMEX" width={28} height={28} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: S.text }}>
                    H<span style={{ color: accentColor }}>mex</span>
                  </span>
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    background: S.surfaceAlt, border: `1px solid ${S.border}`,
                    borderRadius: 8, cursor: "pointer",
                  }}
                >
                  <HamburgerIcon open={true} color={S.muted} />
                </button>
              </div>

              {/* Nav links */}
              <div style={{ flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
                {navItems.map((item, i) => {
                  const active = pathname === item.href;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.045, duration: 0.25 }}
                    >
                      <Link
                        href={item.href}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "13px 16px", borderRadius: 10, textDecoration: "none",
                          background: active ? `${accentColor}14` : "transparent",
                          transition: "background 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: active ? 700 : 500, color: active ? accentColor : S.text }}>
                          {item.label}
                        </span>
                        {active && <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }} />}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Auth + theme toggle pinned to bottom */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  padding: "16px 20px 32px",
                  borderTop: `1px solid ${S.border}`,
                  display: "flex", flexDirection: "column", gap: 10,
                  flexShrink: 0,
                }}
              >
                {/* Theme toggle row in drawer */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px",
                  background: S.surfaceAlt,
                  borderRadius: 10,
                  border: `1px solid ${S.border}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: S.muted }}>
                    {isDark ? "Dark mode" : "Light mode"}
                  </span>
                  <ThemeToggle />
                </div>

                <Link href="/login">
                  <button style={{
                    width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
                    color: S.text, border: `1px solid ${S.border}`, background: S.surfaceAlt,
                    borderRadius: 10, cursor: "pointer",
                  }}>Log in</button>
                </Link>
                <Link href="/register">
                  <button style={{
                    width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
                    color: "#fff", border: "none",
                    background: `linear-gradient(135deg, ${accentColor}, ${accentSecondary})`,
                    boxShadow: `0 2px 14px ${accentColor}40`,
                    borderRadius: 10, cursor: "pointer",
                  }}>Start free assessment</button>
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 767px) {
          .desktop-nav-row { display: none !important; }
          .mobile-nav-row  { display: flex !important; }
        }
      `}</style>
    </>
  );
}
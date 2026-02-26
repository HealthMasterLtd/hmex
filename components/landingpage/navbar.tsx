/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, ArrowRight } from "lucide-react";
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

export default function Navbar() {
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname                = usePathname();
  const { isDark, toggleTheme, surface, accentColor } = useTheme();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0,    opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-colors duration-300"
        style={{
          background: scrolled
            ? isDark ? "rgba(14,17,23,.92)" : "rgba(255,255,255,.92)"
            : surface.bg,
          borderBottom: scrolled ? `1px solid ${surface.border}` : "1px solid transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
        }}
      >
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-5 lg:px-10">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 overflow-hidden rounded-full">
              <Image
                src="/white logo.png"
                alt="HMEX"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: surface.text }}
            >
              H<span style={{ color: accentColor }}>mex</span>
            </span>
          </Link>

          {/* ── Desktop links ── */}
          <div className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative px-3.5 py-2 group"
                >
                  {active && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full"
                      style={{ background: accentColor }}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span
                    className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                    style={{ background: isDark ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.04)" }}
                  />
                  <span
                    className="relative text-[13.5px] font-medium transition-colors duration-150"
                    style={{ color: active ? surface.text : surface.muted }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Desktop actions ── */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150"
              style={{ background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)" }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{    rotate:  45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isDark
                    ? <Moon  size={15} style={{ color: surface.muted }} />
                    : <Sun   size={15} style={{ color: surface.muted }} />
                  }
                </motion.span>
              </AnimatePresence>
            </button>

            <Link href="/login">
              <button
                className="h-8 rounded-lg px-4 text-[13px] font-semibold transition-colors duration-150"
                style={{
                  color: surface.text,
                  border: `1px solid ${surface.border}`,
                  background: "transparent",
                }}
              >
                Log in
              </button>
            </Link>

            <Link href="/register">
              <button
                className="group flex h-8 items-center gap-1.5 rounded-lg px-4 text-[13px] font-semibold text-white transition-opacity duration-150 hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg, #0d9488, #059669)",
                  boxShadow: "0 2px 10px rgba(13,148,136,.30)",
                }}
              >
                Sign up
                <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" />
              </button>
            </Link>
          </div>

          {/* ── Mobile controls ── */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)" }}
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isDark ? "moon" : "sun"}
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{    rotate:  45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isDark
                    ? <Moon size={15} style={{ color: surface.muted }} />
                    : <Sun  size={15} style={{ color: surface.muted }} />
                  }
                </motion.span>
              </AnimatePresence>
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)" }}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={isOpen ? "x" : "menu"}
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0,   opacity: 1 }}
                  exit={{    rotate:  45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {isOpen
                    ? <X    size={18} style={{ color: surface.text }} />
                    : <Menu size={18} style={{ color: surface.text }} />
                  }
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{    opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,.5)", backdropFilter: "blur(6px)" }}
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{    x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="fixed right-0 top-[60px] bottom-0 z-50 w-72 overflow-y-auto md:hidden"
              style={{
                background: surface.bg,
                borderLeft: `1px solid ${surface.border}`,
              }}
            >
              <div className="flex flex-col gap-1 p-5">
                {navItems.map((item, i) => {
                  const active = pathname === item.href;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.25 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center justify-between rounded-lg px-4 py-3 transition-colors duration-150"
                        style={{
                          background: active
                            ? isDark ? "rgba(13,148,136,.12)" : "rgba(13,148,136,.08)"
                            : "transparent",
                        }}
                      >
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: active ? accentColor : surface.text }}
                        >
                          {item.label}
                        </span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                <div className="my-3 h-px" style={{ background: surface.border }} />

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="flex flex-col gap-2"
                >
                  <Link href="/login">
                    <button
                      className="w-full rounded-lg py-3 text-[13.5px] font-semibold transition-colors duration-150"
                      style={{
                        color: surface.text,
                        border: `1px solid ${surface.border}`,
                        background: "transparent",
                      }}
                    >
                      Log in
                    </button>
                  </Link>
                  <Link href="/register">
                    <button
                      className="w-full rounded-lg py-3 text-[13.5px] font-semibold text-white"
                      style={{
                        background: "linear-gradient(135deg, #0d9488, #059669)",
                        boxShadow: "0 2px 12px rgba(13,148,136,.25)",
                      }}
                    >
                      Sign up free
                    </button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
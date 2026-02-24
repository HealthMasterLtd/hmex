/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Risk Assessment", href: "/risk-assesment" },
    { label: "About", href: "/about" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Corporate", href: "/corporate" },
    { label: "Contact", href: "/contact" },
  ];

  const colors = {
    bg: isDark ? "#0D0D0F" : "#FFFFFF",
    bgScrolled: isDark ? "#1A1B1F" : "#FFFFFF",
    border: isDark ? "#202126" : "#E2E2E0",
    text: isDark ? "#FFFFFF" : "#0A0A0B",
    textMuted: isDark ? "#A0A0A8" : "#52525B",
    primary: "#0FB6C8",
    emerald: "#0FBB7D",
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? colors.bgScrolled : colors.bg,
          borderBottom: `1px solid ${scrolled ? colors.border : "transparent"}`,
          backdropFilter: scrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
               <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                <Image
                  src='/white logo.png'
                  alt="Logo"
                  width={120}
                  height={50}
                  className="object-cover w-full h-full"
                />
              </div>
              </motion.div>
              <span
                className="text-xl font-black tracking-tight"
                style={{
                  color: colors.text,
                  fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                  letterSpacing: "-0.02em",
                }}
              >
                H<span style={{ color: colors.emerald }}>mex</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="relative px-3 py-2 group"
                  >
                    <span
                      className="text-sm font-medium transition-colors relative z-10"
                      style={{
                        color: isActive ? colors.emerald : colors.textMuted,
                      }}
                    >
                      {item.label}
                    </span>

                    {/* Unique active state - pill background */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-pill"
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: isDark
                            ? `color-mix(in srgb, ${colors.emerald} 15%, transparent)`
                            : `color-mix(in srgb, ${colors.emerald} 10%, transparent)`,
                          border: `1px solid color-mix(in srgb, ${colors.emerald} 20%, transparent)`,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}

                    {/* Hover effect */}
                    {!isActive && (
                      <div
                        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: isDark
                            ? "rgba(255, 255, 255, 0.03)"
                            : "rgba(0, 0, 0, 0.03)",
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className="p-2 transition-all"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "8px",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? "moon" : "sun"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? (
                      <Moon size={18} style={{ color: colors.text }} />
                    ) : (
                      <Sun size={18} style={{ color: colors.text }} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* Login Button */}
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    background: "transparent",
                  }}
                >
                  Login
                </motion.button>
              </Link>

              {/* Sign Up Button */}
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-sm font-semibold text-white transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.emerald})`,
                    borderRadius: "8px",
                    boxShadow: `0 2px 8px ${colors.emerald}20`,
                  }}
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              {/* Mobile Theme Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isDark ? "moon" : "sun"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? (
                      <Moon size={18} style={{ color: colors.text }} />
                    ) : (
                      <Sun size={18} style={{ color: colors.text }} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>

              {/* Hamburger Menu */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
                className="p-2"
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.05)",
                  borderRadius: "8px",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={isOpen ? "close" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isOpen ? (
                      <X size={24} style={{ color: colors.text }} />
                    ) : (
                      <Menu size={24} style={{ color: colors.text }} />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{
                background: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(8px)",
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-16 right-0 bottom-0 w-80 z-40 md:hidden overflow-y-auto"
              style={{
                background: colors.bg,
                borderLeft: `1px solid ${colors.border}`,
              }}
            >
              <div className="p-6 space-y-6">
                {/* Navigation Links */}
                <div className="space-y-2">
                  {navItems.map((item, index) => {
                    const isActive = pathname === item.href;

                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          href={item.href}
                          className="block px-4 py-3 transition-all relative overflow-hidden group"
                          style={{
                            borderRadius: "12px",
                            background: isActive
                              ? isDark
                                ? `color-mix(in srgb, ${colors.emerald} 15%, transparent)`
                                : `color-mix(in srgb, ${colors.emerald} 10%, transparent)`
                              : "transparent",
                            border: `1px solid ${
                              isActive
                                ? `color-mix(in srgb, ${colors.emerald} 30%, transparent)`
                                : "transparent"
                            }`,
                          }}
                        >
                          {/* Active indicator */}
                          {isActive && (
                            <motion.div
                              layoutId="mobile-active"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
                              style={{ background: colors.emerald }}
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                            />
                          )}

                          <span
                            className="text-base font-semibold relative z-10"
                            style={{
                              color: isActive ? colors.emerald : colors.text,
                            }}
                          >
                            {item.label}
                          </span>

                          {/* Hover effect */}
                          {!isActive && (
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{
                                background: isDark
                                  ? "rgba(255, 255, 255, 0.03)"
                                  : "rgba(0, 0, 0, 0.03)",
                                borderRadius: "12px",
                              }}
                            />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div
                  style={{
                    height: "1px",
                    background: colors.border,
                  }}
                />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link href="/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-3 text-sm font-semibold transition-all"
                      style={{
                        color: colors.text,
                        border: `1px solid ${colors.border}`,
                        borderRadius: "12px",
                        background: "transparent",
                      }}
                    >
                      Login
                    </motion.button>
                  </Link>

                  <Link href="/register">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-4 py-3 text-sm font-semibold text-white transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.emerald})`,
                        borderRadius: "12px",
                        boxShadow: `0 4px 12px ${colors.emerald}30`,
                      }}
                    >
                      Sign Up
                    </motion.button>
                  </Link>
                </div>

                {/* Footer Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="pt-4 text-center"
                >
                  <p
                    className="text-xs"
                    style={{
                      color: colors.textMuted,
                    }}
                  >
                    Your health insights, always safe.
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
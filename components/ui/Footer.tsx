'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Mail, Instagram, ArrowUpRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const navLinks = [
  { label: "Home",            href: "/"               },
  { label: "Risk Assessment", href: "/risk-assesment" },
  { label: "How It Works",    href: "/how-it-works"   },
  { label: "About",           href: "/about"          },
  { label: "Contact",         href: "/contact"        },
];

const legalLinks = [
  { label: "Privacy Policy",  href: "#" },
  { label: "Terms of Service",href: "#" },
  { label: "Cookie Policy",   href: "#" },
];

const socials = [
  { icon: Linkedin,  href: "https://linkedin.com",       label: "LinkedIn"  },
  { icon: Instagram, href: "https://instagram.com",      label: "Instagram" },
  { icon: Mail,      href: "mailto:contact@hmex.health", label: "Email"     },
];

export default function Footer() {
  const { isDark } = useTheme();

  const bg    = isDark ? "#0e1117" : "#0f172a";   // footer is always dark — complements CTA
  const line  = isDark ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.09)";
  const muted = isDark ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.4)";
  const dim   = isDark ? "rgba(255,255,255,.18)" : "rgba(255,255,255,.22)";

  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ background: bg }}
    >
      {/* Ghost brand watermark — anchored to bottom */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span
          style={{
            fontSize: "clamp(5rem,17vw,13rem)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "transparent",
            WebkitTextStroke: `1px rgba(255,255,255,.05)`,
            userSelect: "none",
          }}
        >
          HMEX
        </span>
      </div>

      {/* ── Main grid with full-height vertical lines ── */}
      <div className="relative z-10 mx-auto max-w-7xl">

        {/* Vertical rule — full height of the main content, absolutely positioned */}
        {/* We use a CSS grid with border trick instead for precision */}

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.8fr_1px_1fr_1px_1fr_1px_1fr]"
          style={{ borderBottom: `1px solid ${line}` }}
        >

          {/* ── COL 1: Brand ── */}
          <div className="flex flex-col justify-between gap-10 px-8 py-12 lg:px-10 lg:py-14">
            {/* Logo + name */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 overflow-hidden rounded-full">
                  <Image
                    src="/white logo.png"
                    alt="HMEX"
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="text-[15px] font-bold tracking-tight text-white">
                  H<span className="text-teal-400">MEX</span>
                </span>
              </div>

              <p style={{ color: muted, fontSize: "13.5px", lineHeight: "1.8", maxWidth: "26ch" }}>
                Empowering you to understand and act on your health — before
                NCDs take control.
              </p>
            </div>

            {/* Socials */}
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2.5">
                {socials.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
                    style={{ background: "rgba(255,255,255,.06)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(20,184,166,.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,.06)")}
                  >
                    <Icon className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-teal-400" />
                  </a>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                <span style={{ color: dim, fontSize: "11px" }}>
                  Serving users across 3+ countries
                </span>
              </div>
            </div>
          </div>

          {/* Divider 1 */}
          <div className="hidden lg:block" style={{ background: line }} />

          {/* ── COL 2: Navigate ── */}
          <div className="flex flex-col gap-6 px-8 py-12 lg:px-10 lg:py-14">
            <p style={{ color: dim, fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Navigate
            </p>
            <ul className="flex flex-col gap-3">
              {navLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 transition-colors duration-150"
                    style={{ color: muted, fontSize: "13.5px" }}
                  >
                    <span className="group-hover:text-white transition-colors duration-150">{label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all duration-150 group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider 2 */}
          <div className="hidden lg:block" style={{ background: line }} />

          {/* ── COL 3: Legal ── */}
          <div className="flex flex-col gap-6 px-8 py-12 lg:px-10 lg:py-14">
            <p style={{ color: dim, fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Legal
            </p>
            <ul className="flex flex-col gap-3">
              {legalLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 transition-colors duration-150"
                    style={{ color: muted, fontSize: "13.5px" }}
                  >
                    <span className="group-hover:text-white transition-colors duration-150">{label}</span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all duration-150 group-hover:opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Divider 3 */}
          <div className="hidden lg:block" style={{ background: line }} />

          {/* ── COL 4: Contact ── */}
          <div className="flex flex-col gap-6 px-8 py-12 lg:px-10 lg:py-14">
            <p style={{ color: dim, fontSize: "10.5px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
              Contact
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="mailto:contact@hmex.health"
                className="group inline-flex items-center gap-1.5"
                style={{ color: muted, fontSize: "13.5px" }}
              >
                <span className="group-hover:text-teal-400 transition-colors duration-150">
                  contact@hmex.health
                </span>
              </a>
              <p style={{ color: dim, fontSize: "13px", lineHeight: "1.75", maxWidth: "22ch" }}>
                Built for Africa.
                <br />Designed for the world.
              </p>
            </div>

          </div>

        </div>

        {/* ── Bottom bar ── */}
        <div
          className="flex flex-col items-center justify-between gap-3 px-8 py-5 sm:flex-row lg:px-10"
        >
          <p style={{ color: dim, fontSize: "11.5px" }}>
            © {new Date().getFullYear()} HMEX. All rights reserved.
          </p>
          <p style={{ color: dim, fontSize: "11.5px" }}>
            Empowering healthier communities.
          </p>
        </div>

      </div>
    </footer>
  );
}
import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Mail, Instagram } from 'lucide-react';

const links = [
  { label: "Home",            href: "/"               },
  { label: "Risk Assessment", href: "/risk-assesment" },
  { label: "How It Works",    href: "/how-it-works"   },
  { label: "About",           href: "/about"          },
  { label: "Contact",         href: "/contact"        },
];

const socials = [
  { icon: Linkedin,  href: "https://linkedin.com",          label: "LinkedIn"  },
  { icon: Instagram, href: "https://instagram.com",         label: "Instagram" },
  { icon: Mail,      href: "mailto:contact@hmex.health",    label: "Email"     },
];

export default function Footer() {
  return (
    <footer className="relative w-full overflow-hidden bg-slate-950">

      {/* Ghost brand name — sits behind everything */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex select-none items-end justify-center overflow-hidden"
        aria-hidden="true"
      >
        <span
          className="text-[clamp(5rem,18vw,14rem)] font-black uppercase leading-none tracking-tighter"
          style={{
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,.04)",
            letterSpacing: "-0.03em",
          }}
        >
          HMEX
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-16">

        {/* Top row */}
        <div className="grid grid-cols-1 gap-12 border-b border-white/8 py-14 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 overflow-hidden rounded-full">
                <Image
                  src="/white logo.png"
                  alt="HMEX Logo"
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="text-[15px] font-bold tracking-tight text-white">
                H<span className="text-teal-400">MEX</span>
              </span>
            </div>

            <p className="max-w-[28ch] text-[13.5px] leading-[1.75] text-white/45">
              Empowering you to understand and take control of your
              health — before NCDs take control of you.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-1">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/6 text-white/50 transition-all duration-200 hover:bg-teal-500/20 hover:text-teal-400"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-col gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Navigate
            </p>
            <ul className="flex flex-col gap-2.5">
              {links.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-[13.5px] text-white/50 transition-colors duration-150 hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Legal
            </p>
            <ul className="flex flex-col gap-2.5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[13.5px] text-white/50 transition-colors duration-150 hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact blurb */}
          <div className="flex flex-col gap-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/30">
              Contact
            </p>
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:contact@hmex.health"
                className="text-[13.5px] text-white/50 transition-colors hover:text-teal-400"
              >
                contact@hmex.health
              </a>
              <p className="text-[13.5px] text-white/50">
                Built for Africa.<br />Designed for the world.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-[11.5px] text-white/25">
            © {new Date().getFullYear()} HMEX. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            <p className="text-[11.5px] text-white/25">
              Serving users across 3+ countries
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}
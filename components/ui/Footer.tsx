import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Mail, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0A1F44] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-4">
          <div className="shrink-0 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
                <Image
                  src='/white logo.png'
                  alt="Logo"
                  width={120}
                  height={50}
                  className="object-cover w-full h-full"
                />
              </div>
            <span className="font-bold text-lg text-white tracking-tight">H<span className="text-emerald-600">MEX</span></span>
            </div>
            <p className="text-gray-300 text-lg font-medium max-w-sm">
              Empowering You to Master Your Health.
            </p>
          </div>

          <div className="flex items-center justify-center gap-6 lg:justify-center">
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center group"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="mailto:contact@hmex.health"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center group"
              aria-label="Email"
            >
              <Mail className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-emerald-500 transition-all duration-300 flex items-center justify-center group"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="lg:ml-auto">
            <h3 className="text-lg font-semibold mb-4 text-emerald-400">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-base"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/risk-assesment"
                  className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-base"
                >
                  Risk Assessment
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-base"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-base"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-300 hover:text-emerald-400 transition-colors duration-200 text-base"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} HealthAware. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
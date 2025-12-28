import { Linkedin, Mail, Instagram } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="w-full bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 mb-8">
          {/* Left Section */}
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
            <p className="text-gray-400">Empowering You to Master Your Health.</p>
          </div>

          {/* Right Section - Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
              <a href="/risk-assesment" className="hover:text-emerald-400 transition-colors">
                Risk Assessment
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                How it works
              </a>
              <a href="#" className="hover:text-emerald-400 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-gray-500">© 2025 HealthAware. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
              <Mail size={20} />
            </a>
            <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

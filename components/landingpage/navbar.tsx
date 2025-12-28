"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"
import Image from "next/image"

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Risk Assessment", href: "/risk-assesment" },
    { label: "About", href: "/about" },
<<<<<<< HEAD
    { label: "How It Works", href: "/how-it-works" },
    { label:"Corporates", href: "/corporates" },
=======
    { label: "How It Works", href: "#how-it-works" },
>>>>>>> 6ea6f63 (add contact page)
    { label: "Contact Us", href: "/contact" },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link href='/'>
          <div className="shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              <Image
                src='/white logo.png'
                alt="Logo"
                width={120}
                height={50}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">H<span className="text-emerald-600">MEX</span></span>
          </div>
            </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    group relative font-medium text-sm transition-colors
                    ${isActive ? "text-emerald-600" : "text-gray-600 hover:text-emerald-600"}
                  `}
                >
                  {item.label}

                  {/* left-to-right underline animation */}
                  <span
                    className={`
                      pointer-events-none absolute left-0 -bottom-1 h-0.5 bg-emerald-600 rounded-full
                      transition-transform duration-300 origin-left
                      ${isActive ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100"}
                    `}
                  />
                </Link>
              )
            })}
          </div>

          {/* Desktop Login + Signup */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2 text-sm font-semibold text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>

            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`
                    block px-4 py-2 rounded-md font-medium
                    ${isActive ? "text-emerald-600 bg-emerald-50" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}

            <div className="flex flex-col gap-2 mt-4 px-4">
              <Link
                href="/login"
                className="w-full px-5 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="w-full px-5 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

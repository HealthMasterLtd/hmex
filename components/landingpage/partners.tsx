"use client"

import Image from "next/image"

export default function Partners() {
  const partners = [
    { name: "ALX", logo: "/Alxlogo-black.svg" },
    { name: "TMF", logo: "/TMFlogo.svg" },
    { name: "Bridge for Billions", logo: "/BridgeSquared_logo.png" },
    { name: "Hanga", logo: "/HangPitchFest25.png" },
  ]

  const endlessPartners = [...partners, ...partners]

  return (
    <section className="w-full py-16 md:py-20 px-4 bg-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-balance">
            With Support from
          </h2>
        </div>

        {/* Endless Slider */}
        <div className="relative w-full overflow-hidden">
          <div
            className="flex gap-8 animate-slide whitespace-nowrap"
            style={{ width: `${endlessPartners.length * 200}px` }}
          >
            {endlessPartners.map((partner, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center shrink-0 w-48 h-24 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={120}
                  height={50}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-slide {
          display: flex;
          animation: slide 20s linear infinite;
        }
      `}</style>
    </section>
  )
}

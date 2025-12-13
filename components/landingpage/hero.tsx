/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Main Container */}
      <div className="container mx-auto h-screen px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 h-full gap-12 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
          <div className="space-y-6 animate-slide-in-left z-10 max-w-5xl">
            <h1 className="text-2xl md:text-5xl font-bold text-blue-900 leading-tight text-balance">
              Check Your Health Risk Early – Stay Aware, Stay Healthy.
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed text-balance">
              Assess your NCD risk, get prevention tips, and connect to care – all in one place
            </p>

            <Link href='/risk-assesment'>
            <button className="inline-block px-8 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition-colors shadow-lg hover:shadow-xl">
              Start Your Risk Check
            </button>
            </Link>
          </div>

          {/* RIGHT IMAGE — fixed to match Assessment layout */}
          <div className="relative h-full lg:absolute lg:right-0 lg:top-0 lg:w-1/2">
            <div className="relative w-full h-full">
              <img
                src="/assets/1.png"
                alt="Woman checking health on smartphone"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

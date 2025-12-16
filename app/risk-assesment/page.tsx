"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function HealthCheckPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative min-h-screen overflow-hidden bg-white">
        <div className="container mx-auto px-6 lg:px-12 h-screen">
          <div className="grid lg:grid-cols-2 gap-12 h-full items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
            {/* Left Content */}
            <div className="space-y-8 relative z-10">
              <div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-2 text-(--hmex-dark)">
                  Start Your Personalized
                </h1>
                <h2 className="text-5xl lg:text-6xl font-bold leading-tight text-(--hmex-green)">
                  Health Check
                </h2>
              </div>

              <p className="text-base lg:text-lg leading-relaxed max-w-lg text-(--hmex-gray)">
                Private. Fast. Reliable health insights. Answer a few quick
                questions to see your diabetes and blood pressure risk snapshot.
              </p>

              <Link href='/questions'>
                <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base lg:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl bg-(--hmex-green) text-white cursor-pointer">
                Start Your Free Assessment
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
              </Link>
            </div>

            {/* Right Image - Positioned to extend to edge */}
            <div className="relative h-full lg:absolute lg:right-0 lg:top-0 lg:w-1/2">
              <div className="relative w-full h-full">
                <Image
                  src="/assets/6new.png"
                  alt="Health professional"
                  fill
                  className="object-cover object-center"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative min-h-screen py-20 overflow-hidden bg-(--hmex-green)">
        <div className="absolute right-10 top-20 w-full max-w-xs pointer-events-none z-0 opacity-30">
          <div className="relative w-full aspect-square">
            <Image 
              src="/assets/41.png" 
              alt="" 
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Medical Cross Pattern - Left Side */}
        <div className="absolute left-10 bottom-20 w-full max-w-[200px] pointer-events-none z-0 opacity-20">
          <div className="relative w-full aspect-square">
            <Image 
              src="/assets/41.png" 
              alt="" 
              fill
              className="object-contain"
            />
          </div>
        </div>

        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              How It Works — See It in Action
            </h2>
            <p className="text-base lg:text-lg text-white/90 max-w-2xl mx-auto">
              A simple walkthrough showing how our smart assessment gives you fast, accurate insights.
            </p>
          </div>

          {/* Laptop Mockup */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="relative w-full h-80">
              <Image
                src="/assets/pczoom.png"
                alt="Laptop demonstration"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center cursor-pointer">
            <Link href='/questions'>
            <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base lg:text-lg font-semibold transition-all duration-300 shadow-xl bg-(--hmex-dark) text-white">
              Begin Your Test Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

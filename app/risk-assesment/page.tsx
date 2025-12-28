"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landingPage/navbar";
import Footer from "@/components/ui/Footer";

export default function HealthCheckPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar/>
      
      <section className="relative min-h-screen overflow-hidden bg-white">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
          <div className="text-[12rem] sm:text-[16rem] md:text-[20rem] lg:text-[25rem] xl:text-[30rem] font-black text-gray-100/30 whitespace-nowrap animate-pulse">
            HMEX
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen max-w-7xl mx-auto py-12 lg:py-0">
            <div className="space-y-6 lg:space-y-8 animate-fade-in-up">
              
              {/* Main Heading with Background Text */}
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="block text-[#1a3a52] mb-2">
                    Start Your Personalized
                  </span>
                  <span className="block bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent animate-gradient">
                    Health Check
                  </span>
                </h1>
              </div>

              <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-600 max-w-xl">
                Private. Fast. Reliable health insights. Answer a few quick questions to see your diabetes and blood pressure risk snapshot.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/questions">
                  <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:scale-105">
                    Start Your Free Assessment
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 border-2 border-teal-500 text-teal-600 hover:bg-teal-50">
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Right Image - Better sized */}
            <div className="relative h-[400px] sm:h-[500px] lg:h-[600px] animate-fade-in">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-[3rem] transform rotate-6"></div>
              <div className="relative h-full rounded-[3rem] overflow-hidden transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/assets/6new.png"
                  alt="Health professional"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 right-10 w-20 h-20 bg-teal-200 rounded-full blur-3xl opacity-40 animate-float"></div>
        <div className="absolute bottom-32 left-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl opacity-40 animate-float-delayed"></div>
      </section>

      {/* How It Works Section - Keep as is */}
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
      
      <Footer/>
    </div>
  );
}
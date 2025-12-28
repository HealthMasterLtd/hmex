'use client';/* eslint-disable @next/next/no-img-element */
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Background Text Effect */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="text-[12rem] sm:text-[16rem] md:text-[20rem] lg:text-[25rem] xl:text-[30rem] font-black text-gray-100/30 whitespace-nowrap animate-pulse">
          HMEX
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen max-w-7xl mx-auto py-12 lg:py-0">
          {/* Left Content */}
          <div className="space-y-6 lg:space-y-8 animate-fade-in-up">
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block text-[#1a3a52] mb-2 sm:mb-3">
                Check Your Health Risk Early –
              </span>
              <span className="block text-[#1a3a52] mb-2 sm:mb-3">
                Stay Aware,
              </span>
              <span className="block bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent animate-gradient">
                Stay Healthy.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-xl">
              Assess your NCD risk, get prevention tips, and connect to care – 
              all in one place with our AI-powered health assessment platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/risk-assessment">
                <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:scale-105">
                  Start Your Risk Check
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/how-it-works">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 border-2 border-teal-500 text-teal-600 hover:bg-teal-50">
                  Learn How It Works
                </button>
              </Link>
            </div>
          </div>

          {/* Right Image - Clean and straight */}
          <div className="relative h-[300px] sm:h-[400px] lg:h-[550px] animate-fade-in mt-8 lg:mt-0">
            {/* Background decorative element */}
            <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-[2rem] sm:rounded-[3rem]"></div>
            
            {/* Main image container */}
            <div className="relative h-full rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl">
              <img
                src="/assets/1.png"
                alt="Woman checking health on smartphone with healthcare professional"
                className="w-full h-full object-cover object-center"
              />
              
              {/* Overlay gradient for better text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating background elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-teal-100 rounded-full blur-3xl opacity-30 animate-float"></div>
      <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-30 animate-float-delayed"></div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-30px);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
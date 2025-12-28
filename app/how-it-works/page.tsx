"use client";

import Image from "next/image";
import { ArrowRight, CheckCircle, Shield, Clock, Heart, Users, ChevronDown } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import HowItWorks from "@/components/landingpage/how-it-works";
import { useState } from "react";

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  const benefits = [
    {
      icon: Shield,
      title: "100% Private & Secure",
      description: "Your health data is encrypted and never shared without your consent. We prioritize your privacy above all.",
    },
    {
      icon: Clock,
      title: "Results in Minutes",
      description: "Get instant risk assessment results powered by advanced AI algorithms trained on millions of health records.",
    },
    {
      icon: Heart,
      title: "Personalized Care Plan",
      description: "Receive customized health recommendations based on your unique risk profile and lifestyle factors.",
    },
    {
      icon: Users,
      title: "Expert-Backed Science",
      description: "Our assessments are developed in collaboration with leading healthcare professionals and researchers.",
    },
  ];

  const stats = [
    { number: "100K+", label: "Health Assessments Completed" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "50+", label: "Healthcare Partners" },
    { number: "24/7", label: "Available Support" },
  ];

  const faqs = [
    {
      question: "How accurate is the health risk assessment?",
      answer: "Our AI-powered assessment has a 95% accuracy rate, validated against clinical standards and continuously improved with real-world data from healthcare professionals.",
    },
    {
      question: "Is my health information secure?",
      answer: "Absolutely. We use bank-level encryption and comply with international healthcare data protection standards. Your information is never sold or shared without explicit consent.",
    },
    {
      question: "How long does the assessment take?",
      answer: "The complete assessment takes just 5-7 minutes. You'll answer simple questions about your lifestyle, health history, and current symptoms.",
    },
    {
      question: "What happens after I get my results?",
      answer: "You'll receive a detailed risk report with personalized recommendations. If needed, we'll connect you with nearby healthcare facilities for further consultation.",
    },
    {
      question: "Do I need any medical equipment?",
      answer: "No equipment needed! Our assessment uses your self-reported information. However, knowing basic vitals like blood pressure can improve accuracy.",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section - Redesigned */}
      <section className="relative min-h-screen overflow-hidden bg-white">
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
              
              
              {/* Main Heading with Background Text */}
              <div className="relative">
                <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="block text-[#1a3a52] mb-2">
                    Understanding Your
                  </span>
                  <span className="block text-[#1a3a52]">
                    Health Risk Has
                  </span>
                  <span className="block text-[#1a3a52]">
                    Never Been
                  </span>
                  <span className="block bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent animate-gradient">
                    This Easy
                  </span>
                </h1>
              </div>

              <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-gray-600 max-w-xl">
                Discover how our AI-powered platform helps you take control of your health through simple questions, instant insights, and personalized care guidance.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/questions">
                  <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:scale-105">
                    Start Free Assessment
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
                  src="/assets/works.png"
                  alt="Healthcare professional"
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

      {/* How It Works Component */}
      <HowItWorks />

      {/* Benefits Section - Light Theme Cards */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-emerald-50 via-teal-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a5f7a] mb-4">
                Why Choose HMEX Health Assessment?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                We combine cutting-edge technology with medical expertise to provide you with the most accurate and actionable health insights.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border-2 border-gray-100 p-6 sm:p-8 rounded-3xl hover:border-teal-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-teal-50 group-hover:bg-gradient-to-br group-hover:from-teal-500 group-hover:to-emerald-500 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 transition-all duration-300">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#1a5f7a] mb-2 sm:mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Visual Journey Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a5f7a] mb-4 px-4">
                A Visual Journey Through Your Assessment
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                See how simple and intuitive our platform makes understanding your health risks.
              </p>
            </div>

            <div className="space-y-16 sm:space-y-20">
              {/* Step 1 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-4 sm:space-y-6 px-4">
                  <div className="inline-block px-4 py-2 bg-teal-100 rounded-full text-teal-700 text-xs sm:text-sm font-bold">
                    STEP 1
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a5f7a]">
                    Answer Simple Questions
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    No medical jargon or complicated forms. Just straightforward questions about your lifestyle, family history, and current health.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Quick 5-7 minute completion time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Progress saved automatically</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Clear explanations for every question</span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80"
                    alt="Person filling health questionnaire"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] order-2 lg:order-1 rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80"
                    alt="AI analyzing health data"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2 px-4">
                  <div className="inline-block px-4 py-2 bg-emerald-100 rounded-full text-emerald-700 text-xs sm:text-sm font-bold">
                    STEP 2
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a5f7a]">
                    AI-Powered Analysis
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Our advanced machine learning algorithms analyze your responses instantly and provide accurate predictions.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Validated against clinical standards</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Considers multiple health dimensions</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Results available in seconds</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                <div className="space-y-4 sm:space-y-6 px-4">
                  <div className="inline-block px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-xs sm:text-sm font-bold">
                    STEP 3
                  </div>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a5f7a]">
                    Get Your Personalized Report
                  </h3>
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    Receive a comprehensive report with actionable recommendations tailored to your situation.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Visual risk score breakdown</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Personalized lifestyle recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">Downloadable PDF report</span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=800&q=80"
                    alt="Health report on tablet"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Matching Design Image */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a5f7a] mb-4 px-4">
                Trusted by Thousands
              </h2>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto px-4">
                Join the growing community taking control of their health with HMEX
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="relative bg-white border border-gray-200 p-8 sm:p-10 rounded-2xl text-center transition-all duration-300 hover:shadow-xl hover:border-teal-300 overflow-hidden group"
                >
                  {/* Background Number Effect */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span className="text-[8rem] sm:text-[10rem] lg:text-[12rem] font-black text-gray-100 opacity-30 group-hover:opacity-40 transition-opacity">
                      {stat.number.charAt(0)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-teal-600 mb-3">
                      {stat.number}
                    </div>
                    <div className="text-gray-700 text-sm sm:text-base font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - Accordion Style */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a5f7a] mb-4 px-4">
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-gray-600 px-4">
                Everything you need to know about our health assessment
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-teal-300 hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-[#1a5f7a] pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0 transition-transform duration-300 ${
                        openFaq === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    } overflow-hidden`}
                  >
                    <div className="px-6 pb-6">
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-slate-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-48 sm:w-64 h-48 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 px-4">
                  Ready to Take Control of Your Health?
                </h2>
                <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
                  Start your free health risk assessment now and get personalized insights in minutes.
                </p>
                <Link href="/questions">
                  <button className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 shadow-2xl hover:shadow-3xl bg-white text-teal-600 hover:bg-gray-50 hover:scale-105">
                    Begin Your Free Assessment
                    <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <p className="text-white/80 mt-4 sm:mt-6 text-xs sm:text-sm px-4">
                  No credit card required • 100% Private & Secure • Takes only 5 minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

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
    </div>
  );
}
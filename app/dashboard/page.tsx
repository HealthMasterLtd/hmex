"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Utensils,
  Users,
  TrendingUp,
  Calendar,
  Lock,
  ChevronRight,
  Info,
} from "lucide-react";
import Navbar from "@/components/landingpage/navbar";

export default function DashboardPage() {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);

  // Mock user data
  const userData = {
    name: "Irene",
    overallRisk: 73,
    riskLevel: "Low Risk",
    riskColor: "text-emerald-600",
  };

  // Risk cards data
  const riskCards = [
    {
      id: "blood-pressure",
      icon: Activity,
      title: "Blood Pressure Risk",
      level: "Moderate",
      levelColor: "text-orange-600",
      barColor: "bg-orange-500",
      progress: 65,
      bgGradient: "from-orange-50 to-orange-100",
    },
    {
      id: "diabetes",
      icon: Activity,
      title: "Diabetes Risk",
      level: "Low",
      levelColor: "text-emerald-600",
      barColor: "bg-emerald-500",
      progress: 25,
      bgGradient: "from-emerald-50 to-emerald-100",
    },
    {
      id: "bmi",
      icon: TrendingUp,
      title: "BMI Status",
      level: "Healthy",
      levelColor: "text-emerald-600",
      barColor: "bg-emerald-500",
      progress: 45,
      bgGradient: "from-teal-50 to-teal-100",
    },
  ];

  // Risk factors data
  const riskFactors = [
    {
      icon: Activity,
      iconBg: "bg-teal-100",
      iconColor: "text-teal-600",
      title: "Activity Level",
      description: "You're averaging 8,000 steps daily — slightly below the recommended 10,000.",
      indicator: "warning",
      indicatorColor: "bg-yellow-400",
    },
    {
      icon: Utensils,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      title: "Diet Pattern",
      description: "Your diet is mostly balanced with room to reduce sodium intake.",
      indicator: "info",
      indicatorColor: "bg-blue-400",
    },
    {
      icon: Users,
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      title: "Family History",
      description: "One family member has had heart disease, which slightly increases your risk.",
      indicator: "alert",
      indicatorColor: "bg-rose-400",
    },
  ];

  // Next steps data
  const nextSteps = [
    {
      icon: Activity,
      text: "Walk 20 minutes today",
      color: "bg-teal-100 text-teal-700",
      iconColor: "text-teal-600",
    },
    {
      icon: Utensils,
      text: "Reduce salt intake",
      color: "bg-orange-100 text-orange-700",
      iconColor: "text-orange-600",
    },
    {
      icon: Activity,
      text: "Schedule BP check",
      color: "bg-teal-100 text-teal-700",
      iconColor: "text-teal-600",
    },
    {
      icon: Calendar,
      text: "Retake assessment in 3 months",
      color: "bg-purple-100 text-purple-700",
      iconColor: "text-purple-600",
    },
  ];

  // Assessment history data
  const assessmentHistory = [
    {
      date: "December 28, 2025",
      description: "Overall risk improved from moderate to low",
      icon: "success",
      iconColor: "bg-emerald-500",
    },
    {
      date: "September 15, 2025",
      description: "Blood pressure slightly elevated",
      icon: "warning",
      iconColor: "bg-orange-500",
    },
    {
      date: "June 3, 2025",
      description: "First assessment completed",
      icon: "info",
      iconColor: "bg-gray-500",
    },
  ];

  // Chart data for health risk distribution
  const chartData = [
    { value: 2, position: "2" },
    { value: 3, position: "3" },
    { value: 5, position: "4" },
    { value: 6, position: "5" },
    { value: 7, position: "6" },
    { value: 5, position: "7" },
    { value: 6, position: "8" },
    { value: 4, position: "9" },
    { value: 3, position: "10" },
    { value: 2, position: "12" },
    { value: 1, position: "14" },
  ];

  const maxChartValue = Math.max(...chartData.map((d) => d.value));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          {/* Header Section */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
            {/* Greeting */}
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl sm:text-2xl font-bold">
                    {userData.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1e3a5f] italic">
                    Good Morning, {userData.name}!
                  </h1>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 italic">
                Here&apos;s a simple overview of your health insights.
              </p>
              <div className="relative w-32 h-32 sm:w-40 sm:h-40">
                <Image
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80"
                  alt="Doctor illustration"
                  fill
                  className="object-contain"
                />
              </div>
            </div>

            {/* Overall Risk Circle */}
            <div className="flex justify-center lg:justify-end animate-fade-in">
              <div className="relative">
                <div className="text-center mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-[#1e3a5f]">
                    Overall Health Risk
                  </h3>
                </div>
                <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="20"
                      strokeDasharray={`${(userData.overallRisk / 100) * 283} 283`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-5xl sm:text-6xl font-bold text-emerald-600">
                      {userData.overallRisk}%
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-emerald-600 mt-1">
                      {userData.riskLevel}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Snapshot Section */}
          <div className="animate-fade-in-up animation-delay-200">
            <div className="bg-gradient-to-br from-[#2c3e50] to-[#1e3a5f] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8">
                  Risk Snapshot
                </h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {riskCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.id}
                        className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                        onClick={() => setSelectedRisk(card.id)}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Info className="w-5 h-5" />
                          </button>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-[#1e3a5f] mb-2">
                          {card.title}
                        </h3>

                        <div className={`text-xs sm:text-sm font-semibold ${card.levelColor} mb-3`}>
                          {card.level}
                        </div>

                        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`absolute left-0 top-0 h-full ${card.barColor} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${card.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Risk Factors and Chart Section */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* What's Influencing Your Risk */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-in-up animation-delay-300">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-6">
                What&apos;s Influencing Your Risk
              </h2>

              <div className="space-y-4 sm:space-y-5">
                {riskFactors.map((factor, index) => {
                  const Icon = factor.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <div className={`w-12 h-12 rounded-xl ${factor.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-6 h-6 ${factor.iconColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm sm:text-base font-bold text-[#1e3a5f]">
                            {factor.title}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          {factor.description}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${factor.indicatorColor} flex-shrink-0 mt-2`}></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Health Risk Distribution Chart */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-in-up animation-delay-400">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-6">
                Health Risk Distribution
              </h2>

              <div className="relative h-64 sm:h-80">
                <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-2">
                  {chartData.map((data, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center justify-end group"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-teal-500 cursor-pointer relative"
                        style={{
                          height: `${(data.value / maxChartValue) * 100}%`,
                          animation: "grow-up 0.8s ease-out forwards",
                        }}
                      >
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded shadow-lg">
                            {data.value}
                          </span>
                        </div>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-2 font-medium">
                        {data.position}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs sm:text-sm text-gray-600">
                  Your risk score falls in the <span className="font-bold text-emerald-600">lower range</span> compared to similar profiles
                </p>
              </div>
            </div>
          </div>

          {/* Next Steps Section */}
          <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-in-up animation-delay-500">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-6">
              Your Next Best Steps
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {nextSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className={`${step.color} rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer group`}
                  >
                    <Icon className={`w-5 h-5 ${step.iconColor} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                    <span className="text-xs sm:text-sm font-semibold">
                      {step.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <button className="w-full sm:w-auto bg-[#1e3a5f] hover:bg-[#2c3e50] text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-full flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-xl group">
              <Activity className="w-5 h-5" />
              Connect to a Health Professional
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Assessment History */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg animate-fade-in-up animation-delay-600">
            <h2 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] mb-6">
              Assessment History
            </h2>

            <div className="space-y-4">
              {assessmentHistory.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group cursor-pointer"
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${item.iconColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm text-gray-500 mb-1">
                      {item.date}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-[#1e3a5f]">
                      {item.description}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-2xl p-6 sm:p-8 flex items-start gap-4 animate-fade-in-up animation-delay-700">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <Lock className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-teal-900 mb-2">
                Your Privacy Matters
              </h3>
              <p className="text-sm sm:text-base text-teal-800 leading-relaxed">
                Your health data is private, secure, and only visible to you. We never share your information without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </div>

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

        @keyframes grow-up {
          from {
            height: 0;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .animation-delay-500 {
          animation-delay: 0.5s;
          opacity: 0;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }

        .animation-delay-700 {
          animation-delay: 0.7s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
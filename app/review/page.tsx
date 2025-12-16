/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  AlertCircle, 
  Lock, 
  TrendingUp, 
  Heart, 
  Droplet,
  Zap,
  Target,
  FileText,
  Download,
  Shield,
  BarChart3,
  CheckCircle,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Activity
} from "lucide-react";
import { groqService } from "@/services/GroqService";
import type { DualRiskAssessment } from "@/services/GroqService";
import "@/styles/review.scss";
import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";

const RiskPreviewPage: React.FC = () => {
  const [assessment, setAssessment] = useState<DualRiskAssessment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    generateAssessment();
  }, []);

  const generateAssessment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await groqService.generateRiskAssessment();
      setAssessment(result);
    } catch (err) {
      console.error('Error generating assessment:', err);
      setError('Failed to generate your risk assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSignUp = () => {
    router.push('/login');
  };

  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'low':
        return 'from-green-400 to-emerald-500';
      case 'slightly-elevated':
        return 'from-amber-400 to-yellow-500';
      case 'moderate':
        return 'from-orange-400 to-orange-500';
      case 'high':
        return 'from-red-400 to-rose-500';
      case 'very-high':
        return 'from-rose-600 to-red-700';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getRiskIcon = (level: string, type: 'diabetes' | 'hypertension') => {
    const baseIcon = type === 'diabetes' ? Droplet : Heart;
    
    const iconProps = {
      size: 28,
      className: level === 'low' || level === 'slightly-elevated' 
        ? 'text-emerald-500' 
        : level === 'moderate'
        ? 'text-amber-500'
        : 'text-rose-500'
    };

    return React.createElement(baseIcon, iconProps);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md border border-gray-100 animate-scale-in">
          <div className="loading-spinner">
            <Loader2 className="w-16 h-16 text-teal-500 mx-auto mb-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Analyzing Your Health Profile
          </h2>
          <p className="text-gray-600">
            Generating your personalized risk assessment...
          </p>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md border border-gray-100 animate-fade-in-up">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Assessment Failed
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to generate your risk assessment'}
          </p>
          <button
            onClick={() => router.push('/questions')}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover-lift"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Navbar/>
      <main className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 px-4 py-2 rounded-full border border-teal-200 mb-4">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span className="text-sm font-medium text-teal-700">Evidence-Based Assessment</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Your Health Risk Snapshot
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Based on validated medical frameworks. This is an educational tool, not a medical diagnosis.
          </p>
        </div>

        {/* Risk Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-fade-in-up animate-stagger-1">
          {/* Diabetes Risk */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-50 to-teal-50 rounded-xl">
                {getRiskIcon(assessment.diabetesRisk.level, 'diabetes')}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Diabetes Risk</h3>
                <p className="text-gray-500 text-sm">Type 2 Diabetes</p>
              </div>
            </div>
            <div className={`
              bg-gradient-to-r ${getRiskColor(assessment.diabetesRisk.level)}
              rounded-xl p-4 text-center
            `}>
              <div className="text-white text-xl font-bold">
                {assessment.diabetesRisk.level.toUpperCase().replace('-', ' ')}
              </div>
            </div>
          </div>

          {/* Hypertension Risk */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl">
                {getRiskIcon(assessment.hypertensionRisk.level, 'hypertension')}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Hypertension Risk</h3>
                <p className="text-gray-500 text-sm">High Blood Pressure</p>
              </div>
            </div>
            <div className={`
              bg-gradient-to-r ${getRiskColor(assessment.hypertensionRisk.level)}
              rounded-xl p-4 text-center
            `}>
              <div className="text-white text-xl font-bold">
                {assessment.hypertensionRisk.level.toUpperCase().replace('-', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl shadow-lg border border-teal-200 p-6 mb-8 animate-fade-in-up animate-stagger-2">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Initial Assessment</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            {assessment.summary.substring(0, 180)}...
          </p>
          <div className="bg-white/60 rounded-xl p-4 border border-teal-300">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-gray-800 font-semibold">Complete analysis available</p>
                <p className="text-gray-600 text-sm">Sign up to unlock full report</p>
              </div>
            </div>
          </div>
        </div>

        {/* Locked Content Preview */}
        <div className="relative mb-8 animate-fade-in-up animate-stagger-3">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 opacity-40 blur-[2px]">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-xl p-4">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center p-8 animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Unlock Full Report
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm">
                Get detailed analysis, personalized recommendations, and your complete health assessment
              </p>
              <button
                onClick={handleLoginSignUp}
                className="
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-700 hover:to-indigo-700
                  text-white
                  font-semibold
                  px-8
                  py-4
                  rounded-full
                  shadow-lg
                  transition-all
                  duration-300
                  flex items-center gap-2 mx-auto hover-scale
                "
              >
                <Sparkles className="w-5 h-5" />
                SIGN UP FOR FREE
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-8 animate-fade-in-up animate-stagger-4">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            What You&apos;ll Get
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: BarChart3, title: "Risk Scores", color: "from-blue-400 to-cyan-400" },
              { icon: Target, title: "Key Factors", color: "from-emerald-400 to-teal-400" },
              { icon: Zap, title: "Action Plan", color: "from-amber-400 to-orange-400" },
              { icon: FileText, title: "Full Analysis", color: "from-violet-400 to-purple-400" },
              { icon: Shield, title: "Guidance", color: "from-rose-400 to-pink-400" },
              { icon: Download, title: "PDF Report", color: "from-gray-400 to-slate-400" }
            ].map((item, index) => (
              <div
                key={item.title}
                className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300 hover-lift animate-fade-in-up animate-stagger-${index + 1}`}
              >
                <div className={`inline-flex p-3 bg-gradient-to-br ${item.color} rounded-xl mb-3`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-8 animate-fade-in-up animate-stagger-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-3">
                Important Medical Disclaimer
              </h3>
              <div className="text-blue-800 text-sm leading-relaxed space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>This is an <strong>educational screening tool</strong>, not a medical diagnosis</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Based on validated frameworks (FINDRISC & Framingham)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Consult a healthcare professional for proper diagnosis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center animate-fade-in-up animate-stagger-6">
          <button
            onClick={handleLoginSignUp}
            className="
              bg-gradient-to-r
              from-emerald-500
              to-teal-500
              hover:from-emerald-600
              hover:to-teal-600
              text-white
              font-bold
              px-8
              py-4
              rounded-full
              shadow-xl
              transition-all
              duration-300
              hover:shadow-2xl
              inline-flex items-center gap-3
              mb-4 hover-scale
            "
          >
            Get Your Complete Report
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-gray-500 text-sm">
            Free • Secure • No credit card required
          </p>
        </div>

      </main>
      <Footer/>
    </div>
  );
};

export default RiskPreviewPage;
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  AlertCircle, 
  Droplet,
  Heart,
  ArrowRight,
  MessageCircle,
  RefreshCw,
  Apple,
  Activity,
  Stethoscope,
  AlertTriangle,
  Info
} from "lucide-react";
import { groqService } from "@/services/GroqService";
import type { DualRiskAssessment } from "@/services/GroqService";
import "@/styles/review.scss";
import Navbar from "@/components/landingPage/navbar";
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
        return 'bg-green-500';
      case 'slightly-elevated':
        return 'bg-yellow-500';
      case 'moderate':
        return 'bg-orange-500';
      case 'high':
        return 'bg-red-500';
      case 'very-high':
        return 'bg-red-700';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskScore = (level: string): string => {
    switch (level) {
      case 'low':
        return '2/20';
      case 'slightly-elevated':
        return '5/20';
      case 'moderate':
        return '8/20';
      case 'high':
        return '14/20';
      case 'very-high':
        return '18/20';
      default:
        return '0/20';
    }
  };

  const getRecommendations = (type: 'diabetes' | 'hypertension', level: string) => {
    if (type === 'diabetes') {
      return [
        'Schedule regular health check-ups with your doctor',
        'Reduce intake of sugary drinks and processed foods',
        'Increase physical activity to at least 150 minutes per week'
      ];
    } else {
      return [
        'Monitor your blood pressure regularly at home',
        'Reduce salt intake significantly',
        'Increase potassium-rich foods like bananas and leafy greens'
      ];
    }
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
      
      {/* Main Content Area with Green Background */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in-down">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Here is your quick risk snapshot
            </h1>
          </div>

          {/* Risk Cards Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Diabetes Risk Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Diabetes Risk</h3>
                    <p className="text-sm text-gray-500">Type 2 Diabetes Assessment</p>
                  </div>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>

              {/* Risk Level */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${
                    assessment.diabetesRisk.level === 'low' ? 'text-green-600' :
                    assessment.diabetesRisk.level === 'moderate' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {assessment.diabetesRisk.level.charAt(0).toUpperCase() + assessment.diabetesRisk.level.slice(1).replace('-', ' ')}
                  </span>
                  <span className="text-gray-600 font-semibold">
                    Score: {getRiskScore(assessment.diabetesRisk.level)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getRiskColor(assessment.diabetesRisk.level)}`}
                    style={{
                      width: assessment.diabetesRisk.level === 'low' ? '20%' :
                             assessment.diabetesRisk.level === 'moderate' ? '50%' :
                             assessment.diabetesRisk.level === 'high' ? '80%' : '30%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Recommendations Preview */}
              <div className="space-y-2">
                {getRecommendations('diabetes', assessment.diabetesRisk.level).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* Blur overlay for locked content */}
              <div className="mt-6 relative">
                <div className="blur-sm opacity-50 pointer-events-none">
                  <div className="h-20 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleLoginSignUp}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Sign Up to See More
                  </button>
                </div>
              </div>
            </div>

            {/* Hypertension Risk Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 transform hover:scale-105 transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Hypertension Risk</h3>
                    <p className="text-sm text-gray-500">High Blood Pressure Assessment</p>
                  </div>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>

              {/* Risk Level */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-bold ${
                    assessment.hypertensionRisk.level === 'low' ? 'text-green-600' :
                    assessment.hypertensionRisk.level === 'moderate' ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {assessment.hypertensionRisk.level.charAt(0).toUpperCase() + assessment.hypertensionRisk.level.slice(1).replace('-', ' ')}
                  </span>
                  <span className="text-gray-600 font-semibold">
                    Score: {getRiskScore(assessment.hypertensionRisk.level)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${getRiskColor(assessment.hypertensionRisk.level)}`}
                    style={{
                      width: assessment.hypertensionRisk.level === 'low' ? '20%' :
                             assessment.hypertensionRisk.level === 'moderate' ? '50%' :
                             assessment.hypertensionRisk.level === 'high' ? '80%' : '30%'
                    }}
                  ></div>
                </div>
              </div>

              {/* Recommendations Preview */}
              <div className="space-y-2">
                {getRecommendations('hypertension', assessment.hypertensionRisk.level).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* Blur overlay for locked content */}
              <div className="mt-6 relative">
                <div className="blur-sm opacity-50 pointer-events-none">
                  <div className="h-20 bg-gray-100 rounded-xl"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={handleLoginSignUp}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Sign Up to See More
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Cards */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8">
            
            {/* Nutrition Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Apple className="w-8 h-8 text-teal-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Nutrition Matters</h4>
              <p className="text-sm text-gray-600">
                Focus on whole foods, vegetables, and balanced meals
              </p>
            </div>

            {/* Stay Active Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Stay Active</h4>
              <p className="text-sm text-gray-600">
                Aim for 150 minutes of moderate exercise per week
              </p>
            </div>

            {/* Regular Checkups Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center transform hover:scale-105 transition-all">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-8 h-8 text-pink-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Regular Checkups</h4>
              <p className="text-sm text-gray-600">
                Visit your doctor for routine health screenings
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleLoginSignUp}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-full shadow-xl transition-all duration-300 flex items-center gap-3 hover:scale-105"
            >
              <MessageCircle className="w-5 h-5" />
              Chat With a Doctor on WhatsApp
            </button>
            
            <button
              onClick={() => router.push('/questions')}
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-4 rounded-full shadow-lg transition-all duration-300 flex items-center gap-3 hover:scale-105"
            >
              <RefreshCw className="w-5 h-5" />
              Take Assessment Again
            </button>
          </div>

          {/* Disclaimer */}
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Info className="w-5 h-5 text-white" />
              <span className="font-bold text-white">Disclaimer:</span>
            </div>
            <p className="text-white text-sm max-w-4xl mx-auto">
              This risk assessment is for educational purposes only and should not be considered medical advice. Always consult with qualified healthcare professionals for diagnosis and treatment.
            </p>
          </div>

        </div>
      </div>

      {/* Full Report Teaser Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Want Your Complete Health Analysis?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Sign up for free to unlock detailed recommendations, personalized action plans, and downloadable reports
          </p>
          
          <button
            onClick={handleLoginSignUp}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold px-12 py-5 rounded-full shadow-2xl transition-all duration-300 inline-flex items-center gap-3 hover:scale-105 text-lg"
          >
            Get Your Full Report Free
            <ArrowRight className="w-6 h-6" />
          </button>
          
          <p className="text-gray-500 text-sm mt-4">
            No credit card required • Instant access • 100% Secure
          </p>
        </div>
      </div>

      <Footer/>
    </div>
  );
};

export default RiskPreviewPage;
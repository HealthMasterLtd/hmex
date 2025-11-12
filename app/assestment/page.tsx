// app/assessment/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Check, AlertCircle, Heart, Activity, Shield, Lock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Footer from '@/components/ui/Footer';
import { geminiService, Question, RiskAssessment } from '@/services/gemini_service';

export default function AssessmentPage() {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string | number>('');
  const [messages, setMessages] = useState<Array<{ type: 'bot' | 'user'; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskAssessment | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startAssessment = async () => {
    setStarted(true);
    setMessages([
      {
        type: 'bot',
        content: "Hi there! 👋 I'm your personal health assistant. I'll ask you some questions to understand your health better. This will only take about 2-3 minutes. Ready to get started?",
      },
    ]);
    
    setLoading(true);
    try {
      const firstQuestion = await geminiService.getNextQuestion();
      if (firstQuestion) {
        setCurrentQuestion(firstQuestion);
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { type: 'bot', content: firstQuestion.question },
          ]);
          setLoading(false);
        }, 800);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: "I'm having trouble connecting. Please make sure your Gemini API key is configured correctly." },
      ]);
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!currentQuestion || currentAnswer === '') return;

    setLoading(true);

    // Add user's answer to chat
    let answerText: string;
    if (typeof currentAnswer === 'boolean') {
      answerText = currentAnswer ? 'Yes' : 'No';
    } else if (currentQuestion.type === 'slider') {
      answerText = `${currentAnswer}${currentQuestion.unit ? ` ${currentQuestion.unit}` : ''}`;
    } else {
      answerText = String(currentAnswer);
    }
    
    setMessages(prev => [
      ...prev,
      { type: 'user', content: answerText },
    ]);

    // Save answer
    geminiService.saveAnswer(currentQuestion, currentAnswer);

    // Get next question
    try {
      const nextQuestion = await geminiService.getNextQuestion();
      setLoading(false);
      setCurrentAnswer('');

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            { type: 'bot', content: nextQuestion.question },
          ]);
        }, 500);
      } else {
        // Assessment complete - generate report
        setCompleted(true);
        setGeneratingReport(true);
        setMessages(prev => [
          ...prev,
          { type: 'bot', content: "Perfect! Thank you for answering all my questions. 🎉 Let me analyze your responses and prepare your personalized health risk report..." },
        ]);

        // Generate AI assessment
        const result = await geminiService.generateRiskAssessment();
        setRiskResult(result);
        setGeneratingReport(false);
      }
    } catch (error) {
      console.error('Error getting next question:', error);
      setLoading(false);
      setMessages(prev => [
        ...prev,
        { type: 'bot', content: "I encountered an issue. Let me try again..." },
      ]);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-emerald-500';
      case 'moderate': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'very-high': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-emerald-50 border-emerald-200';
      case 'moderate': return 'bg-yellow-50 border-yellow-200';
      case 'high': return 'bg-orange-50 border-orange-200';
      case 'very-high': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const handleViewFullReport = () => {
    router.push(`/auth?from=assessment&risk=${riskResult?.riskLevel}`);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 bg-gradient-to-br from-blue-50 via-white to-emerald-50">
          {/* Navigation */}
          <nav className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg sm:text-xl">HM</span>
                </div>
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  HMEX
                </span>
              </Link>
              <Link
                href="/auth"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-[#0A1F44] text-white rounded-full font-medium hover:bg-[#0d2a5c] transition-all duration-300 text-sm sm:text-base"
              >
                LOGIN/SIGN UP
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                AI-Powered Health Assessment
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0A1F44] leading-tight">
                Check Your <span className="text-emerald-500">NCD Risk</span>
                <br />
                in 60 Seconds
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
                Private. Fast. Reliable AI-powered health insights.
              </p>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mt-12">
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-emerald-100 hover:border-emerald-300 transition-all duration-300">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Check className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0A1F44] mb-2">Your data is confidential</h3>
                  <p className="text-gray-600 text-sm">End-to-end encrypted and HIPAA compliant</p>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100 hover:border-blue-300 transition-all duration-300">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#0A1F44] mb-2">AI-Powered Analysis</h3>
                  <p className="text-gray-600 text-sm">Dynamic questions tailored to your answers</p>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-8">
                <button
                  onClick={startAssessment}
                  className="px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold text-lg sm:text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
                >
                  <Sparkles className="w-6 h-6" />
                  Start Your AI Risk Check
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <Heart className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-[#0A1F44] mb-2">50K+</div>
                <div className="text-gray-600">Assessments Completed</div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <Activity className="w-10 h-10 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-[#0A1F44] mb-2">95%</div>
                <div className="text-gray-600">Accuracy Rate</div>
              </div>
              <div className="text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow">
                <Shield className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-[#0A1F44] mb-2">100%</div>
                <div className="text-gray-600">Confidential</div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">HM</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              HMEX
            </span>
          </div>
          {!completed && (
            <div className="text-sm font-medium text-emerald-600">
              {geminiService.getProgress()}% Complete
            </div>
          )}
          {completed && <div className="w-16"></div>}
        </div>
      </div>

      {/* Progress Bar */}
      {!completed && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="h-2 bg-gray-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${geminiService.getProgress()}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 sm:px-6 py-3 sm:py-4 ${
                    msg.type === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                      : 'bg-white border-2 border-gray-100 text-gray-800 shadow-sm'
                  }`}
                >
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-2">
                      <Activity className="w-5 h-5 text-emerald-600" />
                    </div>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {generatingReport && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 px-6 py-4 bg-white rounded-full shadow-lg border-2 border-emerald-100">
                  <div className="w-6 h-6 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                  <span className="text-gray-700 font-medium">Analyzing your health profile...</span>
                </div>
              </div>
            )}

            {/* Results Display - BLURRED with Login Prompt */}
            {completed && riskResult && !generatingReport && (
              <div className="space-y-6 animate-fade-in mt-8">
                {/* Quick Preview - Not Blurred */}
                <div className={`rounded-3xl p-6 sm:p-8 border-2 ${getRiskBgColor(riskResult.riskLevel)} shadow-lg`}>
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-600 mb-2">Your Risk Level</div>
                    <div className={`text-4xl sm:text-5xl font-bold ${getRiskColor(riskResult.riskLevel)} uppercase mb-4`}>
                      {riskResult.riskLevel.replace('-', ' ')}
                    </div>
                    <div className="text-6xl sm:text-7xl font-bold text-gray-800 mb-2">{riskResult.score}</div>
                    <div className="text-sm text-gray-600 mb-4">Risk Score (out of 100)</div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          riskResult.riskLevel === 'low' ? 'bg-emerald-500' :
                          riskResult.riskLevel === 'moderate' ? 'bg-yellow-500' :
                          riskResult.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${riskResult.score}%` }}
                      ></div>
                    </div>

                    <p className="mt-6 text-gray-700 text-sm sm:text-base">{riskResult.summary}</p>
                  </div>
                </div>

                {/* Locked Content - Blurred */}
                <div className="relative">
                  {/* Blur Overlay */}
                  <div className="relative filter blur-sm pointer-events-none select-none">
                    {/* Key Findings - Blurred */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
                      <h3 className="text-lg font-bold text-[#0A1F44] mb-4">Key Findings</h3>
                      <ul className="space-y-3">
                        {riskResult.keyFindings.slice(0, 3).map((finding, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{finding}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations - Blurred */}
                    <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 mb-6">
                      <h3 className="text-lg font-bold text-[#0A1F44] mb-4">Personalized Recommendations</h3>
                      <ul className="space-y-3">
                        {riskResult.recommendations.slice(0, 3).map((rec, idx) => (
                          <li key={idx} className="text-gray-700 flex items-start gap-3">
                            <Heart className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Detailed Analysis - Blurred */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
                      <h3 className="text-lg font-bold text-[#0A1F44] mb-4">Detailed Health Analysis</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {riskResult.detailedAnalysis?.slice(0, 200)}...
                      </p>
                    </div>
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white">
                    <div className="text-center px-6 py-8 max-w-md">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Unlock Your Full Report
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Get your complete health analysis with detailed recommendations, action plans, and progress tracking.
                      </p>
                      <button
                        onClick={handleViewFullReport}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                      >
                        <Lock className="w-5 h-5" />
                        View Full Report
                      </button>
                      <p className="text-sm text-gray-500 mt-4">
                        Free to sign up • View report as guest
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!completed && currentQuestion && !loading && (
            <div className="bg-white border-t-2 border-gray-100 px-4 sm:px-6 py-4 sm:py-6 shadow-lg">
              <div className="max-w-2xl mx-auto">
                {currentQuestion.type === 'yesno' && (
                  <div className="flex gap-3 sm:gap-4">
                    <button
                      onClick={() => {
                        setCurrentAnswer(false);
                        setTimeout(handleAnswer, 100);
                      }}
                      className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-medium transition-all duration-200 text-sm sm:text-base"
                    >
                      No
                    </button>
                    <button
                      onClick={() => {
                        setCurrentAnswer(true);
                        setTimeout(handleAnswer, 100);
                      }}
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg text-white rounded-2xl font-medium transition-all duration-200 text-sm sm:text-base"
                    >
                      Yes
                    </button>
                  </div>
                )}

                {currentQuestion.type === 'slider' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
                        {currentAnswer || currentQuestion.min}
                      </span>
                      <span className="text-gray-500 text-sm">{currentQuestion.unit}</span>
                    </div>
                    <input
                      type="range"
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      value={currentAnswer || currentQuestion.min}
                      onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                      className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{currentQuestion.min}</span>
                      <span>{currentQuestion.max}</span>
                    </div>
                    <button
                      onClick={handleAnswer}
                      disabled={loading}
                      className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 text-sm sm:text-base"
                    >
                      Continue
                    </button>
                  </div>
                )}

                {currentQuestion.type === 'multiple' && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentAnswer(option);
                          setTimeout(handleAnswer, 100);
                        }}
                        className="w-full px-6 py-4 bg-white border-2 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-gray-800 rounded-2xl font-medium transition-all duration-200 text-left text-sm sm:text-base"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none text-sm sm:text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={loading || !currentAnswer}
                      className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                )}

                {currentQuestion.type === 'number' && (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                      placeholder="Enter number..."
                      className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none text-sm sm:text-base"
                      onKeyPress={(e) => e.key === 'Enter' && handleAnswer()}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={loading || !currentAnswer}
                      className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
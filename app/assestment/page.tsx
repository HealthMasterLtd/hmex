"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Check,
  Heart,
  Activity,
  Shield,
  Lock,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Footer from "@/components/ui/Footer";
import {
  geminiService,
  Question,
  RiskAssessment,
} from "@/services/gemini_service";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";

export default function AssessmentPage() {
  const { isDark, surface, accentColor, accentFaint } = useTheme();
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string | number | boolean>(
    ""
  );
  const [messages, setMessages] = useState<
    Array<{ type: "bot" | "user"; content: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [riskResult, setRiskResult] = useState<RiskAssessment | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startAssessment = async () => {
    setStarted(true);
    setMessages([
      {
        type: "bot",
        content:
          "Hi there! 👋 I'm your personal health assistant. I'll ask you some questions to understand your health better. This will only take about 2-3 minutes. Ready to get started?",
      },
    ]);

    setLoading(true);
    try {
      const firstQuestion = await geminiService.getNextQuestion();
      if (firstQuestion) {
        setCurrentQuestion(firstQuestion);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: "bot", content: firstQuestion.question },
          ]);
          setLoading(false);
        }, 800);
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "I'm having trouble connecting. Please make sure your Gemini API key is configured correctly.",
        },
      ]);
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!currentQuestion || currentAnswer === "" || loading) return;

    setLoading(true);

    let answerText: string;
    if (typeof currentAnswer === "boolean") {
      answerText = currentAnswer ? "Yes" : "No";
    } else if (currentQuestion.type === "slider") {
      answerText = `${currentAnswer}${
        currentQuestion.unit ? ` ${currentQuestion.unit}` : ""
      }`;
    } else {
      answerText = String(currentAnswer);
    }

    setMessages((prev) => [...prev, { type: "user", content: answerText }]);

    geminiService.saveAnswer(currentQuestion, currentAnswer);
    setCurrentAnswer("");

    try {
      const nextQuestion = await geminiService.getNextQuestion();

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: "bot", content: nextQuestion.question },
          ]);
          setLoading(false);
        }, 500);
      } else {
        setCompleted(true);
        setGeneratingReport(true);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content:
              "Perfect! Thank you for answering all my questions. 🎉 Let me analyze your responses and prepare your personalized health risk report...",
          },
        ]);

        const result = await geminiService.generateRiskAssessment();
        setRiskResult(result);
        setGeneratingReport(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting next question:", error);
      setLoading(false);
      setMessages((prev) => [
        ...prev,
        { type: "bot", content: "I encountered an issue. Let me try again..." },
      ]);
    }
  };

  const handleAnswerClick = (answer: string | number | boolean) => {
    if (loading) return;

    setCurrentAnswer(answer);
    setLoading(true);

    let answerText: string;
    if (typeof answer === "boolean") {
      answerText = answer ? "Yes" : "No";
    } else if (currentQuestion?.type === "slider") {
      answerText = `${answer}${
        currentQuestion.unit ? ` ${currentQuestion.unit}` : ""
      }`;
    } else {
      answerText = String(answer);
    }

    setMessages((prev) => [...prev, { type: "user", content: answerText }]);

    if (currentQuestion) {
      geminiService.saveAnswer(currentQuestion, answer);
    }

    setTimeout(async () => {
      try {
        const nextQuestion = await geminiService.getNextQuestion();
        setCurrentAnswer("");

        if (nextQuestion) {
          setCurrentQuestion(nextQuestion);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              { type: "bot", content: nextQuestion.question },
            ]);
            setLoading(false);
          }, 500);
        } else {
          setCompleted(true);
          setGeneratingReport(true);
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              content:
                "Perfect! Thank you for answering all my questions. 🎉 Let me analyze your responses and prepare your personalized health risk report...",
            },
          ]);

          const result = await geminiService.generateRiskAssessment();
          setRiskResult(result);
          setGeneratingReport(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error getting next question:", error);
        setLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            content: "I encountered an issue. Let me try again...",
          },
        ]);
      }
    }, 100);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-emerald-500";
      case "moderate":
        return "text-yellow-500";
      case "high":
        return "text-orange-500";
      case "very-high":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-emerald-50 border-emerald-200";
      case "moderate":
        return "bg-yellow-50 border-yellow-200";
      case "high":
        return "bg-orange-50 border-orange-200";
      case "very-high":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const handleViewFullReport = () => {
    router.push(`/auth?from=assessment&risk=${riskResult?.riskLevel}`);
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col overflow-x-hidden" style={{ background: surface.bg }}>
        <div className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
            <div className="text-center space-y-6 sm:space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" 
                style={{ background: `${accentColor}20`, color: accentColor }}>
                <Sparkles className="w-4 h-4" />
                AI-Powered Health Assessment
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight" style={{ color: surface.text }}>
                Check Your <span style={{ color: accentColor }}>NCD Risk</span>
                <br />
                in 60 Seconds
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto" style={{ color: surface.muted }}>
                Private. Fast. Reliable AI-powered health insights.
              </p>

              <div
                className="relative py-16 sm:py-20"
                style={{
                  backgroundImage: "url(/Background.jpg)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  marginLeft: "calc(-50vw + 50%)",
                  marginRight: "calc(-50vw + 50%)",
                  width: "100vw",
                }}
              >
                {/* Overlay for better readability */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-emerald-900/50 to-teal-900/60"></div>

                <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-12">
                    <div className="backdrop-blur-sm p-6 border" 
                      style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                      <div className="w-12 h-12 flex items-center justify-center mb-4 mx-auto" style={{ background: `${accentColor}20`, borderRadius: 2 }}>
                        <Check className="w-6 h-6" style={{ color: accentColor }} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: surface.text }}>
                        Your data is confidential
                      </h3>
                      <p className="text-sm" style={{ color: surface.muted }}>
                        End-to-end encrypted and HIPAA compliant
                      </p>
                    </div>
                    <div className="backdrop-blur-sm p-6 border" 
                      style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                      <div className="w-12 h-12 flex items-center justify-center mb-4 mx-auto" style={{ background: `${accentColor}20`, borderRadius: 2 }}>
                        <Sparkles className="w-6 h-6" style={{ color: accentColor }} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2" style={{ color: surface.text }}>
                        AI-Powered Analysis
                      </h3>
                      <p className="text-sm" style={{ color: surface.muted }}>
                        Dynamic questions tailored to your answers
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={startAssessment}
                    className="relative px-8 sm:px-12 py-4 sm:py-5 text-white rounded-full font-semibold text-lg sm:text-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto animate-pulse hover:animate-none"
                    style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
                  >
                    {/* Animated ring effect */}
                    <span className="absolute inset-0 rounded-full animate-ping opacity-75" style={{ background: accentColor }}></span>

                    {/* Glow effect */}
                    <span className="absolute inset-0 rounded-full blur-lg opacity-50 animate-pulse" style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)` }}></span>

                    {/* Button content */}
                    <span className="relative flex items-center gap-3">
                      <Sparkles className="w-6 h-6 animate-spin-slow" />
                      Start Your AI Risk Check
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center p-6 border" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: accentColor }} />
                <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: surface.text }}>
                  50K+
                </div>
                <div style={{ color: surface.muted }}>Assessments Completed</div>
              </div>
              <div className="text-center p-6 border" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                <Activity className="w-10 h-10 mx-auto mb-3" style={{ color: accentColor }} />
                <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: surface.text }}>
                  95%
                </div>
                <div style={{ color: surface.muted }}>Accuracy Rate</div>
              </div>
              <div className="text-center p-6 border" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: accentColor }} />
                <div className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: surface.text }}>
                  100%
                </div>
                <div style={{ color: surface.muted }}>Confidential</div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: surface.bg }}>
      <div className="border-b sticky top-0 z-10 shadow-sm" style={{ background: surface.surface, borderColor: surface.border }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-2 transition-colors"
            style={{ color: surface.muted }}
            onMouseEnter={e => e.currentTarget.style.color = accentColor}
            onMouseLeave={e => e.currentTarget.style.color = surface.muted}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          {/* Logo */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="w-10 h-10 flex items-center justify-center shadow-sm">
              <Image
                src="/white logo.png"
                alt="Logo"
                width={120}
                height={50}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: surface.text }}>
              H<span style={{ color: accentColor }}>MEX</span>
            </span>
          </div>
          {!completed && (
            <div className="text-sm font-medium" style={{ color: accentColor }}>
              {geminiService.getProgress()}% Complete
            </div>
          )}
          {completed && <div className="w-16"></div>}
        </div>
      </div>
      {!completed && (
        <div style={{ background: surface.surface, borderBottom: `1px solid ${surface.border}` }}>
          <div className="max-w-4xl mx-auto">
            <div className="h-2" style={{ background: surface.border }}>
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${geminiService.getProgress()}%`, background: `linear-gradient(135deg,${accentColor},${accentColor}dd)` }}
              ></div>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                } animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] px-4 sm:px-6 py-3 sm:py-4 ${
                    msg.type === "user"
                      ? "text-white shadow-md"
                      : "border text-gray-800 shadow-sm"
                  }`}
                  style={{
                    background: msg.type === "user" 
                      ? `linear-gradient(135deg,${accentColor},${accentColor}dd)`
                      : surface.surface,
                    borderColor: surface.border,
                    borderRadius: 2
                  }}
                >
                  {msg.type === "bot" && (
                    <div className="w-8 h-8 flex items-center justify-center mb-2" style={{ background: `${accentColor}20`, borderRadius: 2 }}>
                      <Activity className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                  )}
                  <p className="text-sm sm:text-base leading-relaxed" style={{ color: msg.type === "user" ? "#fff" : surface.text }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}

            {generatingReport && (
              <div className="flex justify-center py-8">
                <div className="flex items-center gap-3 px-6 py-4 border shadow-lg" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                  <div className="w-6 h-6 border-4 rounded-full animate-spin" style={{ borderColor: `${accentColor}20`, borderTopColor: accentColor }}></div>
                  <span className="font-medium" style={{ color: surface.muted }}>
                    Analyzing your health profile...
                  </span>
                </div>
              </div>
            )}

            {completed && riskResult && !generatingReport && (
              <div className="space-y-6 animate-fade-in mt-8">
                <div
                  className={`p-6 sm:p-8 border-2 shadow-lg`}
                  style={{
                    background: surface.surface,
                    borderColor: riskResult.riskLevel === "low" ? "#22c55e" :
                               riskResult.riskLevel === "moderate" ? "#eab308" :
                               riskResult.riskLevel === "high" ? "#f97316" : "#ef4444",
                    borderRadius: 2
                  }}
                >
                  <div className="text-center">
                    <div className="text-sm font-medium mb-2" style={{ color: surface.muted }}>
                      Your Risk Level
                    </div>
                    <div
                      className={`text-4xl sm:text-5xl font-bold uppercase mb-4 ${getRiskColor(
                        riskResult.riskLevel
                      )}`}
                    >
                      {riskResult.riskLevel.replace("-", " ")}
                    </div>
                    <div className="text-6xl sm:text-7xl font-bold mb-2" style={{ color: surface.text }}>
                      {riskResult.score}
                    </div>
                    <div className="text-sm mb-4" style={{ color: surface.muted }}>
                      Risk Score (out of 100)
                    </div>

                    <div className="w-full h-3 overflow-hidden" style={{ background: surface.border }}>
                      <div
                        className={`h-full transition-all duration-1000 ${
                          riskResult.riskLevel === "low"
                            ? "bg-emerald-500"
                            : riskResult.riskLevel === "moderate"
                            ? "bg-yellow-500"
                            : riskResult.riskLevel === "high"
                            ? "bg-orange-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${riskResult.score}%` }}
                      ></div>
                    </div>

                    <p className="mt-6 text-sm sm:text-base" style={{ color: surface.muted }}>
                      {riskResult.summary}
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative filter blur-sm pointer-events-none select-none">
                    <div className="p-6 border mb-6" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                      <h3 className="text-lg font-bold mb-4" style={{ color: surface.text }}>
                        Key Findings
                      </h3>
                      <ul className="space-y-3">
                        {riskResult.keyFindings
                          .slice(0, 3)
                          .map((finding, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3"
                              style={{ color: surface.muted }}
                            >
                              <Check className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                              <span>{finding}</span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="p-6 border mb-6" style={{ background: surface.surface, borderColor: surface.border, borderRadius: 2 }}>
                      <h3 className="text-lg font-bold mb-4" style={{ color: surface.text }}>
                        Personalized Recommendations
                      </h3>
                      <ul className="space-y-3">
                        {riskResult.recommendations
                          .slice(0, 3)
                          .map((rec, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-3"
                              style={{ color: surface.muted }}
                            >
                              <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
                              <span>{rec}</span>
                            </li>
                          ))}
                      </ul>
                    </div>

                    <div className="p-6 border" style={{ background: `${accentColor}10`, borderColor: `${accentColor}20`, borderRadius: 2 }}>
                      <h3 className="text-lg font-bold mb-4" style={{ color: surface.text }}>
                        Detailed Health Analysis
                      </h3>
                      <p className="leading-relaxed" style={{ color: surface.muted }}>
                        {riskResult.detailedAnalysis?.slice(0, 200)}...
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center px-6 py-8 max-w-md">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}>
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3" style={{ color: surface.text }}>
                        Unlock Your Full Report
                      </h3>
                      <p className="mb-6" style={{ color: surface.muted }}>
                        Get your complete health analysis with detailed
                        recommendations, action plans, and progress tracking.
                      </p>
                      <button
                        onClick={handleViewFullReport}
                        className="px-8 py-4 text-white rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                        style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
                      >
                        <Lock className="w-5 h-5" />
                        View Full Report
                      </button>
                      <p className="text-sm mt-4" style={{ color: surface.subtle }}>
                        Free to sign up • View report as guest
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!completed && currentQuestion && !loading && (
            <div className="border-t-2 px-4 sm:px-6 py-4 sm:py-6 shadow-lg" style={{ background: surface.surface, borderColor: surface.border }}>
              <div className="max-w-2xl mx-auto">
                {currentQuestion.type === "yesno" && (
                  <div className="flex gap-3 sm:gap-4">
                    <button
                      onClick={() => handleAnswerClick(false)}
                      disabled={loading}
                      className="flex-1 px-6 py-4 font-medium transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      style={{ background: surface.surfaceAlt, color: surface.text, borderRadius: 2 }}
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleAnswerClick(true)}
                      disabled={loading}
                      className="flex-1 px-6 py-4 text-white font-medium transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:shadow-lg"
                      style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
                    >
                      Yes
                    </button>
                  </div>
                )}

                {currentQuestion.type === "slider" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl sm:text-3xl font-bold" style={{ color: accentColor }}>
                        {currentAnswer || currentQuestion.min}
                      </span>
                      <span className="text-sm" style={{ color: surface.muted }}>
                        {currentQuestion.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={currentQuestion.min}
                      max={currentQuestion.max}
                      value={
                        typeof currentAnswer === "number"
                          ? currentAnswer
                          : currentQuestion.min
                      }
                      onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                      className="w-full h-3 appearance-none cursor-pointer"
                      style={{ background: surface.border }}
                      disabled={loading}
                    />
                    <div className="flex justify-between text-xs" style={{ color: surface.muted }}>
                      <span>{currentQuestion.min}</span>
                      <span>{currentQuestion.max}</span>
                    </div>
                    <button
                      onClick={handleAnswer}
                      disabled={loading}
                      className="w-full px-6 py-4 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base active:scale-95"
                      style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
                    >
                      Continue
                    </button>
                  </div>
                )}

                {currentQuestion.type === "multiple" && (
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerClick(option)}
                        disabled={loading}
                        className="w-full px-6 py-4 border font-medium transition-all duration-200 text-left text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        style={{ background: surface.surface, borderColor: surface.border, color: surface.text, borderRadius: 2 }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = accentColor;
                          e.currentTarget.style.background = `${accentColor}10`;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = surface.border;
                          e.currentTarget.style.background = surface.surface;
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === "text" && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={
                        typeof currentAnswer === "boolean"
                          ? currentAnswer
                            ? "true"
                            : "false"
                          : currentAnswer
                      }
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer..."
                      className="flex-1 px-6 py-4 border focus:outline-none text-sm sm:text-base"
                      style={{ background: surface.surfaceAlt, borderColor: surface.border, color: surface.text, borderRadius: 2 }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !loading && currentAnswer) {
                          handleAnswer();
                        }
                      }}
                      disabled={loading}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={loading || !currentAnswer}
                      className="px-6 py-4 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                      style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
                    >
                      Send
                    </button>
                  </div>
                )}

                {currentQuestion.type === "number" && (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={
                        typeof currentAnswer === "boolean"
                          ? currentAnswer
                            ? "true"
                            : "false"
                          : currentAnswer
                      }
                      onChange={(e) => setCurrentAnswer(Number(e.target.value))}
                      placeholder="Enter number..."
                      className="flex-1 px-6 py-4 border focus:outline-none text-sm sm:text-base"
                      style={{ background: surface.surfaceAlt, borderColor: surface.border, color: surface.text, borderRadius: 2 }}
                      onKeyPress={(e) =>
                        e.key === "Enter" && !loading && handleAnswer()
                      }
                      disabled={loading}
                    />
                    <button
                      onClick={handleAnswer}
                      disabled={loading || !currentAnswer}
                      className="px-6 py-4 text-white font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                      style={{ background: `linear-gradient(135deg,${accentColor},${accentColor}dd)`, borderRadius: 2 }}
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
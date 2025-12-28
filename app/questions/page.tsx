/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useEffect } from "react";
import {
  Info,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Ruler,
  Scale,
  Activity,
  Utensils,
  Users,
  CloudRain,
  Moon,
  Brain,
  Pill,
  Heart,
  Stethoscope,
  Thermometer,
  Droplets,
  Bed,
  Clock,
  Zap,
  Baby,
  Coffee,
  Cloud,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Answers, DisplayQuestion } from "@/types/questions.type";
import { useRouter } from "next/navigation";
import { groqService } from "@/services/GroqService";
import type { Question } from "@/services/GroqService";
import Navbar from "@/components/landingPage/navbar";
import Footer from "@/components/ui/Footer";

const HealthCheckQuestions: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentQuestion, setCurrentQuestion] = useState<DisplayQuestion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingNext, setIsGeneratingNext] = useState<boolean>(false);
  const router = useRouter();

  // Icon mapping for questions
  const iconMap: Record<string, React.ReactNode> = {
    // Baseline icons
    age: <Calendar className="w-8 h-8 text-blue-600" />,
    gender: <User className="w-8 h-8 text-purple-600" />,
    height_weight: <><Ruler className="w-8 h-8 text-green-600" /><Scale className="w-8 h-8 text-orange-600" /></>,
    waist_circumference: <Activity className="w-8 h-8 text-red-600" />,

    // Shared risk factors
    physical_activity: <Activity className="w-8 h-8 text-green-600" />,
    sedentary_time: <Clock className="w-8 h-8 text-gray-600" />,
    vegetables_fruits: <Utensils className="w-8 h-8 text-emerald-600" />,
    family_history_diabetes: <Users className="w-8 h-8 text-indigo-600" />,
    family_history_hypertension: <Users className="w-8 h-8 text-violet-600" />,
    smoking: <Cloud className="w-8 h-8 text-gray-600" />,
    alcohol: <Droplets className="w-8 h-8 text-amber-600" />,
    sleep_duration: <Moon className="w-8 h-8 text-blue-600" />,
    stress_level: <Brain className="w-8 h-8 text-red-600" />,
    occupation: <Clock className="w-8 h-8 text-gray-700" />,

    // Diabetes-specific
    previous_high_glucose: <Thermometer className="w-8 h-8 text-red-600" />,
    when_last_glucose_tested: <Calendar className="w-8 h-8 text-blue-600" />,
    sugary_drinks: <Droplets className="w-8 h-8 text-pink-600" />,
    gestational_diabetes: <Baby className="w-8 h-8 text-pink-600" />,
    gestational_diabetes_detail: <Baby className="w-8 h-8 text-pink-600" />,
    pcos: <Zap className="w-8 h-8 text-purple-600" />,
    processed_foods: <Utensils className="w-8 h-8 text-orange-600" />,

    // Hypertension-specific
    blood_pressure_history: <Heart className="w-8 h-8 text-red-600" />,
    when_last_bp_checked: <Calendar className="w-8 h-8 text-blue-600" />,
    salt_intake: <CloudRain className="w-8 h-8 text-blue-500" />,
    sleep_apnea: <Bed className="w-8 h-8 text-indigo-600" />,
    kidney_disease: <Pill className="w-8 h-8 text-red-700" />,
    preeclampsia: <Baby className="w-8 h-8 text-red-600" />,
    anxiety: <Brain className="w-8 h-8 text-yellow-600" />,
    medications: <Pill className="w-8 h-8 text-purple-600" />,

    // AI-generated questions
    ai_sleep: <Moon className="w-8 h-8 text-blue-600" />,
    ai_stress: <Brain className="w-8 h-8 text-red-600" />,
    ai_diet: <Utensils className="w-8 h-8 text-green-600" />,
    ai_activity: <Activity className="w-8 h-8 text-emerald-600" />,
    ai_family: <Users className="w-8 h-8 text-indigo-600" />,
    ai_symptoms: <AlertTriangle className="w-8 h-8 text-orange-600" />,
    ai_medical: <Stethoscope className="w-8 h-8 text-blue-700" />,
  };

  useEffect(() => {
    loadNextQuestion();
  }, []);

  const loadNextQuestion = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const question = await groqService.getNextQuestion();

      if (question === null) {
        router.push("/review");
        return;
      }

      const displayQuestion = convertToDisplayQuestion(question, currentStep);
      setCurrentQuestion(displayQuestion);
    } catch (err) {
      console.error('Error loading question:', err);
      setError('Failed to load question. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToDisplayQuestion = (question: Question, step: number): DisplayQuestion => {
    const category = getCategoryFromStep(step);
    const icon = iconMap[question.id] || <Info className="w-8 h-8 text-teal-600" />;
    const subtitle = getSubtitleFromQuestion(question);
    const progress = Math.round((step / groqService.getMaxQuestions()) * 100);

    const displayQuestion: DisplayQuestion = {
      id: question.id,
      type: question.id,
      category,
      stepOf: `Step ${step} of ~${groqService.getMaxQuestions()}`,
      icon: icon,
      question: question.question,
      subtitle,
      progress,
      hasImages: false,
      hasInput: false,
      hasDoubleInput: false,
      required: question.required,
      aiGenerated: question.aiGenerated,
      tooltip: question.tooltip,
    };

    // Special handling for height_weight (dual input)
    if (question.id === 'height_weight') {
      displayQuestion.hasDoubleInput = true;
      displayQuestion.inputs = [
        {
          label: 'Height',
          placeholder: 'Enter height in cm',
          unit: 'cm'
        },
        {
          label: 'Weight',
          placeholder: 'Enter weight in kg',
          unit: 'kg'
        }
      ];
    }
    // Handle different question types
    else switch (question.type) {
      case 'slider':
        displayQuestion.hasInput = true;
        displayQuestion.inputLabel = question.question;
        displayQuestion.inputUnit = question.unit || '';
        displayQuestion.inputPlaceholder = `Enter value (${question.min}-${question.max})`;
        displayQuestion.min = question.min;
        displayQuestion.max = question.max;
        displayQuestion.unit = question.unit;
        break;

      case 'yesno':
        displayQuestion.options = [
          { value: 'Yes', label: 'Yes', icon: <CheckCircle className="w-5 h-5 text-green-600" /> },
          { value: 'No', label: 'No', icon: <AlertCircle className="w-5 h-5 text-red-600" /> }
        ];
        break;
      

      case 'multiple':
        displayQuestion.options = question.options?.map(opt => ({
          value: opt,
          label: opt
        })) || [];

        // Special handling for waist circumference with images
        if (question.id === 'waist_circumference') {
          displayQuestion.hasImages = true;
          displayQuestion.options = [
            {
              value: 'Slim waist',
              label: 'Slim',
              image: '👤',
              description: 'Waist <94cm (men) / <80cm (women)'
            },
            {
              value: 'Moderate waist',
              label: 'Moderate',
              image: '👤',
              description: 'Waist 94-102cm (men) / 80-88cm (women)'
            },
            {
              value: 'Large waist',
              label: 'Large',
              image: '👤',
              description: 'Waist >102cm (men) / >88cm (women)'
            }
          ];
        }
        break;

      case 'text':
        displayQuestion.hasInput = true;
        displayQuestion.inputLabel = question.question;
        displayQuestion.inputPlaceholder = 'Type your answer here...';
        break;
    }

    return displayQuestion;
  };

  const getCategoryFromStep = (step: number): string => {
    if (step <= 4) return 'Baseline Assessment';
    if (step <= 8) return 'Risk Factor Assessment';
    return 'Personalized Follow-up';
  };

  const getSubtitleFromQuestion = (question: Question): string => {
    if (question.aiGenerated) {
      return "This personalized question was generated based on your unique profile to better understand your specific risk factors.";
    }

    const subtitleMap: Record<string, string> = {
      age: 'Age helps us understand your baseline risk for both diabetes and high blood pressure.',
      gender: 'Biological sex affects how conditions develop and their risk patterns.',
      height_weight: 'Height and weight are used to calculate your BMI, a key indicator of metabolic health.',
      waist_circumference: 'Belly fat is particularly dangerous for both diabetes and high blood pressure.',
      physical_activity: 'Regular physical activity is one of the most powerful preventive measures for both conditions.',
      vegetables_fruits: 'Fruits and vegetables provide fiber for blood sugar control and minerals for blood pressure regulation.',
      previous_high_glucose: 'Previous high blood sugar is one of the strongest predictors of future diabetes.',
      blood_pressure_history: 'High blood pressure and diabetes often occur together as part of metabolic syndrome.',
      family_history_diabetes: 'Diabetes has a strong genetic component that significantly increases risk.',
      family_history_hypertension: 'High blood pressure runs in families, indicating genetic predisposition.',
    };

    return subtitleMap[question.id] || 'Your answer helps us provide a more accurate and personalized risk assessment.';
  };

  const handleNext = async (): Promise<void> => {
    if (!currentQuestion) return;

    // For height_weight, combine values
    if (currentQuestion.id === 'height_weight' && currentQuestion.inputs) {
      const height = answers['height'] || '';
      const weight = answers['weight'] || '';
      if (!height || !weight) {
        setError('Please enter both height and weight.');
        return;
      }

      // Save combined answer
      const question: Question = {
        id: currentQuestion.id,
        question: currentQuestion.question,
        type: currentQuestion.type as any,
        options: currentQuestion.options?.map(o => o.value),
        min: currentQuestion.min,
        max: currentQuestion.max,
        unit: currentQuestion.unit,
        required: currentQuestion.required,
        aiGenerated: currentQuestion.aiGenerated,
        condition: undefined,
        tooltip: currentQuestion.tooltip,
      };

      groqService.saveAnswer(question, `${height}/${weight}`);
    } else {
      // Validate regular answer
      const answer = answers[currentQuestion.type];
      if (currentQuestion.required && !answer && answer !== 0) {
        setError('Please answer this question before continuing.');
        return;
      }

      // Save answer to service
      const question: Question = {
        id: currentQuestion.id,
        question: currentQuestion.question,
        type: currentQuestion.type as any,
        options: currentQuestion.options?.map(o => o.value),
        min: currentQuestion.min,
        max: currentQuestion.max,
        unit: currentQuestion.unit,
        required: currentQuestion.required,
        aiGenerated: currentQuestion.aiGenerated,
        condition: undefined,
        tooltip: currentQuestion.tooltip,
      };

      groqService.saveAnswer(question, answer);
    }

    // Move to next question
    setIsGeneratingNext(true);
    setCurrentStep(currentStep + 1);
    await loadNextQuestion();
    setIsGeneratingNext(false);
  };

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('To maintain assessment accuracy, please continue forward. Use the "Next" button to proceed.');
    }
  };

  const handleOptionSelect = (value: string): void => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.type]: value });
    setError(null);
  };

  const handleInputChange = (field: string, value: string): void => {
    if (!currentQuestion) return;

    if (currentQuestion.hasDoubleInput && currentQuestion.inputs) {
      setAnswers({ ...answers, [field]: value });
    } else if (currentQuestion.hasInput && (currentQuestion.min !== undefined || currentQuestion.max !== undefined)) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        setAnswers({ ...answers, [currentQuestion.type]: numValue });
      }
    } else {
      setAnswers({ ...answers, [currentQuestion.type]: value });
    }
    setError(null);
  };

  // Loading state
  if (isLoading && !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md">
          <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Preparing Your Assessment
          </h2>
          <p className="text-gray-600">
            Loading personalized questions based on medical guidelines...
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-12 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Assessment Error
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load the next question. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-700 transition"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const isLastStep = groqService.getQuestionCount() >= groqService.getMaxQuestions();

  return (
    
    <div className="min-h-screen  bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 ">
     <Navbar/>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
      
        {/* Header with Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Health Risk Assessment</h1>
              <p className="text-gray-600 text-sm">Personalized diabetes & hypertension screening</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {currentQuestion.stepOf}
              </div>
              <div className="text-xs text-gray-500">
                {groqService.getProgress()}% complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-blue-600 transition-all duration-500"
              style={{ width: `${currentQuestion.progress}%` }}
            />
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-900 to-teal-800 text-white px-4 py-2 rounded-full text-sm font-semibold">
            {currentQuestion.aiGenerated ? (
              <>
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>AI Personalized</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>{currentQuestion.category}</span>
              </>
            )}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl">
                {currentQuestion.icon}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                {currentQuestion.question}
              </h2>
              <p className="text-gray-700 text-base leading-relaxed">
                {currentQuestion.subtitle}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* AI Explanation Banner */}
          {currentQuestion.aiGenerated && (
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <p className="text-purple-700 text-sm font-medium">
                  AI Insight: This question was dynamically generated to better understand your unique risk profile.
                </p>
              </div>
            </div>
          )}

          {/* Question Input Area */}
          <div className="mb-8">
            {/* Double Input for height/weight */}
            {currentQuestion.hasDoubleInput && currentQuestion.inputs && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentQuestion.inputs.map((input, idx) => (
                    <div key={idx} className="space-y-2">
                      <label className="block text-gray-800 font-medium">
                        {input.label}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder={input.placeholder}
                          value={answers[input.label.toLowerCase()] as string || ''}
                          onChange={(e) => handleInputChange(input.label.toLowerCase(), e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition text-lg text-gray-900 placeholder:text-gray-500"
                        />
                        <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                          {input.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  We&apos;ll calculate your BMI automatically from these measurements.
                </p>
              </div>
            )}

            {/* Slider Input */}
            {currentQuestion.hasInput && currentQuestion.min !== undefined && currentQuestion.max !== undefined && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">
                    {currentQuestion.min} {currentQuestion.unit}
                  </span>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600">
                      {answers[currentQuestion.type] || currentQuestion.min} {currentQuestion.unit}
                    </div>
                    <div className="text-sm text-gray-600">Current selection</div>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {currentQuestion.max} {currentQuestion.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  value={answers[currentQuestion.type] as number || currentQuestion.min}
                  onChange={(e) => handleInputChange(currentQuestion.type, e.target.value)}
                  className="w-full h-3 bg-gradient-to-r from-teal-100 to-blue-100 rounded-full appearance-none slider-thumb"
                />
              </div>
            )}

            {/* Text Input */}
            {currentQuestion.hasInput && currentQuestion.min === undefined && (
              <input
                type="text"
                placeholder={currentQuestion.inputPlaceholder}
                value={answers[currentQuestion.type] as string || ''}
                onChange={(e) => handleInputChange(currentQuestion.type, e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition text-lg text-gray-900 placeholder:text-gray-500"
              />
            )}

            {/* Multiple Choice Options */}
            {currentQuestion.options && !currentQuestion.hasInput && !currentQuestion.hasDoubleInput && (
              <div className="space-y-3">
                <div className={`grid gap-3 ${currentQuestion.options.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    currentQuestion.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                      'grid-cols-1'
                  }`}>
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option.value)}
                      className={`p-4 rounded-2xl border-2 transition-all text-left ${answers[currentQuestion.type] === option.value
                          ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon && <span>{option.icon}</span>}
                        <div>
                          <div className="font-semibold text-gray-900">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image Options for waist circumference */}
            {currentQuestion.hasImages && currentQuestion.options && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-800 font-semibold mb-2">
                    Select the image that best matches your body shape
                  </p>
                  <p className="text-gray-600 text-sm">
                    This helps us assess central obesity, a key risk factor for both conditions
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(option.value)}
                      className={`p-4 rounded-2xl border-2 transition-all ${answers[currentQuestion.type] === option.value
                          ? 'border-teal-500 bg-gradient-to-r from-teal-50 to-blue-50 shadow-lg'
                          : 'border-gray-200 bg-white hover:border-teal-300 hover:shadow-md'
                        }`}
                    >
                      <div className="bg-gray-100 rounded-xl p-6 mb-3 flex items-center justify-center">
                        <div className="text-4xl">{option.image}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-gray-900 mb-1">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-600">
                          {option.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tooltip if available */}
          {currentQuestion.tooltip && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-blue-800 text-sm">{currentQuestion.tooltip}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition ${currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={() => {
              if (isLastStep) {
                router.push("/review");
              } else {
                handleNext();
              }
            }}
            disabled={isGeneratingNext}
            className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isGeneratingNext ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating next question...
              </>
            ) : isLastStep ? (
              <>
                See My Risk Assessment
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Next Question
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Assessment Info */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Question {currentStep} • Based on FINDRISC & Framingham validated frameworks</p>
          <p className="mt-1">Your responses are confidential and used only for risk assessment</p>
        </div>
      </div>
<Footer/>
      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
          cursor: pointer;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 3px solid white;
        }

        .slider-thumb::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .slider-thumb::-webkit-slider-track {
          background: linear-gradient(to right, #5eead4 0%, #7dd3fc 100%);
height: 12px;
border-radius: 6px;
}
    .slider-thumb::-moz-range-track {
      background: linear-gradient(to right, #5eead4 0%, #7dd3fc 100%);
      height: 12px;
      border-radius: 6px;
    }
  `}</style>
    </div>
  );
};
export default HealthCheckQuestions;
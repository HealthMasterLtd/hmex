"use client"

import React, { useState } from "react";
import { Info } from "lucide-react";
import { Answers } from "@/types/questions.type";
import { questions } from "@/lib/mockdata";
import { useRouter } from "next/navigation";


const HealthCheckQuestions: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [answers, setAnswers] = useState<Answers>({});
  const router = useRouter()


  const currentQuestion = questions[currentStep - 1];
  const isLastStep = currentStep === questions.length;

  const handleNext = (): void => {
    if (currentStep < questions.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOptionSelect = (value: string): void => {
    setAnswers({ ...answers, [currentQuestion.type]: value });
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50 via-cyan-50 to-emerald-50 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="h-3 flex-1 bg-white/60 rounded-full overflow-hidden border border-teal-200">
              <div
                className="h-full bg-linear-to-r from-emerald-400 to-teal-500 transition-all duration-500 rounded-full"
                style={{ width: `${currentQuestion.progress}%` }}
              />
            </div>
            <span className="ml-4 text-sm font-medium text-gray-700">
              {currentQuestion.progress}% complete
            </span>
          </div>
        </div>

        {/* Category Badge */}
        <div className="mb-6">
          <div className="inline-block bg-blue-900 text-white px-6 py-3 rounded-full text-sm font-semibold">
            {currentQuestion.category} . {currentQuestion.stepOf}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-200 p-5 sm:p-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="text-3xl">{currentQuestion.icon}</div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
                {currentQuestion.question}
              </h2>
              <div className="flex items-start gap-2">
                <p className="text-gray-600 text-base flex-1">
                  {currentQuestion.subtitle}
                </p>
                <button className="flex items-center gap-1 text-[#0fbb7d] text-sm font-medium whitespace-nowrap">
                  <Info className="w-4 h-4" />
                  More info
                </button>
              </div>
            </div>
          </div>

          {/* Image Options with Examples */}
          {currentQuestion.hasImages && "options" in currentQuestion && (
            <div className="space-y-6 mb-6">
              <div className="text-center mb-6">
                <p className="text-blue-700 font-bold text-lg mb-2">
                  {currentQuestion.subtitle}
                </p>
                <p className="text-gray-600 text-sm">
                  Your eating habits are the types of foods you choose most
                  often —<br />
                  whether they{"'"}re fresh, homemade, or processed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(option.value)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left ${
                      answers[currentQuestion.type] === option.value
                        ? "border-[#0fbb7d] bg-teal-50"
                        : "border-teal-200 bg-teal-50/30 hover:border-teal-300"
                    }`}
                  >
                    <div className="bg-gray-700 rounded-xl p-4 mb-3 aspect-video flex items-center justify-center text-xl">
                      {option.image}
                    </div>
                    <div className="font-bold text-gray-800 text-sm mb-3">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-semibold mb-1">Examples:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {option.examples.map((example, idx) => (
                          <li key={idx}>{example}</li>
                        ))}
                      </ul>
                    </div>
                  </button>
                ))}
              </div>
              <div className="text-center">
                <button className="text-gray-600 hover:text-gray-800 font-medium">
                  Back to the choices
                </button>
              </div>
            </div>
          )}

          {/* Regular Options for multiple choice */}
          {!currentQuestion.hasImages &&
            currentQuestion.options &&
            !currentQuestion.hasDoubleInput && (
              <div className="space-y-4 mb-6">
                <div
                  className={`grid grid-cols-1 ${
                    currentQuestion.options.length === 2
                      ? "sm:grid-cols-2"
                      : currentQuestion.options.length === 3
                      ? "sm:grid-cols-3"
                      : "sm:grid-cols-2"
                  } gap-4`}
                >
                  {currentQuestion.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionSelect(option.value)}
                      className={`p-3 rounded-2xl border-2 transition-all text-left flex justify-between ${
                        answers[currentQuestion.type] === option.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-teal-200 bg-teal-50/30 hover:border-teal-300 hover:bg-teal-50/50"
                      }`}
                    >
                      <div className="font-bold text-gray-800 text-lg mb-1">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-sm text-gray-600">
                          {option.description}
                        </div>
                      )}
                      {!option.description && currentStep === 1 && (
                        <div className="text-sm text-gray-500">
                          Tap to choose
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* Single Input Field */}
          {currentQuestion.hasInput && !currentQuestion.hasDoubleInput && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <label className="text-gray-700 font-medium">
                  {currentQuestion.inputLabel}
                </label>
                <span className="text-sm text-gray-500">
                  {currentQuestion.inputUnit}
                </span>
              </div>
              <input
                type="text"
                placeholder={currentQuestion.inputPlaceholder}
                className="w-full px-6 py-3 rounded-2xl border-2 border-teal-200 bg-white focus:border-[#0fbb7d] focus:outline-none text-lg text-black"
              />
              {currentQuestion.note && (
                <p className="text-sm text-gray-600 mt-4">
                  {currentQuestion.note}
                </p>
              )}
            </div>
          )}

          {/* Double Input Fields */}
          {currentQuestion.hasDoubleInput && "inputs" in currentQuestion && (
            <div className="space-y-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {currentQuestion.inputs.map((input, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700 font-medium">
                        {input.label}
                      </label>
                      <span className="text-sm text-gray-500">
                        {input.unit}
                      </span>
                    </div>
                    <input
                      type="text"
                      placeholder={input.placeholder}
                      className="w-full px-6 py-4 rounded-2xl border-2 border-teal-200 bg-white focus:border-[#0fbb7d] focus:outline-none text-lg"
                    />
                  </div>
                ))}
              </div>
              {currentQuestion.note && (
                <p className="text-sm text-gray-600">{currentQuestion.note}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`text-gray-700 font-medium ${
              currentStep === 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:text-gray-900"
            }`}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (isLastStep) {
                router.push("/review")
              } else {
                handleNext()
              }
            }}
            className="bg-linear-to-r cursor-pointer from-emerald-400 to-[#0fbb7d] text-white px-8 py-4 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            {isLastStep ? "See my risk preview" : "Next question"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HealthCheckQuestions;

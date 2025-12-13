"use client";

import React, { useState } from "react";
import { User, Mail, Lock, Shield } from "lucide-react";
import Image from "next/image";

const SignUpPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5FAFD] flex">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-10">
        <div className="max-w-lg w-full">
          {/* Prevention Card */}
          <div className="bg-[#D6F2EA] rounded-4xl p-10 mb-14">
            <div className="bg-white rounded-2xl p-8 flex justify-center items-center mb-6 shadow-sm">
              <div className="w-20 h-20 bg-[#0A2D5E] rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>

            <h2 className="text-center text-2xl font-semibold text-[#101828] mb-3">
              Prevention is Better
            </h2>
            <p className="text-center text-[#475467] text-sm">
              Track diabetes & hypertension risks with personalized insights
              designed for everyone
            </p>
          </div>

          {/* Text + Benefits */}
          <h3 className="text-xl font-bold text-[#101828] text-center mb-2">
            Simple Health Insights for everyone
          </h3>
          <p className="text-[#475467] text-center text-sm mb-10">
            No medical jargon. Just clear, actionable guidance to help you live
            healthier
          </p>

          <div className="space-y-4">
            {/* Benefit 1 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#E0F7F1] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-[#0F9D8A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-[#344054] text-sm">
                Personalized health risk assessments
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#E0F7F1] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-[#0F9D8A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-[#344054] text-sm">
                Easy to Understand health reports
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-[#E0F7F1] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-[#0F9D8A]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-[#344054] text-sm">
                Track your progress over time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-2 mb-5">
                <Image
                  src="/white logo.png"
                  alt="HMEX"
                  width={50}
                  height={50}
                  className="object-contain"
                />
                <span className="text-2xl font-bold text-emerald-600">HMEX</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-semibold text-[#1D2939] mb-1">
            Create Your Account
          </h1>
          <p className="text-sm text-[#475467] mb-8">
            Personalized insights for a healthier future start here.
          </p>

          {/* FORM */}
          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="text-sm font-medium text-[#344054] mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3 border border-[#D0D5DD] rounded-lg text-black focus:ring-2 focus:ring-[#0FB6C8]"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-[#344054] mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-3 border border-[#D0D5DD] rounded-lg text-black focus:ring-2 focus:ring-[#0FB6C8]"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-[#344054] mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-[#D0D5DD] rounded-lg text-black focus:ring-2 focus:ring-[#0FB6C8]"
                />
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="text-sm font-medium text-[#344054] mb-2 block">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 border border-[#D0D5DD] rounded-lg text-black focus:ring-2 focus:ring-[#0FB6C8]"
                />
              </div>
            </div>

            {/* Create Account */}
            <button className="w-full py-3 bg-teal-500 cursor-pointer  text-white rounded-lg font-semibold hover:bg-[#0EA8B8] transition">
              Create Account
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6 gap-4">
            <div className="flex-1 border-t border-gray-300" />
            <span className="text-sm text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {/* Google */}
          <button className="w-full text-black border border-[#D0D5DD] bg-white py-3 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign up with Google
          </button>

          {/* Login */}
          <p className="text-center text-sm text-[#475467] mt-6">
            Already have an account?{" "}
            <a className="text-[#0FB6C8] font-medium hover:text-[#0EA8B8]">
              Log In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

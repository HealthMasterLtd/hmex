"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Mail, Lock, Shield } from "lucide-react";

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = () => {
    console.log("Login:", formData);
  };

  const handleGoogleLogin = () => {
    console.log("Login with Google");
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-3 sm:p-6">
        <div className="
          w-full max-w-md 
          bg-white border border-teal-100 
          rounded-3xl shadow-xl p-8
          backdrop-blur-sm
        ">

          {/* LOGO */}
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

          {/* TITLE */}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome Back to HMEX
          </h1>
          <p className="text-gray-600 mb-8">
            Your health insights are always safe and ready for you.
          </p>

          {/* EMAIL */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 text-black py-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 text-black py-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            className="w-full cursor-pointer bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-lg transition"
          >
            Log In
          </button>

          {/* DIVIDER */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-xs text-gray-500">OR</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>

          {/* GOOGLE LOGIN */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 
            hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-lg transition"
          >
            <Image
              src="/google.png" 
              alt="Google"
              width={20}
              height={20}
            />
            Continue with Google
          </button>

          {/* PRIVACY */}
          <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
            <Shield className="text-emerald-600 w-5 h-5 mt-0.5" />
            <p className="text-sm text-emerald-900">
              Your data stays private and secure.
            </p>
          </div>

          {/* SIGN UP */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <a href="#" className="text-emerald-600 font-medium hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* RIGHT IMAGE */}
    <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-[#E6F7F8]">
  <div
    className="
      relative 
      w-full
      h-full
      overflow-hidden 
      
      shadow-lg
      bg-white
    "
  >
    <Image
      src="/Nurse.jpg"
      alt="Doctor"
      quality={100}
      fill
      className="object-cover"
    />
  </div>
</div>
    </div>
  );
};

export default LoginPage;

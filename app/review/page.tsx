"use client";

import React from "react";
import { useRouter } from "next/navigation";

const RiskPreviewPage: React.FC = () => {
  const router = useRouter()

  const handleLoginSignUp = () => {
    router.push('/login')
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-6xl mx-auto px-6 py-24">

        {/* TOP GRADIENT CARD SECTION */}
        <div className="
          rounded-3xl
          p-12
          bg-linear-to-b
          from-emerald-400
          via-emerald-400/70
          to-transparent
          shadow-xl
          relative
        ">
          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Here is your quick risk snapshot
          </h1>

          {/* Subtext */}
          <p className="text-white/90 max-w-3xl text-lg mb-14">
            This is a simple educational overview, not a medical diagnosis.
            Use it to start a helpful chat with your health care team.
          </p>
        </div>

        {/* CTA SECTION */}
        <div className="mt-12 text-center flex justify-between ">
          <p className="text-xl font-semibold text-blue-900 mb-4">
            To view a full report
          </p>

          <button
            onClick={handleLoginSignUp}
            className="
              bg-blue-900
              hover:bg-blue-800
              text-white
              font-semibold
              px-10
              py-3
              rounded-full
              shadow-md
              transition
              cursor-pointer
            "
          >
            PLEASE LOGIN/SIGN UP
          </button>
        </div>

      </main>
    </div>
  );
};

export default RiskPreviewPage;

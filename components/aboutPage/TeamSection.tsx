'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TeamSection = () => {
  const team = [
    { name: "Irene Dushime", role: "CEO", bg: "bg-[#00C896]", image: "/assets/new/Irene.jpg" },
    { name: "Bonheur", role: "COO", bg: "bg-[#0B2E6F]", image: "/assets/new/bonheur.JPG" },
    { name: "Brian Chege", role: "CTO", bg: "bg-[#00C896]", image: "/assets/new/Brian.jpg" },
    { name: "Mucyo Papy Blaise", role: "Developer", bg: "bg-[#00C896]", image: "/assets/14.png" },
    { name: "Francis", role: "Product Manager", bg: "bg-[#0B2E6F]", image: "/assets/new/Francis.JPG" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? team.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === team.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="bg-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
        <h2 className="text-4xl font-bold text-[#0B2E6F] text-center mb-20">
          Meet Our Team
        </h2>

        {/* Desktop View - Original Layout */}
        <div className="hidden md:block">
          {/* Top Row - 3 members */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-32 mb-12">
            {team.slice(0, 3).map((member, index) => (
              <div key={index} className="w-48">
                {/* Image with colored background - sits on top */}
                <div className={`${member.bg} overflow-hidden w-full h-56 -mb-12 relative z-10 shadow-lg`}>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* White Card below */}
                <div className="bg-white shadow-md pt-14 pb-5 px-4 text-center">
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{member.name}</h4>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs text-gray-600">{member.role}</p>
                    <span className="w-3.5 h-3.5 bg-[#00C896] rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">in</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Row - 2 members centered */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-32">
            {team.slice(3, 5).map((member, index) => (
              <div key={index} className="w-48">
                {/* Image with colored background - sits on top */}
                <div className={`${member.bg} overflow-hidden w-full h-56 -mb-12 relative z-10 shadow-lg`}>
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* White Card below */}
                <div className="bg-white shadow-md pt-14 pb-5 px-4 text-center">
                  <h4 className="font-bold text-sm text-gray-900 mb-1">{member.name}</h4>
                  <div className="flex items-center justify-center gap-1.5">
                    <p className="text-xs text-gray-600">{member.role}</p>
                    <span className="w-3.5 h-3.5 bg-[#00C896] rounded-full flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">in</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View - Slider with Chevrons */}
        <div className="md:hidden relative">
          <div className="flex justify-center items-center">
            {/* Left Chevron */}
            <button
              onClick={handlePrev}
              className="absolute left-0 z-20 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-colors"
              aria-label="Previous team member"
            >
              <ChevronLeft className="w-6 h-6 text-[#0B2E6F]" />
            </button>

            {/* Team Member Card */}
            <div className="w-48 mx-auto">
              <div className={`${team[currentIndex].bg} overflow-hidden w-full h-56 -mb-12 relative z-10 shadow-lg`}>
                <img
                  src={team[currentIndex].image}
                  alt={team[currentIndex].name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="bg-white shadow-md pt-14 pb-5 px-4 text-center">
                <h4 className="font-bold text-sm text-gray-900 mb-1">{team[currentIndex].name}</h4>
                <div className="flex items-center justify-center gap-1.5">
                  <p className="text-xs text-gray-600">{team[currentIndex].role}</p>
                  <span className="w-3.5 h-3.5 bg-[#00C896] rounded-full flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">in</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Chevron */}
            <button
              onClick={handleNext}
              className="absolute right-0 z-20 bg-white shadow-lg rounded-full p-3 hover:bg-gray-100 transition-colors"
              aria-label="Next team member"
            >
              <ChevronRight className="w-6 h-6 text-[#0B2E6F]" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {team.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-[#00C896]' : 'bg-gray-300'
                }`}
                aria-label={`Go to team member ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
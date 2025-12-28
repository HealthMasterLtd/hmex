import Image from "next/image";

export default function MissionVision() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-20">
      {/* Title */}
      <h2 className="text-3xl font-bold text-[#0B2E6F] text-center mb-12">
        Our Mission & Vision
      </h2>

      {/* Grid Layout */}
      <div className="relative grid md:grid-cols-3 gap-0 items-center">
        {/* Mission Card - Left */}
        <div className="bg-[#00C896] text-white p-10 relative z-10 md:-mr-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="font-bold text-2xl">Our Mission</h3>
          </div>
          <p className="leading-relaxed">
            To empower individuals with early health awareness and guide them
            toward the right carusing technology that is simple, trusted, and
            built for real life.
          </p>
        </div>

        {/* Center Image */}
        <div className="relative z-20 md:-mx-4 overflow-hidden shadow-lg">
          <Image
          src="/assets/new/13.png"
          alt="Person looking up with determination"
          width={300}
          height={200}
          className="w-full h-full object-cover"
          priority
        />
        </div>

        {/* Vision Card - Right */}
        <div className="bg-[#0B2E6F] text-white p-10 relative z-10 md:-ml-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
              <span className="text-xl">👁️</span>
            </div>
            <h3 className="font-bold text-2xl">Our Vision</h3>
          </div>
          <p className="leading-relaxed">
            To empower individuals with early health awareness and guide them
            toward the right care using technology that is simple, trusted, and
            built for real life.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function ImpactStats() {
  return (
    <section
      className="relative py-20 bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/new/4.png')" }}
    >
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Title */}
        <h2 className="text-4xl font-bold text-white text-center mb-16">
          Our Early Impact
        </h2>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          
          {/* Stat 1 */}
          <div className="bg-[#0B2E6F] text-white p-10 text-center">
            <h3 className="text-5xl font-bold mb-3">1,200+</h3>
            <p className="text-lg font-semibold mb-2">Risk assessments completed</p>
            <p className="text-sm text-gray-200">
              Helping individuals understand their potential risk for diabetes and hypertension.
            </p>
          </div>

          {/* Stat 2 */}
          <div className="bg-[#0B2E6F] text-white p-10 text-center">
            <h3 className="text-5xl font-bold mb-3">500+</h3>
            <p className="text-lg font-semibold mb-2">Personalized health tips delivered</p>
            <p className="text-sm text-gray-200">
              Actionable, easy-to-follow guidance tailored based on individual responses.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
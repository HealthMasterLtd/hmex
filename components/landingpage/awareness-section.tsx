export default function AwarenessSection() {
  return (
    <>
      {/* Demo: Section before (to show scrolling works normally) */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">Risk Assessment</h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            Take our comprehensive health risk assessment to understand your current health status.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Scroll down to see the parallax section...
          </p>
        </div>
      </section>

      {/* Parallax Section - Only this part has the fixed background */}
      <section className="relative w-full py-16 md:py-24 px-4 overflow-hidden">
        {/* Fixed Background Image - confined to this section */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: "url(/Background.jpg)",
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="max-w-6xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Turning Awareness into Action: How We Fight NCDs
            </h2>
            <p className="text-lg md:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
              We combine technology, data, and community to help people detect risks early, take preventive action, and
              stay healthy.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
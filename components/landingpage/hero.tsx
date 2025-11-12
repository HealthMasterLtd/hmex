/* eslint-disable @next/next/no-img-element */
export default function Hero() {
  return (
    <section className="w-full py-12 md:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center justify-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-in-left">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight text-balance">
              Check Your Health Risk Early – Stay Aware, Stay Healthy.
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed text-balance">
              Assess your NCD risk, get prevention tips, and connect to care – all in one place
            </p>
            <button className="inline-block px-8 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition-colors shadow-lg hover:shadow-xl">
              Start Your Risk Check
            </button>
          </div>

          {/* Right Image */}
          <div className="relative h-96 md:h-full animate-fade-in-up">
            <div className="absolute bg-white flex items-center justify-center overflow-hidden">
              <img
                src="/Hero22.png"
                alt="Woman checking health on smartphone"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

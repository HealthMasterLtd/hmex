import Image from "next/image"

const features = [
  {
    icon: "/assets/2.png",
    title: "AI-Driven Accuracy:",
    description: "Our risk assessments are built on validated medical research and reviewed by health experts.",
  },
  {
    icon: "/assets/3.png",
    title: "Human + Technology Approach",
    description: "Smart AI guidance backed by real doctors for trustworthy results.",
  },
  {
    icon: "/assets/5zoom.png",
    title: "Fast & Accessible",
    description: "Complete your risk check in under a minute — anytime, anywhere.",
  },
  {
    icon: "/assets/2.png",
    title: "Personalized Prevention Tips",
    description: "Get simple, actionable insights tailored to your lifestyle.",
  },
  {
    icon: "/assets/3.png",
    title: "Secure & Private",
    description: "Your information stays confidential and protected.",
  },
]

export default function WhyChooseUs() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-[#1a3a52] mb-2">
            Why Choose Us
          </h2>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-5 items-center">
          
          <div className="bg-emerald-500 rounded-3xl p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                {/* Icon */}
                <div className="shrink-0 w-10 h-10 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center">
                  <Image
                    src={feature.icon}
                    alt={feature.title}
                    width={28}
                    height={28}
                    className="w-6 h-6 md:w-7 md:h-7 object-contain"
                  />
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-[#1a3a52] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-white leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Stats and Image */}
          <div className="space-y-6">
            {/* Stats Header */}
            <div className="text-right mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                NCD risk checks completed
              </h3>
            </div>

            {/* Image with Stats Overlay */}
            <div className="relative">
              {/* Large Number */}
              <div className="absolute top-8 left-20 z-10">
                <span className="text-3xl md:text-5xl lg:text-7xl font-bold text-emerald-500">
                  1,240+
                </span>
              </div>

              {/* Doctor Image */}
              <div className="relative">
                <div className="relative w-full max-w-[500px] ml-auto">
                  <Image
                    src="/assets/5zoom.png"
                    alt="Healthcare professional"
                    width={400}
                    height={500}
                    className="w-full h-auto object-contain rounded-3xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
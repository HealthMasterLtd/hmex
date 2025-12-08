import Image from "next/image"

const stepsLeft = [
  {
    number: "01",
    title: "Check Your Risk",
    description: "Answer quick health & lifestyle questions",
    icon: "/assets/2.png",
  },
  {
    number: "02",
    title: "AI Analyzes",
    description: "Get your personalized NCD risk score instantly",
    icon: "/assets/3.png",
  },
  {
    number: "03",
    title: "Get Smart Tips",
    description: "Receive daily prevention and lifestyle advice",
    icon: "/assets/5.png",
  },
]

const stepsRight = [
  {
    number: "04",
    title: "Connect to Care",
    description: "Get referred to nearby health centers",
    icon: "/assets/2.png",
  },
  {
    number: "05",
    title: "Empowering Insights",
    description: "Data helps health systems act faster",
    icon: "/assets/3.png",
  },
]

export default function HowItWorks() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a3a52] mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-sm md:text-base leading-relaxed px-4">
            Your health journey made simple in 5 Steps: answer a few questions, get instant insights, and receive guidance tailored just for you.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Steps */}
          <div className="space-y-10 md:space-y-12 relative">
            {/* Vertical connecting line */}
            <div className="hidden lg:block absolute left-[50px] top-[60px] bottom-[60px] w-px bg-gray-200"></div>
            
            {stepsLeft.map((step, _idx) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  {/* Number */}
                  <div className="shrink-0 w-12 text-left">
                    <span className="text-xl md:text-2xl font-bold text-gray-300">{step.number}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 md:w-10 md:h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center relative z-10">
                    <Image
                      src={step.icon}
                      alt={step.title}
                      width={32}
                      height={32}
                      className="w-7 h-7 md:w-8 md:h-8 object-contain"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-sm md:text-base text-gray-600 flex-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Horizontal underline */}
                <div className="ml-[90px] md:ml-[100px] h-px bg-gray-300 w-[280px] md:w-[320px]"></div>
              </div>
            ))}
          </div>

          {/* Center Image */}
          <div className="flex justify-center items-center lg:mx-6 xl:mx-8">
            <div className="relative w-full max-w-[320px] md:max-w-[380px] lg:max-w-[420px]">
              <Image
                src="/assets/4zoom.png"
                alt="Healthcare professional showing five fingers"
                width={450}
                height={500}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Right Steps */}
          <div className="space-y-10 md:space-y-12">
            {stepsRight.map((step) => (
              <div key={step.number} className="relative">
                <div className="flex items-start gap-4">
                  {/* Number */}
                  <div className="shrink-0 w-12 text-left">
                    <span className="text-xl md:text-2xl font-bold text-gray-300">{step.number}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className="shrink-0 w-10 h-10 md:w-10 md:h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                    <Image
                      src={step.icon}
                      alt={step.title}
                      width={32}
                      height={32}
                      className="w-7 h-7 md:w-8 md:h-8 object-contain"
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                      <p className="text-sm md:text-base text-gray-600 flex-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Horizontal underline */}
                <div className="ml-[90px] md:ml-[100px] h-px bg-gray-300 w-[280px] md:w-[320px]"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
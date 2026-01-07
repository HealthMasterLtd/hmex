import Image from "next/image"
import {
  ClipboardCheck,
  Brain,
  Lightbulb,
  Hospital,
  Share2,
} from "lucide-react"

const stepsLeft = [
  {
    number: "01",
    title: "Check Your Risk",
    description: "Answer quick health & lifestyle questions",
    icon: ClipboardCheck,
  },
  {
    number: "02",
    title: "AI Analyzes",
    description: "Get your personalized NCD risk score instantly",
    icon: Brain,
  },
  {
    number: "03",
    title: "Get Smart Tips",
    description: "Receive daily prevention and lifestyle advice",
    icon: Lightbulb,
  },
]

const stepsRight = [
  {
    number: "04",
    title: "Connect to Care",
    description: "Get referred to nearby health centers",
    icon: Hospital,
  },
  {
    number: "05",
    title: "Empowering Insights",
    description: "Data helps health systems act faster",
    icon: Share2,
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="w-full scroll-mt-24 py-12 md:py-16 lg:py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a3a52] mb-4">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-4xl mx-auto text-sm md:text-base leading-relaxed px-4">
            Your health journey made simple in 5 Steps: answer a few questions, get instant insights, and receive guidance tailored just for you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-12 xl:gap-16 items-start">
          {/* Left Steps */}
          <div className="space-y-10 md:space-y-12 relative">
            <div className="hidden lg:block absolute left-12.5 top-15 bottom-15 w-px bg-gray-200"></div>

            {stepsLeft.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 text-left">
                      <span className="text-xl md:text-2xl font-bold text-gray-300">
                        {step.number}
                      </span>
                    </div>

                    <div className="shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center relative z-10">
                      <Icon className="w-6 h-6 text-emerald-500" />
                    </div>

                    <div className="flex-1 pt-1">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="ml-22.5 md:ml-25 h-px bg-gray-300 w-70 md:w-[320px]"></div>
                </div>
              )
            })}
          </div>

          {/* Center Image */}
          <div className="flex justify-center items-center lg:mx-6 xl:mx-8">
            <div className="relative w-full max-w-[320px] md:max-w-95 lg:max-w-105">
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
            {stepsRight.map((step) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="relative">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 text-left">
                      <span className="text-xl md:text-2xl font-bold text-gray-300">
                        {step.number}
                      </span>
                    </div>

                    <div className="shrink-0 w-10 h-10 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
                      <Icon className="w-6 h-6 text-emerald-500" />
                    </div>

                    <div className="flex-1 pt-1">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 mb-4">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  <div className="ml-22.5 md:ml-25 h-px bg-gray-300 w-70 md:w-[320px]"></div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

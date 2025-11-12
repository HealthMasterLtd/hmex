import { CheckCircle2, Brain, MessageCircle, BarChart3, Zap } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Check Your Risk",
    description: "Answer quick health & lifestyle questions",
    icon: CheckCircle2,
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
    icon: MessageCircle,
  },
  {
    number: "04",
    title: "Connect to Care",
    description: "Get referral to nearby health centers",
    icon: Zap,
  },
  {
    number: "05",
    title: "Empowering Insights",
    description: "Data helps health systems act faster",
    icon: BarChart3,
  },
]

export default function HowItWorks() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-28 px-6 sm:px-8 lg:px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12 md:mb-20 space-y-3">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900">
            How It Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            A simple, AI-driven process that helps you assess and manage your health risk step by step.
          </p>
        </div>

        {/* Timeline Flow */}
        <div className="relative">
          {/* Connecting Line (only visible on large screens) */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-emerald-500  rounded-full"></div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 md:gap-10 lg:gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon
              const isEven = idx % 2 === 1
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center text-center ${
                    isEven ? "lg:mt-20" : ""
                  }`}
                >
                  {/* Step Circles */}
                  <div className="flex flex-col items-center mb-6">
                    <div className="hidden sm:flex w-20 h-20 rounded-full bg-white border-4 border-gray-900 items-center justify-center mb-4 shadow-md">
                      <span className="text-2xl font-bold text-gray-900">{step.number}</span>
                    </div>
                                  
                    {/* Icon Circle (always visible) */}
                    <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                      <Icon className="w-7 h-7" />
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="space-y-2 px-4 sm:px-2 lg:px-0">
                    <h3 className="font-semibold text-lg sm:text-xl text-gray-900">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

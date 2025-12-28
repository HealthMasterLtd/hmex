const services = [
  {
    icon: "📊",
    text: "Help users quickly assess their risk for diabetes and hypertension",
    color: "bg-[#0B2E6F]"
  },
  {
    icon: "💡",
    text: "Provide clear, personalized prevention tips",
    color: "bg-[#00C896]"
  },
  {
    icon: "🔗",
    text: "Connect people to healthcare professionals when needed",
    color: "bg-[#0B2E6F]"
  },
  {
    icon: "📱",
    text: "Support better follow-up and medication adherence",
    color: "bg-[#00C896]"
  },
  {
    icon: "📈",
    text: "Generate anonymized insights that help strengthen public health efforts",
    color: "bg-[#0B2E6F]"
  }
];

export default function WhatWeDo() {
  return (
    <section className="bg-[#ddf9ef] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <h2 className="text-3xl font-bold text-[#0B2E6F] text-center mb-16">
          What We Do
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="relative bg-white pt-20 pb-8 px-6 shadow-md text-center"
            >
              {/* Icon Circle */}
              <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 ${service.color} rounded-full flex items-center justify-center text-white text-3xl shadow-lg`}>
                {service.icon}
              </div>
              
              {/* Text */}
              <p className="text-sm text-gray-700 leading-relaxed">
                {service.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
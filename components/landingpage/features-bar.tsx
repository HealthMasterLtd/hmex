import { Activity, Lightbulb, Link2, Target } from "lucide-react"

const features = [
  {
    icon: Activity,
    label: "Early Detection",
  },
  {
    icon: Lightbulb,
    label: "Smart Prevention",
  },
  {
    icon: Link2,
    label: "Care Linkage",
  },
  {
    icon: Target,
    label: "Adherence Support",
  },
]

export default function FeaturesBar() {
  return (
    <section className="w-full py-8 px-4 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl hover:bg-emerald-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{feature.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

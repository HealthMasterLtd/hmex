import Image from "next/image"

export default function QuoteSection() {
  return (
    <section className="w-full py-16 md:py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
          <div className="flex justify-center md:justify-start w-full md:w-1/2">
            <Image
              src="/Map.jpeg"
              alt="Africa health network"
              width={800}
              height={800}
              className="w-full max-w-sm h-auto object-cover"
            />
          </div>

          {/* Quote Content */}
          <div className="w-full md:w-1/2 space-y-4 text-center md:text-left">
            <div className="text-4xl text-emerald-500 font-bold">{'"'}</div>
            <p className="text-lg text-gray-700 leading-relaxed">
              In the World Health Organization African Region, non-communicable diseases accounted for approximately 37%
              of all deaths in 2019, up from only 24% in 2000 – signalling a rapid and alarming shift in the health
              burden.
            </p>
            <div className="flex justify-center md:justify-start gap-2 pt-4">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-300"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

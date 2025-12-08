import Image from "next/image"

export default function QuoteSection() {
  return (
    <section className="w-full py-16 md:py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start gap-12 md:gap-16">
          <div className="flex justify-center md:justify-start w-full md:w-1/2">
            <Image
              src="/assets/3.png"
              alt="World map"
              width={400}
              height={300}
              className="w-full max-w-md h-auto object-contain"
            />
          </div>

          <div className="w-full md:w-1/2 space-y-8">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold text-[#001b44] mb-4">
                74% <span className="text-base font-normal text-gray-600">of all deaths</span>
              </h2>
              <p className="text-sm text-gray-700 font-semibold leading-relaxed">
                Non-communicable diseases (NCDs) account for over 70% of all deaths worldwide, making them the leading cause of mortality across the globe.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500 mb-1">33%</div>
                <div className="flex justify-center mb-2 items-center gap-2">
                  <Image
                    src="/assets/cordial.png"
                    alt="cardiovascular"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                  <div className="text-xs text-gray-600 font-bold text-nowrap">cardiovascular diseases</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500 mb-1">17%</div>
                <div className="flex justify-center mb-2 items-center gap-2">
                  <Image
                    src="/assets/cancer.png"
                    alt="cancers"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                  <div className="text-xs text-gray-600 font-bold">Cancers</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500 mb-1">8%</div>
                <div className="flex justify-center mb-2 gap-2 items-center">
                  <Image
                    src="/assets/diabetes.png"
                    alt="diabetes"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                <div className="text-xs text-gray-600 font-bold">Diabetes</div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-500 mb-1">14%</div>
                <div className="flex justify-center mb-2  items-center gap-2">
                  <Image
                    src="/assets/otherCNDS.png"
                    alt="other NCDs"
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                  />
                <div className="text-xs text-gray-600 font-bold text-nowrap">Other NCDs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
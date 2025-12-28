import Image from "next/image";

export default function WhyWeExist() {
  return (
    <section className="bg-[#ddf9ef] py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 grid lg:grid-cols-2 gap-16 items-center">

        {/* LEFT IMAGE LAYOUT */}
        <div className="grid grid-cols-2 gap-4">
          {/* Top Left - Lab work */}
          <div className="overflow-hidden h-48">
            <Image
              src="/assets/new/2.png"
              alt="Laboratory work"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Top Right - Doctor consultation */}
          <div className="overflow-hidden h-48 mt-12">
            <Image
              src="/assets/new/3.png"
              alt="Doctor consultation"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bottom Left - Blood pressure check */}
          <div className="overflow-hidden h-48 -mt-6">
            <Image
              src="/assets/new/4.png"
              alt="Blood pressure check"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          </div>
          <div />
        </div>

        {/* RIGHT CONTENT */}
        <div>
          <h2 className="text-3xl font-bold text-[#0B2E6F] mb-6">
            Why We Exist
          </h2>

          <p className="text-gray-700 leading-relaxed max-w-xl mb-4">
            Non-communicable diseases are silently affecting millions of people
            across Africa. Many live with conditions like hypertension or
            diabetes without knowing it—until it becomes serious.
          </p>

          <p className="text-gray-700 leading-relaxed max-w-xl mb-8">
            We exist to close this gap by making early risk screening simple,
            accessible, and understandable for everyday people.
          </p>

          {/* VIDEO PREVIEW */}
          <div className="relative w-full max-w-xl h-56 overflow-hidden">
            <Image
              src="/assets/new/cancerII.png"
              alt="Health awareness video"
              fill
              className="object-cover w-full h-full"
            />

            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer">
                <span className="ml-1 text-black text-xl">▶</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

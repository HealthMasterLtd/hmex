import Image from 'next/image'

export default function WhoWeAre() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-16 grid md:grid-cols-2 gap-10">
      <div>
        <h2 className="text-2xl font-bold text-blue-900 mb-4">Who We Are</h2>
        <div className="flex flex-col gap-5">
          <p className="text-gray-700 leading-relaxed">
          We are a digital health team committed to helping people understand
          their health earlier, before serious complications arise. Our platform
          uses simple questions, smart technology, and clear guidance to help
          individuals assess their risk for non-communicable diseases like
          diabetes and high blood pressure.
        </p>
        <p className="text-gray-700 leading-relaxed">
          We believe that everyone deserves access to basic health insights, no
          matter where they live or what device they use.
        </p>
        </div>
      </div>

      <div className="relative w-full h-64 bg-black overflow-hidden">
        <Image
        src="/assets/new/2.png"
        alt="Healthcare"
        fill
        className="w-full object-cover"
      />
      </div>
    </section>
  );
}

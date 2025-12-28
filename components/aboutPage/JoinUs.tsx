const JoinUs = () => {
  return (
    <section className="bg-gray-100 py-20 px-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side with green accent */}
          <div className="relative">
            <div className="md:flex hidden absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-[#00C896] rounded-r-3xl" />
            <div className="relative md:pl-64 pl-0 ">
              <h2 className="text-4xl font-bold text-[#0B2E6F] mb-6">Join Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are building this platform with communities, healthcare workers, and partners who believe in preventive care.
              </p>
              <p className="text-gray-700 leading-relaxed mb-8">
                If you share our vision, we{"'"}d love to work together.
              </p>
              <button className="bg-[#00C896] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#00b386] transition-colors">
                Contact Us
              </button>
            </div>
          </div>

          {/* Right side with doctor image */}
          <div className="md:flex hidden justify-center md:justify-end">
            <div className="bg-gray-300 w-full max-w-md h-100 overflow-hidden">
              <img 
                src="/assets/new/1.png" 
                alt="Healthcare professional" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JoinUs;
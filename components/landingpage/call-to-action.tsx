export default function CallToAction() {
  return (
    <section className="bg-white py-16">
      {/* centered green panel (not full-width) */}
      <div className="max-w-7xl mx-auto bg-emerald-500 px-6 md:px-12 py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Ready to Know your health status?
        </h2>

        <p className="text-white text-lg md:text-xl mb-10">
          Take the first step towards better health today
        </p>

        <div className="flex justify-center">
          <button
            type="button"
            className="relative inline-flex items-center gap-4 cursor-pointer rounded-full px-8 py-3 font-semibold text-white bg-[#071a2a] hover:bg-[#092436] focus:outline-none focus:ring-4 focus:ring-black/10 shadow-md transition transform active:translate-y-0.5"
          >
            <span className="select-none">Start Your Free Assessment</span>

            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-[#071a2a]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

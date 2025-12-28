export default function HeroAbout() {
  return (
    <section
      className="relative h-[60vh] bg-cover bg-center"
      style={{ backgroundImage: "url('/assets/new/hero.png')" }}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 flex h-full items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          About Us
        </h1>
      </div>
    </section>
  );
}

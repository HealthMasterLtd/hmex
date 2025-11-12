import Navbar from "@/components/landingpage/navbar"
import Hero from "@/components/landingpage/hero"
import QuoteSection from "@/components/landingpage/quote-section"
import AwarenessSection from "@/components/landingpage/awareness-section"
import HowItWorks from "@/components/landingpage/how-it-works"
import CallToAction from "@/components/landingpage/call-to-action"
import Footer from "@/components/landingpage/footer"
import Partners from "@/components/landingpage/partners"


export default function Home() {
  return (
    <main className="w-full">
      <Navbar />
      <Hero />
      <QuoteSection />
      <AwarenessSection />
      <HowItWorks />
      <Partners />
      <CallToAction />
      <Footer />
    </main>
  )
}

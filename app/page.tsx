import Hero from "@/components/landingPage/hero"
import QuoteSection from "@/components/landingPage/quote-section"
import AwarenessSection from "@/components/landingPage/awareness-section"
import HowItWorks from "@/components/landingPage/how-it-works"
import CallToAction from "@/components/landingPage/call-to-action"
import Partners from "@/components/landingPage/partners"
import WhyChooseUs from "@/components/landingPage/whyChoos-us"
import Navbar from "@/components/landingPage/navbar"
import Footer from "@/components/ui/Footer"


export default function Home() {
  return (
    <main className="w-full">
      <Navbar/>
      <Hero />
      <QuoteSection />
      <AwarenessSection />
      <HowItWorks />
      <WhyChooseUs />
      <Partners />
      <CallToAction />
      <Footer/>
    </main>
  )
}

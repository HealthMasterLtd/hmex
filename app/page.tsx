import AwarenessSection from "@/components/landingpage/awareness-section"
import CallToAction from "@/components/landingpage/call-to-action"
import Hero from "@/components/landingpage/hero"
import HowItWorks from "@/components/landingpage/how-it-works"
import Navbar from "@/components/landingpage/navbar"
import Partners from "@/components/landingpage/partners"
import QuoteSection from "@/components/landingpage/quote-section"
import WhyChooseUs from "@/components/landingpage/whyChoos-us"
import ThemeToggle from "@/components/Themetoggle"
import Footer from "@/components/ui/Footer"

export default function Home() {
  return (
    <main className="w-full">
      <Navbar/>
      <Hero/>
      <QuoteSection/>
      <AwarenessSection/>
      <HowItWorks/>
      <WhyChooseUs/>
      <Partners/>
      <CallToAction/>
      <Footer/>
    </main>
  )
}
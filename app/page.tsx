import Hero from "@/components/landingpage/hero"
import QuoteSection from "@/components/landingpage/quote-section"
import AwarenessSection from "@/components/landingpage/awareness-section"
import HowItWorks from "@/components/landingpage/how-it-works"
import CallToAction from "@/components/landingpage/call-to-action"
import Partners from "@/components/landingpage/partners"
import WhyChooseUs from "@/components/landingpage/whyChoos-us"
import Navbar from "@/components/landingpage/navbar"
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

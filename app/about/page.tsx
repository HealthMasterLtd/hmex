import HeroAbout from "@/components/aboutPage/HeroAbout";
import WhoWeAre from "@/components/aboutPage/WhoWeAre";
import WhyWeExist from "@/components/aboutPage/WhyWeExist";
import MissionVision from "@/components/aboutPage/MissionVision";
import WhatWeDo from "@/components/aboutPage/WhatWeDo";
import ImpactStats from "@/components/aboutPage/ImpactStats";
import TeamSection from "@/components/aboutPage/TeamSection";
import JoinUs from "@/components/aboutPage/JoinUs";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/landingpage/navbar";

export default function AboutPage() {
  return (
    <div>
      <Navbar />
      <main className="bg-[#E9FBF5]">
        <HeroAbout />
        <WhoWeAre />
        <WhyWeExist />
        <MissionVision />
        <WhatWeDo />
        <ImpactStats />
        <TeamSection />
        <JoinUs />
      </main>
      <Footer />
    </div>
  );
}

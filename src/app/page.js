import HeroSection from "@/app/components/HeroSection";
import PremiumInvestmentProperties from "./components/PremiumInvestmentProperties";
import WhatWeDo from "./components/WhatWeDo";
import InvestmentSteps from "./components/InvestmentSteps";
import TestimonialsSection from './components/TestimonialsSection';
import StayUpdated from "./components/StayUpdated";
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PremiumInvestmentProperties />
      <WhatWeDo />
      <InvestmentSteps />
      <TestimonialsSection />
      <StayUpdated />
    </>
  );
}

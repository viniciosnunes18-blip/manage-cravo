import React from "react";
import HeroSection from "../components/home/HeroSection";
import StatsCounter from "../components/home/StatsCounter";
import ProductShowcase from "../components/home/ProductShowcase";
import BraceletsSection from "../components/home/BraceletsSection";
import InitialNecklaceSection from "../components/home/InitialNecklaceSection";
import DifferentialsSection from "../components/home/DifferentialsSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import TestimonialsSection from "../components/home/TestimonialsSection";
import CTASection from "../components/home/CTASection";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <StatsCounter />
      <ProductShowcase />
      <BraceletsSection />
      <InitialNecklaceSection />
      <DifferentialsSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  );
}
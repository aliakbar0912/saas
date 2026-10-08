"use client";

import {
  LandingHero,
  LandingFeatures,
  LandingWorkflow,
  LandingPricing,
  LandingFAQ,
  LandingFinalCTA,
  LandingNav,
  LandingFooter,
} from "./sections";

export function Landing() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <LandingHero />
        <LandingFeatures />
        <LandingWorkflow />
        <LandingPricing />
        <LandingFAQ />
        <LandingFinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}

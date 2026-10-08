"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { Landing } from "@/components/landing/Landing";
import { AppShell } from "@/components/app/AppShell";
import { AuthModal } from "@/components/app/AuthModal";
import { PublicHeader, PublicFooter } from "@/components/public/Layout";
import {
  HomePage,
  FeaturesPage,
  PricingPage,
  StatusPage,
  AboutPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  SecurityPage,
  DPAPage,
  CompliancePage,
  ChangelogPage,
  RoadmapPage,
  CareersPage,
  BlogPage,
  BlogPostPage,
  PressPage,
  DocsPage,
  ApiRefPage,
  GuidesPage,
  CommunityPage,
  SupportPage,
} from "@/components/public/Pages";

export default function Home() {
  const inApp = useStore((s) => s.inApp);
  const user = useStore((s) => s.user);
  const authReady = useStore((s) => s.authReady);
  const initAuth = useStore((s) => s.initAuth);
  const publicView = useStore((s) => s.publicView);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (authReady && !user && inApp) {
      useStore.setState({ inApp: false });
    }
  }, [authReady, user, inApp]);

  if (inApp) {
    return (
      <>
        <AppShell />
        <AuthModal />
      </>
    );
  }

  // Public website
  const renderPublicPage = () => {
    switch (publicView) {
      case "home": return <HomePage />;
      case "features": return <FeaturesPage />;
      case "pricing": return <PricingPage />;
      case "status": return <StatusPage />;
      case "about": return <AboutPage />;
      case "contact": return <ContactPage />;
      case "privacy": return <PrivacyPage />;
      case "terms": return <TermsPage />;
      case "security": return <SecurityPage />;
      case "dpa": return <DPAPage />;
      case "compliance": return <CompliancePage />;
      case "changelog": return <ChangelogPage />;
      case "roadmap": return <RoadmapPage />;
      case "careers": return <CareersPage />;
      case "blog": return <BlogPage />;
      case "blog-post": return <BlogPostPage />;
      case "press": return <PressPage />;
      case "docs": return <DocsPage />;
      case "api-ref": return <ApiRefPage />;
      case "guides": return <GuidesPage />;
      case "community": return <CommunityPage />;
      case "support": return <SupportPage />;
      default: return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        {renderPublicPage()}
      </main>
      <PublicFooter />
      <AuthModal />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Check,
  Activity,
  Shield,
  FileText,
  Users,
  Zap,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = {
  Product: [
    { label: "Features", view: "features" },
    { label: "Pricing", view: "pricing" },
    { label: "Changelog", view: "changelog" },
    { label: "Roadmap", view: "roadmap" },
    { label: "Status", view: "status" },
  ],
  Resources: [
    { label: "Documentation", view: "docs" },
    { label: "API Reference", view: "api-ref" },
    { label: "Guides", view: "guides" },
    { label: "Community", view: "community" },
    { label: "Support", view: "support" },
  ],
  Company: [
    { label: "About", view: "about" },
    { label: "Careers", view: "careers" },
    { label: "Blog", view: "blog" },
    { label: "Press", view: "press" },
    { label: "Contact", view: "contact" },
  ],
};

const FOOTER_LINKS = {
  Product: NAV.Product,
  Company: NAV.Company,
  Resources: NAV.Resources,
  Legal: [
    { label: "Privacy", view: "privacy" },
    { label: "Terms", view: "terms" },
    { label: "Security", view: "security" },
    { label: "DPA", view: "dpa" },
    { label: "Compliance", view: "compliance" },
  ],
};

export function PublicHeader() {
  const { publicView, setPublicView, setAuthModalOpen, user, enterApp } = useStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (view: string) => {
    setPublicView(view);
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigate("home")} className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
            <div className="h-3 w-3 bg-black rounded-sm" />
          </div>
          <span className="font-semibold tracking-tight">Nexus</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {Object.entries(NAV).map(([category, items]) => (
            <div
              key={category}
              className="relative"
              onMouseEnter={() => setOpenDropdown(category)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                {category}
                <ChevronDown className="h-3 w-3" />
              </button>
              <AnimatePresence>
                {openDropdown === category && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-border bg-popover shadow-2xl shadow-black/40 p-1.5 z-50"
                  >
                    {items.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => navigate(item.view)}
                        className="w-full text-left rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <button
            onClick={() => navigate("pricing")}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={enterApp}
              className="rounded-full bg-white text-black text-sm font-medium px-4 h-9 hover:bg-white/90 transition-colors"
            >
              Open dashboard
            </button>
          ) : (
            <>
              <button
                onClick={() => setAuthModalOpen(true, "login")}
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => setAuthModalOpen(true, "signup")}
                className="rounded-full bg-white text-black text-sm font-medium px-4 h-9 hover:bg-white/90 transition-colors"
              >
                Get started
              </button>
            </>
          )}
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden h-9 w-9 rounded-lg border border-border flex items-center justify-center"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border overflow-hidden"
          >
            <div className="px-6 py-4 space-y-4">
              {Object.entries(NAV).map(([category, items]) => (
                <div key={category}>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{category}</div>
                  <div className="space-y-1">
                    {items.map((item) => (
                      <button
                        key={item.view}
                        onClick={() => navigate(item.view)}
                        className="block w-full text-left py-1.5 text-sm text-foreground hover:text-white"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export function PublicFooter() {
  const setPublicView = useStore((s) => s.setPublicView);
  const navigate = (view: string) => setPublicView(view);

  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
                <div className="h-3 w-3 bg-black rounded-sm" />
              </div>
              <span className="font-semibold">Nexus</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              One workspace for your entire social operation. Connect, create, automate, and analyze — all in one premium platform.
            </p>
          </div>
          {Object.entries(FOOTER_LINKS).map(([category, items]) => (
            <div key={category}>
              <div className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.view}>
                    <button
                      onClick={() => navigate(item.view)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-xs text-muted-foreground">
            © 2026 Nexus, Inc. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}

// Shared UI components for public pages
export function PublicButton({
  children,
  variant = "primary",
  onClick,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  className?: string;
}) {
  const variants = {
    primary: "bg-white text-black hover:bg-white/90",
    secondary: "border border-border text-foreground hover:bg-card",
    ghost: "text-muted-foreground hover:text-foreground",
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-6 h-11 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PublicSection({
  children,
  className,
  dark,
}: {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <section className={cn("py-20 lg:py-28", dark && "bg-card/40", className)}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {children}
      </div>
    </section>
  );
}

export function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-xs text-muted-foreground mb-6">
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="pt-32 pb-12">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-lg text-muted-foreground text-pretty leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export function SimplePage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="mt-4 text-base text-muted-foreground text-pretty leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}

export function ComingSoon({ title }: { title: string }) {
  const setPublicView = useStore((s) => s.setPublicView);
  return (
    <div className="pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-6">
          <Zap className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-4 text-base text-muted-foreground leading-relaxed">
          This section is being prepared. In the meantime, explore the rest of Nexus — connect social accounts, generate AI content, schedule posts, and analyze performance.
        </p>
        <div className="mt-8">
          <PublicButton variant="secondary" onClick={() => setPublicView("home")}>
            Back to home
            <ArrowRight className="h-4 w-4" />
          </PublicButton>
        </div>
      </div>
    </div>
  );
}

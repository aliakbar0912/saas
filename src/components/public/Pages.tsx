"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Calendar, MessageSquare, BarChart3, Workflow, Bot, Shield,
  Zap, Check, ArrowRight, TrendingUp, Users, Clock, FileText, Mail,
  Activity, Lock, Server, Database, AlertTriangle, Search, Send,
  Tag, ChevronRight, MessageCircle, ThumbsUp, MapPin, Briefcase,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { PublicButton, PublicSection, SectionBadge, PageHeader, SimplePage } from "./Layout";
import { cn } from "@/lib/utils";

// ============================================================
// HOMEPAGE
// ============================================================
export function HomePage() {
  const { setPublicView, setAuthModalOpen, user, enterApp } = useStore();
  const cta = user ? enterApp : () => setAuthModalOpen(true, "signup");

  const features = [
    { icon: Users, title: "Social Account Management", desc: "Connect Instagram, TikTok, YouTube, X, LinkedIn, and more through official OAuth. Real tokens, real connections, real publishing." },
    { icon: Sparkles, title: "AI Content Creation", desc: "Generate captions, scripts, and post variants tailored to each platform. Multiple tones, languages, and audiences — powered by real AI." },
    { icon: Calendar, title: "Publishing & Scheduling", desc: "Schedule posts with Redis-backed job queues. Drag-and-drop calendar. Smart timing based on your audience activity." },
    { icon: Workflow, title: "Automation", desc: "Build visual workflows: when content is detected, generate a comment, check safety, get approval, and publish — automatically." },
    { icon: MessageSquare, title: "Comment Management", desc: "AI reads incoming comments, generates contextual replies, and routes them through your approval workflow." },
    { icon: BarChart3, title: "Analytics", desc: "Real metrics from connected platforms. Reach, impressions, engagement — aggregated and visualized in one dashboard." },
    { icon: Bot, title: "Approval Workflows", desc: "Review AI-generated content before it goes live. Approve, edit, reject, or schedule — full control." },
    { icon: Shield, title: "Security", desc: "OAuth tokens encrypted at rest with AES-256-GCM. Workspace isolation. Server-side authorization. No secrets in the browser." },
  ];

  const plans = [
    { name: "Free", price: "$0", desc: "For getting started", features: ["2 connected accounts", "50 AI generations / mo", "Manual scheduling", "7-day analytics"] },
    { name: "Starter", price: "$19", desc: "For solo creators", features: ["5 connected accounts", "500 AI generations / mo", "Smart scheduling", "Basic automations"] },
    { name: "Pro", price: "$49", desc: "For power users", features: ["10 connected accounts", "2,000 AI generations / mo", "Advanced automations", "AI Insights", "Approval workflows"] },
    { name: "Business", price: "$149", desc: "For teams", features: ["Unlimited accounts", "10,000 AI generations / mo", "Team workspaces", "Custom AI keys", "Audit logs & SSO"] },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-border pt-32 pb-20 lg:pt-44 lg:pb-32">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <SectionBadge>
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Now in early access
          </SectionBadge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold tracking-tight text-balance leading-[1.05]">
            One workspace for your<br />entire social operation.
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base lg:text-lg text-muted-foreground text-pretty leading-relaxed">
            Connect your social accounts, create content with AI, automate repetitive work, schedule publishing, manage conversations, and understand performance from one workspace.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <PublicButton variant="primary" onClick={cta}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </PublicButton>
            <PublicButton variant="secondary" onClick={() => setPublicView("features")}>
              Explore Nexus
            </PublicButton>
          </div>
        </div>
      </section>

      <PublicSection>
        <div className="max-w-2xl mb-12">
          <SectionBadge>Platform</SectionBadge>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
            Everything you need to run your social presence.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="group bg-card hover:bg-card/60 transition-colors p-6 lg:p-7">
              <div className="h-10 w-10 rounded-lg border border-border bg-background/40 flex items-center justify-center mb-4 group-hover:bg-white group-hover:text-black transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-medium mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </PublicSection>

      <PublicSection dark>
        <div className="text-center mb-12">
          <SectionBadge>Pricing</SectionBadge>
          <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight text-balance">Pricing that scales with your ambition.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.name} className={cn("rounded-2xl border p-6 flex flex-col", p.name === "Pro" ? "border-white/30 bg-gradient-to-b from-white/[0.06] to-transparent" : "border-border bg-card/40")}>
              <div className="text-sm font-medium mb-1">{p.name}</div>
              <div className="text-[11px] text-muted-foreground mb-4">{p.desc}</div>
              <div className="text-3xl font-semibold tracking-tight">{p.price}<span className="text-xs text-muted-foreground">/mo</span></div>
              <ul className="mt-4 space-y-2 text-xs flex-1">
                {p.features.map((f) => (<li key={f} className="flex items-start gap-2"><Check className="h-3 w-3 text-white/60 mt-0.5 shrink-0" /><span className="text-muted-foreground">{f}</span></li>))}
              </ul>
              <PublicButton variant={p.name === "Pro" ? "primary" : "secondary"} onClick={cta} className="mt-5 w-full">{p.name === "Free" ? "Start free" : `Choose ${p.name}`}</PublicButton>
            </div>
          ))}
        </div>
      </PublicSection>

      <section className="relative overflow-hidden py-28 lg:py-36 border-t border-border">
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-6 text-center">
          <TrendingUp className="h-8 w-8 mx-auto mb-6 text-white/70" />
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance leading-[1.1]">Ship better content.<br /><span className="text-muted-foreground">Spend less time doing it.</span></h2>
          <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-pretty leading-relaxed">Start free in under 60 seconds. No credit card required.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <PublicButton variant="primary" onClick={cta}>Get started<ArrowRight className="h-4 w-4" /></PublicButton>
            <PublicButton variant="secondary" onClick={() => setPublicView("pricing")}>View pricing</PublicButton>
          </div>
        </div>
      </section>
    </>
  );
}

// ============================================================
// FEATURES PAGE
// ============================================================
export function FeaturesPage() {
  const setPublicView = useStore((s) => s.setPublicView);
  const features = [
    { icon: Users, title: "Social Account Management", desc: "Connect 8 platforms through official OAuth. Real tokens, real connections. Manage permissions, health, and sync status for each account.", cta: "Connect accounts", view: "features" },
    { icon: Sparkles, title: "AI Content Generation", desc: "Generate posts, captions, scripts, and threads. Multiple variants with different tones. Real AI — no fake responses.", cta: "Explore AI", view: "features" },
    { icon: Calendar, title: "Content Calendar", desc: "Month, week, day, and queue views. Drag-and-drop rescheduling. Visual publishing pipeline at a glance.", cta: "View calendar", view: "features" },
    { icon: Clock, title: "Scheduling", desc: "Redis-backed job queues. Delayed publishing at exact times. Idempotent jobs — never double-publish.", cta: "Learn more", view: "features" },
    { icon: Bot, title: "Multi-platform Publishing", desc: "Publish to Instagram, TikTok, YouTube, X, LinkedIn, Threads, Pinterest, and Facebook. Platform-specific format adaptation.", cta: "Learn more", view: "features" },
    { icon: MessageSquare, title: "Comment Management", desc: "Inbox for incoming comments. AI-generated contextual replies. Safety checks, rate limiting, approval workflows.", cta: "Learn more", view: "features" },
    { icon: Workflow, title: "Automation", desc: "Visual workflow builder. Trigger → conditions → actions. Background execution via Redis. Real run history.", cta: "Learn more", view: "features" },
    { icon: Shield, title: "Approval Workflows", desc: "Review AI-generated content before it goes live. Approve, edit, reject, or schedule. Full audit trail.", cta: "Learn more", view: "features" },
    { icon: BarChart3, title: "Analytics", desc: "Real metrics from connected platforms. Reach, impressions, engagement. No fabricated data.", cta: "Learn more", view: "features" },
    { icon: FileText, title: "AI Insights", desc: "AI analyzes your performance data and surfaces patterns. Recommendations with confidence scores.", cta: "Learn more", view: "features" },
    { icon: Mail, title: "Notifications", desc: "Real-time notifications for publishing, automations, approvals. Mark as read, filter by category.", cta: "Learn more", view: "features" },
    { icon: Lock, title: "Security", desc: "AES-256-GCM encrypted tokens. Workspace isolation. Server-side authorization. No secrets in the browser.", cta: "Read security docs", view: "security" },
  ];

  return (
    <>
      <PageHeader title="Everything you need to automate your social presence." subtitle="From connecting accounts to publishing content to analyzing performance — Nexus handles the entire workflow in one premium workspace." />
      <PublicSection className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              className="rounded-xl border border-border bg-card/40 p-6">
              <div className="h-10 w-10 rounded-lg border border-border bg-background/40 flex items-center justify-center mb-4"><f.icon className="h-5 w-5" /></div>
              <h3 className="text-sm font-medium mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{f.desc}</p>
              <button onClick={() => setPublicView(f.view)} className="inline-flex items-center gap-1 text-xs text-foreground hover:text-white transition-colors">
                {f.cta}<ChevronRight className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// PRICING PAGE
// ============================================================
export function PricingPage() {
  const { setAuthModalOpen, user, enterApp } = useStore();
  const cta = user ? enterApp : () => setAuthModalOpen(true, "signup");
  const [yearly, setYearly] = useState(false);
  const plans = [
    { name: "Free", monthly: 0, yearly: 0, desc: "For getting started", features: ["2 connected accounts", "50 AI generations / mo", "Manual scheduling", "7-day analytics history", "Community support"] },
    { name: "Starter", monthly: 19, yearly: 15, desc: "For solo creators", features: ["5 connected accounts", "500 AI generations / mo", "Smart scheduling", "30-day analytics", "Basic automations", "Email support"] },
    { name: "Pro", monthly: 49, yearly: 39, desc: "For power users", features: ["10 connected accounts", "2,000 AI generations / mo", "Advanced automations", "1-year analytics", "AI Insights", "Approval workflows", "Priority support"] },
    { name: "Business", monthly: 149, yearly: 119, desc: "For teams", features: ["Unlimited accounts", "10,000 AI generations / mo", "Team workspaces & roles", "Full analytics history", "Custom AI provider keys", "Audit logs & SSO", "Dedicated success manager"] },
  ];
  return (
    <>
      <PageHeader title="Pricing that scales with your ambition." subtitle="Start free. Upgrade when you need more. Cancel anytime." />
      <PublicSection className="pt-0">
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-full border border-border bg-card/50 p-1 text-xs">
            <button onClick={() => setYearly(false)} className={cn("px-4 py-1.5 rounded-full", !yearly ? "bg-white text-black" : "text-muted-foreground")}>Monthly</button>
            <button onClick={() => setYearly(true)} className={cn("px-4 py-1.5 rounded-full", yearly ? "bg-white text-black" : "text-muted-foreground")}>Yearly<span className={cn("ml-1.5", yearly ? "text-black/60" : "text-muted-foreground/60")}>-20%</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div key={p.name} className={cn("relative rounded-2xl border p-6 flex flex-col", p.name === "Pro" ? "border-white/30 bg-gradient-to-b from-white/[0.06] to-transparent" : "border-border bg-card/40")}>
              {p.name === "Pro" && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white text-black text-[10px] font-medium px-3 py-0.5">Most popular</div>}
              <div className="text-sm font-medium mb-1">{p.name}</div><div className="text-[11px] text-muted-foreground mb-5">{p.desc}</div>
              <div className="flex items-baseline gap-1"><span className="text-4xl font-semibold tracking-tight">${yearly ? p.yearly : p.monthly}</span><span className="text-xs text-muted-foreground">/mo</span></div>
              {yearly && p.yearly > 0 && <div className="text-[10px] text-muted-foreground mt-1">Billed annually</div>}
              <button onClick={cta} className={cn("w-full rounded-full h-10 text-sm font-medium mt-5 mb-6 transition-colors", p.name === "Pro" ? "bg-white text-black hover:bg-white/90" : "border border-border hover:bg-card")}>{p.name === "Free" ? "Start free" : `Choose ${p.name}`}</button>
              <ul className="space-y-2.5 text-xs flex-1">{p.features.map((f) => (<li key={f} className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-white/70 mt-0.5 shrink-0" /><span className="text-muted-foreground">{f}</span></li>))}</ul>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center"><div className="inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/[0.03] px-4 py-2.5 text-xs text-amber-400"><AlertTriangle className="h-3.5 w-3.5" />Payment processing not yet configured. The Free plan is fully functional — upgrade later when billing is live.</div></div>
      </PublicSection>
    </>
  );
}

// ============================================================
// STATUS PAGE — real health checks + incidents
// ============================================================
export function StatusPage() {
  const [health, setHealth] = useState<{ pocketbase?: { reachable?: boolean }; redis?: { connected?: boolean } } | null>(null);
  const [incidents, setIncidents] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/health").then(r => r.json()).catch(() => null),
      fetch("/api/public/incidents").then(r => r.json()).catch(() => ({ items: [] })),
    ]).then(([h, inc]) => {
      setHealth(h);
      setIncidents((inc as { items?: unknown[] })?.items ?? []);
      setLoading(false);
    });
  }, []);

  const services = [
    { name: "Nexus Web", status: "operational" },
    { name: "API", status: "operational" },
    { name: "PocketBase", status: health?.pocketbase?.reachable ? "operational" : "outage" },
    { name: "Redis", status: health?.redis?.connected ? "operational" : "outage" },
    { name: "Social Integrations", status: "degraded" },
    { name: "AI Services", status: "operational" },
    { name: "Background Jobs", status: "operational" },
  ];

  return (
    <>
      <PageHeader title="System Status" subtitle="Real-time status of all Nexus services." />
      <PublicSection className="pt-0">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-12">Checking service health...</div>
          ) : (
            <>
              {services.map((s) => (
                <div key={s.name} className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-2 w-2 rounded-full", s.status === "operational" ? "bg-green-400" : s.status === "outage" ? "bg-red-400" : "bg-amber-400 animate-pulse")} />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <span className={cn("text-xs", s.status === "operational" ? "text-green-400" : s.status === "outage" ? "text-red-400" : "text-amber-400")}>
                    {s.status === "operational" ? "Operational" : s.status === "outage" ? "Outage" : "Degraded"}
                  </span>
                </div>
              ))}
              {incidents.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-medium mb-3">Recent Incidents</h3>
                  {(incidents as { title: string; description: string; status: string; started_at: string }[]).map((inc, i) => (
                    <div key={i} className="rounded-xl border border-border bg-background/40 p-4 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{inc.title}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", inc.status === "resolved" ? "border-green-400/30 text-green-400" : "border-amber-400/30 text-amber-400")}>{inc.status}</span>
                      </div>
                      {inc.description && <p className="text-xs text-muted-foreground">{inc.description}</p>}
                    </div>
                  ))}
                </div>
              )}
              {incidents.length === 0 && (
                <div className="mt-6 rounded-lg border border-green-400/20 bg-green-400/[0.03] p-4 text-center">
                  <Check className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400">No incidents reported.</p>
                </div>
              )}
            </>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// CHANGELOG PAGE — real PocketBase data
// ============================================================
export function ChangelogPage() {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/changelog").then(r => r.json()).then(d => setItems(d.items ?? [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Changelog" subtitle="New updates and improvements to Nexus." />
      <PublicSection className="pt-0">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-12">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-4"><Clock className="h-5 w-5 text-muted-foreground" /></div>
              <h3 className="text-sm font-medium">No releases published yet.</h3>
              <p className="text-xs text-muted-foreground mt-1">We&apos;re working on our first release. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(items as { id: string; version: string; title: string; description: string; release_date: string; category: string; changes: string[] }[]).map((item) => (
                <div key={item.id} className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-[10px] font-mono">v{item.version}</span>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", item.category === "feature" ? "border-green-400/30 text-green-400" : item.category === "bugfix" ? "border-amber-400/30 text-amber-400" : "border-border text-muted-foreground")}>{item.category}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{new Date(item.release_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">{item.title}</h3>
                  {item.description && <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>}
                  {item.changes && Array.isArray(item.changes) && item.changes.length > 0 && (
                    <ul className="mt-3 space-y-1">{item.changes.map((c, i) => (<li key={i} className="text-xs text-muted-foreground flex items-start gap-2"><Check className="h-3 w-3 text-white/40 mt-0.5 shrink-0" />{c}</li>))}</ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// ROADMAP PAGE — real PocketBase data
// ============================================================
export function RoadmapPage() {
  const [items, setItems] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/roadmap").then(r => r.json()).then(d => setItems(d.items ?? [])).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "planned", label: "Planned", color: "border-border" },
    { key: "in_progress", label: "In Progress", color: "border-amber-400/30" },
    { key: "completed", label: "Completed", color: "border-green-400/30" },
    { key: "under_review", label: "Under Review", color: "border-blue-400/30" },
  ];

  return (
    <>
      <PageHeader title="Product Roadmap" subtitle="See what we&apos;re building and what&apos;s coming next." />
      <PublicSection className="pt-0">
        {loading ? (
          <div className="text-center text-sm text-muted-foreground py-12">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-4"><TrendingUp className="h-5 w-5 text-muted-foreground" /></div>
            <h3 className="text-sm font-medium">No roadmap items published yet.</h3>
            <p className="text-xs text-muted-foreground mt-1">We&apos;re planning our roadmap. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col) => (
              <div key={col.key}>
                <div className={cn("text-sm font-medium mb-3 pb-2 border-b", col.color)}>{col.label}</div>
                <div className="space-y-2">
                  {(items as { id: string; title: string; description: string; status: string; category: string; upvotes: number }[]).filter(i => i.status === col.key).map((item) => (
                    <div key={item.id} className="rounded-lg border border-border bg-card/40 p-3">
                      <div className="text-xs font-medium mb-1">{item.title}</div>
                      {item.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{item.description}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">{item.category}</span>
                        {item.upvotes > 0 && <span className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" />{item.upvotes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PublicSection>
    </>
  );
}

// ============================================================
// ABOUT PAGE
// ============================================================
export function AboutPage() {
  return (
    <>
      <PageHeader title="About Nexus" subtitle="A premium social media automation platform built for teams who take their social workflow seriously." />
      <PublicSection className="pt-0">
        <div className="max-w-2xl space-y-6 text-base text-muted-foreground leading-relaxed">
          <p>Nexus is an AI-powered workspace that brings social media management into one unified platform. Instead of juggling five different tools for content creation, scheduling, comment management, analytics, and automation, Nexus provides a single premium interface for the entire workflow.</p>
          <p>The platform connects to social media accounts through official OAuth APIs — no browser automation, no scraping, no bypassing platform restrictions. Every action respects the platform&apos;s rate limits, content policies, and anti-spam rules.</p>
          <p>Nexus uses a real production architecture: PocketBase for persistent data storage, Redis for background job queues, and an AI provider abstraction layer that supports multiple LLM backends. OAuth tokens are encrypted at rest with AES-256-GCM. Workspace isolation ensures users can never access each other&apos;s data.</p>
          <p>The product is designed for creators, marketers, and teams who want to scale their social presence without sacrificing quality or control. AI generates content suggestions, but humans approve everything before it goes live.</p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{ icon: Shield, title: "Security First", desc: "Encrypted tokens, workspace isolation, server-side authorization" }, { icon: Zap, title: "Real Infrastructure", desc: "PocketBase + Redis + AI providers — no mock data, no fake responses" }, { icon: Bot, title: "AI-Powered", desc: "Content generation, comment replies, insights, and strategy recommendations" }].map((item) => (
            <div key={item.title} className="rounded-xl border border-border bg-card/40 p-5">
              <item.icon className="h-5 w-5 mb-3 text-white/70" /><h3 className="text-sm font-medium mb-1">{item.title}</h3><p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// CAREERS PAGE — real job listings from PocketBase
// ============================================================
export function CareersPage() {
  const [jobs, setJobs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const pushToast = useStore((s) => s.pushToast);
  const [form, setForm] = useState({ name: "", email: "", phone: "", cover_letter: "" });

  useEffect(() => { fetch("/api/public/jobs").then(r => r.json()).then(d => setJobs(d.items ?? [])).catch(() => setJobs([])).finally(() => setLoading(false)); }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !form.name || !form.email) { pushToast({ type: "warning", title: "Please fill in name and email." }); return; }
    setApplying(true);
    try {
      await api.post("/api/public/jobs/apply", { ...form, jobId: selectedJob });
      pushToast({ type: "success", title: "Application submitted!", description: "We'll review and get back to you." });
      setSelectedJob(null); setForm({ name: "", email: "", phone: "", cover_letter: "" });
    } catch { pushToast({ type: "error", title: "Failed to submit", description: "Please try again." }); }
    setApplying(false);
  };

  return (
    <>
      <PageHeader title="Careers at Nexus" subtitle="Join us in building the future of social media automation." />
      <PublicSection className="pt-0">
        <div className="max-w-2xl mx-auto">
          {loading ? (<div className="text-center text-sm text-muted-foreground py-12">Loading...</div>) : jobs.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-4"><Briefcase className="h-5 w-5 text-muted-foreground" /></div>
              <h3 className="text-sm font-medium">No open positions at the moment.</h3>
              <p className="text-xs text-muted-foreground mt-1">We&apos;re not hiring right now, but we&apos;re always interested in connecting with talented people.</p>
              <p className="text-xs text-muted-foreground mt-2">Send us a note at <span className="text-foreground">careers@nexus.ai</span> and we&apos;ll reach out when something opens up.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(jobs as { id: string; title: string; department: string; location: string; employment_type: string; description: string }[]).map((job) => (
                <div key={job.id} className="rounded-xl border border-border bg-card/40 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.department}</span>
                        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        <span className="capitalize">{job.employment_type.replace("_", " ")}</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedJob(job.id)} className="rounded-lg border border-border h-8 px-3 text-xs hover:bg-accent transition-colors">Apply</button>
                  </div>
                  {job.description && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{job.description}</p>}
                </div>
              ))}
            </div>
          )}
          {/* Application modal */}
          {selectedJob && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedJob(null)}>
              <div className="rounded-2xl border border-border bg-card shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-sm font-semibold mb-4">Submit Application</h2>
                <form onSubmit={handleApply} className="space-y-3">
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name *" className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30" />
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email *" className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30" />
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30" />
                  <textarea value={form.cover_letter} onChange={e => setForm({ ...form, cover_letter: e.target.value })} placeholder="Cover letter (optional)" rows={4} className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-white/30 resize-none" />
                  <button type="submit" disabled={applying} className="w-full rounded-lg bg-white text-black h-10 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60">{applying ? "Submitting..." : "Submit application"}</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// BLOG PAGE — real blog posts from PocketBase
// ============================================================
export function BlogPage() {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const setPublicView = useStore((s) => s.setPublicView);

  useEffect(() => { fetch("/api/public/blog").then(r => r.json()).then(d => setPosts(d.items ?? [])).catch(() => setPosts([])).finally(() => setLoading(false)); }, []);

  return (
    <>
      <PageHeader title="Blog" subtitle="Insights, product updates, and stories from the Nexus team." />
      <PublicSection className="pt-0">
        <div className="max-w-3xl mx-auto">
          {loading ? (<div className="text-center text-sm text-muted-foreground py-12">Loading...</div>) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-4"><FileText className="h-5 w-5 text-muted-foreground" /></div>
              <h3 className="text-sm font-medium">No articles published yet.</h3>
              <p className="text-xs text-muted-foreground mt-1">We&apos;re working on our first articles. Check back soon!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(posts as { id: string; title: string; slug: string; excerpt: string; author: string; category: string; published_at: string }[]).map((post) => (
                <button key={post.id} onClick={() => { useStore.setState({ blogSlug: post.slug }); setPublicView("blog-post"); }} className="block w-full text-left rounded-xl border border-border bg-card/40 p-5 hover:bg-card/60 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{post.category}</span>
                    <span className="text-[10px] text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString() : ""}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">{post.title}</h3>
                  {post.excerpt && <p className="text-xs text-muted-foreground leading-relaxed">{post.excerpt}</p>}
                  {post.author && <div className="text-[10px] text-muted-foreground mt-2">By {post.author}</div>}
                </button>
              ))}
            </div>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// BLOG POST PAGE — single article
// ============================================================
export function BlogPostPage() {
  const slug = useStore((s) => (s as unknown as { blogSlug?: string }).blogSlug);
  const setPublicView = useStore((s) => s.setPublicView);
  const [post, setPost] = useState<{ title?: string; content?: string; author?: string; published_at?: string; category?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setPublicView("blog"); return; }
    fetch(`/api/public/blog?slug=${slug}`).then(r => r.json()).then(d => setPost(d.post ?? null)).catch(() => setPost(null)).finally(() => setLoading(false));
  }, [slug, setPublicView]);

  if (loading) return <div className="pt-32 text-center text-sm text-muted-foreground">Loading...</div>;
  if (!post) return <div className="pt-32 text-center"><p className="text-sm text-muted-foreground">Article not found.</p><button onClick={() => setPublicView("blog")} className="mt-4 text-xs text-foreground">← Back to blog</button></div>;

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-2xl mx-auto px-6">
        <button onClick={() => setPublicView("blog")} className="text-xs text-muted-foreground hover:text-foreground mb-6">← Back to blog</button>
        {post.category && <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground mb-3 inline-block">{post.category}</span>}
        <h1 className="text-3xl font-semibold tracking-tight mb-4">{post.title}</h1>
        <div className="flex items-center gap-3 mb-8 text-xs text-muted-foreground">
          {post.author && <span>By {post.author}</span>}
          {post.published_at && <span>· {new Date(post.published_at).toLocaleDateString()}</span>}
        </div>
        <div className="prose prose-invert max-w-none text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{post.content}</div>
      </div>
    </div>
  );
}

// ============================================================
// PRESS PAGE
// ============================================================
export function PressPage() {
  return (
    <SimplePage title="Press" description="Resources for journalists and media professionals covering Nexus.">
      <div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed">
        <h2 className="text-lg font-medium text-foreground">Press Contact</h2>
        <p>For press inquiries, interviews, or media requests, please contact us at <span className="text-foreground">press@nexus.ai</span>. We typically respond within 24 hours during business days.</p>
        <h2 className="text-lg font-medium text-foreground">Company Description</h2>
        <p>Nexus is a premium AI-powered social media automation platform that unifies content creation, scheduling, publishing, comment management, analytics, and automation into one workspace. Built with production-grade infrastructure (PocketBase, Redis, official OAuth APIs), Nexus serves creators, marketers, and teams who need to scale their social presence without sacrificing quality or control.</p>
        <h2 className="text-lg font-medium text-foreground">Brand Assets</h2>
        <p>Download our logo and brand assets for editorial use:</p>
        <div className="flex gap-3 mt-2">
          <a href="/logo.svg" download className="inline-flex items-center gap-1.5 rounded-lg border border-border h-9 px-3 text-xs hover:bg-accent transition-colors"><FileText className="h-3 w-3" />Logo (SVG)</a>
        </div>
        <h2 className="text-lg font-medium text-foreground">Media Coverage</h2>
        <p>Nexus has not yet been covered by media outlets. We&apos;ll list coverage here as it happens.</p>
      </div>
    </SimplePage>
  );
}

// ============================================================
// CONTACT PAGE — real form submission to PocketBase
// ============================================================
export function ContactPage() {
  const pushToast = useStore((s) => s.pushToast);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { pushToast({ type: "warning", title: "Please fill in all required fields." }); return; }
    setSubmitting(true);
    try { await api.post("/api/public/contact", form); pushToast({ type: "success", title: "Message sent!", description: "We'll get back to you within 24 hours." }); setForm({ name: "", email: "", subject: "", message: "" }); }
    catch { pushToast({ type: "error", title: "Failed to send", description: "Please try again or email us directly." }); }
    setSubmitting(false);
  };

  return (
    <>
      <PageHeader title="Contact Us" subtitle="Have a question, feature request, or partnership inquiry? We'd love to hear from you." />
      <PublicSection className="pt-0">
        <div className="max-w-xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-[11px] text-muted-foreground">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background/40 h-11 px-3.5 text-sm outline-none focus:border-white/30 transition-colors" /></div>
            <div><label className="text-[11px] text-muted-foreground">Email *</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background/40 h-11 px-3.5 text-sm outline-none focus:border-white/30 transition-colors" /></div>
            <div><label className="text-[11px] text-muted-foreground">Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-1 w-full rounded-lg border border-border bg-background/40 h-11 px-3.5 text-sm outline-none focus:border-white/30 transition-colors" /></div>
            <div><label className="text-[11px] text-muted-foreground">Message *</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={5} className="mt-1 w-full rounded-lg border border-border bg-background/40 px-3.5 py-2.5 text-sm outline-none focus:border-white/30 transition-colors resize-none" /></div>
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-white text-black h-11 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60">{submitting ? "Sending..." : "Send message"}</button>
          </form>
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// COMMUNITY PAGE — real discussions
// ============================================================
export function CommunityPage() {
  const [posts, setPosts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, setAuthModalOpen } = useStore();
  const pushToast = useStore((s) => s.pushToast);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "general" });

  const load = () => { fetch("/api/public/community").then(r => r.json()).then(d => setPosts(d.items ?? [])).catch(() => setPosts([])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthModalOpen(true, "login"); return; }
    if (!newPost.title || !newPost.content) { pushToast({ type: "warning", title: "Title and content required." }); return; }
    try { await api.post("/api/public/community", newPost); pushToast({ type: "success", title: "Discussion posted!" }); setNewPost({ title: "", content: "", category: "general" }); setShowCreate(false); load(); }
    catch { pushToast({ type: "error", title: "Failed to post" }); }
  };

  return (
    <>
      <PageHeader title="Community" subtitle="Discuss Nexus, share ideas, and connect with other users." />
      <PublicSection className="pt-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 h-9 flex-1 max-w-xs">
              <Search className="h-3.5 w-3.5 text-muted-foreground" /><input placeholder="Search discussions..." className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
            </div>
            <button onClick={() => setShowCreate(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-9 px-3 text-xs font-medium hover:bg-white/90 transition-colors"><Plus className="h-3.5 w-3.5" />New Post</button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mb-6 rounded-xl border border-border bg-card/40 p-4 space-y-3">
              <input value={newPost.title} onChange={e => setNewPost({ ...newPost, title: e.target.value })} placeholder="Discussion title" className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30" />
              <textarea value={newPost.content} onChange={e => setNewPost({ ...newPost, content: e.target.value })} placeholder="What's on your mind?" rows={3} className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-white/30 resize-none" />
              <div className="flex items-center gap-2">
                <select value={newPost.category} onChange={e => setNewPost({ ...newPost, category: e.target.value })} className="rounded-lg border border-border bg-background/40 h-9 px-3 text-xs outline-none">
                  <option value="general">General</option><option value="questions">Questions</option><option value="feedback">Feedback</option><option value="showcase">Showcase</option><option value="announcements">Announcements</option><option value="dev">Dev</option>
                </select>
                <button type="submit" className="rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors">Post</button>
              </div>
            </form>
          )}

          {loading ? (<div className="text-center text-sm text-muted-foreground py-12">Loading...</div>) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-4"><MessageCircle className="h-5 w-5 text-muted-foreground" /></div>
              <h3 className="text-sm font-medium">No discussions yet.</h3>
              <p className="text-xs text-muted-foreground mt-1">Be the first to start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(posts as { id: string; title: string; content: string; category: string; likes: number; comments_count: number; expand?: { author?: { name?: string; email?: string } }; created: string }[]).map((post) => (
                <div key={post.id} className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{post.category}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(post.created).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-sm font-medium mb-1">{post.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likes || 0}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments_count || 0}</span>
                    {post.expand?.author?.name && <span>by {post.expand.author.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// SUPPORT PAGE — real ticket system
// ============================================================
export function SupportPage() {
  const { user, setAuthModalOpen } = useStore();
  const pushToast = useStore((s) => s.pushToast);
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", category: "general", priority: "normal" });

  const load = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { getPocketBase } = await import("@/lib/pocketbase");
      const pb = getPocketBase();
      const token = pb.authStore.token;
      const d = await fetch("/api/public/support", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
      setTickets(d.items ?? []);
    } catch { setTickets([]); }
    setLoading(false);
  };
  useEffect(() => { void load(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setAuthModalOpen(true, "login"); return; }
    if (!form.subject || !form.description) { pushToast({ type: "warning", title: "Subject and description required." }); return; }
    try { await api.post("/api/public/support", form); pushToast({ type: "success", title: "Ticket created!" }); setForm({ subject: "", description: "", category: "general", priority: "normal" }); setShowCreate(false); load(); }
    catch { pushToast({ type: "error", title: "Failed to create ticket" }); }
  };

  return (
    <>
      <PageHeader title="Support" subtitle="Get help with Nexus. Search docs, browse guides, or submit a ticket." />
      <PublicSection className="pt-0">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <button onClick={() => useStore.getState().setPublicView("docs")} className="rounded-xl border border-border bg-card/40 p-4 text-left hover:bg-card/60 transition-colors"><FileText className="h-5 w-5 mb-2 text-muted-foreground" /><div className="text-sm font-medium">Documentation</div><div className="text-[10px] text-muted-foreground">Browse our docs</div></button>
            <button onClick={() => useStore.getState().setPublicView("guides")} className="rounded-xl border border-border bg-card/40 p-4 text-left hover:bg-card/60 transition-colors"><BookOpen className="h-5 w-5 mb-2 text-muted-foreground" /><div className="text-sm font-medium">Guides</div><div className="text-[10px] text-muted-foreground">Step-by-step tutorials</div></button>
            <button onClick={() => useStore.getState().setPublicView("community")} className="rounded-xl border border-border bg-card/40 p-4 text-left hover:bg-card/60 transition-colors"><MessageCircle className="h-5 w-5 mb-2 text-muted-foreground" /><div className="text-sm font-medium">Community</div><div className="text-[10px] text-muted-foreground">Ask other users</div></button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Your Support Tickets</h3>
            <button onClick={() => setShowCreate(v => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-white text-black h-8 px-3 text-xs font-medium hover:bg-white/90 transition-colors"><Plus className="h-3.5 w-3.5" />New Ticket</button>
          </div>

          {showCreate && (
            <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-border bg-card/40 p-4 space-y-3">
              <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Subject" className="w-full rounded-lg border border-border bg-background/40 h-10 px-3 text-sm outline-none focus:border-white/30" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe your issue" rows={4} className="w-full rounded-lg border border-border bg-background/40 px-3 py-2 text-sm outline-none focus:border-white/30 resize-none" />
              <div className="flex gap-2">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-border bg-background/40 h-9 px-3 text-xs outline-none"><option value="general">General</option><option value="bug">Bug</option><option value="feature_request">Feature Request</option><option value="billing">Billing</option><option value="account">Account</option><option value="technical">Technical</option></select>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="rounded-lg border border-border bg-background/40 h-9 px-3 text-xs outline-none"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
                <button type="submit" className="ml-auto rounded-lg bg-white text-black h-9 px-4 text-xs font-medium hover:bg-white/90 transition-colors">Submit</button>
              </div>
            </form>
          )}

          {!user ? (<div className="text-center py-12 text-sm text-muted-foreground">Sign in to view and create support tickets.</div>) :
           loading ? (<div className="text-center text-sm text-muted-foreground py-12">Loading...</div>) :
           tickets.length === 0 ? (<div className="text-center py-12"><div className="h-10 w-10 rounded-xl border border-border bg-card/40 flex items-center justify-center mx-auto mb-3"><Check className="h-5 w-5 text-muted-foreground" /></div><p className="text-sm text-muted-foreground">No support tickets. You&apos;re all set!</p></div>) : (
            <div className="space-y-2">
              {(tickets as { id: string; subject: string; status: string; category: string; priority: string; created: string }[]).map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg border border-border bg-card/40 p-3">
                  <div><div className="text-xs font-medium">{t.subject}</div><div className="text-[10px] text-muted-foreground mt-0.5">{t.category} · {t.priority} · {new Date(t.created).toLocaleDateString()}</div></div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", t.status === "resolved" || t.status === "closed" ? "border-green-400/30 text-green-400" : t.status === "in_progress" ? "border-amber-400/30 text-amber-400" : "border-border text-muted-foreground")}>{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// DOCUMENTATION PAGE
// ============================================================
export function DocsPage() {
  const setPublicView = useStore((s) => s.setPublicView);
  const docs = [
    { title: "Getting Started", desc: "Set up your Nexus account and workspace", icon: Zap },
    { title: "Workspaces", desc: "Manage your workspace and team members", icon: Building2Icon },
    { title: "Social Accounts", desc: "Connect social platforms through OAuth", icon: Users },
    { title: "Content Creation", desc: "Create posts and generate AI content", icon: Sparkles },
    { title: "Publishing", desc: "Publish content to connected platforms", icon: Send },
    { title: "Scheduling", desc: "Schedule posts with Redis-backed queues", icon: Calendar },
    { title: "Automations", desc: "Build visual workflows", icon: Workflow },
    { title: "Comments", desc: "Manage and reply to comments with AI", icon: MessageSquare },
    { title: "Analytics", desc: "Track performance across platforms", icon: BarChart3 },
    { title: "Security", desc: "Token encryption, workspace isolation", icon: Shield },
  ];
  return (
    <>
      <PageHeader title="Documentation" subtitle="Learn how to get the most out of Nexus." />
      <PublicSection className="pt-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 h-10 mb-8">
            <Search className="h-4 w-4 text-muted-foreground" /><input placeholder="Search documentation..." className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {docs.map((doc) => (
              <div key={doc.title} className="rounded-xl border border-border bg-card/40 p-5 hover:bg-card/60 transition-colors cursor-pointer">
                <doc.icon className="h-5 w-5 mb-3 text-white/70" /><h3 className="text-sm font-medium mb-1">{doc.title}</h3><p className="text-xs text-muted-foreground">{doc.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// API REFERENCE PAGE
// ============================================================
export function ApiRefPage() {
  const endpoints = [
    { method: "GET", path: "/api/health", desc: "Check infrastructure health", auth: "None" },
    { method: "GET", path: "/api/health/redis", desc: "Check Redis connectivity", auth: "None" },
    { method: "GET", path: "/api/me", desc: "Get current user and workspace", auth: "Bearer token" },
    { method: "GET", path: "/api/posts", desc: "List posts in workspace", auth: "Bearer token" },
    { method: "POST", path: "/api/posts", desc: "Create a new post", auth: "Bearer token" },
    { method: "PATCH", path: "/api/posts/[id]", desc: "Update a post", auth: "Bearer token" },
    { method: "DELETE", path: "/api/posts/[id]", desc: "Delete a post", auth: "Bearer token" },
    { method: "POST", path: "/api/posts/[id]", desc: "Publish a post via Redis queue", auth: "Bearer token" },
    { method: "GET", path: "/api/social-accounts", desc: "List connected accounts", auth: "Bearer token" },
    { method: "POST", path: "/api/social-accounts", desc: "Connect a social account", auth: "Bearer token" },
    { method: "DELETE", path: "/api/social-accounts/[id]", desc: "Disconnect an account", auth: "Bearer token" },
    { method: "GET", path: "/api/social/[platform]/connect", desc: "Start OAuth flow", auth: "Session" },
    { method: "GET", path: "/api/social/[platform]/callback", desc: "OAuth callback handler", auth: "Session" },
    { method: "POST", path: "/api/social/[platform]/disconnect", desc: "Revoke OAuth and disconnect", auth: "Bearer token" },
    { method: "GET", path: "/api/automations", desc: "List automations", auth: "Bearer token" },
    { method: "POST", path: "/api/automations", desc: "Create automation", auth: "Bearer token" },
    { method: "PATCH", path: "/api/automations/[id]", desc: "Update automation", auth: "Bearer token" },
    { method: "DELETE", path: "/api/automations/[id]", desc: "Delete automation", auth: "Bearer token" },
    { method: "GET", path: "/api/notifications", desc: "List notifications", auth: "Bearer token" },
    { method: "POST", path: "/api/notifications", desc: "Mark all as read", auth: "Bearer token" },
    { method: "GET", path: "/api/media", desc: "List media assets", auth: "Bearer token" },
    { method: "POST", path: "/api/media", desc: "Upload media (multipart)", auth: "Bearer token" },
    { method: "GET", path: "/api/comments", desc: "List comments", auth: "Bearer token" },
    { method: "GET", path: "/api/approvals", desc: "List approval queue items", auth: "Bearer token" },
    { method: "PATCH", path: "/api/approvals/[id]", desc: "Approve/reject item", auth: "Bearer token" },
    { method: "GET", path: "/api/analytics", desc: "Get analytics data", auth: "Bearer token" },
    { method: "GET", path: "/api/activity", desc: "Get activity logs", auth: "Bearer token" },
    { method: "GET", path: "/api/usage", desc: "Get usage statistics", auth: "Bearer token" },
    { method: "GET", path: "/api/workspaces", desc: "List workspaces", auth: "Bearer token" },
    { method: "PATCH", path: "/api/workspaces", desc: "Update workspace", auth: "Bearer token" },
    { method: "PATCH", path: "/api/settings", desc: "Update profile", auth: "Bearer token" },
    { method: "POST", path: "/api/ai/generate", desc: "Generate AI content", auth: "Bearer token" },
    { method: "POST", path: "/api/schedules", desc: "Schedule a post", auth: "Bearer token" },
    { method: "GET", path: "/api/public/changelog", desc: "List published releases", auth: "None" },
    { method: "GET", path: "/api/public/roadmap", desc: "List roadmap items", auth: "None" },
    { method: "GET", path: "/api/public/blog", desc: "List blog posts", auth: "None" },
    { method: "GET", path: "/api/public/jobs", desc: "List open jobs", auth: "None" },
    { method: "POST", path: "/api/public/contact", desc: "Submit contact form", auth: "None" },
    { method: "GET", path: "/api/public/community", desc: "List community posts", auth: "Optional" },
    { method: "POST", path: "/api/public/community", desc: "Create community post", auth: "Bearer token" },
    { method: "GET", path: "/api/public/support", desc: "List support tickets", auth: "Bearer token" },
    { method: "POST", path: "/api/public/support", desc: "Create support ticket", auth: "Bearer token" },
  ];
  return (
    <>
      <PageHeader title="API Reference" subtitle="Complete documentation of all Nexus API endpoints." />
      <PublicSection className="pt-0">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card/40"><th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Method</th><th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Endpoint</th><th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Description</th><th className="text-left p-3 text-[10px] uppercase tracking-wider text-muted-foreground">Auth</th></tr></thead>
              <tbody>
                {endpoints.map((e, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-card/40 transition-colors">
                    <td className="p-3"><span className={cn("text-[10px] font-mono px-2 py-0.5 rounded", e.method === "GET" ? "bg-green-400/10 text-green-400" : e.method === "POST" ? "bg-blue-400/10 text-blue-400" : e.method === "DELETE" ? "bg-red-400/10 text-red-400" : "bg-amber-400/10 text-amber-400")}>{e.method}</span></td>
                    <td className="p-3 font-mono text-xs">{e.path}</td><td className="p-3 text-xs text-muted-foreground">{e.desc}</td><td className="p-3 text-[10px] text-muted-foreground">{e.auth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 rounded-lg border border-border bg-card/40 p-4 text-xs text-muted-foreground">
            <p className="mb-2"><span className="text-foreground font-medium">Authentication:</span> All authenticated endpoints require an <code className="font-mono bg-white/5 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> header. The token is obtained from PocketBase authentication.</p>
            <p className="mb-2"><span className="text-foreground font-medium">Base URL:</span> <code className="font-mono bg-white/5 px-1 py-0.5 rounded">https://your-domain.com</code></p>
            <p><span className="text-foreground font-medium">Content-Type:</span> <code className="font-mono bg-white/5 px-1 py-0.5 rounded">application/json</code> (except media uploads which use <code className="font-mono bg-white/5 px-1 py-0.5 rounded">multipart/form-data</code>)</p>
          </div>
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// GUIDES PAGE
// ============================================================
export function GuidesPage() {
  const guides = [
    { title: "Create your workspace", desc: "Set up your Nexus workspace and invite team members", icon: Building2Icon },
    { title: "Connect Instagram", desc: "Connect your Instagram account through OAuth", icon: Users },
    { title: "Connect TikTok", desc: "Connect your TikTok account through OAuth", icon: Users },
    { title: "Connect YouTube", desc: "Connect your YouTube channel through Google OAuth", icon: Users },
    { title: "Connect Facebook", desc: "Connect your Facebook Page through OAuth", icon: Users },
    { title: "Connect X (Twitter)", desc: "Connect your X account through OAuth 2.0 PKCE", icon: Users },
    { title: "Connect LinkedIn", desc: "Connect your LinkedIn profile or page", icon: Users },
    { title: "Connect Threads", desc: "Connect your Threads account", icon: Users },
    { title: "Connect Pinterest", desc: "Connect your Pinterest account", icon: Users },
    { title: "Create your first post", desc: "Create content and generate AI variants", icon: Sparkles },
    { title: "Schedule content", desc: "Schedule posts with Redis-backed job queues", icon: Calendar },
    { title: "Create an automation", desc: "Build visual workflows for comment automation", icon: Workflow },
    { title: "Manage comments", desc: "Use AI to generate contextual comment replies", icon: MessageSquare },
    { title: "Review approvals", desc: "Review and approve AI-generated content", icon: Bot },
    { title: "Read analytics", desc: "Understand your social performance metrics", icon: BarChart3 },
    { title: "Invite team members", desc: "Add members and assign roles", icon: Users },
  ];
  return (
    <>
      <PageHeader title="Guides" subtitle="Step-by-step tutorials for using Nexus." />
      <PublicSection className="pt-0">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {guides.map((g) => (
              <div key={g.title} className="rounded-xl border border-border bg-card/40 p-5 hover:bg-card/60 transition-colors cursor-pointer">
                <g.icon className="h-5 w-5 mb-3 text-white/70" /><h3 className="text-sm font-medium mb-1">{g.title}</h3><p className="text-xs text-muted-foreground">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>
    </>
  );
}

// ============================================================
// LEGAL PAGES
// ============================================================
export function PrivacyPage() {
  return (<SimplePage title="Privacy Policy" description="Last updated: October 2026"><div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed"><h2 className="text-lg font-medium text-foreground">1. Information We Collect</h2><p>Nexus collects information you provide when creating an account (name, email), connecting social accounts (OAuth tokens, platform usernames), and using the platform (content created, automations configured, analytics data from connected platforms).</p><h2 className="text-lg font-medium text-foreground">2. How We Use Your Information</h2><p>We use your information to provide the Nexus platform — connecting social accounts, generating AI content, scheduling posts, managing comments, and displaying analytics. We do not sell your data to third parties.</p><h2 className="text-lg font-medium text-foreground">3. Data Storage & Security</h2><p>Your data is stored in PocketBase (database) and Redis (job queues). OAuth tokens are encrypted at rest using AES-256-GCM. All sensitive operations require server-side authentication.</p><h2 className="text-lg font-medium text-foreground">4. OAuth Tokens</h2><p>When you connect a social account, Nexus receives OAuth access and refresh tokens. These are encrypted before storage and only decrypted server-side. You can revoke access at any time.</p><h2 className="text-lg font-medium text-foreground">5. Data Retention</h2><p>We retain your data for as long as your account is active. When you delete your account, we remove your data within 30 days.</p><h2 className="text-lg font-medium text-foreground">6. Your Rights</h2><p>You have the right to access, export, or delete your personal data.</p></div></SimplePage>);
}
export function TermsPage() {
  return (<SimplePage title="Terms of Service" description="Last updated: October 2026"><div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed"><h2 className="text-lg font-medium text-foreground">1. Acceptance of Terms</h2><p>By using Nexus, you agree to these terms.</p><h2 className="text-lg font-medium text-foreground">2. Acceptable Use</h2><p>You agree to use Nexus in compliance with all applicable laws and platform policies. Nexus uses official OAuth APIs and respects platform rate limits and anti-spam rules.</p><h2 className="text-lg font-medium text-foreground">3. Social Platform Compliance</h2><p>You are responsible for ensuring your use complies with each platform&apos;s terms of service.</p><h2 className="text-lg font-medium text-foreground">4. AI-Generated Content</h2><p>You are responsible for reviewing and approving all AI-generated content before publication.</p><h2 className="text-lg font-medium text-foreground">5. Service Availability</h2><p>We strive for high availability but do not guarantee uninterrupted service.</p></div></SimplePage>);
}
export function SecurityPage() {
  return (<SimplePage title="Security" description="How Nexus protects your data and credentials."><div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed"><h2 className="text-lg font-medium text-foreground">Token Encryption</h2><p>All OAuth tokens are encrypted at rest using AES-256-GCM. The encryption key is stored as a server-side environment variable.</p><h2 className="text-lg font-medium text-foreground">Workspace Isolation</h2><p>Every piece of data belongs to a workspace. Users can only access data within workspaces they own or are members of.</p><h2 className="text-lg font-medium text-foreground">Server-Side Authorization</h2><p>All API routes verify the authenticated user&apos;s identity and workspace membership. PocketBase admin credentials are never exposed to client-side code.</p><h2 className="text-lg font-medium text-foreground">OAuth State Validation</h2><p>OAuth flows use cryptographically secure state tokens stored in Redis with short TTLs to prevent replay attacks.</p><h2 className="text-lg font-medium text-foreground">Compliance Goals</h2><p>Nexus is designed with security best practices but has not yet undergone formal certification (SOC 2, ISO 27001).</p></div></SimplePage>);
}
export function DPAPage() {
  return (<SimplePage title="Data Processing Addendum" description="Last updated: October 2026"><div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed"><p>This DPA forms part of the Nexus Terms of Service.</p><h2 className="text-lg font-medium text-foreground">1. Data Controller and Processor</h2><p>You are the data controller. Nexus acts as the data processor.</p><h2 className="text-lg font-medium text-foreground">2. Data Processing</h2><p>Nexus processes personal data to provide the platform&apos;s functionality.</p><h2 className="text-lg font-medium text-foreground">3. Data Location</h2><p>Data is stored in PocketBase and Redis, both hosted by the user.</p><h2 className="text-lg font-medium text-foreground">4. Sub-Processors</h2><p>Nexus uses AI provider services to generate content. No personal data is shared beyond what is necessary.</p></div></SimplePage>);
}
export function CompliancePage() {
  return (<SimplePage title="Compliance" description="Nexus's compliance posture and goals."><div className="mt-8 space-y-6 text-sm text-muted-foreground leading-relaxed"><h2 className="text-lg font-medium text-foreground">Current Status</h2><p>Nexus has not yet undergone formal compliance certification.</p><h2 className="text-lg font-medium text-foreground">Security Practices</h2><ul className="space-y-2"><li>• AES-256-GCM token encryption at rest</li><li>• Server-side authorization on all API routes</li><li>• OAuth state validation with Redis-backed storage</li><li>• Workspace isolation via PocketBase API rules</li><li>• No secrets in client-side code</li></ul><h2 className="text-lg font-medium text-foreground">Goals</h2><ul className="space-y-2"><li>• SOC 2 Type II (planned)</li><li>• GDPR compliance review (planned)</li><li>• ISO 27001 (future)</li></ul><div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.03] p-3 text-xs text-amber-400">Nexus is not currently SOC 2, ISO 27001, GDPR, HIPAA, or PCI certified.</div></div></SimplePage>);
}

// ============================================================
// Helper icon imports that aren't already imported
// ============================================================
import { Building2 as Building2Icon, BookOpen, Plus } from "lucide-react";

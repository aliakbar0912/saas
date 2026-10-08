"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Calendar,
  MessageSquare,
  BarChart3,
  Workflow,
  ShieldCheck,
  Clock,
  Zap,
  Bot,
  CheckCircle2,
  ArrowRight,
  Play,
  Globe,
  Lock,
  Layers,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function LandingHero() {
  const enterApp = useStore((s) => s.enterApp);
  const user = useStore((s) => s.user);
  const setAuthModalOpen = useStore((s) => s.setAuthModalOpen);

  const handleStartFree = () => {
    if (user) enterApp();
    else setAuthModalOpen(true, "signup");
  };

  const handleViewDemo = () => {
    if (user) enterApp();
    else setAuthModalOpen(true, "login");
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[400px] bg-white/[0.04] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-24 lg:pt-44 lg:pb-32">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            Now in early access — join 4,200+ teams
          </div>
        </motion.div>

        <motion.h1
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="text-center text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-tight text-balance leading-[1.02]"
        >
          Your social media,
          <br />
          <span className="text-muted-foreground">on autopilot.</span>
        </motion.h1>

        <motion.p
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-8 max-w-2xl mx-auto text-center text-base lg:text-lg text-muted-foreground text-pretty leading-relaxed"
        >
          Connect your social accounts, let AI create your content, engage with your audience, and
          automate your social workflow — all from one intelligent workspace.
        </motion.p>

        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={handleStartFree}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 h-12 text-sm font-medium text-black hover:bg-white/90 transition-colors w-full sm:w-auto"
          >
            {user ? "Open dashboard" : "Start for Free"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={handleViewDemo}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur-sm px-7 h-12 text-sm font-medium text-foreground hover:bg-card/80 transition-colors w-full sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            View Demo
          </button>
        </motion.div>

        <motion.div
          custom={4}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Official platform APIs only
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> SOC 2 Type II
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" /> End-to-end encryption
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> GDPR & CCPA compliant
          </span>
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-20 lg:mt-28"
        >
          <HeroDashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}

function HeroDashboardPreview() {
  const stats = [
    { label: "Connected", value: "7", sub: "accounts" },
    { label: "Scheduled", value: "23", sub: "posts" },
    { label: "AI Actions", value: "1,284", sub: "this week" },
    { label: "Engagement", value: "+41%", sub: "vs last week" },
  ];

  const queue = [
    { time: "09:30", platform: "Instagram", title: "5 AI tools you should know" },
    { time: "12:00", platform: "TikTok", title: "3 productivity hacks" },
    { time: "15:30", platform: "LinkedIn", title: "Building with AI" },
    { time: "18:00", platform: "X", title: "Thread: AI infrastructure" },
  ];

  return (
    <div className="relative mx-auto max-w-6xl">
      <div className="absolute -inset-x-8 -top-8 -bottom-8 bg-gradient-to-b from-white/[0.03] via-transparent to-transparent rounded-3xl blur-2xl" />
      <div className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-border px-4 h-10">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            app.nexus.ai/overview
          </div>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-2 border-r border-border p-3 hidden md:block">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-6 w-6 rounded-md bg-white" />
              <div className="text-sm font-medium">Nexus</div>
            </div>
            <div className="space-y-1">
              {["Overview", "Content", "Calendar", "Engagement", "Automations", "Analytics"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                      i === 0 ? "bg-white/10 text-white" : "text-muted-foreground"
                    }`}
                  >
                    <div className="h-1 w-1 rounded-full bg-current opacity-60" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-10 p-5 lg:p-6">
            <div className="mb-5">
              <div className="text-[11px] text-muted-foreground mb-1">Good afternoon.</div>
              <div className="text-lg font-semibold">Here's what's happening across your social workspace.</div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background/40 p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  <div className="text-xl font-semibold mt-1">{s.value}</div>
                  <div className="text-[10px] text-muted-foreground">{s.sub}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium">Today's Queue</div>
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {queue.map((q) => (
                    <div key={q.time} className="flex items-center gap-3">
                      <div className="text-[10px] font-mono text-muted-foreground w-9">{q.time}</div>
                      <div className="h-7 w-7 rounded-md bg-white/5 border border-border flex items-center justify-center text-[9px] text-muted-foreground">
                        {q.platform.slice(0, 2)}
                      </div>
                      <div className="text-xs flex-1 truncate">{q.title}</div>
                      <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-background/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-medium">AI Activity</div>
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  {[
                    "Generated 4 captions",
                    "Prepared 2 posts",
                    "Analyzed 18 comments",
                    "Scheduled 3 posts",
                    "Replied to 7 mentions",
                  ].map((a) => (
                    <div key={a} className="flex items-center gap-2 text-xs">
                      <div className="h-1 w-1 rounded-full bg-white" />
                      <div className="flex-1">{a}</div>
                      <div className="text-[9px] text-muted-foreground">just now</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingFeatures() {
  const features = [
    {
      icon: Sparkles,
      title: "AI Content Creation",
      description:
        "Generate posts, captions, scripts, and threads tailored to each platform. Multiple variants in seconds — professional, casual, or high-engagement.",
      bullets: ["10+ content types", "Tone & audience controls", "Multi-variant generation"],
    },
    {
      icon: Layers,
      title: "Multi-Platform Publishing",
      description:
        "Publish to TikTok, Instagram, YouTube, X, LinkedIn, Threads, Pinterest, and Facebook from a single workflow. Each format adapted automatically.",
      bullets: ["8 platforms supported", "Format auto-adaptation", "OAuth-secured connections"],
    },
    {
      icon: MessageSquare,
      title: "AI Comment Automation",
      description:
        "Context-aware comments and replies that feel human. Built-in safety checks, rate-limit controls, and approval workflows keep your accounts safe.",
      bullets: ["Contextual understanding", "Confidence thresholds", "Approval queues"],
    },
    {
      icon: Calendar,
      title: "Smart Scheduling",
      description:
        "AI picks the best time to post based on your audience's activity patterns. Drag-and-drop calendar with month, week, day, and queue views.",
      bullets: ["Optimal-time prediction", "Drag-drop rescheduling", "Multi-view calendar"],
    },
    {
      icon: Bot,
      title: "Audience Engagement",
      description:
        "Detect mentions, questions, and high-intent comments. AI generates thoughtful replies while respecting platform policies and your safety limits.",
      bullets: ["Mention detection", "Question classification", "Sentiment-aware replies"],
    },
    {
      icon: BarChart3,
      title: "Analytics",
      description:
        "Reach, impressions, engagement, growth, best-performing content, and optimal posting windows — unified across every connected platform.",
      bullets: ["Cross-platform metrics", "Best-post-time analysis", "Cohort comparisons"],
    },
    {
      icon: Workflow,
      title: "Automation Rules",
      description:
        "Build visual workflows with triggers, conditions, and actions. Run multiple automations in parallel with full observability and per-rule rate limits.",
      bullets: ["Visual builder", "Conditional logic", "Per-rule rate caps"],
    },
    {
      icon: Zap,
      title: "AI Workspace",
      description:
        "A built-in assistant that understands your workspace context. Create posts, build automations, or analyze performance — all through conversation.",
      bullets: ["Context-aware chat", "Action execution", "Confirmation before publish"],
    },
    {
      icon: ShieldCheck,
      title: "Security",
      description:
        "Workspace isolation, encrypted OAuth tokens, audit logs, and role-based permissions. Sensitive credentials never touch the client.",
      bullets: ["Token encryption at rest", "Audit trail", "Workspace isolation"],
    },
  ];

  return (
    <section id="features" className="border-b border-border py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-16">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Platform
          </div>
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            An operating system for your social presence.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty leading-relaxed">
            Everything you need to plan, create, publish, and engage — unified in one premium
            workspace. Built for teams who take their social workflow seriously.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.06 }}
              className="group bg-card hover:bg-card/60 transition-colors p-7 lg:p-8"
            >
              <div className="h-10 w-10 rounded-lg border border-border bg-background/40 flex items-center justify-center mb-5 group-hover:bg-white group-hover:text-black transition-all">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-medium mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{f.description}</p>
              <ul className="space-y-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-white/60" />
                    {b}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingWorkflow() {
  const steps = [
    { label: "Idea", desc: "AI generates ideas from your niche, history, and trends." },
    { label: "Script", desc: "Platform-specific scripts written for your audience." },
    { label: "Caption", desc: "Optimized captions with hooks and CTAs." },
    { label: "Hashtags", desc: "Trend-aware hashtag sets with reach predictions." },
    { label: "Media", desc: "AI-generated or sourced visuals attached." },
    { label: "Preview", desc: "See exactly how it looks on each platform." },
    { label: "Approval", desc: "Optional review queue for sensitive posts." },
    { label: "Schedule", desc: "Smart-scheduled at your audience's peak." },
    { label: "Publish", desc: "Published through official platform APIs." },
    { label: "Analytics", desc: "Performance fed back into AI for next round." },
  ];

  return (
    <section id="workflow" className="border-b border-border py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-30 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-16">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
            Content Pipeline
          </div>
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            From idea to analytics — one continuous workflow.
          </h2>
          <p className="mt-5 text-muted-foreground text-pretty leading-relaxed">
            Every step of the content lifecycle is connected. The AI learns from each publish and
            improves its next generation. No more stitching together five different tools.
          </p>
        </div>

        <div className="relative grid grid-cols-2 md:grid-cols-5 gap-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="relative"
            >
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 h-full">
                <div className="text-[10px] font-mono text-muted-foreground mb-2">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-sm font-medium mb-1.5">{s.label}</div>
                <div className="text-[11px] text-muted-foreground leading-relaxed">{s.desc}</div>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40 z-10" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPricing() {
  const [yearly, setYearly] = useState(false);
  const enterApp = useStore((s) => s.enterApp);
  const user = useStore((s) => s.user);
  const setAuthModalOpen = useStore((s) => s.setAuthModalOpen);

  const handleCta = () => {
    if (user) enterApp();
    else setAuthModalOpen(true, "signup");
  };

  const plans = [
    {
      name: "Free",
      tagline: "For getting started",
      monthly: 0,
      yearly: 0,
      features: [
        "2 connected accounts",
        "50 AI generations / mo",
        "Manual scheduling",
        "7-day analytics history",
        "Community support",
      ],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Starter",
      tagline: "For solo creators",
      monthly: 19,
      yearly: 15,
      features: [
        "5 connected accounts",
        "500 AI generations / mo",
        "Smart scheduling",
        "30-day analytics history",
        "Basic automations",
        "Email support",
      ],
      cta: "Start Starter",
      highlight: false,
    },
    {
      name: "Pro",
      tagline: "For power users",
      monthly: 49,
      yearly: 39,
      features: [
        "10 connected accounts",
        "2,000 AI generations / mo",
        "Advanced automations",
        "1-year analytics history",
        "AI Insights & recommendations",
        "Approval workflows",
        "Priority support",
      ],
      cta: "Start Pro",
      highlight: true,
    },
    {
      name: "Business",
      tagline: "For teams & agencies",
      monthly: 149,
      yearly: 119,
      features: [
        "Unlimited accounts",
        "10,000 AI generations / mo",
        "Team workspaces & roles",
        "Full analytics history",
        "Custom AI provider keys",
        "Audit logs & SSO",
        "Dedicated success manager",
      ],
      cta: "Contact sales",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="border-b border-border py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Pricing</div>
            <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
              Pricing that scales with your ambition.
            </h2>
            <p className="mt-5 text-muted-foreground text-pretty leading-relaxed">
              Start free. Upgrade when you need more. Cancel anytime. No hidden fees, no surprise
              overages.
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-border bg-card/50 p-1 text-xs">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                !yearly ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 rounded-full transition-colors ${
                yearly ? "bg-white text-black" : "text-muted-foreground"
              }`}
            >
              Yearly
              <span className={`ml-1.5 ${yearly ? "text-black/60" : "text-muted-foreground/60"}`}>
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 flex flex-col ${
                p.highlight
                  ? "border-white/30 bg-gradient-to-b from-white/[0.06] to-transparent"
                  : "border-border bg-card/40"
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white text-black text-[10px] font-medium px-3 py-0.5">
                  Most popular
                </div>
              )}
              <div className="text-sm font-medium mb-1">{p.name}</div>
              <div className="text-[11px] text-muted-foreground mb-5">{p.tagline}</div>
              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    ${yearly ? p.yearly : p.monthly}
                  </span>
                  <span className="text-xs text-muted-foreground">/ mo</span>
                </div>
                {yearly && p.yearly > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Billed annually
                  </div>
                )}
              </div>
              <button
                onClick={handleCta}
                className={`w-full rounded-full h-10 text-sm font-medium transition-colors mb-6 ${
                  p.highlight
                    ? "bg-white text-black hover:bg-white/90"
                    : "border border-border text-foreground hover:bg-card"
                }`}
              >
                {p.cta}
              </button>
              <ul className="space-y-2.5 text-xs">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-white/70 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the AI generate platform-specific content?",
      a: "Each platform has distinct format constraints — character limits, hashtag behavior, visual aspect ratios, and audience expectations. Nexus uses a provider abstraction layer that prompts models with platform-specific instructions and post-processing rules. The result is content that feels natively written for TikTok versus LinkedIn versus X, not generic copy dressed up differently.",
    },
    {
      q: "Will using this get my accounts banned?",
      a: "No — Nexus exclusively uses official platform APIs and OAuth mechanisms. We do not scrape, automate browser sessions, or bypass rate limits. Every action respects platform policies, and our safety layer enforces configurable caps on actions per day, per hour, and per platform. You set the limits; we never exceed them.",
    },
    {
      q: "Can I review AI-generated content before it publishes?",
      a: "Absolutely. The Approval Center lets you review every AI-generated post, comment, reply, caption, and script before it goes live. You can approve, edit, reject, or schedule from there. For sensitive workflows, you can require approval on every action; for trusted ones, you can let AI run with confidence thresholds.",
    },
    {
      q: "Which AI providers are supported?",
      a: "Nexus ships with a provider abstraction layer. The default provider is configured out of the box, and on Business plans you can bring your own API keys for any supported provider. New providers can be added without touching application code — the abstraction handles request shape, tokenization, and response normalization.",
    },
    {
      q: "What happens if a scheduled post fails to publish?",
      a: "Every job is idempotent and retried with exponential backoff. If a publish fails — due to a transient API error, rate limit, or network blip — Nexus retries intelligently without ever duplicating the post. You'll see the failure in real-time on your dashboard and notification center, with retry status and the underlying cause.",
    },
    {
      q: "How secure are my OAuth tokens and credentials?",
      a: "All OAuth tokens and provider credentials are encrypted at rest using AES-256. Tokens never touch client-side JavaScript — every API call is proxied through our server-side authorization layer with workspace isolation. Audit logs capture every privileged action, and Business plans add SSO and per-team role-based permissions.",
    },
    {
      q: "Can I use Nexus with a team?",
      a: "Yes. The Business plan supports team workspaces with role-based permissions: owners, editors, approvers, and viewers. Each role has scoped capabilities — for example, approvers can review AI content but cannot modify automations. Audit logs track who did what, when.",
    },
    {
      q: "What does the free plan include?",
      a: "The Free plan includes 2 connected accounts, 50 AI generations per month, manual scheduling, and 7 days of analytics history. It's a genuine starter plan — not a 14-day trial. Upgrade anytime; downgrade anytime. Your data is always exportable.",
    },
  ];

  return (
    <section id="faq" className="border-b border-border py-24 lg:py-32">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-16">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">FAQ</div>
          <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            Questions, answered.
          </h2>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {faqs.map((f, i) => (
            <div key={f.q} className="py-1">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-5 text-left group"
              >
                <span className="text-sm font-medium pr-4">{f.q}</span>
                <span
                  className={`mt-0.5 shrink-0 h-6 w-6 rounded-full border border-border flex items-center justify-center text-xs transition-transform ${
                    open === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: open === i ? "auto" : 0,
                  opacity: open === i ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="text-sm text-muted-foreground leading-relaxed pb-5 pr-8">{f.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingFinalCTA() {
  const enterApp = useStore((s) => s.enterApp);
  const user = useStore((s) => s.user);
  const setAuthModalOpen = useStore((s) => s.setAuthModalOpen);

  const handleStartFree = () => {
    if (user) enterApp();
    else setAuthModalOpen(true, "signup");
  };

  const handleViewDemo = () => {
    if (user) enterApp();
    else setAuthModalOpen(true, "login");
  };

  return (
    <section className="relative overflow-hidden py-28 lg:py-40">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/[0.06] rounded-full blur-[120px] pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-6 lg:px-10 text-center">
        <TrendingUp className="h-8 w-8 mx-auto mb-6 text-white/70" />
        <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.05]">
          Ship better content.
          <br />
          <span className="text-muted-foreground">Spend less time doing it.</span>
        </h2>
        <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-pretty leading-relaxed">
          Join 4,200+ teams using Nexus to automate their social workflow. Start free in under 60
          seconds — no credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleStartFree}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 h-12 text-sm font-medium text-black hover:bg-white/90 transition-colors w-full sm:w-auto"
          >
            {user ? "Open dashboard" : "Start for Free"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            onClick={handleViewDemo}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/40 backdrop-blur-sm px-7 h-12 text-sm font-medium text-foreground hover:bg-card/80 transition-colors w-full sm:w-auto"
          >
            View Demo
          </button>
        </div>
      </div>
    </section>
  );
}

export function LandingNav() {
  const enterApp = useStore((s) => s.enterApp);
  const user = useStore((s) => s.user);
  const setAuthModalOpen = useStore((s) => s.setAuthModalOpen);

  const handleStartFree = () => {
    if (user) {
      enterApp();
    } else {
      setAuthModalOpen(true, "signup");
    }
  };

  const handleSignIn = () => {
    if (user) {
      enterApp();
    } else {
      setAuthModalOpen(true, "login");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center">
            <div className="h-3 w-3 bg-black rounded-sm" />
          </div>
          <span className="font-semibold tracking-tight">Nexus</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSignIn}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            {user ? "Open dashboard" : "Sign in"}
          </button>
          <button
            onClick={handleStartFree}
            className="rounded-full bg-white text-black text-sm font-medium px-4 h-9 hover:bg-white/90 transition-colors"
          >
            {user ? "Open dashboard" : "Start free"}
          </button>
        </div>
      </div>
    </header>
  );
}

export function LandingFooter() {
  const setPublicView = useStore((s) => s.setPublicView);
  const cols = [
    { title: "Product", links: [["Features", "features"], ["Pricing", "pricing"], ["Changelog", "changelog"], ["Roadmap", "roadmap"], ["Status", "status"]] as [string, string][] },
    { title: "Company", links: [["About", "about"], ["Careers", "careers"], ["Blog", "blog"], ["Press", "press"], ["Contact", "contact"]] as [string, string][] },
    { title: "Resources", links: [["Documentation", "docs"], ["API Reference", "api-ref"], ["Guides", "guides"], ["Community", "community"], ["Support", "support"]] as [string, string][] },
    { title: "Legal", links: [["Privacy", "privacy"], ["Terms", "terms"], ["Security", "security"], ["DPA", "dpa"], ["Compliance", "compliance"]] as [string, string][] },
  ];

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
              The AI operating system for social media. Connect, automate, and grow — all from one
              premium workspace.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-medium mb-3 text-muted-foreground uppercase tracking-wider">
                {c.title}
              </div>
              <ul className="space-y-2">
                {c.links.map(([label, view]) => (
                  <li key={label}>
                    <button
                      onClick={() => setPublicView(view)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground">
            © 2026 Nexus, Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse-soft" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

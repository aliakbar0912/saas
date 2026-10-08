"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, ArrowRight, AlertTriangle, Loader2 } from "lucide-react";
import { useStore } from "@/lib/store";

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    authLoading,
    setAuthModalOpen,
    setAuthModalMode,
    signIn,
    signUp,
    enterApp,
    pushToast,
  } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Derive whether the form should be in loading state
  const switchMode = (mode: "login" | "signup") => {
    setAuthModalMode(mode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (authModalMode === "signup" && !name) {
      setError("Please enter your name.");
      return;
    }

    const res =
      authModalMode === "login"
        ? await signIn(email, password)
        : await signUp(email, password, name);

    if (res.ok) {
      pushToast({
        type: "success",
        title: authModalMode === "login" ? "Signed in" : "Account created",
        description:
          authModalMode === "login"
            ? "Welcome back to Nexus."
            : "Your workspace is ready. Let's get started.",
      });
      enterApp();
    } else {
      setError(res.error || "Something went wrong. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md"
            onClick={() => setAuthModalOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-full max-w-md px-4"
          >
            <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-black/60 overflow-hidden">
              {/* Header */}
              <div className="relative px-6 pt-6 pb-5 border-b border-border">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center">
                    <div className="h-3.5 w-3.5 bg-black rounded-sm" />
                  </div>
                  <span className="font-semibold tracking-tight">Nexus</span>
                </div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {authModalMode === "login" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {authModalMode === "login"
                    ? "Sign in to your Nexus workspace to continue automating your social presence."
                    : "Start free in under 60 seconds. No credit card required."}
                </p>
                <button
                  onClick={() => setAuthModalOpen(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
                {authModalMode === "signup" && (
                  <Field
                    icon={User}
                    label="Full name"
                    type="text"
                    value={name}
                    onChange={setName}
                    placeholder="Ayan Khan"
                    autoComplete="name"
                  />
                )}
                <Field
                  icon={Mail}
                  label="Email"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
                <Field
                  icon={Lock}
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete={authModalMode === "login" ? "current-password" : "new-password"}
                />

                {error && (
                  <div className="rounded-lg border border-red-400/30 bg-red-400/[0.05] p-2.5 flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-red-300 leading-relaxed">{error}</span>
                  </div>
                )}

                {authModalMode === "login" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="accent-white h-3 w-3 rounded" />
                      Remember me
                    </label>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black h-11 text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {authModalMode === "login" ? "Signing in..." : "Creating account..."}
                    </>
                  ) : (
                    <>
                      {authModalMode === "login" ? "Sign in" : "Create account"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center text-xs text-muted-foreground pt-2">
                  {authModalMode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("signup")}
                        className="text-foreground font-medium hover:text-white transition-colors"
                      >
                        Sign up free
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="text-foreground font-medium hover:text-white transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="border-t border-border px-6 py-3.5 bg-background/40">
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  By continuing you agree to our{" "}
                  <span className="text-foreground hover:underline cursor-pointer">Terms</span> and{" "}
                  <span className="text-foreground hover:underline cursor-pointer">Privacy Policy</span>.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({
  icon: Icon,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-border bg-background/40 h-11 px-3.5 text-sm outline-none focus:border-white/40 transition-colors placeholder:text-muted-foreground/60"
      />
    </div>
  );
}

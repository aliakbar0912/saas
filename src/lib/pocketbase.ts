"use client";

import PocketBase from "pocketbase";
import Cookies from "js-cookie";

// ============================================================
// PocketBase client — singleton
// ============================================================

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  process.env.POCKETBASE_URL ||
  "https://pocketbase.mughalx.tech";

// Persist auth token in a cookie so SSR + client share the session
const AUTH_COOKIE = "pb_auth";

let pbInstance: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (typeof window === "undefined") {
    // Server-side: just create a fresh instance per request.
    // We can't share state across requests on the server.
    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);
    return pb;
  }

  if (!pbInstance) {
    pbInstance = new PocketBase(POCKETBASE_URL);
    pbInstance.autoCancellation(false);

    // Try to restore auth from cookie
    const stored = Cookies.get(AUTH_COOKIE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { token: string; record: unknown };
        pbInstance.authStore.save(parsed.token, parsed.record as never);
      } catch {
        // ignore malformed cookie
      }
    }

    // Persist any auth changes to cookie
    pbInstance.authStore.onChange(() => {
      const token = pbInstance!.authStore.token;
      const record = pbInstance!.authStore.record;
      if (token && record) {
        Cookies.set(AUTH_COOKIE, JSON.stringify({ token, record }), {
          expires: 30, // days
          sameSite: "lax",
          path: "/",
        });
      } else {
        Cookies.remove(AUTH_COOKIE, { path: "/" });
      }
    });
  }

  return pbInstance;
}

// ============================================================
// Public API
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  verified?: boolean;
  created?: string;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const pb = getPocketBase();
  const record = pb.authStore.record;
  if (!record) return null;
  return {
    id: record.id,
    email: (record.email as string) ?? "",
    name: (record.name as string) ?? undefined,
    avatar: (record.avatar as string) ?? undefined,
    verified: (record.verified as boolean) ?? false,
    created: (record.created as string) ?? undefined,
  };
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return getPocketBase().authStore.token ?? null;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return getPocketBase().authStore.isValid;
}

// Sign in with email + password
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const pb = getPocketBase();
    await pb.collection("users").authWithPassword(email, password);
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { response?: { message?: string; data?: unknown } };
    return {
      ok: false,
      error: e.response?.message || "Invalid email or password.",
    };
  }
}

// Sign up with email + password + name
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const pb = getPocketBase();
    // Create the user record first
    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: password,
      name,
    });
    // Then authenticate immediately
    await pb.collection("users").authWithPassword(email, password);
    return { ok: true };
  } catch (err: unknown) {
    const e = err as { response?: { message?: string; data?: Record<string, { message?: string }> } };
    // Try to surface a friendly field-level error
    const data = e.response?.data;
    if (data) {
      const firstField = Object.keys(data)[0];
      const fieldError = data[firstField]?.message;
      if (fieldError) {
        return { ok: false, error: `${firstField}: ${fieldError}` };
      }
    }
    return {
      ok: false,
      error: e.response?.message || "Sign up failed. Please try again.",
    };
  }
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  getPocketBase().authStore.clear();
}

// Avatar URL helper (PocketBase files)
export function getAvatarUrl(user: AuthUser): string | null {
  if (!user.avatar || !user.id) return null;
  return `${POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}`;
}

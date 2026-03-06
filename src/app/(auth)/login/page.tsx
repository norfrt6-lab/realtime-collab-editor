"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, UserCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
    }
  }

  async function handleGuestLogin() {
    setLoading(true);
    const guestEmail = `guest-${Date.now()}@demo.local`;
    const guestPassword = "guest123";

    await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: guestEmail,
        name: `Guest ${Math.floor(Math.random() * 9999)}`,
        password: guestPassword,
      }),
    });

    const result = await signIn("credentials", {
      email: guestEmail,
      password: guestPassword,
      redirect: false,
    });

    setLoading(false);
    if (!result?.error) {
      router.push("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-2)] p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-[var(--card)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent">
                CollabEdit
              </h1>
              <p className="text-[var(--muted-foreground)] mt-2">
                Sign in to your account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-[var(--destructive)] bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-xl animate-slide-in-up">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-[var(--border)] rounded-xl bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-white font-medium rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 hover:-translate-y-px hover:shadow-[var(--shadow-md)] disabled:opacity-50 transition-all duration-200"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-[var(--card)] text-[var(--muted-foreground)]">
                  or
                </span>
              </div>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 border-2 border-dashed border-[var(--border)] rounded-xl font-medium hover:bg-[var(--muted)] hover:border-[var(--primary)]/30 disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              <UserCircle size={18} />
              Continue as Guest
            </button>

            <p className="text-center text-sm text-[var(--muted-foreground)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[var(--primary)] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

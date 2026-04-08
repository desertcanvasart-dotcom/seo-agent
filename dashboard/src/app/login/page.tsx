"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const supabase = createSupabaseBrowser();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex bg-[#fafaf8]">
      {/* Left — branding */}
      <div className="hidden lg:flex w-[480px] bg-[#0f1a14] flex-col justify-between p-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[17px] text-white tracking-tight">SEO Agent</span>
        </Link>

        <div>
          <h2 className="text-[28px] font-extrabold text-white leading-tight tracking-tight">
            Rank on Google.
            <br />
            <span className="text-[#4ade80]">Get cited by AI.</span>
          </h2>
          <p className="text-[14px] text-[#7a8a7f] mt-4 leading-relaxed">
            Audit your website, find internal links, research competitors, and generate content briefs — all in one platform.
          </p>
        </div>

        <p className="text-[11px] text-[#3a4a3f]">SEO &amp; GEO Platform</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-[17px] text-[#1a1a1a] tracking-tight">SEO Agent</span>
            </Link>
          </div>

          <h1 className="text-[26px] font-extrabold text-[#0f0f0f] tracking-tight">Welcome back</h1>
          <p className="text-[14px] text-[#6b6b6b] mt-1.5 mb-8">Sign in to your dashboard</p>

          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-[#fce8e6] text-[#c5221f] text-[13px]">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
              <input
                type="email" id="email" name="email" required disabled={loading}
                className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="text-[13px] font-semibold text-[#1a1a1a]">Password</label>
                <Link href="/forgot-password" className="text-[12px] text-[#1a3a2a] font-medium hover:underline">Forgot?</Link>
              </div>
              <input
                type="password" id="password" name="password" required disabled={loading}
                className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
                placeholder="Your password"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1a3a2a] text-white text-[14px] font-semibold rounded-xl hover:bg-[#143020] transition-colors disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#9a9a9a] mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#1a3a2a] font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

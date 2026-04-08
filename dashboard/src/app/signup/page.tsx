"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function SignUpPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const fullName = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowser();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (signUpError) setError(signUpError.message);
    else setSuccess(true);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-6">
        <div className="max-w-[400px] text-center">
          <div className="w-16 h-16 bg-[#e8f5e9] rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#1a3a2a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-[24px] font-extrabold text-[#0f0f0f] tracking-tight mb-2">Check your email</h1>
          <p className="text-[14px] text-[#6b6b6b] leading-relaxed">
            We sent a confirmation link. Click it to activate your account and start analyzing.
          </p>
          <Link href="/login" className="inline-block mt-6 text-[13px] text-[#1a3a2a] font-semibold hover:underline">Back to Login</Link>
        </div>
      </div>
    );
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
            Start optimizing
            <br />
            <span className="text-[#4ade80]">in minutes.</span>
          </h2>
          <div className="mt-6 space-y-4">
            {[
              "Full SEO & GEO audit for any website",
              "AI-powered internal link discovery",
              "Competitor research & content briefs",
              "Free to start, no credit card required",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <svg className="w-4 h-4 text-[#4ade80] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-[13px] text-[#7a8a7f]">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[#3a4a3f]">SEO &amp; GEO Platform</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-[380px]">
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

          <h1 className="text-[26px] font-extrabold text-[#0f0f0f] tracking-tight">Create your account</h1>
          <p className="text-[14px] text-[#6b6b6b] mt-1.5 mb-8">Start analyzing your websites for free</p>

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
              <label htmlFor="name" className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Full Name</label>
              <input type="text" id="name" name="name" required disabled={loading} placeholder="John Doe"
                className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
              <input type="email" id="email" name="email" required disabled={loading} placeholder="you@company.com"
                className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Password</label>
              <input type="password" id="password" name="password" required disabled={loading} placeholder="Min 6 characters"
                className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1a3a2a] text-white text-[14px] font-semibold rounded-xl hover:bg-[#143020] transition-colors disabled:opacity-50 mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Creating account...
                </span>
              ) : "Create Account"}
            </button>
          </form>

          <p className="text-center text-[13px] text-[#9a9a9a] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1a3a2a] font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

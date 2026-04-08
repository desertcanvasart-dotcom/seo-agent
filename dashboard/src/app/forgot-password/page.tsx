"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    const supabase = createSupabaseBrowser();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setLoading(false);
    if (resetError) setError(resetError.message);
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
          <p className="text-[14px] text-[#6b6b6b] leading-relaxed">We sent a password reset link to your email.</p>
          <Link href="/login" className="inline-block mt-6 text-[13px] text-[#1a3a2a] font-semibold hover:underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-6">
      <div className="w-full max-w-[380px]">
        <Link href="/" className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-[#1a3a2a] rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[17px] text-[#1a1a1a] tracking-tight">SEO Agent</span>
        </Link>

        <h1 className="text-[26px] font-extrabold text-[#0f0f0f] tracking-tight">Reset password</h1>
        <p className="text-[14px] text-[#6b6b6b] mt-1.5 mb-8">Enter your email and we&apos;ll send a reset link</p>

        {error && (
          <div className="flex items-center gap-2.5 p-3.5 mb-5 rounded-xl bg-[#fce8e6] text-[#c5221f] text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-[#1a1a1a] mb-1.5">Email</label>
            <input type="email" id="email" name="email" required disabled={loading} placeholder="you@company.com"
              className="w-full px-4 py-3 bg-white border border-[#e0ddd6] rounded-xl text-[14px] focus:outline-none focus:border-[#1a3a2a] focus:ring-2 focus:ring-[#1a3a2a]/10 transition disabled:opacity-50 placeholder:text-[#c0bdb6]"
            />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3.5 bg-[#1a3a2a] text-white text-[14px] font-semibold rounded-xl hover:bg-[#143020] transition-colors disabled:opacity-50">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#9a9a9a] mt-6">
          <Link href="/login" className="text-[#1a3a2a] font-semibold hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}

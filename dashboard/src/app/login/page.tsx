"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--accent)] rounded-xl flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">S</div>
          <h1 className="text-xl font-semibold">SEO Agent</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Sign in to your dashboard</p>
        </div>

        {state?.error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-[var(--red-light)] text-[var(--red)] text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.error}
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <form action={formAction} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  autoFocus
                  disabled={pending}
                  className="input"
                  placeholder="Enter dashboard password"
                />
              </div>
              <button type="submit" disabled={pending} className="btn btn-primary w-full py-3">
                {pending ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

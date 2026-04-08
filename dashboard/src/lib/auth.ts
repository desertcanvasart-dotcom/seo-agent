"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD || "admin";
const SESSION_COOKIE = "seo_agent_session";
const SESSION_VALUE = "authenticated";

export async function loginAction(_prevState: any, formData: FormData) {
  const password = formData.get("password") as string;

  if (password !== DASHBOARD_PASSWORD) {
    return { error: "Wrong password" };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  redirect("/");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

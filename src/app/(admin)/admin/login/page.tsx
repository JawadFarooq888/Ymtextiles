import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ADMIN_ROLES } from "@/lib/auth.config";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role && ADMIN_ROLES.includes(session.user.role)) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-center text-xs tracking-[0.3em] text-brand-gold uppercase">Admin</p>
        <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">YM TEXTILES</h1>
        <LoginForm />
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { sanitizeTextInput } from "@/lib/sanitize";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = sanitizeTextInput(email).toLowerCase();
    const normalizedPassword = sanitizeTextInput(password);

    if (!normalizedEmail || !normalizedPassword) {
      setError(t("auth.error.requiredLogin", "Email and password are required."));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t("auth.error.invalidEmail", "Enter a valid email format."));
      return;
    }

    setIsSubmitting(true);

    // Placeholder auth flow for hackathon demo with role routing.
    await new Promise((resolve) => setTimeout(resolve, 500));
    const isAdmin =
      normalizedEmail === "admin@holbertonschool.com" && normalizedPassword === "admin1234";

    if (!isAdmin) {
      let registeredUser:
        | {
            fullName?: string;
            email?: string;
            password?: string;
          }
        | null = null;
      try {
        const raw = localStorage.getItem("hspts_registered_user");
        registeredUser = raw
          ? (JSON.parse(raw) as { fullName?: string; email?: string; password?: string })
          : null;
      } catch {
        registeredUser = null;
      }

      const validRegisteredLogin =
        registeredUser &&
        registeredUser.email?.trim().toLowerCase() === normalizedEmail &&
        registeredUser.password === normalizedPassword;

      if (!validRegisteredLogin) {
        setError(t("auth.error.invalidCredentials", "Email or password is incorrect."));
        setIsSubmitting(false);
        return;
      }
    }

    try {
      sessionStorage.setItem("hspts_auth", "true");
      sessionStorage.setItem("hspts_user_email", normalizedEmail);
      sessionStorage.setItem("hspts_user_role", isAdmin ? "admin" : "user");
      // Remove legacy persistent auth keys.
      localStorage.removeItem("hspts_auth");
      localStorage.removeItem("hspts_user_email");
      localStorage.removeItem("hspts_user_role");
    } catch {
      // Ignore storage access issues in restricted browsers.
    }
    router.push(isAdmin ? "/admin" : "/student-portal");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-14rem] h-[30rem] w-[30rem] rounded-full bg-[#F40F2C]/10 blur-3xl" />
        <div className="absolute right-[-8%] bottom-[-10rem] h-[26rem] w-[26rem] rounded-full bg-[#fecdd3]/35 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl border border-[#fecdd3] bg-white/95 p-7 shadow-[0_35px_90px_-48px_rgba(244,15,44,0.5)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 text-center">
          <div className="mb-4 flex justify-end">
            <LanguageSwitcher />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F40F2C]">
            Holberton HSPTS
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
            {t("auth.signIn", "Sign In")}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {t("auth.loginSubtitle", "Sign in to the student performance dashboard.")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="email">
              {t("auth.email", "Email")}
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder", "you@holbertonschool.com")}
                className="h-11 rounded-xl border-[#e5e7eb] bg-white pl-10 focus-visible:ring-[#F40F2C]"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="password">
              {t("auth.password", "Password")}
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.passwordPlaceholder", "********")}
                className="h-11 rounded-xl border-[#e5e7eb] bg-white pl-10 focus-visible:ring-[#F40F2C]"
                autoComplete="current-password"
              />
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-[#b91c1c]">{error}</p> : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
          >
            {isSubmitting ? t("common.submitting", "Submitting...") : t("auth.signIn", "Sign In")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-5 text-center text-sm text-[#6b7280]">
          {t("auth.noAccount", "No account?")}{" "}
          <Link href="/register" className="font-semibold text-[#F40F2C] hover:underline">
            {t("common.register", "Register")}
          </Link>
        </div>
      </div>
    </main>
  );
}

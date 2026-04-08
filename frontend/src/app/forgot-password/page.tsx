"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { sanitizeTextInput } from "@/lib/sanitize";
import { apiForgotPassword } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const safe = sanitizeTextInput(email).toLowerCase();
    if (!safe || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe)) {
      setError(t("auth.error.invalidEmail", "Enter a valid email format."));
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiForgotPassword(safe);
      setMessage(res.message || t("auth.resetSent", "If the email exists, a reset link was sent."));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError", "Unknown error occurred."));
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[#111827]">
            {t("auth.forgotTitle", "Reset password")}
          </h1>
          <p className="mt-2 text-sm text-[#6b7280]">
            {t("auth.forgotSubtitle", "We will email you a link if the account exists.")}
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
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-[#e5e7eb] bg-white pl-10"
                autoComplete="email"
              />
            </div>
          </div>
          {error ? <p className="text-sm text-[#b91c1c]">{error}</p> : null}
          {message ? <p className="text-sm text-[#15803d]">{message}</p> : null}
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
          >
            {submitting ? t("common.submitting", "Submitting...") : t("auth.sendResetLink", "Send reset link")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-semibold text-[#F40F2C] hover:underline">
            {t("auth.backToLogin", "Back to sign in")}
          </Link>
        </div>
      </div>
    </main>
  );
}

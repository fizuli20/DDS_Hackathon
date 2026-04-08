"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { sanitizeTextInput } from "@/lib/sanitize";
import { apiResetPassword } from "@/lib/auth-client";

function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const p = sanitizeTextInput(password);
    const c = sanitizeTextInput(confirm);
    if (p.length < 8) {
      setError(t("auth.error.passwordMin8", "Password must be at least 8 characters."));
      return;
    }
    if (p !== c) {
      setError(t("auth.error.passwordMismatch", "Passwords do not match."));
      return;
    }
    if (!token) {
      setError(t("auth.missingToken", "Invalid or missing reset link."));
      return;
    }
    setSubmitting(true);
    try {
      await apiResetPassword(token, p);
      router.push("/login?reset=ok");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.unknownError", "Unknown error occurred."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="password">
          {t("auth.newPassword", "New password")}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl border-[#e5e7eb] bg-white pl-10"
            autoComplete="new-password"
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="confirm">
          {t("auth.confirmPassword", "Confirm password")}
        </label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11 rounded-xl border-[#e5e7eb] bg-white"
          autoComplete="new-password"
        />
      </div>
      {error ? <p className="text-sm text-[#b91c1c]">{error}</p> : null}
      <Button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
      >
        {submitting ? t("common.submitting", "Submitting...") : t("auth.updatePassword", "Update password")}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="relative w-full max-w-md rounded-3xl border border-[#fecdd3] bg-white/95 p-7 shadow-[0_35px_90px_-48px_rgba(244,15,44,0.5)] backdrop-blur-xl sm:p-8">
        <div className="mb-7 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-2xl font-black text-[#111827]">{t("auth.resetTitle", "Set a new password")}</h1>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-[#6b7280]">{t("common.loading", "Loading...")}</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <div className="mt-5 text-center text-sm">
          <Link href="/login" className="font-semibold text-[#F40F2C] hover:underline">
            {t("auth.backToLogin", "Back to sign in")}
          </Link>
        </div>
      </div>
    </main>
  );
}

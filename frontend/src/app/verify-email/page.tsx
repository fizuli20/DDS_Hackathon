"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { apiVerifyEmail } from "@/lib/auth-client";

function VerifyBody() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("err");
      setMsg(t("auth.missingToken", "Invalid or missing reset link."));
      return;
    }
    void apiVerifyEmail(token)
      .then(() => {
        setStatus("ok");
        setTimeout(() => router.push("/login?verified=1"), 2000);
      })
      .catch((e) => {
        setStatus("err");
        setMsg(e instanceof Error ? e.message : t("common.unknownError", "Unknown error occurred."));
      });
  }, [token, router, t]);

  return (
    <div className="text-center">
      {status === "idle" ? <p className="text-sm text-[#6b7280]">{t("auth.verifying", "Verifying email...")}</p> : null}
      {status === "ok" ? (
        <p className="text-sm font-medium text-[#15803d]">{t("auth.verifiedOk", "Email verified. Redirecting to sign in...")}</p>
      ) : null}
      {status === "err" ? <p className="text-sm text-[#b91c1c]">{msg}</p> : null}
    </div>
  );
}

export default function VerifyEmailPage() {
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="relative w-full max-w-md rounded-3xl border border-[#fecdd3] bg-white/95 p-7 shadow-[0_35px_90px_-48px_rgba(244,15,44,0.5)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <h1 className="text-2xl font-black text-[#111827]">{t("auth.verifyTitle", "Email verification")}</h1>
        <div className="mt-6">
          <Suspense fallback={<p className="text-sm text-[#6b7280]">{t("common.loading", "Loading...")}</p>}>
            <VerifyBody />
          </Suspense>
        </div>
        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-[#F40F2C] hover:underline">
            {t("auth.backToLogin", "Back to sign in")}
          </Link>
        </div>
      </div>
    </main>
  );
}

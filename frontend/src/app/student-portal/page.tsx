"use client";

import { FormEvent, useMemo, useState } from "react";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";

type ActivityScoreResponse = {
  studentId: string;
  score: number;
  sessionsCount: number;
  averageSessionMinutes: number;
  recentSessions: Array<{
    checkInAt: string;
    checkOutAt: string;
    durationMinutes: number;
  }>;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

function nowLocalDateTimeValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function StudentPortalPage() {
  const { t } = useI18n();
  const [studentId, setStudentId] = useState("hspts-1004");
  const [checkInAt, setCheckInAt] = useState(nowLocalDateTimeValue());
  const [checkOutAt, setCheckOutAt] = useState(nowLocalDateTimeValue());
  const [activity, setActivity] = useState<ActivityScoreResponse | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(studentId.trim() && checkInAt && checkOutAt),
    [studentId, checkInAt, checkOutAt],
  );

  const fetchScore = async (targetStudentId: string) => {
    setLoadingScore(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/students/${encodeURIComponent(targetStudentId)}/activity-score`,
      );
      if (!response.ok) {
        throw new Error("Aktivlik skorunu almaq mümkün olmadı.");
      }
      const data = (await response.json()) as ActivityScoreResponse;
      setActivity(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinməyən xəta baş verdi.");
    } finally {
      setLoadingScore(false);
    }
  };

  const handleLogSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/students/${encodeURIComponent(studentId.trim())}/attendance-log`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkInAt: new Date(checkInAt).toISOString(),
            checkOutAt: new Date(checkOutAt).toISOString(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Giriş/çıxış vaxtını qeyd etmək mümkün olmadı.");
      }

      await fetchScore(studentId.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinməyən xəta baş verdi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-[#fecdd3] shadow-[0_22px_60px_-40px_rgba(244,15,44,0.45)]">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F40F2C]">
            {t("portal.studentSide", "Student Side")}
          </p>
          <CardTitle className="text-3xl font-black tracking-tight text-[#111827]">
            {t("portal.title", "Check-In / Check-Out and Activity Score")}
          </CardTitle>
          <div className="pt-2">
            <LanguageSwitcher />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogSession} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="studentId">
                {t("portal.studentId", "Student ID")}
              </label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder="hspts-1004"
                className="h-11 rounded-xl border-[#e5e7eb]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="checkInAt">
                {t("portal.checkIn", "Check-in time")}
              </label>
              <div className="relative">
                <LogIn className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <Input
                  id="checkInAt"
                  type="datetime-local"
                  value={checkInAt}
                  onChange={(event) => setCheckInAt(event.target.value)}
                  className="h-11 rounded-xl border-[#e5e7eb] pl-10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="checkOutAt">
                {t("portal.checkOut", "Check-out time")}
              </label>
              <div className="relative">
                <LogOut className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <Input
                  id="checkOutAt"
                  type="datetime-local"
                  value={checkOutAt}
                  onChange={(event) => setCheckOutAt(event.target.value)}
                  className="h-11 rounded-xl border-[#e5e7eb] pl-10"
                />
              </div>
            </div>

            <div className="md:col-span-2 flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={!canSubmit || submitting}
                className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white hover:bg-[#d60d28]"
              >
                {submitting ? "..." : t("portal.saveTime", "Save time")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchScore(studentId.trim())}
                disabled={loadingScore || !studentId.trim()}
                className="h-11 rounded-xl border-[#fecdd3] bg-white hover:bg-[#fff1f2]"
              >
                {loadingScore ? "..." : t("portal.refreshScore", "Refresh activity score")}
              </Button>
            </div>

            {error ? <p className="md:col-span-2 text-sm font-medium text-[#b91c1c]">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#e5e7eb]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-[#111827]">
            <Clock3 className="h-5 w-5 text-[#F40F2C]" />
            Aktivlik nəticəsi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activity ? (
            <p className="text-sm text-[#6b7280]">
              Skoru görmək üçün əvvəlcə giriş/çıxış vaxtı əlavə edin və ya “Aktivlik skorunu yenilə”
              düyməsini basın.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#6b7280]">
                Student: <span className="font-semibold text-[#111827]">{activity.studentId}</span>
              </p>
              <p className="text-5xl font-black tracking-tight text-[#111827]">{activity.score}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#fafafa] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Sessiya sayı</p>
                  <p className="mt-2 text-2xl font-black text-[#111827]">{activity.sessionsCount}</p>
                </div>
                <div className="rounded-xl bg-[#fafafa] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">Orta dəqiqə</p>
                  <p className="mt-2 text-2xl font-black text-[#111827]">
                    {activity.averageSessionMinutes} dk
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

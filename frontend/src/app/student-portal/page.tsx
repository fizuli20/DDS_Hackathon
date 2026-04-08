"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import {
  clampDatetimeLocalToBounds,
  ensureCheckoutAfterCheckin,
  getTodayDatetimeLocalBounds,
  isDatetimeLocalWithinTodayBounds,
  nowLocalDatetimeLocalValue,
} from "@/lib/datetime-local";
import { isValidStudentId, sanitizeTextInput } from "@/lib/sanitize";

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

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
const localSessionsKey = "hspts_student_sessions";
const localPortalActivityKey = "hspts_portal_activity";
const namePattern = /^[\p{L}\s'-]{2,60}$/u;

function initialSessionTimes() {
  const bounds = getTodayDatetimeLocalBounds();
  const raw = nowLocalDatetimeLocalValue();
  const clamped = clampDatetimeLocalToBounds(raw, bounds.min, bounds.max);
  return { checkIn: clamped, checkOut: ensureCheckoutAfterCheckin(clamped, clamped, bounds.max) };
}

export default function StudentPortalPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [studentId, setStudentId] = useState("hspts-1004");
  const [checkInAt, setCheckInAt] = useState(() => initialSessionTimes().checkIn);
  const [checkOutAt, setCheckOutAt] = useState(() => initialSessionTimes().checkOut);
  const [activity, setActivity] = useState<ActivityScoreResponse | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);

  const todayBounds = getTodayDatetimeLocalBounds();

  useEffect(() => {
    const onDayChange = () => {
      const b = getTodayDatetimeLocalBounds();
      setCheckInAt((prev) => {
        const next = clampDatetimeLocalToBounds(prev, b.min, b.max);
        setCheckOutAt((cout) =>
          ensureCheckoutAfterCheckin(next, clampDatetimeLocalToBounds(cout, b.min, b.max), b.max),
        );
        return next;
      });
    };
    const id = window.setInterval(onDayChange, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") onDayChange();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("hspts_auth");
      sessionStorage.removeItem("hspts_user_email");
      sessionStorage.removeItem("hspts_user_role");
      localStorage.removeItem("hspts_auth");
      localStorage.removeItem("hspts_user_email");
      localStorage.removeItem("hspts_user_role");
    } catch {
      // Ignore storage cleanup issues.
    }
    router.push("/login");
  };

  const getLocalSessions = (targetStudentId: string) => {
    try {
      const raw = localStorage.getItem(localSessionsKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, ActivityScoreResponse["recentSessions"]>) : {};
      return parsed[targetStudentId] || [];
    } catch {
      return [];
    }
  };

  const saveLocalSessions = (
    targetStudentId: string,
    sessions: ActivityScoreResponse["recentSessions"],
  ) => {
    try {
      const raw = localStorage.getItem(localSessionsKey);
      const parsed = raw ? (JSON.parse(raw) as Record<string, ActivityScoreResponse["recentSessions"]>) : {};
      parsed[targetStudentId] = sessions;
      localStorage.setItem(localSessionsKey, JSON.stringify(parsed));
    } catch {
      // noop
    }
  };

  const computeLocalScore = (
    targetStudentId: string,
    sessions: ActivityScoreResponse["recentSessions"],
  ): ActivityScoreResponse => {
    const totalMinutes = sessions.reduce((sum, item) => sum + item.durationMinutes, 0);
    const averageMinutes = sessions.length ? totalMinutes / sessions.length : 0;
    const score = Math.min(100, Math.round(40 + averageMinutes / 3 + sessions.length * 4));
    return {
      studentId: targetStudentId,
      score,
      sessionsCount: sessions.length,
      averageSessionMinutes: Math.round(averageMinutes),
      recentSessions: sessions.slice(0, 10),
    };
  };

  const appendPortalActivity = (entry: {
    studentId: string;
    fullName: string;
    checkInAt: string;
    checkOutAt: string;
    durationMinutes: number;
  }) => {
    try {
      const raw = localStorage.getItem(localPortalActivityKey);
      const parsed = raw
        ? (JSON.parse(raw) as Array<
            {
              studentId: string;
              fullName: string;
              checkInAt: string;
              checkOutAt: string;
              durationMinutes: number;
              loggedAt: string;
            }
          >)
        : [];
      const next = [{ ...entry, loggedAt: new Date().toISOString() }, ...parsed].slice(0, 100);
      localStorage.setItem(localPortalActivityKey, JSON.stringify(next));
    } catch {
      // noop
    }
  };

  const validateNameField = (value: string) => namePattern.test(value);

  const canSubmit = useMemo(
    () =>
      Boolean(
        studentId.trim() &&
          checkInAt &&
          checkOutAt &&
          validateNameField(sanitizeTextInput(firstName)) &&
          validateNameField(sanitizeTextInput(lastName)),
      ),
    [studentId, checkInAt, checkOutAt, firstName, lastName],
  );

  const fetchScore = async (targetStudentId: string) => {
    setLoadingScore(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/students/${encodeURIComponent(targetStudentId)}/activity-score`,
      );
      if (!response.ok) {
        const local = computeLocalScore(targetStudentId, getLocalSessions(targetStudentId));
        setActivity(local);
        setError("");
        return;
      }
      const data = (await response.json()) as ActivityScoreResponse;
      setActivity(data);
      setError("");
    } catch (err) {
      const local = computeLocalScore(targetStudentId, getLocalSessions(targetStudentId));
      setActivity(local);
      setError(err instanceof Error ? err.message : t("common.unknownError", "Unknown error occurred."));
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
    const safeFirstName = sanitizeTextInput(firstName);
    const safeLastName = sanitizeTextInput(lastName);
    if (!validateNameField(safeFirstName) || !validateNameField(safeLastName)) {
      setError(
        t(
          "portal.error.invalidName",
          "Name and surname must be 2-60 chars and include only letters, spaces, apostrophe, or hyphen.",
        ),
      );
      return;
    }

    const safeStudentId = sanitizeTextInput(studentId);
    if (!safeStudentId) {
      setError(t("portal.error.studentIdRequired", "Student ID cannot be empty."));
      return;
    }
    if (!isValidStudentId(safeStudentId)) {
      setError(t("portal.error.invalidStudentId", "Student ID format is invalid."));
      return;
    }

    const checkInDate = new Date(checkInAt);
    const checkOutDate = new Date(checkOutAt);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      setError(t("portal.error.invalidDate", "Please provide valid check-in/check-out times."));
      return;
    }
    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      setError(t("portal.error.invalidTimeOrder", "Check-out time must be later than check-in time."));
      return;
    }

    const bounds = getTodayDatetimeLocalBounds();
    if (
      !isDatetimeLocalWithinTodayBounds(checkInAt, bounds) ||
      !isDatetimeLocalWithinTodayBounds(checkOutAt, bounds)
    ) {
      setError(
        t(
          "portal.error.todayOnly",
          "You can only log attendance for today. Past and future calendar days are not allowed.",
        ),
      );
      return;
    }

    const nowMs = Date.now();
    const clockSkewMs = 60_000;
    if (checkInDate.getTime() > nowMs + clockSkewMs || checkOutDate.getTime() > nowMs + clockSkewMs) {
      setError(
        t(
          "portal.error.futureTime",
          "Check-in and check-out cannot be set in the future.",
        ),
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/students/${encodeURIComponent(safeStudentId)}/attendance-log`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkInAt: checkInDate.toISOString(),
            checkOutAt: checkOutDate.toISOString(),
          }),
        },
      );

      if (!response.ok) {
        const local = getLocalSessions(safeStudentId);
        const durationMinutes = Math.max(
          0,
          Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000),
        );
        const next = [
          {
            checkInAt: checkInDate.toISOString(),
            checkOutAt: checkOutDate.toISOString(),
            durationMinutes,
          },
          ...local,
        ].slice(0, 30);
        saveLocalSessions(safeStudentId, next);
        appendPortalActivity({
          studentId: safeStudentId,
          fullName: `${safeFirstName} ${safeLastName}`,
          checkInAt: checkInDate.toISOString(),
          checkOutAt: checkOutDate.toISOString(),
          durationMinutes,
        });
        await fetchScore(safeStudentId);
        return;
      }

      appendPortalActivity({
        studentId: safeStudentId,
        fullName: `${safeFirstName} ${safeLastName}`,
        checkInAt: checkInDate.toISOString(),
        checkOutAt: checkOutDate.toISOString(),
        durationMinutes: Math.max(
          0,
          Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 60000),
        ),
      });
      await fetchScore(safeStudentId);
    } catch (err) {
      const safeFirstName = sanitizeTextInput(firstName);
      const safeLastName = sanitizeTextInput(lastName);
      const safeStudentId = sanitizeTextInput(studentId);
      const local = getLocalSessions(safeStudentId);
      const checkIn = new Date(checkInAt);
      const checkOut = new Date(checkOutAt);
      const durationMinutes = Math.max(
        0,
        Math.round((checkOut.getTime() - checkIn.getTime()) / 60000),
      );
      const next = [
        {
          checkInAt: checkIn.toISOString(),
          checkOutAt: checkOut.toISOString(),
          durationMinutes,
        },
        ...local,
      ].slice(0, 30);
      saveLocalSessions(safeStudentId, next);
      appendPortalActivity({
        studentId: safeStudentId,
        fullName: `${safeFirstName} ${safeLastName}`.trim() || t("portal.unknownStudent", "Unknown student"),
        checkInAt: checkIn.toISOString(),
        checkOutAt: checkOut.toISOString(),
        durationMinutes,
      });
      await fetchScore(safeStudentId);
      setError(err instanceof Error ? err.message : t("common.unknownError", "Unknown error occurred."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-[#fecdd3] shadow-[0_22px_60px_-40px_rgba(244,15,44,0.45)]">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleLogout}
              className="h-10 rounded-xl border-[#fecdd3] bg-white px-4 text-[#111827] hover:bg-[#fff1f2]"
            >
              {t("common.logout", "Logout")}
            </Button>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F40F2C]">
            {t("portal.studentSide", "Student Side")}
          </p>
          <CardTitle className="text-3xl font-black tracking-tight text-[#111827]">
            {t("portal.title", "Check-In / Check-Out and Activity Score")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogSession} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="firstName">
                {t("portal.firstName", "Name")}
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t("portal.firstName", "Name")}
                className="h-11 rounded-xl border-[#e5e7eb]"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="lastName">
                {t("portal.lastName", "Surname")}
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={t("portal.lastName", "Surname")}
                className="h-11 rounded-xl border-[#e5e7eb]"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-[#111827]" htmlFor="studentId">
                {t("portal.studentId", "Student ID")}
              </label>
              <Input
                id="studentId"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                placeholder={t("portal.studentIdPlaceholder", "hspts-1004")}
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
                  min={todayBounds.min}
                  max={todayBounds.max}
                  value={checkInAt}
                  onChange={(event) => {
                    const b = getTodayDatetimeLocalBounds();
                    const cin = clampDatetimeLocalToBounds(event.target.value, b.min, b.max);
                    setCheckInAt(cin);
                    setCheckOutAt((cout) =>
                      ensureCheckoutAfterCheckin(cin, clampDatetimeLocalToBounds(cout, b.min, b.max), b.max),
                    );
                  }}
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
                  min={todayBounds.min}
                  max={todayBounds.max}
                  value={checkOutAt}
                  onChange={(event) => {
                    const b = getTodayDatetimeLocalBounds();
                    setCheckOutAt(clampDatetimeLocalToBounds(event.target.value, b.min, b.max));
                  }}
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
                {submitting ? t("common.submitting", "Submitting...") : t("portal.saveTime", "Save time")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => fetchScore(sanitizeTextInput(studentId))}
                disabled={loadingScore || !studentId.trim()}
                className="h-11 rounded-xl border-[#fecdd3] bg-white hover:bg-[#fff1f2]"
              >
                {loadingScore
                  ? t("common.loading", "Loading...")
                  : t("portal.refreshScore", "Refresh activity score")}
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
            {t("portal.activityResult", "Activity result")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activity ? (
            <p className="text-sm text-[#6b7280]">
              {t(
                "portal.activityHelp",
                "To see the score, first add check-in/check-out times or click 'Refresh activity score'.",
              )}
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#6b7280]">
                {t("portal.studentLabel", "Student")}:{" "}
                <span className="font-semibold text-[#111827]">{activity.studentId}</span>
              </p>
              <p className="text-5xl font-black tracking-tight text-[#111827]">{activity.score}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#fafafa] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
                    {t("portal.sessionsCount", "Sessions count")}
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#111827]">{activity.sessionsCount}</p>
                </div>
                <div className="rounded-xl bg-[#fafafa] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
                    {t("portal.avgMinutes", "Average minutes")}
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#111827]">
                    {activity.averageSessionMinutes} {t("portal.minutesShort", "min")}
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

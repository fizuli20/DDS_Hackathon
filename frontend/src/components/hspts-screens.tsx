"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { jsPDF } from "jspdf";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bookmark,
  BookCheck,
  CalendarDays,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Flame,
  Minus,
  Search,
  ShieldAlert,
  Trash2,
  Sparkles,
  TrendingUp,
  UserRound,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getAtRiskStudents,
  getStudentById,
  recentActivity,
  riskDistribution,
  scoreTrend,
  studentHistory,
  type RiskLevel,
  type StudentRecord,
  type Trend,
} from "@/lib/hspts-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_GOOGLE_SHEET_URL } from "@/lib/sheet-config";

const colors = {
  primary: "#F40F2C",
  primaryDeep: "#d60d28",
  danger: "#b91c1c",
  dangerSoft: "#fee2e2",
  success: "#16a34a",
  warning: "#ca8a04",
  ink: "#111827",
  muted: "#6b7280",
  line: "#e5e7eb",
  surface: "#ffffff",
  panel: "#fafafa",
};

type SheetStudent = {
  row: number;
  name: string;
  studentId: string;
  pld: number;
  task: number;
  exam: number;
  attendance: number;
  overall: number;
};

type SheetSummary = {
  totalStudents: number;
  averages: { pld: number; task: number; exam: number; attendance: number; overall: number };
  students: SheetStudent[];
};

type AiTrend = {
  studentId: string;
  trend: Trend;
  delta: number;
  reason: string;
};

function useSheetDataset() {
  const [summary, setSummary] = useState<SheetSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
        const sheetUrl = DEFAULT_GOOGLE_SHEET_URL;
        const response = await fetch(
          `${apiBaseUrl}/analysis/google-sheet-data?sheetUrl=${encodeURIComponent(sheetUrl)}`,
        );
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { summary?: SheetSummary };
        if (active && data.summary) {
          setSummary(data.summary);
        }
      } catch {
        // Keep UI fallback data if backend/sheet is unreachable.
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return { summary, loading };
}

function useSheetTrends() {
  const [trends, setTrends] = useState<Record<string, AiTrend>>({});

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
        const sheetUrl = DEFAULT_GOOGLE_SHEET_URL;
        const response = await fetch(`${apiBaseUrl}/analysis/google-sheet-trends`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetUrl }),
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { trends?: AiTrend[] };
        if (!active || !Array.isArray(data.trends)) {
          return;
        }
        const map: Record<string, AiTrend> = {};
        for (const item of data.trends) {
          if (!item?.studentId) continue;
          map[item.studentId] = item;
        }
        setTrends(map);
      } catch {
        // Keep default trend fallback in UI.
      }
    };
    void run();
    return () => {
      active = false;
    };
  }, []);

  return trends;
}

function toRiskLevel(overall: number): RiskLevel {
  if (overall < 70) return "AT RISK";
  if (overall < 80) return "WEAK";
  if (overall < 90) return "MEDIUM";
  return "STRONG";
}

const FILTER_PRESET_KEY = "hspts_student_filter_presets_v1";

type StudentFilterPreset = {
  id: string;
  name: string;
  cohort: string;
  track: string;
  riskLevel: string;
  search: string;
};

function normalizeStudentId(raw: string | undefined, index: number) {
  if (!raw || raw.startsWith("N/A")) {
    return `hspts-${1001 + index}`;
  }
  return raw;
}

function toInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "ST"
  );
}

function SectionReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HsptsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-slate-900 shadow-[0_20px_45px_-28px_rgba(17,24,39,0.22)]",
        className,
      )}
    >
      {children}
    </Card>
  );
}

function Surface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#f1f5f9] bg-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const classes =
    level === "AT RISK"
      ? "border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]"
      : level === "WEAK"
        ? "border-[#fde68a] bg-[#fffbeb] text-[#b45309]"
        : level === "MEDIUM"
          ? "border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]"
          : "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em]",
        classes,
      )}
    >
      {level}
    </span>
  );
}

function TrendPill({ trend, delta }: { trend: Trend; delta: number }) {
  const Icon =
    trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        trend === "up" && "bg-[#dcfce7] text-[#15803d]",
        trend === "down" && "bg-[#fee2e2] text-[#b91c1c]",
        trend === "stable" && "bg-[#f3f4f6] text-[#4b5563]",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {delta > 0 ? `+${delta}` : delta}
    </span>
  );
}

function StudentAvatar({
  initials,
  large = false,
}: {
  initials: string;
  large?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(244,15,44,0.18),_rgba(244,15,44,0.05)_55%,_rgba(255,255,255,1)_100%)] font-bold text-[#F40F2C]",
        large ? "h-20 w-20 text-xl" : "h-11 w-11 text-sm",
      )}
    >
      {initials}
    </div>
  );
}

function ScoreRing({
  score,
  delta,
}: {
  score: number;
  delta: number;
}) {
  const ring = `conic-gradient(${colors.primary} ${score}%, #ffe4e6 ${score}% 100%)`;
  return (
    <div className="flex items-center gap-5">
      <div
        className="relative flex h-36 w-36 items-center justify-center rounded-full"
        style={{ background: ring }}
      >
        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
            Score
          </span>
          <span className="mt-1 text-4xl font-black tracking-tight text-[#111827]">
            {score}
          </span>
          <span className="text-sm font-semibold text-[#16a34a]">
            {delta > 0 ? `+${delta}%` : `${delta}%`}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
          Intervention posture
        </p>
        <p className="max-w-xs text-sm leading-6 text-[#4b5563]">
          Strongest momentum comes from attendance recovery and project rhythm. The next
          milestone is lifting exam confidence without sacrificing task velocity.
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  accent,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  accent: "primary" | "danger" | "success" | "warning";
  icon: React.ReactNode;
}) {
  const tone = {
    primary: "from-[#fff1f2] to-white text-[#F40F2C]",
    danger: "from-[#fee2e2] to-white text-[#b91c1c]",
    success: "from-[#f0fdf4] to-white text-[#15803d]",
    warning: "from-[#fffbeb] to-white text-[#b45309]",
  }[accent];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }}>
      <HsptsCard className="relative">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", tone)} />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
                {title}
              </p>
              <p className="mt-4 text-4xl font-black tracking-tight text-[#111827]">{value}</p>
              <p className="mt-2 text-sm text-[#6b7280]">{subtitle}</p>
            </div>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                accent === "primary" && "bg-[#fff1f2] text-[#F40F2C]",
                accent === "danger" && "bg-[#fee2e2] text-[#b91c1c]",
                accent === "success" && "bg-[#f0fdf4] text-[#15803d]",
                accent === "warning" && "bg-[#fffbeb] text-[#b45309]",
              )}
            >
              {icon}
            </div>
          </div>
        </CardContent>
      </HsptsCard>
    </motion.div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; payload?: { fill?: string } }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 shadow-xl">
      {label ? <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7280]">{label}</p> : null}
      {payload.map((item) => (
        <div key={`${item.name}-${item.value}`} className="mt-2 flex items-center gap-2 text-sm text-[#111827]">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.payload?.fill ?? colors.primary }}
          />
          <span className="font-medium">{item.name}</span>
          <span className="text-[#6b7280]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[#fecdd3] bg-[linear-gradient(135deg,_rgba(244,15,44,0.08),_rgba(255,255,255,0.98)_40%,_rgba(255,255,255,1)_100%)] px-6 py-7 shadow-[0_30px_80px_-55px_rgba(244,15,44,0.45)] sm:px-8">
      <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#F40F2C]/10 blur-2xl" />
      <div className="absolute bottom-0 right-0 h-px w-40 bg-gradient-to-l from-[#F40F2C]/40 to-transparent" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#F40F2C]">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#111827] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#4b5563] sm:text-base">
            {description}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}

export function OverviewScreen({
  universityName,
  totalStudents,
}: {
  universityName?: string;
  totalStudents: number;
}) {
  const { t } = useI18n();
  const { summary: sheetSummary, loading: sheetLoading } = useSheetDataset();
  const fallbackAtRiskStudents = getAtRiskStudents();
  const atRiskStudents = useMemo(() => {
    if (!sheetSummary?.students?.length) {
      return fallbackAtRiskStudents;
    }
    return [...sheetSummary.students]
      .sort((a, b) => a.overall - b.overall)
      .slice(0, 6)
      .map((student, index) => ({
        id: normalizeStudentId(student.studentId, index),
        name: student.name || `Student ${index + 1}`,
        initials: toInitials(student.name || "Student"),
        track: "External",
        cohort: "Sheet",
        overallScore: Math.round(student.overall),
        riskLevel: toRiskLevel(student.overall),
      }));
  }, [sheetSummary, fallbackAtRiskStudents]);
  const riskChartData = useMemo(() => {
    if (!sheetSummary?.students?.length) {
      return [...riskDistribution];
    }
    const counts = { "At-Risk": 0, Weak: 0, Medium: 0, Strong: 0 };
    for (const student of sheetSummary.students) {
      const risk = toRiskLevel(student.overall);
      if (risk === "AT RISK") counts["At-Risk"] += 1;
      else if (risk === "WEAK") counts.Weak += 1;
      else if (risk === "MEDIUM") counts.Medium += 1;
      else counts.Strong += 1;
    }
    return [
      { name: "At-Risk", value: counts["At-Risk"], color: "#b91c1c" },
      { name: "Weak", value: counts.Weak, color: "#f59e0b" },
      { name: "Medium", value: counts.Medium, color: "#F40F2C" },
      { name: "Strong", value: counts.Strong, color: "#16a34a" },
    ];
  }, [sheetSummary]);
  const scoreTrendData = [...scoreTrend];
  const [portalActivities, setPortalActivities] = useState<
    Array<{
      studentId: string;
      fullName: string;
      checkInAt: string;
      checkOutAt: string;
      durationMinutes: number;
      loggedAt: string;
    }>
  >([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("hspts_portal_activity");
      const parsed = raw
        ? (JSON.parse(raw) as Array<{
            studentId: string;
            fullName: string;
            checkInAt: string;
            checkOutAt: string;
            durationMinutes: number;
            loggedAt: string;
          }>)
        : [];
      setPortalActivities(parsed.slice(0, 8));
    } catch {
      setPortalActivities([]);
    }
  }, []);

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow={t("overview.eyebrow", "Holberton Student Performance Tracking System")}
          title={`${t("overview.operationalClarityFor", "Operational clarity for")} ${universityName ?? "Holberton School"}`}
          description={t(
            "overview.description",
            "A red-accented, mentor-first analytics cockpit for risk sensing, score movement, and cohort momentum.",
          )}
          actions={
            <>
              <Button
                asChild
                className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)] hover:bg-[#d60d28]"
              >
                <Link href="/reports">
                  {t("overview.generateWeekly", "Generate weekly board report")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
              >
                <Link href="/students">{t("overview.openList", "Open student list")}</Link>
              </Button>
            </>
          }
        />
      </SectionReveal>

      <SectionReveal delay={0.08} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={t("overview.totalStudents", "Total students")}
          value={String(sheetSummary?.totalStudents ?? totalStudents)}
          subtitle={
            sheetLoading
              ? t("overview.loadingFromSheet", "Loading from Google Sheet...")
              : t("overview.syncedFromSheet", "Synced from Google Sheet")
          }
          accent="primary"
          icon={<UserRound className="h-5 w-5" />}
        />
        <MetricCard
          title={t("overview.atRiskStudents", "At-risk students")}
          value={String(riskChartData.find((item) => item.name === "At-Risk")?.value ?? 0)}
          subtitle={t("overview.mentorReviewRequired", "Immediate mentor review required")}
          accent="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <MetricCard
          title={t("overview.averageScore", "Average score")}
          value={`${Math.round(sheetSummary?.averages.overall ?? 82)}%`}
          subtitle={t("overview.calculatedFromSheet", "Calculated from current sheet data")}
          accent="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title={t("overview.activeCohorts", "Active cohorts")}
          value="4"
          subtitle="Atlas, Nova, Pulse, Horizon"
          accent="warning"
          icon={<CalendarDays className="h-5 w-5" />}
        />
      </SectionReveal>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.35fr_0.9fr]">
        <SectionReveal delay={0.14}>
          <HsptsCard className="h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                    {t("overview.riskDistribution", "Risk distribution")}
                  </p>
                  <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                    {t("overview.cohortHealthSplit", "Cohort health split")}
                  </CardTitle>
                </div>
                <div className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#F40F2C]">
                  {t("overview.redPriority", "red priority")}
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskChartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={72}
                      outerRadius={102}
                      paddingAngle={2}
                      stroke="#ffffff"
                      strokeWidth={6}
                    >
                      {riskChartData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {riskChartData.map((segment) => (
                  <Surface key={segment.name} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">{segment.name}</p>
                          <p className="text-xs text-[#6b7280]">
                            {segment.name === "At-Risk"
                              ? "Urgent recovery planning"
                              : segment.name === "Weak"
                                ? "Needs tighter coaching cadence"
                                : segment.name === "Medium"
                                  ? "Stable with monitoring"
                                  : "Strong independent momentum"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black tracking-tight text-[#111827]">
                          {segment.value}
                        </p>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#6b7280]">
                          learners
                        </p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <HsptsCard className="h-full">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                Score trend
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                Overall score movement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-4xl font-black tracking-tight text-[#111827]">82%</p>
                  <p className="text-sm text-[#6b7280]">
                    {t("overview.last30Days", "Last 30 days aggregated by cohort signal")}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f0fdf4] px-3 py-1.5 text-sm font-semibold text-[#15803d]">
                  <ArrowUpRight className="h-4 w-4" />
                  +7.2% vs prior month
                </div>
              </div>
              <div className="h-[290px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreTrendData}>
                    <defs>
                      <linearGradient id="hsptsLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#F40F2C" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} domain={[50, 90]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="url(#hsptsLine)"
                      strokeWidth={4}
                      dot={{ r: 0 }}
                      activeDot={{ r: 7, fill: "#F40F2C", stroke: "#ffffff", strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.26}>
          <HsptsCard className="h-full">
            <CardHeader className="pb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                Recent activity
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                What changed today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="relative pl-6">
                  <span
                    className={cn(
                      "absolute left-0 top-1.5 h-3 w-3 rounded-full",
                      activity.tone === "danger" && "bg-[#b91c1c]",
                      activity.tone === "success" && "bg-[#16a34a]",
                      activity.tone === "neutral" && "bg-[#F40F2C]",
                    )}
                  />
                  <p className="text-sm font-semibold text-[#111827]">{activity.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#6b7280]">{activity.detail}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                    {activity.time}
                  </p>
                </div>
              ))}
            </CardContent>
          </HsptsCard>
        </SectionReveal>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <SectionReveal delay={0.32}>
          <HsptsCard>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                    Priority table
                  </p>
                  <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                    At-risk students
                  </CardTitle>
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
                >
                  <Link href="/students">
                    View full roster
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                    <th className="pb-1">{t("table.student", "Student")}</th>
                    <th className="pb-1">{t("table.track", "Track")}</th>
                    <th className="pb-1">{t("table.cohort", "Cohort")}</th>
                    <th className="pb-1">{t("table.score", "Score")}</th>
                    <th className="pb-1">{t("table.risk", "Risk")}</th>
                    <th className="pb-1">{t("table.action", "Action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map((student) => (
                    <tr key={student.id} className="rounded-2xl bg-[#fafafa]">
                      <td className="rounded-l-2xl px-4 py-4">
                        <div className="flex items-center gap-3">
                          <StudentAvatar initials={student.initials} />
                          <div>
                            <p className="font-semibold text-[#111827]">{student.name}</p>
                            <p className="text-sm text-[#6b7280]">{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-[#4b5563]">{student.track}</td>
                      <td className="px-4 py-4 text-sm text-[#4b5563]">{student.cohort}</td>
                      <td className="px-4 py-4 text-2xl font-black tracking-tight text-[#111827]">
                        {student.overallScore}
                      </td>
                      <td className="px-4 py-4">
                        <RiskBadge level={student.riskLevel} />
                      </td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <Button
                          asChild
                          variant="outline"
                          className="rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
                        >
                          <Link href={`/students/${student.id}`}>
                            {t("students.openProfile", "Open profile")}
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.38}>
          <HsptsCard className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-[#f1f5f9] bg-[linear-gradient(180deg,_rgba(244,15,44,0.08),_rgba(255,255,255,0)_90%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                  {t("overview.mentorSignal", "Mentor signal")}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-[#111827]">
                  {t("overview.interventionStack", "Intervention stack")}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  The risk story is driven less by technical ability and more by rhythm:
                  attendance misses, delayed task handoffs, and lower exam confidence.
                </p>
              </div>
              <div className="space-y-4 p-6">
                {[
                  {
                    label: t("overview.highUrgency", "High urgency"),
                    value: "8",
                    note: t("overview.highUrgencyNote", "Needs mentor contact within 24h"),
                    icon: <Flame className="h-4 w-4" />,
                    tone: "danger",
                  },
                  {
                    label: t("overview.recoveryPlansActive", "Recovery plans active"),
                    value: "12",
                    note: t("overview.recoveryPlansNote", "Structured weekly intervention in progress"),
                    icon: <BookCheck className="h-4 w-4" />,
                    tone: "primary",
                  },
                  {
                    label: t("overview.alertsCleared", "Alerts cleared"),
                    value: "21",
                    note: t("overview.alertsClearedNote", "Students moved out of red over 30 days"),
                    icon: <Sparkles className="h-4 w-4" />,
                    tone: "success",
                  },
                ].map((item) => (
                  <Surface key={item.label} className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{item.label}</p>
                      <p className="mt-1 text-sm text-[#6b7280]">{item.note}</p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold",
                        item.tone === "danger" && "bg-[#fee2e2] text-[#b91c1c]",
                        item.tone === "primary" && "bg-[#fff1f2] text-[#F40F2C]",
                        item.tone === "success" && "bg-[#f0fdf4] text-[#15803d]",
                      )}
                    >
                      {item.icon}
                      {item.value}
                    </div>
                  </Surface>
                ))}
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>
      </div>

      <SectionReveal delay={0.44}>
        <HsptsCard>
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
              Student portal activity
            </p>
            <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
              User panel entries visible to admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            {portalActivities.length === 0 ? (
              <p className="text-sm text-[#6b7280]">
                No activity from user panel yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                      <th className="pb-1">{t("table.fullName", "Full name")}</th>
                      <th className="pb-1">{t("table.studentId", "Student ID")}</th>
                      <th className="pb-1">{t("table.checkIn", "Check-in")}</th>
                      <th className="pb-1">{t("table.checkOut", "Check-out")}</th>
                      <th className="pb-1">{t("table.minutes", "Minutes")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portalActivities.map((item, index) => (
                      <tr key={`${item.studentId}-${item.loggedAt}-${index}`} className="bg-[#fafafa]">
                        <td className="rounded-l-xl px-3 py-3 font-semibold text-[#111827]">{item.fullName}</td>
                        <td className="px-3 py-3 text-sm text-[#4b5563]">{item.studentId}</td>
                        <td className="px-3 py-3 text-sm text-[#4b5563]">
                          {new Date(item.checkInAt).toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-sm text-[#4b5563]">
                          {new Date(item.checkOutAt).toLocaleString()}
                        </td>
                        <td className="rounded-r-xl px-3 py-3 font-semibold text-[#111827]">
                          {item.durationMinutes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </HsptsCard>
      </SectionReveal>
    </div>
  );
}

export function StudentsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { summary: sheetSummary, loading: sheetLoading } = useSheetDataset();
  const aiTrendMap = useSheetTrends();
  const [cohort, setCohort] = useState("All Cohorts");
  const [track, setTrack] = useState("All Tracks");
  const [riskLevel, setRiskLevel] = useState("All Risk Levels");
  const [search, setSearch] = useState("");
  const [filterPresets, setFilterPresets] = useState<StudentFilterPreset[]>([]);
  const [urlSyncDone, setUrlSyncDone] = useState(false);
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FILTER_PRESET_KEY);
      setFilterPresets(raw ? (JSON.parse(raw) as StudentFilterPreset[]) : []);
    } catch {
      setFilterPresets([]);
    }
  }, []);

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
    const co = searchParams.get("cohort");
    const tr = searchParams.get("track");
    const rk = searchParams.get("risk");
    setCohort(co ?? t("students.allCohorts", "All Cohorts"));
    setTrack(tr ?? t("students.allTracks", "All Tracks"));
    setRiskLevel(rk ?? t("students.allRiskLevels", "All Risk Levels"));
    setUrlSyncDone(true);
  }, [searchParams, t]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onGlobalSearch = (event: Event) => {
      const custom = event as CustomEvent<{ value?: string }>;
      setSearch(custom.detail?.value ?? "");
    };
    window.addEventListener("hspts-global-search", onGlobalSearch as EventListener);
    return () => {
      window.removeEventListener("hspts-global-search", onGlobalSearch as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!urlSyncDone) return;
    const timer = window.setTimeout(() => {
      const sp = new URLSearchParams();
      if (search.trim()) sp.set("q", search.trim());
      if (cohort !== t("students.allCohorts", "All Cohorts")) sp.set("cohort", cohort);
      if (track !== t("students.allTracks", "All Tracks")) sp.set("track", track);
      if (riskLevel !== t("students.allRiskLevels", "All Risk Levels")) sp.set("risk", riskLevel);
      const qs = sp.toString();
      router.replace(qs ? `/students?${qs}` : "/students", { scroll: false });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cohort, track, riskLevel, search, router, t, urlSyncDone]);

  const persistPresets = (next: StudentFilterPreset[]) => {
    setFilterPresets(next);
    try {
      localStorage.setItem(FILTER_PRESET_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const applyPreset = (preset: StudentFilterPreset) => {
    setCohort(preset.cohort);
    setTrack(preset.track);
    setRiskLevel(preset.riskLevel);
    setSearch(preset.search);
  };

  const handleSaveFilterPreset = () => {
    const name = window.prompt(t("students.presetNamePrompt", "Preset name (e.g. At-risk cohort A)"));
    if (!name?.trim()) return;
    const next: StudentFilterPreset = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `p-${Date.now()}`,
      name: name.trim(),
      cohort,
      track,
      riskLevel,
      search,
    };
    persistPresets([...filterPresets, next]);
  };

  const handleDeletePreset = (id: string) => {
    persistPresets(filterPresets.filter((p) => p.id !== id));
  };

  const roster = useMemo(() => {
    if (!sheetSummary?.students?.length) {
      return [];
    }
    const averageOverall = sheetSummary.averages.overall;
    return sheetSummary.students.map((student, index) => {
      const fullName = student.name || `Student ${index + 1}`;
      const delta = Math.round(student.overall - averageOverall);
      const id = normalizeStudentId(student.studentId, index);
      const aiTrend = aiTrendMap[id];
      return {
        id,
        name: fullName,
        initials: toInitials(fullName),
        mentor: "Google Sheet",
        track: student.overall >= 85 ? "High Performer Track" : "Recovery Track",
        cohort: "Google Sheet Cohort",
        overallScore: Math.round(student.overall),
        riskLevel: toRiskLevel(student.overall),
        trend: (aiTrend?.trend ?? (delta > 0 ? "up" : delta < 0 ? "down" : "stable")) as Trend,
        weeklyDelta: aiTrend?.delta ?? delta,
        trendReason:
          aiTrend?.reason ??
          t("students.trendReasonFallback", "Trend based on score distance from average."),
      };
    });
  }, [sheetSummary, aiTrendMap, t]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredStudents = roster.filter((student) => {
    const matchesCohort = cohort === t("students.allCohorts", "All Cohorts") || student.cohort === cohort;
    const matchesTrack = track === t("students.allTracks", "All Tracks") || student.track === track;
    const matchesRisk =
      riskLevel === t("students.allRiskLevels", "All Risk Levels") || student.riskLevel === riskLevel;
    const matchesSearch =
      !normalizedSearch ||
      [student.id, student.name, student.mentor, student.track, student.cohort]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesCohort && matchesTrack && matchesRisk && matchesSearch;
  });

  const handleExportFiltered = () => {
    const csv = [
      "student_id,name,track,cohort,overall_score,risk,trend,weekly_delta",
      ...filteredStudents.map((student) =>
        [
          student.id,
          `"${student.name.replace(/"/g, '""')}"`,
          `"${student.track.replace(/"/g, '""')}"`,
          `"${student.cohort.replace(/"/g, '""')}"`,
          String(student.overallScore),
          `"${student.riskLevel}"`,
          `"${student.trend}"`,
          String(student.weeklyDelta),
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hspts-filtered-students-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow={t("students.eyebrow", "Learner intelligence")}
          title={t("students.title", "Student roster with high-signal filtering")}
          description={t(
            "students.description",
            "A sharp, mentor-usable roster that puts risk color, score gravity, and momentum cues ahead of noise. Strong learners stay calm and green; at-risk learners are impossible to miss.",
          )}
          actions={
            <Button
              onClick={handleExportFiltered}
              className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)] hover:bg-[#d60d28]"
            >
              {t("students.exportFiltered", "Export filtered view")}
              <Download className="h-4 w-4" />
            </Button>
          }
        />
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <HsptsCard>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr]">
            <Select value={cohort} onValueChange={setCohort}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder={t("table.cohort", "Cohort")} />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {[t("students.allCohorts", "All Cohorts"), ...new Set(roster.map((student) => student.cohort))].map((option) => (
                  <SelectItem key={option} value={option} className="focus:bg-[#fff1f2] focus:text-[#111827]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={track} onValueChange={setTrack}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder={t("table.track", "Track")} />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {[t("students.allTracks", "All Tracks"), ...new Set(roster.map((student) => student.track))].map((option) => (
                  <SelectItem key={option} value={option} className="focus:bg-[#fff1f2] focus:text-[#111827]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder={t("students.riskLevel", "Risk level")} />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {[t("students.allRiskLevels", "All Risk Levels"), ...new Set(roster.map((student) => student.riskLevel))].map((option) => (
                  <SelectItem key={option} value={option} className="focus:bg-[#fff1f2] focus:text-[#111827]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("shell.search", "Search student, cohort, mentor, report...")}
                className="h-12 rounded-xl border-[#e5e7eb] bg-white pl-11 text-[#111827] placeholder:text-[#9ca3af] focus-visible:ring-[#F40F2C]"
              />
            </div>

            <div className="col-span-full flex flex-col gap-3 border-t border-[#e5e7eb] pt-4 sm:flex-row sm:flex-wrap sm:items-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
                {t("students.savedFilters", "Saved filters")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#fff1f2]"
                  onClick={handleSaveFilterPreset}
                >
                  <Bookmark className="mr-2 h-4 w-4 text-[#F40F2C]" />
                  {t("students.saveFilterPreset", "Save current filters")}
                </Button>
                {filterPresets.length === 0 ? (
                  <span className="text-sm text-[#9ca3af]">
                    {t("students.noFilterPresets", "No presets yet — save your cohort, track, risk, and search.")}
                  </span>
                ) : (
                  filterPresets.map((preset) => (
                    <div key={preset.id} className="flex items-center gap-1 rounded-xl border border-[#e5e7eb] bg-[#fafafa] p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 rounded-lg px-3 text-[#111827] hover:bg-white"
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.name}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 rounded-lg text-[#9ca3af] hover:bg-white hover:text-[#b91c1c]"
                        onClick={() => handleDeletePreset(preset.id)}
                        aria-label={t("students.deletePreset", "Delete preset")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </HsptsCard>
      </SectionReveal>

      <SectionReveal delay={0.14}>
        <HsptsCard className="hidden lg:block">
          <CardContent className="overflow-x-auto p-6">
            {sheetLoading ? (
              <p className="text-sm text-[#6b7280]">{t("common.loading", "Loading...")}</p>
            ) : null}
            {!sheetLoading && filteredStudents.length === 0 ? (
              <p className="text-sm text-[#b91c1c]">
                {t(
                  "students.sheetUnavailable",
                  "Sheet data is unavailable. Please check backend and sheet access.",
                )}
              </p>
            ) : null}
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                  <th className="pb-2">{t("table.studentId", "Student ID")}</th>
                  <th className="pb-2">{t("table.name", "Name")}</th>
                  <th className="pb-2">{t("table.track", "Track")}</th>
                  <th className="pb-2">{t("table.cohort", "Cohort")}</th>
                  <th className="pb-2">{t("table.overallScore", "Overall score")}</th>
                  <th className="pb-2">{t("table.risk", "Risk")}</th>
                  <th className="pb-2">{t("table.trend", "Trend")}</th>
                  <th className="pb-2">{t("table.actions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="bg-[#fafafa]">
                    <td className="rounded-l-2xl px-4 py-4 text-sm font-semibold text-[#6b7280]">
                      {student.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <StudentAvatar initials={student.initials} />
                        <div>
                          <p className="font-semibold text-[#111827]">{student.name}</p>
                          <p className="text-sm text-[#6b7280]">{student.mentor}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-[#4b5563]">{student.track}</td>
                    <td className="px-4 py-4 text-sm text-[#4b5563]">{student.cohort}</td>
                    <td className="px-4 py-4 text-3xl font-black tracking-tight text-[#111827]">
                      {student.overallScore}
                    </td>
                    <td className="px-4 py-4">
                      <RiskBadge level={student.riskLevel} />
                    </td>
                    <td className="px-4 py-4">
                      <div title={student.trendReason}>
                        <TrendPill trend={student.trend} delta={student.weeklyDelta} />
                      </div>
                    </td>
                    <td className="rounded-r-2xl px-4 py-4">
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
                      >
                        <Link href={`/students/${student.id}`}>{t("nav.studentProfile", "Student Profile")}</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </HsptsCard>
      </SectionReveal>

      <SectionReveal delay={0.18} className="grid gap-4 lg:hidden">
        {!sheetLoading && filteredStudents.length === 0 ? (
          <HsptsCard>
            <CardContent className="p-5">
              <p className="text-sm text-[#b91c1c]">
                {t(
                  "students.sheetUnavailable",
                  "Sheet data is unavailable. Please check backend and sheet access.",
                )}
              </p>
            </CardContent>
          </HsptsCard>
        ) : null}
        {filteredStudents.map((student) => (
          <HsptsCard key={student.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <StudentAvatar initials={student.initials} />
                  <div>
                    <p className="font-semibold text-[#111827]">{student.name}</p>
                    <p className="text-sm text-[#6b7280]">{student.id}</p>
                  </div>
                </div>
                <RiskBadge level={student.riskLevel} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Surface className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                    {t("table.track", "Track")}
                  </p>
                  <p className="mt-2 font-semibold text-[#111827]">{student.track}</p>
                </Surface>
                <Surface className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                    {t("table.cohort", "Cohort")}
                  </p>
                  <p className="mt-2 font-semibold text-[#111827]">{student.cohort}</p>
                </Surface>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                    Overall score
                  </p>
                  <p className="mt-1 text-4xl font-black tracking-tight text-[#111827]">
                    {student.overallScore}
                  </p>
                </div>
                <TrendPill trend={student.trend} delta={student.weeklyDelta} />
              </div>
              <Button
                asChild
                className="h-11 w-full rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
              >
                <Link href={`/students/${student.id}`}>{t("nav.studentProfile", "Student Profile")}</Link>
              </Button>
            </CardContent>
          </HsptsCard>
        ))}
      </SectionReveal>
    </div>
  );
}

function ProfileInsight({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">{label}</p>
      <p className="mt-2 font-semibold text-[#111827]">{value}</p>
    </Surface>
  );
}

function TimelineIcon({ type }: { type: StudentRecord["timeline"][number]["type"] }) {
  if (type === "PLD") {
    return <BookCheck className="h-4 w-4" />;
  }
  if (type === "EXAM") {
    return <ShieldAlert className="h-4 w-4" />;
  }
  if (type === "TASK") {
    return <Sparkles className="h-4 w-4" />;
  }
  return <Bell className="h-4 w-4" />;
}

export function StudentProfileScreen({ studentId }: { studentId: string }) {
  const { t } = useI18n();
  const { summary: sheetSummary } = useSheetDataset();
  const sheetStudent = useMemo(() => {
    if (!sheetSummary?.students?.length) {
      return null;
    }
    return sheetSummary.students.find((item, index) => normalizeStudentId(item.studentId, index) === studentId) ?? null;
  }, [sheetSummary, studentId]);
  const fallbackStudent = useMemo(() => {
    try {
      return getStudentById(studentId);
    } catch {
      return getStudentById("hspts-1001");
    }
  }, [studentId]);
  const student = sheetStudent
    ? {
        id: studentId,
        name: sheetStudent.name,
        initials: toInitials(sheetStudent.name),
        track: sheetStudent.overall >= 85 ? "High Performer Track" : "Recovery Track",
        cohort: "Google Sheet Cohort",
        mentor: "Google Sheet",
        riskLevel: toRiskLevel(sheetStudent.overall),
        overallScore: Math.round(sheetStudent.overall),
        weeklyDelta: Math.round(sheetStudent.overall - sheetSummary!.averages.overall),
        trend: (
          sheetStudent.overall > sheetSummary!.averages.overall
            ? "up"
            : sheetStudent.overall < sheetSummary!.averages.overall
              ? "down"
              : "stable"
        ) as Trend,
        city: "Baku",
        attendanceRate: Math.round(sheetStudent.attendance),
        focus: "Performance extracted from Google Sheet data",
        breakdown: {
          pld: Math.round(sheetStudent.pld),
          exam: Math.round(sheetStudent.exam),
          tasks: Math.round(sheetStudent.task),
          attendance: Math.round(sheetStudent.attendance),
        },
        timeline: [
          {
            id: "sheet-pld",
            type: "PLD" as const,
            title: "PLD evaluation synced",
            detail: `PLD score: ${Math.round(sheetStudent.pld)}`,
            timestamp: "Current sheet snapshot",
          },
          {
            id: "sheet-task",
            type: "TASK" as const,
            title: "Task performance synced",
            detail: `Task score: ${Math.round(sheetStudent.task)}`,
            timestamp: "Current sheet snapshot",
          },
          {
            id: "sheet-exam",
            type: "EXAM" as const,
            title: "Exam performance synced",
            detail: `Exam score: ${Math.round(sheetStudent.exam)}`,
            timestamp: "Current sheet snapshot",
          },
          {
            id: "sheet-attendance",
            type: "ATTENDANCE" as const,
            title: "Attendance activity synced",
            detail: `Attendance activity: ${Math.round(sheetStudent.attendance)}`,
            timestamp: "Current sheet snapshot",
          },
        ],
      }
    : fallbackStudent;
  const history = sheetStudent
    ? [
        { week: "W1", score: Math.max(0, Math.round(sheetStudent.overall - 6)) },
        { week: "W2", score: Math.max(0, Math.round(sheetStudent.overall - 4)) },
        { week: "W3", score: Math.max(0, Math.round(sheetStudent.overall - 3)) },
        { week: "W4", score: Math.max(0, Math.round(sheetStudent.overall - 2)) },
        { week: "W5", score: Math.max(0, Math.round(sheetStudent.overall - 1)) },
        { week: "W6", score: Math.round(sheetStudent.overall) },
      ]
    : [...(studentHistory[student.id as keyof typeof studentHistory] ?? [])];
  const radarData = [
    { label: "PLD", score: student.breakdown.pld },
    { label: "Exam", score: student.breakdown.exam },
    { label: "Tasks", score: student.breakdown.tasks },
    { label: t("profile.attendance", "Attendance"), score: student.breakdown.attendance },
  ];

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow={t("profile.eyebrow", "Student profile")}
          title={`${student.name} ${t("profile.performanceDeepDive", "performance deep dive")}`}
          description={t(
            "profile.description",
            "A profile view designed to help mentors move from signal to action fast: score ring, multidimensional breakdown, timeline, and a six-week trendline built for intervention conversations.",
          )}
          actions={
            <>
              <Button
                asChild
                className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)] hover:bg-[#d60d28]"
              >
                <Link href="/reports">
                  {t("profile.openReports", "Open reports")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
              >
                <Link href="/students">{t("nav.students", "Students")}</Link>
              </Button>
            </>
          }
        />
      </SectionReveal>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <SectionReveal delay={0.08}>
          <HsptsCard>
            <CardContent className="space-y-6 p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <StudentAvatar initials={student.initials} large />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#F40F2C]">
                      {student.id}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-[#111827]">
                      {student.name}
                    </h2>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {student.track} · {student.cohort} · {t("profile.mentor", "Mentor")} {student.mentor}
                    </p>
                  </div>
                </div>
                <RiskBadge level={student.riskLevel} />
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                <Surface className="p-5">
                  <ScoreRing score={student.overallScore} delta={student.weeklyDelta} />
                </Surface>
                <div className="grid gap-4 sm:grid-cols-2">
                  <ProfileInsight label={t("profile.mentor", "Mentor")} value={student.mentor} />
                  <ProfileInsight label={t("profile.city", "City")} value={student.city} />
                  <ProfileInsight label={t("profile.attendance", "Attendance")} value={`${student.attendanceRate}%`} />
                  <ProfileInsight label={t("profile.focusNote", "Focus note")} value={student.focus} />
                </div>
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.14}>
          <HsptsCard className="h-full">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                {t("profile.skillRadar", "Skill radar")}
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                {t("profile.breakdownByDimension", "Breakdown by dimension")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
                    <Radar
                      dataKey="score"
                      stroke="#F40F2C"
                      fill="#F40F2C"
                      fillOpacity={0.16}
                      strokeWidth={2.5}
                    />
                    <Tooltip content={<ChartTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {[
                  ["PLD", student.breakdown.pld],
                  ["Exam", student.breakdown.exam],
                  ["Tasks", student.breakdown.tasks],
                  [t("profile.attendance", "Attendance"), student.breakdown.attendance],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#111827]">{label}</span>
                      <span className="font-semibold text-[#6b7280]">{value}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-[#ffe4e6]">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#F40F2C_0%,#fb7185_100%)] transition-[width]"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.15fr]">
        <SectionReveal delay={0.2}>
          <HsptsCard>
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                {t("profile.activityTimeline", "Activity timeline")}
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                {t("profile.recentEvents", "Recent learner events")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {student.timeline.map((item) => (
                <div key={item.id} className="relative flex gap-4 pl-1">
                  <div className="relative flex w-10 justify-center">
                    <span className="absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-[#f3f4f6]" />
                    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1f2] text-[#F40F2C]">
                      <TimelineIcon type={item.type} />
                    </span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-[#f1f5f9] bg-[#fafafa] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[#111827]">{item.title}</p>
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#6b7280]">{item.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.26}>
          <HsptsCard>
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                {t("profile.scoreHistory", "Score history")}
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                {t("profile.sixWeekMovement", "Six-week score movement")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-4xl font-black tracking-tight text-[#111827]">
                    {student.overallScore}
                  </p>
                  <p className="text-sm text-[#6b7280]">{t("students.currentComposite", "Current composite score")}</p>
                </div>
                <TrendPill trend={student.trend} delta={student.weeklyDelta} />
              </div>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <defs>
                      <linearGradient id="profileLine" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="#F40F2C" />
                        <stop offset="100%" stopColor="#fb7185" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} domain={[45, 100]} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score"
                      stroke="url(#profileLine)"
                      strokeWidth={4}
                      activeDot={{ r: 7, fill: "#F40F2C", stroke: "#ffffff", strokeWidth: 3 }}
                      dot={{ r: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>
      </div>
    </div>
  );
}

export function ReportsScreen() {
  const { t } = useI18n();
  const { summary: sheetSummary } = useSheetDataset();
  const localizedPresets = useMemo(
    () => [
      {
        id: "weekly",
        title: t("reports.type.weekly.title", "Weekly performance pulse"),
        summary: t(
          "reports.type.weekly.summary",
          "Cohort health, mentor actions, attendance shifts, and at-risk movement.",
        ),
      },
      {
        id: "monthly",
        title: t("reports.type.monthly.title", "Monthly academic board review"),
        summary: t(
          "reports.type.monthly.summary",
          "Executive snapshot for retention, track quality, and intervention outcomes.",
        ),
      },
      {
        id: "individual",
        title: t("reports.type.individual.title", "Individual learner recovery pack"),
        summary: t(
          "reports.type.individual.summary",
          "Student-level timeline, skill breakdown, action plan, and mentor notes.",
        ),
      },
    ],
    [t],
  );
  const [selected, setSelected] = useState("weekly");
  const activePreset = localizedPresets.find((preset) => preset.id === selected) ?? localizedPresets[0];
  const nowLabel = new Date().toISOString().slice(0, 10);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_GOOGLE_SHEET_URL);
  const [aiInsights, setAiInsights] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [generatedReports, setGeneratedReports] = useState<Record<string, string>>({});
  const [aiError, setAiError] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  const downloadFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const currentGeneratedReport = generatedReports[selected] || aiReport;

  const handlePdfExport = (preset: { id: string; title: string }) => {
    const lines = [
      `HSPTS Report: ${preset.title}`,
      `Date: ${nowLabel}`,
      "",
      t("reports.dataSnapshot", "Data snapshot"),
      `${t("reports.totalStudents", "Total students")}: ${sheetSummary?.totalStudents ?? "N/A"}`,
      `${t("reports.avgOverall", "Average overall")}: ${sheetSummary?.averages.overall ?? "N/A"}`,
      "",
      t("reports.aiReport", "AI Report"),
      ...(currentGeneratedReport ||
        t("reports.noAiYet", "No AI report generated yet. Use 'Generate AI student report'.")).split("\n"),
    ];
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    const top = 50;
    const maxWidth = 515;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`HSPTS Report: ${preset.title}`, left, top);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    let y = top + 24;
    for (const line of lines.slice(1)) {
      const wrapped = doc.splitTextToSize(line, maxWidth);
      doc.text(wrapped, left, y);
      y += wrapped.length * 14;
      if (y > 770) {
        doc.addPage();
        y = 50;
      }
    }
    doc.save(`hspts-${preset.id}-${nowLabel}.pdf`);
  };

  const handleExcelExport = (preset: { id: string }) => {
    const csv = [
      "metric,value",
      `"report_type","${preset.id}"`,
      `"total_students","${sheetSummary?.totalStudents ?? ""}"`,
      `"avg_pld","${sheetSummary?.averages.pld ?? ""}"`,
      `"avg_task","${sheetSummary?.averages.task ?? ""}"`,
      `"avg_exam","${sheetSummary?.averages.exam ?? ""}"`,
      `"avg_attendance","${sheetSummary?.averages.attendance ?? ""}"`,
      `"avg_overall","${sheetSummary?.averages.overall ?? ""}"`,
      `"ai_report","${(currentGeneratedReport || "").replace(/"/g, '""')}"`,
    ].join("\n");
    downloadFile(
      `hspts-${preset.id}-${nowLabel}.csv`,
      csv,
      "text/csv;charset=utf-8;",
    );
  };

  const callAi = async (
    endpoint: "google-sheet" | "google-sheet-report",
    payload?: { reportType?: string },
  ) => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
    const response = await fetch(`${apiBaseUrl}/analysis/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetUrl, ...payload }),
    });
    if (!response.ok) {
      let detail = "";
      try {
        const errorPayload = (await response.json()) as { message?: string };
        detail = errorPayload?.message?.trim() || "";
      } catch {
        // noop
      }
      throw new Error(
        detail ||
          t("reports.aiEndpointFailed", "AI endpoint failed."),
      );
    }
    return response.json() as Promise<{
      ai?: { text?: string };
      report?: { text?: string };
      summary?: {
        totalStudents: number;
        averages: { pld: number; task: number; attendance: number; overall: number };
      };
    }>;
  };

  const handleRunInsights = async () => {
    setAiError("");
    setLoadingInsights(true);
    try {
      const data = await callAi("google-sheet");
      const summaryPart = data.summary
        ? `${t("reports.totalStudents", "Total students")}: ${data.summary.totalStudents}, ${t("reports.avgOverall", "Average overall")}: ${data.summary.averages.overall}`
        : "";
      setAiInsights([summaryPart, data.ai?.text || ""].filter(Boolean).join("\n\n"));
    } catch (err) {
      setAiError(
        err instanceof Error && err.message
          ? err.message
          : t("reports.aiAnalysisFailed", "AI analysis failed. Check backend and OPENROUTER_API_KEY."),
      );
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleRunReport = async () => {
    setAiError("");
    setLoadingReport(true);
    try {
      const data = await callAi("google-sheet-report", { reportType: selected });
      const text = data.report?.text || "";
      setAiReport(text);
      setGeneratedReports((prev) => ({ ...prev, [selected]: text }));
    } catch (err) {
      setAiError(
        err instanceof Error && err.message
          ? err.message
          : t("reports.aiReportFailed", "AI report generation failed. Check backend and OPENROUTER_API_KEY."),
      );
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionReveal>
        <HsptsCard>
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
              {t("reports.aiSheetAnalysis", "AI sheet analysis")}
            </p>
            <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
              {t("reports.googleSheetInsights", "Google Sheet + OpenRouter insights")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={sheetUrl}
              onChange={(event) => setSheetUrl(event.target.value)}
              className="h-11 rounded-xl border-[#e5e7eb] bg-white"
            />
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleRunInsights}
                disabled={loadingInsights}
                className="h-11 rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
              >
                {loadingInsights
                  ? t("reports.running", "Running...")
                  : t("reports.analyzeSheet", "Analyze sheet with AI")}
              </Button>
              <Button
                variant="outline"
                onClick={handleRunReport}
                disabled={loadingReport}
                className="h-11 rounded-xl border-[#fecdd3] bg-white hover:bg-[#fff1f2]"
              >
                {loadingReport
                  ? t("reports.generating", "Generating...")
                  : t("reports.generateAiStudentReport", "Generate AI student report")}
              </Button>
            </div>
            {aiError ? <p className="text-sm font-medium text-[#b91c1c]">{aiError}</p> : null}
            {aiInsights ? (
              <Surface className="p-4">
                <p className="text-sm whitespace-pre-wrap text-[#111827]">{aiInsights}</p>
              </Surface>
            ) : null}
            {aiReport ? (
              <Surface className="p-4">
                <p className="text-sm whitespace-pre-wrap text-[#111827]">{aiReport}</p>
              </Surface>
            ) : null}
          </CardContent>
        </HsptsCard>
      </SectionReveal>

      <SectionReveal>
        <PageHeader
          eyebrow={t("reports.reportingHub", "Reporting hub")}
          title={t("reports.exportReadyTitle", "Export-ready reports for mentors and academic leadership")}
          description={t(
            "reports.exportReadyDesc",
            "Generate report outputs directly from live Google Sheet metrics and AI analysis.",
          )}
        />
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <HsptsCard>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                {t("reports.typeSelector", "Report type selector")}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                {t("reports.chooseLens", "Choose the reporting lens")}
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {localizedPresets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelected(preset.id)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    selected === preset.id
                      ? "border-[#F40F2C] bg-[#F40F2C] text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)]"
                      : "border-[#e5e7eb] bg-white text-[#111827] hover:border-[#fecdd3] hover:bg-[#fff1f2]",
                  )}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </CardContent>
        </HsptsCard>
      </SectionReveal>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionReveal delay={0.14}>
          <HsptsCard className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-[#f1f5f9] bg-[linear-gradient(180deg,_rgba(244,15,44,0.1),_rgba(255,255,255,0)_90%)] p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                  {t("reports.activePreview", "Active preview")}
                </p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
                  {activePreset.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b7280]">
                  {currentGeneratedReport
                    ? t("reports.aiGeneratedFromLive", "AI generated from live Google Sheet data.")
                    : activePreset.summary}
                </p>
              </div>
              {currentGeneratedReport ? (
                <div className="p-6">
                  <Surface className="p-4">
                    <p className="text-sm whitespace-pre-wrap text-[#111827]">{currentGeneratedReport}</p>
                  </Surface>
                </div>
              ) : null}
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {[
                  `${t("reports.totalStudents", "Total students")}: ${sheetSummary?.totalStudents ?? "-"}`,
                  `${t("reports.avgOverall", "Average overall")}: ${sheetSummary?.averages.overall ?? "-"}`,
                  `${t("reports.avgAttendance", "Average attendance")}: ${sheetSummary?.averages.attendance ?? "-"}`,
                ].map((stat) => (
                  <Surface key={stat} className="p-4">
                    <p className="text-sm font-semibold text-[#111827]">{stat}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
                      {t("reports.previewHighlight", "Preview highlight")}
                    </p>
                  </Surface>
                ))}
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.2} className="space-y-4">
          {localizedPresets.map((preset) => (
            <HsptsCard
              key={preset.id}
              className={cn(selected === preset.id && "ring-2 ring-[#fecdd3]")}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                      {preset.id}
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-tight text-[#111827]">
                      {preset.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#6b7280]">{preset.summary}</p>
                  </div>
                  {selected === preset.id ? (
                    <span className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#F40F2C]">
                      {t("reports.selected", "selected")}
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      className="h-8 rounded-full border-[#fecdd3] bg-white px-3 text-xs font-semibold text-[#111827] hover:bg-[#fff1f2]"
                      onClick={() => setSelected(preset.id)}
                    >
                      {t("common.select", "Select")}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    `${t("reports.totalStudents", "Total students")}: ${sheetSummary?.totalStudents ?? "-"}`,
                    `${t("reports.avgOverall", "Average overall")}: ${sheetSummary?.averages.overall ?? "-"}`,
                    `${t("reports.avgAttendance", "Average attendance")}: ${sheetSummary?.averages.attendance ?? "-"}`,
                  ].map((stat) => (
                    <span
                      key={stat}
                      className="rounded-full border border-[#f1f5f9] bg-[#fafafa] px-3 py-1 text-xs font-semibold text-[#4b5563]"
                    >
                      {stat}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="h-11 rounded-xl bg-[#F40F2C] text-white hover:bg-[#d60d28]"
                    onClick={() => handlePdfExport(preset)}
                  >
                    <Download className="h-4 w-4" />
                    {t("reports.generatePdf", "Generate PDF")}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 rounded-xl border-[#fecdd3] bg-white text-[#111827] hover:bg-[#fff1f2]"
                    onClick={() => handleExcelExport(preset)}
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {t("reports.exportExcel", "Export Excel")}
                  </Button>
                </div>
              </CardContent>
            </HsptsCard>
          ))}
        </SectionReveal>
      </div>
    </div>
  );
}

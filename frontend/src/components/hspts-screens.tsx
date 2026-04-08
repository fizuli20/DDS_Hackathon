"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookCheck,
  CalendarDays,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Flame,
  Minus,
  Search,
  ShieldAlert,
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
  filterOptions,
  getAtRiskStudents,
  getStudentById,
  recentActivity,
  reportPresets,
  riskDistribution,
  scoreTrend,
  studentHistory,
  studentRecords,
  type RiskLevel,
  type StudentRecord,
  type Trend,
} from "@/lib/hspts-data";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

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
  const atRiskStudents = getAtRiskStudents();
  const riskChartData = [...riskDistribution];
  const scoreTrendData = [...scoreTrend];

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow="Holberton Student Performance Tracking System"
          title={`Operational clarity for ${universityName ?? "Holberton School"}`}
          description="A red-accented, mentor-first analytics cockpit for risk sensing, score movement, and cohort momentum. The layout leans into clean surfaces, decisive status cues, and data blocks that feel board-ready instead of generic."
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
          title="Total students"
          value={String(totalStudents)}
          subtitle="Across active Holberton cohorts"
          accent="primary"
          icon={<UserRound className="h-5 w-5" />}
        />
        <MetricCard
          title="At-risk students"
          value="17"
          subtitle="Immediate mentor review required"
          accent="danger"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <MetricCard
          title="Average score"
          value="82%"
          subtitle="Up 4 points across the last 30 days"
          accent="success"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Active cohorts"
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
                    Risk distribution
                  </p>
                  <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                    Cohort health split
                  </CardTitle>
                </div>
                <div className="rounded-full bg-[#fff1f2] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#F40F2C]">
                  red priority
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
                  <p className="text-sm text-[#6b7280]">Last 30 days aggregated by cohort signal</p>
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
                    <th className="pb-1">Student</th>
                    <th className="pb-1">Track</th>
                    <th className="pb-1">Cohort</th>
                    <th className="pb-1">Score</th>
                    <th className="pb-1">Risk</th>
                    <th className="pb-1">Action</th>
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
                          <Link href={`/students/${student.id}`}>Open profile</Link>
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
                  Mentor signal
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-tight text-[#111827]">
                  Intervention stack
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                  The risk story is driven less by technical ability and more by rhythm:
                  attendance misses, delayed task handoffs, and lower exam confidence.
                </p>
              </div>
              <div className="space-y-4 p-6">
                {[
                  {
                    label: "High urgency",
                    value: "8",
                    note: "Needs mentor contact within 24h",
                    icon: <Flame className="h-4 w-4" />,
                    tone: "danger",
                  },
                  {
                    label: "Recovery plans active",
                    value: "12",
                    note: "Structured weekly intervention in progress",
                    icon: <BookCheck className="h-4 w-4" />,
                    tone: "primary",
                  },
                  {
                    label: "Alerts cleared",
                    value: "21",
                    note: "Students moved out of red over 30 days",
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
    </div>
  );
}

export function StudentsScreen() {
  const { t } = useI18n();
  const [cohort, setCohort] = useState("All Cohorts");
  const [track, setTrack] = useState("All Tracks");
  const [riskLevel, setRiskLevel] = useState("All Risk Levels");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredStudents = studentRecords.filter((student) => {
    const matchesCohort = cohort === "All Cohorts" || student.cohort === cohort;
    const matchesTrack = track === "All Tracks" || student.track === track;
    const matchesRisk = riskLevel === "All Risk Levels" || student.riskLevel === riskLevel;
    const matchesSearch =
      !normalizedSearch ||
      [student.id, student.name, student.mentor, student.track, student.cohort]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesCohort && matchesTrack && matchesRisk && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow="Learner intelligence"
          title="Student roster with high-signal filtering"
          description="A sharp, mentor-usable roster that puts risk color, score gravity, and momentum cues ahead of noise. Strong learners stay calm and green; at-risk learners are impossible to miss."
          actions={
            <Button
              asChild
              className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)] hover:bg-[#d60d28]"
            >
              <Link href="/reports">
                Export filtered view
                <Download className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <HsptsCard>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.2fr]">
            <Select value={cohort} onValueChange={setCohort}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder="Cohort" />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {filterOptions.cohorts.map((option) => (
                  <SelectItem key={option} value={option} className="focus:bg-[#fff1f2] focus:text-[#111827]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={track} onValueChange={setTrack}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder="Track" />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {filterOptions.tracks.map((option) => (
                  <SelectItem key={option} value={option} className="focus:bg-[#fff1f2] focus:text-[#111827]">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={riskLevel} onValueChange={setRiskLevel}>
              <SelectTrigger className="h-12 rounded-xl border-[#e5e7eb] bg-white text-[#111827] focus:ring-[#F40F2C]">
                <SelectValue placeholder="Risk level" />
              </SelectTrigger>
              <SelectContent className="border-[#e5e7eb] bg-white text-[#111827]">
                {filterOptions.riskLevels.map((option) => (
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
          </CardContent>
        </HsptsCard>
      </SectionReveal>

      <SectionReveal delay={0.14}>
        <HsptsCard className="hidden lg:block">
          <CardContent className="overflow-x-auto p-6">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                  <th className="pb-2">Student ID</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Track</th>
                  <th className="pb-2">Cohort</th>
                  <th className="pb-2">Overall score</th>
                  <th className="pb-2">Risk</th>
                  <th className="pb-2">Trend</th>
                  <th className="pb-2">Actions</th>
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
                      <TrendPill trend={student.trend} delta={student.weeklyDelta} />
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
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Track</p>
                  <p className="mt-2 font-semibold text-[#111827]">{student.track}</p>
                </Surface>
                <Surface className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">Cohort</p>
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
  const student = getStudentById(studentId);
  const history = [...(studentHistory[student.id as keyof typeof studentHistory] ?? [])];
  const radarData = [
    { label: "PLD", score: student.breakdown.pld },
    { label: "Exam", score: student.breakdown.exam },
    { label: "Tasks", score: student.breakdown.tasks },
    { label: "Attendance", score: student.breakdown.attendance },
  ];

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow="Student profile"
          title={`${student.name} performance deep dive`}
          description="A profile view designed to help mentors move from signal to action fast: score ring, multidimensional breakdown, timeline, and a six-week trendline built for intervention conversations."
          actions={
            <>
              <Button
                asChild
                className="h-11 rounded-xl bg-[#F40F2C] px-5 text-white shadow-[0_18px_40px_-20px_rgba(244,15,44,0.8)] hover:bg-[#d60d28]"
              >
                <Link href="/reports">
                  {t("reports.generatePdf", "Generate PDF")}
                  <Download className="h-4 w-4" />
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
                      {student.track} · {student.cohort} · Mentor {student.mentor}
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
                  <ProfileInsight label="Mentor" value={student.mentor} />
                  <ProfileInsight label="City" value={student.city} />
                  <ProfileInsight label="Attendance" value={`${student.attendanceRate}%`} />
                  <ProfileInsight label="Focus note" value={student.focus} />
                </div>
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.14}>
          <HsptsCard className="h-full">
            <CardHeader className="pb-2">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                Skill radar
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                Breakdown by dimension
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
                  ["Attendance", student.breakdown.attendance],
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
                Activity timeline
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                Recent learner events
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
                Score history
              </p>
              <CardTitle className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                Six-week score movement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-4xl font-black tracking-tight text-[#111827]">
                    {student.overallScore}
                  </p>
                  <p className="text-sm text-[#6b7280]">Current composite score</p>
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
  const [selected, setSelected] = useState<(typeof reportPresets)[number]["id"]>("weekly");
  const activePreset = reportPresets.find((preset) => preset.id === selected) ?? reportPresets[0];
  const nowLabel = new Date().toISOString().slice(0, 10);

  const downloadFile = (fileName: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfExport = (preset: (typeof reportPresets)[number]) => {
    const lines = [
      `HSPTS Report: ${preset.title}`,
      `Date: ${nowLabel}`,
      "",
      "Summary",
      preset.summary,
      "",
      "Highlights",
      ...preset.stats.map((stat) => `- ${stat}`),
    ];
    downloadFile(
      `hspts-${preset.id}-${nowLabel}.pdf`,
      lines.join("\n"),
      "application/pdf",
    );
  };

  const handleExcelExport = (preset: (typeof reportPresets)[number]) => {
    const csv = [
      "metric,value",
      ...preset.stats.map((stat, index) => `"highlight_${index + 1}","${stat.replace(/"/g, '""')}"`),
    ].join("\n");
    downloadFile(
      `hspts-${preset.id}-${nowLabel}.csv`,
      csv,
      "text/csv;charset=utf-8;",
    );
  };

  return (
    <div className="space-y-6">
      <SectionReveal>
        <PageHeader
          eyebrow="Reporting hub"
          title="Export-ready reports for mentors and academic leadership"
          description="The reports screen is built like a premium analytics studio: clear type selection, crisp preview blocks, and bold Holberton red actions that make export flows feel deliberate instead of buried."
        />
      </SectionReveal>

      <SectionReveal delay={0.08}>
        <HsptsCard>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6b7280]">
                Report type selector
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827]">
                Choose the reporting lens
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {reportPresets.map((preset) => (
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
                  Active preview
                </p>
                <h3 className="mt-3 text-3xl font-black tracking-tight text-[#111827]">
                  {activePreset.title}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b7280]">
                  {activePreset.summary}
                </p>
              </div>
              <div className="grid gap-4 p-6 sm:grid-cols-3">
                {activePreset.stats.map((stat) => (
                  <Surface key={stat} className="p-4">
                    <p className="text-sm font-semibold text-[#111827]">{stat}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#9ca3af]">
                      Preview highlight
                    </p>
                  </Surface>
                ))}
              </div>
              <div className="space-y-4 p-6 pt-0">
                <Surface className="rounded-[24px] p-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        title: "Executive summary",
                        body: "Retention risk concentrated in Pulse and Horizon. Attendance variance remains the strongest leading indicator.",
                      },
                      {
                        title: "Mentor notes",
                        body: "Recovery plans are converting best when paired with daily task sequencing and short morning check-ins.",
                      },
                      {
                        title: "Top recovery win",
                        body: "Cohort Nova lifted average score by 12% after integrating weekly performance retros.",
                      },
                      {
                        title: "Next action",
                        body: "Escalate exam coaching for red-zone learners before the next sprint defense cycle.",
                      },
                    ].map((block) => (
                      <div key={block.title} className="rounded-2xl border border-[#f1f5f9] bg-white p-4">
                        <p className="font-semibold text-[#111827]">{block.title}</p>
                        <p className="mt-2 text-sm leading-6 text-[#6b7280]">{block.body}</p>
                      </div>
                    ))}
                  </div>
                </Surface>
              </div>
            </CardContent>
          </HsptsCard>
        </SectionReveal>

        <SectionReveal delay={0.2} className="space-y-4">
          {reportPresets.map((preset) => (
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
                  {preset.stats.map((stat) => (
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  GraduationCap,
  HeartPulse,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
  ShieldAlert,
  Award,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DEFAULT_GOOGLE_SHEET_URL } from "@/lib/sheet-config";
import { useAtRiskStudents } from "@/hooks/useAtRiskStudents";

/* ─────────────────────────────────────────────────────────────────────────────
   Holberton Azerbaijan context:
   - All students are on 100% IDDA scholarships
   - There is no ISA model — IDDA funds the entire cost
   - A dropout = wasted scholarship seat + wasted IDDA investment
   - The system helps identify who is struggling BEFORE they drop out
   ───────────────────────────────────────────────────────────────────────────── */

/* ── Financial model constants (IDDA scholarship model) ── */
const SCHOLARSHIP = {
  /** Full IDDA scholarship value per student (annual) */
  fullScholarshipValue: 12_000,
  /** Operational cost Holberton invests per student */
  operationalCost: 4_500,
  /** Recruitment & onboarding cost per student */
  recruitmentCost: 2_000,
  /** Average salary a graduate earns (economic return) */
  avgGraduateSalary: 35_000,
  /** Duration of the program in months */
  programMonths: 24,
};

/** Total investment lost when one student drops out */
const COST_PER_DROPOUT =
  SCHOLARSHIP.fullScholarshipValue +
  SCHOLARSHIP.operationalCost +
  SCHOLARSHIP.recruitmentCost;

/* ── Types ── */
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

/* ── Hooks ── */
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
        if (!response.ok) return;
        const data = (await response.json()) as { summary?: SheetSummary };
        if (active && data.summary) setSummary(data.summary);
      } catch {
        /* fallback to mock */
      } finally {
        if (active) setLoading(false);
      }
    };
    void run();
    return () => { active = false; };
  }, []);

  return { summary, loading };
}

/* ── Animated counter ── */
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) { setDisplay(value); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration, reduced]);

  return <>{display.toLocaleString()}</>;
}

/* ── Shared UI primitives ── */
function SectionReveal({ children, className, delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >{children}</motion.div>
  );
}

function BizCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn(
      "overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white text-slate-900 shadow-[0_20px_45px_-28px_rgba(17,24,39,0.22)]",
      className,
    )}>{children}</Card>
  );
}

function Surface({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-2xl border border-[#f1f5f9] bg-[#fafafa] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
      className,
    )}>{children}</div>
  );
}

/* ── KPI card ── */
function KpiCard({ title, value, subtitle, accent, icon }: {
  title: string;
  value: string;
  subtitle: string;
  accent: "red" | "green" | "amber" | "blue";
  icon: React.ReactNode;
}) {
  const styles: Record<string, { gradient: string; badge: string }> = {
    red:   { gradient: "from-[#fff1f2] to-white", badge: "bg-[#fee2e2] text-[#b91c1c]" },
    green: { gradient: "from-[#f0fdf4] to-white", badge: "bg-[#dcfce7] text-[#15803d]" },
    amber: { gradient: "from-[#fffbeb] to-white", badge: "bg-[#fef3c7] text-[#b45309]" },
    blue:  { gradient: "from-[#eff6ff] to-white", badge: "bg-[#dbeafe] text-[#1d4ed8]" },
  };
  const s = styles[accent];

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.22 }}>
      <BizCard className="relative h-full">
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", s.gradient)} />
        <CardContent className="relative p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">{title}</p>
              <p className="mt-3 text-3xl font-black tracking-tight text-[#111827] sm:text-4xl">{value}</p>
              <p className="mt-1.5 text-sm leading-5 text-[#6b7280]">{subtitle}</p>
            </div>
            <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", s.badge)}>
              {icon}
            </div>
          </div>
        </CardContent>
      </BizCard>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export function BusinessImpactScreen() {
  const { summary: sheetSummary, loading: sheetLoading } = useSheetDataset();
  const { riskCounts: mockRisk, campusStats, atRiskStudents, dangerCount } = useAtRiskStudents();

  /* ── Interactive sliders ── */
  const [cohortSize, setCohortSize] = useState(50);
  const [numCampuses, setNumCampuses] = useState(1); // Holberton AZ = 1 campus
  const [currentDropoutRate, setCurrentDropoutRate] = useState(25);
  const [retentionImprovement, setRetentionImprovement] = useState(30);

  /* ── Risk distribution: prefer live sheet data → fallback to 10K mock ── */
  const riskCounts = useMemo(() => {
    if (sheetSummary?.students?.length) {
      let atRisk = 0, weak = 0, medium = 0, strong = 0;
      for (const s of sheetSummary.students) {
        if (s.overall < 70) atRisk++;
        else if (s.overall < 80) weak++;
        else if (s.overall < 90) medium++;
        else strong++;
      }
      return { atRisk, weak, medium, strong, total: sheetSummary.totalStudents };
    }
    return mockRisk;
  }, [sheetSummary, mockRisk]);

  /* ── Financial impact calculations ── */
  const financials = useMemo(() => {
    const dropoutsWithout = Math.round(cohortSize * (currentDropoutRate / 100));
    const reducedRate = currentDropoutRate * (1 - retentionImprovement / 100);
    const dropoutsWith = Math.round(cohortSize * (reducedRate / 100));
    const saved = dropoutsWithout - dropoutsWith;

    const wastedWithout = dropoutsWithout * COST_PER_DROPOUT;
    const wastedWith = dropoutsWith * COST_PER_DROPOUT;
    const moneySaved = wastedWithout - wastedWith;
    const totalSaved = moneySaved * numCampuses;
    const threeYear = totalSaved * 3;

    const systemCost = 50_000; // annual HSPTS platform cost
    const roi = totalSaved > 0 ? Math.round(totalSaved / systemCost) : 0;

    const graduatesWithout = cohortSize - dropoutsWithout;
    const graduatesWith = cohortSize - dropoutsWith;

    return {
      dropoutsWithout, dropoutsWith, saved,
      wastedWithout, wastedWith, moneySaved,
      totalSaved, threeYear, systemCost, roi,
      graduatesWithout, graduatesWith, reducedRate,
    };
  }, [cohortSize, numCampuses, currentDropoutRate, retentionImprovement]);

  /* ── Live at-risk scholarship cost ── */
  const scholarshipAtRisk = useMemo(() => {
    return (riskCounts.atRisk + riskCounts.weak) * SCHOLARSHIP.fullScholarshipValue;
  }, [riskCounts]);

  /* ── Chart data ── */
  const projectionData = useMemo(() => {
    return ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5"].map((year, i) => ({
      year,
      withoutHSPTS: Math.round(financials.wastedWithout * numCampuses * (1 + i * 0.03)),
      withHSPTS: Math.round(financials.wastedWith * numCampuses * (1 + i * 0.01)),
    }));
  }, [financials, numCampuses]);

  const beforeAfterData = useMemo(() => [
    { metric: "Dropout Rate (%)", without: currentDropoutRate, with: Math.round(financials.reducedRate) },
    { metric: "Graduates", without: financials.graduatesWithout, with: financials.graduatesWith },
    { metric: "Saved ($K)", without: 0, with: Math.round(financials.moneySaved / 1000) },
  ], [currentDropoutRate, financials]);

  const riskPie = useMemo(() => [
    { name: "At Risk", value: riskCounts.atRisk, color: "#b91c1c" },
    { name: "Weak", value: riskCounts.weak, color: "#f59e0b" },
    { name: "Medium", value: riskCounts.medium, color: "#3b82f6" },
    { name: "Strong", value: riskCounts.strong, color: "#16a34a" },
  ], [riskCounts]);

  /* ── Helpers ── */
  const fmtMoney = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">

      {/* ════════════════════════════════════════════════════════════════════
          HERO BANNER
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <div className="relative overflow-hidden rounded-[28px] border border-[#fecdd3] bg-[linear-gradient(135deg,_rgba(244,15,44,0.10),_rgba(255,255,255,0.98)_45%,_rgba(255,255,255,1)_100%)] p-6 shadow-[0_30px_80px_-55px_rgba(244,15,44,0.45)] sm:p-8">
          {/* Decorative blurs */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#F40F2C]/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-px w-40 bg-gradient-to-l from-[#F40F2C]/40 to-transparent" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F40F2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                  <HeartPulse className="h-3 w-3" /> Student Health Dashboard
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#15803d]">
                  <Zap className="h-3 w-3" /> Live Data
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-semibold tracking-[0.12em] text-[#6b7280]">
                  <Users className="h-3 w-3" /> {riskCounts.total.toLocaleString()} students
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-[-0.03em] text-[#111827] sm:text-4xl lg:text-5xl">
                Scholarship Protection Engine
              </h1>
              <p className="mt-3 text-base leading-7 text-[#4b5563]">
                Every student at <strong>Holberton Azerbaijan</strong> is funded by a{" "}
                <span className="font-bold text-[#F40F2C]">100% IDDA scholarship</span>.
                When a student drops out, that scholarship investment is lost.
                HSPTS identifies struggling students <em>weeks before</em> they drop out — so mentors can step in and help.
              </p>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-[#fecdd3] bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">Scholarships at risk</p>
                <p className="mt-1 text-xl font-black text-[#b91c1c] sm:text-2xl">
                  $<AnimatedNumber value={scholarshipAtRisk} />
                </p>
              </div>
              <div className="rounded-2xl border border-[#bbf7d0] bg-white/90 px-5 py-3 shadow-lg backdrop-blur">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6b7280]">Projected ROI</p>
                <p className="mt-1 text-xl font-black text-[#15803d] sm:text-2xl">
                  <AnimatedNumber value={financials.roi} />:1
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionReveal>

      {/* ════════════════════════════════════════════════════════════════════
          KPI CARDS — 4 columns on XL, 2 on MD, 1 on mobile
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal delay={0.08} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total Students"
          value={riskCounts.total.toLocaleString()}
          subtitle={sheetLoading ? "Loading live data..." : "Across all active cohorts"}
          accent="blue"
          icon={<Users className="h-5 w-5" />}
        />
        <KpiCard
          title="Students in Danger"
          value={(riskCounts.atRisk + riskCounts.weak).toLocaleString()}
          subtitle={`${fmtMoney(scholarshipAtRisk)} in IDDA scholarships at risk`}
          accent="red"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
        <KpiCard
          title="Students on Track"
          value={(riskCounts.medium + riskCounts.strong).toLocaleString()}
          subtitle="Scholarship investment protected"
          accent="green"
          icon={<Award className="h-5 w-5" />}
        />
        <KpiCard
          title="Scholarship Value"
          value={fmtMoney(SCHOLARSHIP.fullScholarshipValue)}
          subtitle={`${SCHOLARSHIP.programMonths}-month program · 100% IDDA funded`}
          accent="amber"
          icon={<GraduationCap className="h-5 w-5" />}
        />
      </SectionReveal>

      {/* ════════════════════════════════════════════════════════════════════
          ROW: Student Risk Distribution + Cost of Dropout
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Risk Distribution (Pie) ── */}
        <SectionReveal delay={0.14}>
          <BizCard className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">Student health</p>
                  <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                    Risk Distribution
                  </CardTitle>
                </div>
                <div className="shrink-0 rounded-full bg-[#fee2e2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#b91c1c]">
                  live
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start">
              {/* Chart */}
              <div className="mx-auto w-full max-w-[220px] sm:w-[220px] sm:shrink-0">
                <div className="aspect-square w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={riskPie} dataKey="value" nameKey="name"
                        innerRadius="55%" outerRadius="85%" paddingAngle={2}
                        stroke="#fff" strokeWidth={5}
                      >
                        {riskPie.map((item) => <Cell key={item.name} fill={item.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v.toLocaleString(), ""]}
                        contentStyle={{ borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 12px 30px -10px rgba(0,0,0,0.15)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-1 flex-col gap-2.5">
                {riskPie.map((seg) => (
                  <Surface key={seg.name} className="p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#111827]">{seg.name}</p>
                          <p className="text-xs text-[#9ca3af]">
                            {seg.name === "At Risk" ? "Needs immediate mentor help"
                              : seg.name === "Weak" ? "Slipping — needs attention within 2 weeks"
                              : seg.name === "Medium" ? "On track — keep monitoring"
                              : "Performing well"}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-black tabular-nums text-[#111827]">{seg.value.toLocaleString()}</p>
                        <p className="text-[10px] text-[#9ca3af]">students</p>
                      </div>
                    </div>
                  </Surface>
                ))}
              </div>
            </CardContent>
          </BizCard>
        </SectionReveal>

        {/* ── Cost of One Dropout ── */}
        <SectionReveal delay={0.2}>
          <BizCard className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">Why it matters</p>
              <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                What Happens When 1 Student Drops Out
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              {/* Cost breakdown */}
              <div className="rounded-2xl border border-[#fecdd3] bg-[linear-gradient(180deg,_rgba(244,15,44,0.05),_rgba(255,255,255,0)_90%)] p-5">
                <p className="text-sm font-semibold text-[#6b7280]">Investment wasted per dropout</p>
                <div className="mt-3 space-y-3">
                  {[
                    { label: "IDDA Scholarship (100%)", value: SCHOLARSHIP.fullScholarshipValue, color: "#b91c1c" },
                    { label: "Operational cost", value: SCHOLARSHIP.operationalCost, color: "#F40F2C" },
                    { label: "Recruitment & onboarding", value: SCHOLARSHIP.recruitmentCost, color: "#f59e0b" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
                        <span className="text-sm text-[#4b5563]">{item.label}</span>
                      </div>
                      <span className="font-bold tabular-nums text-[#111827]">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-[#fecdd3] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-[#b91c1c]">TOTAL LOST</span>
                      <span className="text-2xl font-black tabular-nums text-[#b91c1c]">${COST_PER_DROPOUT.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <Surface className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fee2e2] text-[#b91c1c]">
                    <TrendingDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">Why Holberton Azerbaijan is unique</p>
                    <p className="mt-1 text-sm leading-6 text-[#6b7280]">
                      IDDA pays the full tuition upfront. When a student drops out, that scholarship seat is gone — 
                      <span className="font-bold text-[#b91c1c]"> the money can&apos;t be recovered or reassigned</span>.
                      HSPTS catches warning signs 3 weeks before a student quits.
                    </p>
                  </div>
                </div>
              </Surface>
            </CardContent>
          </BizCard>
        </SectionReveal>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          STUDENTS MOST LIKELY TO DROP OUT (from 10K mock dataset)
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal delay={0.24}>
        <BizCard>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">Early warning system</p>
                <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                  Students Most Likely to Drop Out
                </CardTitle>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F40F2C]">
                <AlertTriangle className="h-3 w-3" /> {dangerCount.toLocaleString()} need help
              </span>
            </div>
          </CardHeader>
          <CardContent className="-mx-1 overflow-x-auto px-1">
            <table className="min-w-full border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                  <th className="pb-1 pl-4">Student</th>
                  <th className="pb-1">Status</th>
                  <th className="pb-1">Score</th>
                  <th className="pb-1">Attendance</th>
                  <th className="pb-1">Trend</th>
                  <th className="pb-1">City</th>
                  <th className="pb-1 pr-4 text-right">Scholarship at risk</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.slice(0, 12).map((s) => (
                  <tr key={s.id} className="group rounded-2xl bg-[#fafafa] transition-colors hover:bg-[#fff1f2]">
                    <td className="rounded-l-2xl px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                          s.riskLevel === "AT RISK" ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#fef3c7] text-[#b45309]",
                        )}>{s.initials}</div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#111827]">{s.name}</p>
                          <p className="truncate text-[11px] text-[#9ca3af]">{s.cohort}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        s.riskLevel === "AT RISK" ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#fef3c7] text-[#b45309]",
                      )}>{s.riskLevel}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[#ffe4e6]">
                          <div className={cn("h-full rounded-full", s.overallScore < 40 ? "bg-[#b91c1c]" : "bg-[#f59e0b]")}
                            style={{ width: `${s.overallScore}%` }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[#111827]">{s.overallScore}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm tabular-nums text-[#4b5563]">{s.attendanceRate}%</td>
                    <td className="py-3">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        s.trend === "down" && "bg-[#fee2e2] text-[#b91c1c]",
                        s.trend === "up" && "bg-[#dcfce7] text-[#15803d]",
                        s.trend === "stable" && "bg-[#f3f4f6] text-[#4b5563]",
                      )}>
                        {s.trend === "down" ? <TrendingDown className="h-3 w-3" /> : s.trend === "up" ? <TrendingUp className="h-3 w-3" /> : null}
                        {s.weeklyDelta > 0 ? `+${s.weeklyDelta}` : s.weeklyDelta}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-[#4b5563]">{s.city}</td>
                    <td className="rounded-r-2xl px-4 py-3 text-right font-bold tabular-nums text-[#b91c1c]">
                      ${SCHOLARSHIP.fullScholarshipValue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </BizCard>
      </SectionReveal>

      {/* ════════════════════════════════════════════════════════════════════
          INTERACTIVE ROI CALCULATOR
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal delay={0.3}>
        <BizCard>
          <CardContent className="p-0">
            {/* Header */}
            <div className="border-b border-[#f1f5f9] bg-[linear-gradient(180deg,_rgba(244,15,44,0.07),_rgba(255,255,255,0)_90%)] p-5 sm:p-6">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F40F2C] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                <BarChart3 className="h-3 w-3" /> Interactive
              </span>
              <h3 className="mt-3 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                Impact Calculator — See the Numbers Yourself
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6b7280]">
                Move the sliders to model different scenarios. Everything updates in real time.
              </p>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
              {/* Sliders */}
              <div className="space-y-5">
                {[
                  { label: "Students per cohort", value: cohortSize, setter: setCohortSize, min: 10, max: 100, suffix: "" },
                  { label: "Number of campuses", value: numCampuses, setter: setNumCampuses, min: 1, max: 10, suffix: "" },
                  { label: "Current dropout rate", value: currentDropoutRate, setter: setCurrentDropoutRate, min: 5, max: 50, suffix: "%" },
                  { label: "HSPTS improvement", value: retentionImprovement, setter: setRetentionImprovement, min: 10, max: 50, suffix: "%" },
                ].map((sl) => (
                  <div key={sl.label}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-semibold text-[#111827]">{sl.label}</label>
                      <span className="rounded-full bg-[#fff1f2] px-3 py-0.5 text-sm font-black tabular-nums text-[#F40F2C]">
                        {sl.value}{sl.suffix}
                      </span>
                    </div>
                    <input type="range" min={sl.min} max={sl.max} value={sl.value}
                      onChange={(e) => sl.setter(Number(e.target.value))}
                      className="slider-holberton w-full" />
                    <div className="mt-0.5 flex justify-between text-[10px] text-[#9ca3af]">
                      <span>{sl.min}{sl.suffix}</span><span>{sl.max}{sl.suffix}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Surface className="p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Dropouts prevented</p>
                    <p className="mt-2 text-3xl font-black text-[#15803d]"><AnimatedNumber value={financials.saved} /></p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">students saved</p>
                  </Surface>
                  <Surface className="p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Scholarships saved</p>
                    <p className="mt-2 text-3xl font-black text-[#15803d]">{fmtMoney(financials.moneySaved)}</p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">per year</p>
                  </Surface>
                  <Surface className="p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Total annual savings</p>
                    <p className="mt-2 text-3xl font-black text-[#F40F2C]">{fmtMoney(financials.totalSaved)}</p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">across {numCampuses} campus{numCampuses > 1 ? "es" : ""}</p>
                  </Surface>
                  <Surface className="p-4 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">System ROI</p>
                    <p className="mt-2 text-3xl font-black text-[#047857]"><AnimatedNumber value={financials.roi} />:1</p>
                    <p className="mt-0.5 text-xs text-[#6b7280]">return on investment</p>
                  </Surface>
                </div>

                <div className="rounded-2xl border-2 border-[#bbf7d0] bg-[#f0fdf4] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#d1fae5] text-[#047857]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#047857]">3-Year Impact</p>
                      <p className="mt-1 text-3xl font-black text-[#047857]">{fmtMoney(financials.threeYear)}</p>
                      <p className="mt-0.5 text-sm text-[#065f46]">in protected scholarship investment</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </BizCard>
      </SectionReveal>

      {/* ════════════════════════════════════════════════════════════════════
          ROW: Waste Projection Chart + Before/After Comparison
          ════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <SectionReveal delay={0.36}>
          <BizCard className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">5-year forecast</p>
              <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                Scholarship Waste: With vs Without HSPTS
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-8 rounded-full bg-[#e5e7eb]" />
                  <span className="text-sm text-[#6b7280]">Without HSPTS (waste)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-8 rounded-full bg-[#F40F2C]" />
                  <span className="text-sm text-[#6b7280]">With HSPTS (reduced waste)</span>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F40F2C" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#F40F2C" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]}
                      contentStyle={{ borderRadius: "14px", border: "1px solid #e5e7eb", boxShadow: "0 12px 30px -10px rgba(0,0,0,0.15)" }} />
                    <Area type="monotone" dataKey="withoutHSPTS" name="Without HSPTS"
                      stroke="#d1d5db" strokeWidth={3} fill="transparent"
                      dot={{ r: 4, fill: "#d1d5db", stroke: "#fff", strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="withHSPTS" name="With HSPTS"
                      stroke="#F40F2C" strokeWidth={3} fill="url(#wasteFill)"
                      dot={{ r: 4, fill: "#F40F2C", stroke: "#fff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </BizCard>
        </SectionReveal>

        <SectionReveal delay={0.42}>
          <BizCard className="flex h-full flex-col">
            <CardHeader className="pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">Side by side</p>
              <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                Before vs After HSPTS
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={beforeAfterData} barGap={4}>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="metric" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid #e5e7eb" }} />
                    <Bar dataKey="without" name="Without" fill="#d1d5db" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="with" name="With HSPTS" fill="#F40F2C" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Dropout rate", value: `${currentDropoutRate}% → ${Math.round(financials.reducedRate)}%`, color: "#15803d" },
                  { label: "Extra graduates", value: `+${financials.saved} students`, color: "#F40F2C" },
                  { label: "Scholarship savings", value: `+${fmtMoney(financials.moneySaved)}`, color: "#047857" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-[#fafafa] p-3">
                    <span className="text-sm text-[#6b7280]">{item.label}</span>
                    <span className="font-black" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </BizCard>
        </SectionReveal>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CAMPUS PERFORMANCE TABLE
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal delay={0.48}>
        <BizCard>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280]">Campus breakdown</p>
                <CardTitle className="mt-1.5 text-xl font-black tracking-tight text-[#111827] sm:text-2xl">
                  Performance by City
                </CardTitle>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#F40F2C]">
                <Building2 className="h-3 w-3" /> {campusStats.length} cities
              </span>
            </div>
          </CardHeader>
          <CardContent className="-mx-1 overflow-x-auto px-1">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
                  <th className="pb-1 pl-4">City</th>
                  <th className="pb-1">Students</th>
                  <th className="pb-1">In danger</th>
                  <th className="pb-1">Completion</th>
                  <th className="pb-1">Trend</th>
                  <th className="pb-1 pr-4 text-right">Scholarships at risk</th>
                </tr>
              </thead>
              <tbody>
                {campusStats.map((c) => (
                  <tr key={c.campus} className="rounded-2xl bg-[#fafafa] transition-colors hover:bg-[#fff1f2]">
                    <td className="rounded-l-2xl px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#fff1f2] text-xs font-bold text-[#F40F2C]">
                          {c.campus.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-[#111827]">{c.campus}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm tabular-nums text-[#4b5563]">{c.students.toLocaleString()}</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-bold tabular-nums",
                        c.atRisk > 100 ? "bg-[#fee2e2] text-[#b91c1c]" :
                        c.atRisk > 50 ? "bg-[#fef3c7] text-[#b45309]" :
                        "bg-[#dcfce7] text-[#15803d]",
                      )}>{c.atRisk.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#ffe4e6]">
                          <div className="h-full rounded-full bg-[#F40F2C]" style={{ width: `${c.completion}%` }} />
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-[#111827]">{c.completion}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.trend === "up" && "bg-[#dcfce7] text-[#15803d]",
                        c.trend === "down" && "bg-[#fee2e2] text-[#b91c1c]",
                        c.trend === "stable" && "bg-[#f3f4f6] text-[#4b5563]",
                      )}>
                        {c.trend === "up" ? <TrendingUp className="h-3 w-3" /> : c.trend === "down" ? <TrendingDown className="h-3 w-3" /> : null}
                        {c.trend}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-4 py-3 text-right font-bold tabular-nums text-[#b91c1c]">
                      {fmtMoney(c.atRisk * SCHOLARSHIP.fullScholarshipValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </BizCard>
      </SectionReveal>

      {/* ════════════════════════════════════════════════════════════════════
          BOTTOM LINE CTA
          ════════════════════════════════════════════════════════════════════ */}
      <SectionReveal delay={0.54}>
        <div className="relative overflow-hidden rounded-[28px] border-2 border-[#F40F2C] bg-[linear-gradient(135deg,_#F40F2C_0%,_#d60d28_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(244,15,44,0.7)] sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
          <div className="relative flex flex-col items-center gap-6 text-center lg:flex-row lg:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
              <Target className="h-10 w-10 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/70">The bottom line</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                Every IDDA-funded student who drops out wastes ${COST_PER_DROPOUT.toLocaleString()} in scholarship investment.
              </h2>
              <p className="mt-3 text-base leading-7 text-white/80">
                HSPTS catches them <strong className="text-white">3 weeks before they quit</strong>.{" "}
                With {numCampuses} campus{numCampuses > 1 ? "es" : ""}, that&apos;s{" "}
                <span className="font-black text-white">{fmtMoney(financials.totalSaved)}</span> in saved scholarship money per year 
                — a <span className="font-black text-white">{financials.roi}:1 return</span> on the platform investment.
              </p>
            </div>
          </div>
        </div>
      </SectionReveal>
    </div>
  );
}

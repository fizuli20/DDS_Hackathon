import type { StudentRecord, RiskLevel, Trend } from "./hspts-data";

/**
 * Seeded pseudo-random number generator (Mulberry32).
 * Produces deterministic output so the 10,000-student dataset is
 * identical between server and client (no hydration mismatch).
 */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

/* ── Reference data ── */
const FIRST_NAMES = [
  "Ada", "Daniel", "Sofia", "Imane", "Noah", "Leila", "Karim", "Mariam",
  "Youssef", "Amina", "Moussa", "Fatou", "Omar", "Aisha", "Kofi",
  "Nadia", "Ibrahim", "Salma", "Mamadou", "Zineb", "Cheikh", "Hala",
  "Abdou", "Lina", "Kwame", "Sara", "Ousmane", "Aya", "Rachid", "Dina",
] as const;

const LAST_NAMES = [
  "N'Diaye", "Owusu", "Karim", "Bensalem", "Mensah", "Haddar", "Bellamine",
  "Jallow", "El Fassi", "Sy", "Dupont", "Naji", "Traoré", "Diallo",
  "Koné", "Benali", "Osei", "Mbaye", "Tazi", "Ouedraogo", "Sissoko",
  "Haddad", "Bennani", "Cissé", "Addo", "Camara", "Abadi", "Keita",
] as const;

const CITIES = [
  "Casablanca", "Accra", "Rabat", "Dakar", "Tangier", "Banjul",
  "Algiers", "Marrakesh", "Lagos", "Nairobi", "Tunis", "Bogotá",
  "Medellín", "Lima", "Abidjan",
] as const;

const TRACKS = [
  "Full-Stack Web", "Machine Learning", "Cybersecurity",
  "Data Analytics", "AR / VR",
] as const;

const COHORTS = [
  "Cohort Atlas", "Cohort Nova", "Cohort Pulse", "Cohort Horizon",
  "Cohort Zenith", "Cohort Apex", "Cohort Forge", "Cohort Orbit",
] as const;

const MENTORS = [
  "Michelle Dupont", "Fatou Sy", "Karim El Fassi", "Youssef Naji",
  "Lina Haddad", "Abdoulaye Traoré", "Rachida Benali", "Kofi Mensah",
] as const;

const FOCUS_MAP: Record<RiskLevel, readonly string[]> = {
  "AT RISK": [
    "Needs immediate intervention around attendance and task cadence",
    "Falling behind on PLD sessions — requires daily mentor check-ins",
    "Exam scores declining for 3 consecutive weeks",
    "Disengaged from peer learning activities",
    "Critical: multiple deadlines missed this sprint",
  ],
  WEAK: [
    "Declining — needs coaching within 2 weeks",
    "Task completion rate dropping below threshold",
    "Inconsistent attendance pattern emerging",
    "Exam confidence issues identified by mentor",
    "Needs structured study plan to avoid AT RISK transition",
  ],
  MEDIUM: [
    "Improving steadily — monitor exam pacing",
    "Solid peer engagement, growing technical depth",
    "On track but needs support for upcoming assessment cycle",
    "Task quality improving, attendance consistent",
  ],
  STRONG: [
    "High leadership and peer feedback consistency",
    "Sustained upward growth with strong mentoring",
    "Excellent lab execution and consistent delivery",
    "Top performer — potential peer mentor candidate",
  ],
};

/* ── Score ranges by risk level ── */
interface ScoreRange { min: number; max: number }
const SCORE_RANGES: Record<RiskLevel, ScoreRange> = {
  "AT RISK": { min: 25, max: 55 },
  WEAK:     { min: 50, max: 68 },
  MEDIUM:   { min: 65, max: 82 },
  STRONG:   { min: 80, max: 99 },
};

/* ── Build 10,000 students ── */
function generateStudents(): StudentRecord[] {
  const TOTAL = 10_000;

  // Target distribution: ~10% AT RISK, 20% WEAK, 30% MEDIUM, 40% STRONG
  const distribution: { level: RiskLevel; count: number }[] = [
    { level: "AT RISK", count: Math.round(TOTAL * 0.10) },
    { level: "WEAK",    count: Math.round(TOTAL * 0.20) },
    { level: "MEDIUM",  count: Math.round(TOTAL * 0.30) },
    { level: "STRONG",  count: Math.round(TOTAL * 0.40) },
  ];

  // Build a flat array of risk levels in the exact counts
  const riskBuckets: RiskLevel[] = [];
  for (const { level, count } of distribution) {
    for (let i = 0; i < count; i++) riskBuckets.push(level);
  }
  // Pad to exactly 10,000 if rounding left us short
  while (riskBuckets.length < TOTAL) riskBuckets.push("STRONG");

  // Fisher-Yates shuffle using our seeded PRNG
  for (let i = riskBuckets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [riskBuckets[i], riskBuckets[j]] = [riskBuckets[j], riskBuckets[i]];
  }

  const students: StudentRecord[] = [];

  for (let i = 0; i < TOTAL; i++) {
    const riskLevel = riskBuckets[i];
    const range = SCORE_RANGES[riskLevel];
    const overallScore = randInt(range.min, range.max);

    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const initials = `${firstName[0]}${lastName[0]}`;

    const trend: Trend =
      riskLevel === "AT RISK"
        ? (rand() < 0.7 ? "down" : "stable")
        : riskLevel === "WEAK"
          ? (rand() < 0.5 ? "down" : rand() < 0.7 ? "stable" : "up")
          : riskLevel === "MEDIUM"
            ? (rand() < 0.15 ? "down" : rand() < 0.5 ? "stable" : "up")
            : (rand() < 0.05 ? "down" : rand() < 0.2 ? "stable" : "up");

    const attendanceRate =
      riskLevel === "AT RISK"
        ? randInt(55, 78)
        : riskLevel === "WEAK"
          ? randInt(70, 88)
          : riskLevel === "MEDIUM"
            ? randInt(82, 95)
            : randInt(90, 100);

    const weeklyDelta =
      trend === "down" ? randInt(-8, -1) : trend === "up" ? randInt(1, 7) : randInt(-2, 2);

    const breakdown = {
      pld: Math.min(100, Math.max(0, overallScore + randInt(-8, 6))),
      exam: Math.min(100, Math.max(0, overallScore + randInt(-12, 4))),
      tasks: Math.min(100, Math.max(0, overallScore + randInt(-6, 8))),
      attendance: attendanceRate,
    };

    students.push({
      id: `hspts-${1000 + i}`,
      name,
      cohort: pick(COHORTS),
      track: pick(TRACKS),
      overallScore,
      riskLevel,
      trend,
      mentor: pick(MENTORS),
      initials,
      city: pick(CITIES),
      focus: pick(FOCUS_MAP[riskLevel]),
      attendanceRate,
      weeklyDelta,
      breakdown,
      timeline: [], // lightweight — timelines loaded on demand
    });
  }

  return students;
}

/**
 * 10,000 deterministic mock student records.
 * Generated once at module load with a seeded PRNG — safe for SSR.
 */
export const mockStudentRecords: StudentRecord[] = generateStudents();

/**
 * Pre-computed risk counts from the 10K dataset.
 */
export const mockRiskCounts = (() => {
  let atRisk = 0, weak = 0, medium = 0, strong = 0;
  for (const s of mockStudentRecords) {
    switch (s.riskLevel) {
      case "AT RISK": atRisk++; break;
      case "WEAK": weak++; break;
      case "MEDIUM": medium++; break;
      case "STRONG": strong++; break;
    }
  }
  return { atRisk, weak, medium, strong, total: mockStudentRecords.length };
})();

/**
 * Top at-risk students sorted by overallScore (worst first), limited to 50.
 */
export const mockAtRiskStudents: StudentRecord[] = mockStudentRecords
  .filter((s) => s.riskLevel === "AT RISK" || s.riskLevel === "WEAK")
  .sort((a, b) => a.overallScore - b.overallScore)
  .slice(0, 50);

/**
 * Campus-level aggregation derived from the mock dataset.
 */
export const mockCampusStats = (() => {
  const cityMap = new Map<string, { students: number; atRisk: number; totalScore: number; trends: Trend[] }>();
  for (const s of mockStudentRecords) {
    const entry = cityMap.get(s.city) ?? { students: 0, atRisk: 0, totalScore: 0, trends: [] };
    entry.students++;
    if (s.riskLevel === "AT RISK" || s.riskLevel === "WEAK") entry.atRisk++;
    entry.totalScore += s.overallScore;
    entry.trends.push(s.trend);
    cityMap.set(s.city, entry);
  }

  return Array.from(cityMap.entries())
    .map(([campus, data]) => {
      const completion = Math.round(((data.students - data.atRisk) / data.students) * 100);
      const isaRevenue = Math.round(((data.students - data.atRisk) * 35) ); // in $K
      const upCount = data.trends.filter((t) => t === "up").length;
      const downCount = data.trends.filter((t) => t === "down").length;
      const trend: Trend = upCount > downCount * 1.2 ? "up" : downCount > upCount * 1.2 ? "down" : "stable";
      return { campus, students: data.students, atRisk: data.atRisk, completion, isaRevenue, trend };
    })
    .sort((a, b) => b.students - a.students);
})();

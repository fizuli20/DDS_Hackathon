export type RiskLevel = "AT RISK" | "WEAK" | "MEDIUM" | "STRONG";
export type Trend = "up" | "down" | "stable";

export type StudentScoreBreakdown = {
  pld: number;
  exam: number;
  tasks: number;
  attendance: number;
};

export type StudentTimelineItem = {
  id: string;
  type: "PLD" | "EXAM" | "TASK" | "ATTENDANCE";
  title: string;
  detail: string;
  timestamp: string;
};

export type StudentRecord = {
  id: string;
  name: string;
  cohort: string;
  track: string;
  overallScore: number;
  riskLevel: RiskLevel;
  trend: Trend;
  mentor: string;
  initials: string;
  city: string;
  focus: string;
  attendanceRate: number;
  weeklyDelta: number;
  breakdown: StudentScoreBreakdown;
  timeline: StudentTimelineItem[];
};

export const riskDistribution = [
  { name: "Strong", value: 118, color: "#16a34a" },
  { name: "Medium", value: 54, color: "#fb7185" },
  { name: "Weak", value: 29, color: "#ca8a04" },
  { name: "At-Risk", value: 17, color: "#b91c1c" },
] as const;

export const scoreTrend = [
  { day: "Mar 10", score: 67 },
  { day: "Mar 12", score: 68 },
  { day: "Mar 14", score: 67 },
  { day: "Mar 16", score: 70 },
  { day: "Mar 18", score: 69 },
  { day: "Mar 20", score: 71 },
  { day: "Mar 22", score: 72 },
  { day: "Mar 24", score: 74 },
  { day: "Mar 26", score: 73 },
  { day: "Mar 28", score: 75 },
  { day: "Mar 30", score: 76 },
  { day: "Apr 01", score: 78 },
  { day: "Apr 03", score: 79 },
  { day: "Apr 05", score: 81 },
  { day: "Apr 07", score: 82 },
] as const;

export const recentActivity = [
  {
    id: "act-1",
    title: "Mentor alert triggered for Cohort Atlas",
    detail: "5 learners dropped below the PLD completion threshold in the last 72 hours.",
    time: "6 min ago",
    tone: "danger",
  },
  {
    id: "act-2",
    title: "Weekly evaluation sync completed",
    detail: "Exam and attendance data merged across Full-Stack and AR/VR tracks.",
    time: "28 min ago",
    tone: "neutral",
  },
  {
    id: "act-3",
    title: "Recovery plan accepted",
    detail: "Mentor Michelle D. approved a 14-day intervention path for 3 students.",
    time: "1 hr ago",
    tone: "success",
  },
  {
    id: "act-4",
    title: "Cohort Nova moved into strong zone",
    detail: "Average score crossed 84 after attendance and task completion gains.",
    time: "3 hr ago",
    tone: "success",
  },
] as const;

export const studentRecords: StudentRecord[] = [
  {
    id: "hspts-1001",
    name: "Ada N'Diaye",
    cohort: "Cohort Atlas",
    track: "Full-Stack Web",
    overallScore: 91,
    riskLevel: "STRONG",
    trend: "up",
    mentor: "Michelle Dupont",
    initials: "AN",
    city: "Casablanca",
    focus: "High leadership and peer feedback consistency",
    attendanceRate: 98,
    weeklyDelta: 4,
    breakdown: { pld: 94, exam: 88, tasks: 92, attendance: 98 },
    timeline: [
      {
        id: "a1",
        type: "PLD",
        title: "Project defense passed with distinction",
        detail: "Scored 95 on the API architecture rubric.",
        timestamp: "Today · 09:20",
      },
      {
        id: "a2",
        type: "TASK",
        title: "Completed 6 advanced sprint tasks",
        detail: "Closed all backend refactor milestones ahead of deadline.",
        timestamp: "Yesterday · 18:40",
      },
      {
        id: "a3",
        type: "ATTENDANCE",
        title: "Attendance streak extended",
        detail: "Reached 29 consecutive on-time check-ins.",
        timestamp: "Yesterday · 08:03",
      },
    ],
  },
  {
    id: "hspts-1002",
    name: "Daniel Owusu",
    cohort: "Cohort Atlas",
    track: "Machine Learning",
    overallScore: 78,
    riskLevel: "MEDIUM",
    trend: "stable",
    mentor: "Fatou Sy",
    initials: "DO",
    city: "Accra",
    focus: "Strong technical depth, uneven exam pacing",
    attendanceRate: 92,
    weeklyDelta: 0,
    breakdown: { pld: 83, exam: 74, tasks: 79, attendance: 92 },
    timeline: [
      {
        id: "d1",
        type: "EXAM",
        title: "Formative model evaluation completed",
        detail: "Missed one section under time pressure.",
        timestamp: "Today · 11:15",
      },
      {
        id: "d2",
        type: "TASK",
        title: "Submitted feature engineering notebook",
        detail: "Mentor requested improved experiment logging.",
        timestamp: "Yesterday · 16:10",
      },
      {
        id: "d3",
        type: "ATTENDANCE",
        title: "Missed standup alert resolved",
        detail: "Late arrival documented and coaching follow-up scheduled.",
        timestamp: "Mon · 08:21",
      },
    ],
  },
  {
    id: "hspts-1003",
    name: "Sofia Karim",
    cohort: "Cohort Nova",
    track: "Cybersecurity",
    overallScore: 84,
    riskLevel: "STRONG",
    trend: "up",
    mentor: "Karim El Fassi",
    initials: "SK",
    city: "Rabat",
    focus: "Excellent lab execution and faster assessment recovery",
    attendanceRate: 95,
    weeklyDelta: 6,
    breakdown: { pld: 82, exam: 86, tasks: 83, attendance: 95 },
    timeline: [
      {
        id: "s1",
        type: "EXAM",
        title: "Red-team simulation score improved",
        detail: "Jumped 12 points versus prior sprint benchmark.",
        timestamp: "Today · 13:05",
      },
      {
        id: "s2",
        type: "PLD",
        title: "Pair programming review marked as strong",
        detail: "Mentor highlighted clear incident-response thinking.",
        timestamp: "Yesterday · 14:48",
      },
      {
        id: "s3",
        type: "TASK",
        title: "Completed vulnerability triage deck",
        detail: "Delivered polished remediation summary for stakeholders.",
        timestamp: "Mon · 19:30",
      },
    ],
  },
  {
    id: "hspts-1004",
    name: "Imane Bensalem",
    cohort: "Cohort Pulse",
    track: "Full-Stack Web",
    overallScore: 59,
    riskLevel: "AT RISK",
    trend: "down",
    mentor: "Michelle Dupont",
    initials: "IB",
    city: "Tangier",
    focus: "Needs structure around task cadence and attendance recovery",
    attendanceRate: 69,
    weeklyDelta: -7,
    breakdown: { pld: 62, exam: 55, tasks: 58, attendance: 69 },
    timeline: [
      {
        id: "i1",
        type: "ATTENDANCE",
        title: "Attendance warning triggered",
        detail: "Three late arrivals and one missed project sync this week.",
        timestamp: "Today · 08:44",
      },
      {
        id: "i2",
        type: "TASK",
        title: "Sprint submission incomplete",
        detail: "Only 4 of 9 assigned tasks were delivered before review.",
        timestamp: "Yesterday · 17:20",
      },
      {
        id: "i3",
        type: "PLD",
        title: "Recovery meeting scheduled",
        detail: "Mentor and student aligned on a two-week rebound plan.",
        timestamp: "Yesterday · 10:05",
      },
      {
        id: "i4",
        type: "EXAM",
        title: "Assessment score dropped",
        detail: "Revision gaps surfaced in state management and testing.",
        timestamp: "Mon · 15:30",
      },
    ],
  },
  {
    id: "hspts-1005",
    name: "Noah Mensah",
    cohort: "Cohort Pulse",
    track: "AR / VR",
    overallScore: 64,
    riskLevel: "WEAK",
    trend: "down",
    mentor: "Lina Haddad",
    initials: "NM",
    city: "Dakar",
    focus: "Solid creativity, but mentoring needed for technical discipline",
    attendanceRate: 81,
    weeklyDelta: -3,
    breakdown: { pld: 67, exam: 59, tasks: 65, attendance: 81 },
    timeline: [
      {
        id: "n1",
        type: "TASK",
        title: "3D prototype delivered with missing interactions",
        detail: "Navigation flow remains incomplete ahead of demo day.",
        timestamp: "Today · 12:18",
      },
      {
        id: "n2",
        type: "PLD",
        title: "Mentor feedback escalated",
        detail: "Needs daily checkpoint structure for the next sprint.",
        timestamp: "Yesterday · 16:55",
      },
      {
        id: "n3",
        type: "ATTENDANCE",
        title: "Morning sessions normalized",
        detail: "Reached 4 consecutive on-time arrivals after coaching.",
        timestamp: "Mon · 08:09",
      },
    ],
  },
  {
    id: "hspts-1006",
    name: "Leila Haddar",
    cohort: "Cohort Nova",
    track: "Data Analytics",
    overallScore: 73,
    riskLevel: "MEDIUM",
    trend: "up",
    mentor: "Youssef Naji",
    initials: "LH",
    city: "Marrakesh",
    focus: "Improving steadily after intervention around exam confidence",
    attendanceRate: 94,
    weeklyDelta: 5,
    breakdown: { pld: 76, exam: 68, tasks: 74, attendance: 94 },
    timeline: [
      {
        id: "l1",
        type: "EXAM",
        title: "Weekly SQL assessment improved",
        detail: "Raised score from 61 to 72 within one cycle.",
        timestamp: "Today · 10:22",
      },
      {
        id: "l2",
        type: "TASK",
        title: "Dashboard storytelling milestone hit",
        detail: "Presented a clearer narrative around retention risk.",
        timestamp: "Yesterday · 15:11",
      },
    ],
  },
  {
    id: "hspts-1007",
    name: "Karim Bellamine",
    cohort: "Cohort Horizon",
    track: "Machine Learning",
    overallScore: 87,
    riskLevel: "STRONG",
    trend: "up",
    mentor: "Fatou Sy",
    initials: "KB",
    city: "Algiers",
    focus: "Sustained upward growth with strong peer mentoring",
    attendanceRate: 97,
    weeklyDelta: 3,
    breakdown: { pld: 89, exam: 84, tasks: 88, attendance: 97 },
    timeline: [
      {
        id: "k1",
        type: "PLD",
        title: "Mentor flagged leadership growth",
        detail: "Supported two peers through deployment blockers.",
        timestamp: "Today · 09:58",
      },
      {
        id: "k2",
        type: "TASK",
        title: "Inference optimization shipped",
        detail: "Reduced runtime latency by 19% on cohort benchmark.",
        timestamp: "Yesterday · 17:43",
      },
    ],
  },
  {
    id: "hspts-1008",
    name: "Mariam Jallow",
    cohort: "Cohort Horizon",
    track: "Cybersecurity",
    overallScore: 61,
    riskLevel: "AT RISK",
    trend: "down",
    mentor: "Karim El Fassi",
    initials: "MJ",
    city: "Banjul",
    focus: "Needs intervention around exam performance and consistency",
    attendanceRate: 74,
    weeklyDelta: -5,
    breakdown: { pld: 65, exam: 53, tasks: 64, attendance: 74 },
    timeline: [
      {
        id: "m1",
        type: "EXAM",
        title: "Threat-modeling assessment dropped",
        detail: "Missed key mitigation steps under time pressure.",
        timestamp: "Today · 14:25",
      },
      {
        id: "m2",
        type: "ATTENDANCE",
        title: "Attendance support plan launched",
        detail: "Coach aligned morning routine changes for next 10 days.",
        timestamp: "Yesterday · 08:10",
      },
      {
        id: "m3",
        type: "PLD",
        title: "Mentor 1:1 escalated",
        detail: "Student agreed to weekly checkpoint on progress and fatigue.",
        timestamp: "Mon · 11:40",
      },
    ],
  },
];

export const studentHistory = {
  "hspts-1001": [
    { week: "W1", score: 83 },
    { week: "W2", score: 84 },
    { week: "W3", score: 86 },
    { week: "W4", score: 88 },
    { week: "W5", score: 89 },
    { week: "W6", score: 91 },
  ],
  "hspts-1002": [
    { week: "W1", score: 73 },
    { week: "W2", score: 74 },
    { week: "W3", score: 76 },
    { week: "W4", score: 77 },
    { week: "W5", score: 78 },
    { week: "W6", score: 78 },
  ],
  "hspts-1003": [
    { week: "W1", score: 72 },
    { week: "W2", score: 75 },
    { week: "W3", score: 77 },
    { week: "W4", score: 79 },
    { week: "W5", score: 82 },
    { week: "W6", score: 84 },
  ],
  "hspts-1004": [
    { week: "W1", score: 71 },
    { week: "W2", score: 69 },
    { week: "W3", score: 66 },
    { week: "W4", score: 63 },
    { week: "W5", score: 61 },
    { week: "W6", score: 59 },
  ],
  "hspts-1005": [
    { week: "W1", score: 70 },
    { week: "W2", score: 68 },
    { week: "W3", score: 69 },
    { week: "W4", score: 66 },
    { week: "W5", score: 65 },
    { week: "W6", score: 64 },
  ],
  "hspts-1006": [
    { week: "W1", score: 61 },
    { week: "W2", score: 64 },
    { week: "W3", score: 67 },
    { week: "W4", score: 69 },
    { week: "W5", score: 71 },
    { week: "W6", score: 73 },
  ],
  "hspts-1007": [
    { week: "W1", score: 78 },
    { week: "W2", score: 80 },
    { week: "W3", score: 82 },
    { week: "W4", score: 84 },
    { week: "W5", score: 85 },
    { week: "W6", score: 87 },
  ],
  "hspts-1008": [
    { week: "W1", score: 69 },
    { week: "W2", score: 67 },
    { week: "W3", score: 66 },
    { week: "W4", score: 64 },
    { week: "W5", score: 63 },
    { week: "W6", score: 61 },
  ],
} as const;

export const reportPresets = [
  {
    id: "weekly",
    title: "Weekly performance pulse",
    summary: "Cohort health, mentor actions, attendance shifts, and at-risk movement.",
    stats: ["17 at-risk", "82 avg score", "6 mentors engaged"],
  },
  {
    id: "monthly",
    title: "Monthly academic board review",
    summary: "Executive snapshot for retention, track quality, and intervention outcomes.",
    stats: ["4 active cohorts", "91% attendance", "12% score lift"],
  },
  {
    id: "individual",
    title: "Individual learner recovery pack",
    summary: "Student-level timeline, skill breakdown, action plan, and mentor notes.",
    stats: ["1 learner", "4 score bands", "PDF + Excel export"],
  },
] as const;

export const filterOptions = {
  cohorts: ["All Cohorts", "Cohort Atlas", "Cohort Nova", "Cohort Pulse", "Cohort Horizon"],
  tracks: ["All Tracks", "Full-Stack Web", "Machine Learning", "Cybersecurity", "Data Analytics", "AR / VR"],
  riskLevels: ["All Risk Levels", "AT RISK", "WEAK", "MEDIUM", "STRONG"],
} as const;

export function getStudentById(studentId: string) {
  return studentRecords.find((student) => student.id === studentId) ?? studentRecords[3];
}

export function getAtRiskStudents() {
  return studentRecords
    .filter((student) => student.riskLevel === "AT RISK" || student.riskLevel === "WEAK")
    .sort((a, b) => a.overallScore - b.overallScore)
    .slice(0, 5);
}

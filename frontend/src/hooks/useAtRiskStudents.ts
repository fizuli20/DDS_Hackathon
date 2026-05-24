import { useMemo } from "react";
import {
  mockStudentRecords,
  mockRiskCounts,
  mockAtRiskStudents,
  mockCampusStats,
} from "../lib/mock-students";
import type { StudentRecord, RiskLevel } from "../lib/hspts-data";

export type RiskStats = {
  atRisk: number;
  weak: number;
  medium: number;
  strong: number;
  total: number;
};

export type CampusStat = {
  campus: string;
  students: number;
  atRisk: number;
  completion: number;
  isaRevenue: number;
  trend: "up" | "down" | "stable";
};

/**
 * Hook that returns everything the Business Impact dashboard needs
 * from the 10,000 mock student dataset — pre-computed and memoized
 * so the component never re-derives on every render.
 */
export function useAtRiskStudents() {
  return useMemo(() => {
    return {
      /** Full 10K dataset (rarely needed directly) */
      allStudents: mockStudentRecords,

      /** Top 50 at-risk/weak students, sorted worst-first */
      atRiskStudents: mockAtRiskStudents,

      /** Pre-counted risk distribution */
      riskCounts: mockRiskCounts,

      /** Per-campus aggregated stats */
      campusStats: mockCampusStats,

      /** Quick danger check */
      isDanger: (s: StudentRecord) =>
        s.riskLevel === "AT RISK" || s.riskLevel === "WEAK",

      /** Number of students in danger */
      dangerCount: mockRiskCounts.atRisk + mockRiskCounts.weak,
    };
  }, []);
}

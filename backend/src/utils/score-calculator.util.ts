export type ScoreInput = {
  pldPct?: number | null;
  examPct?: number | null;
  taskPct?: number | null;
  attendancePct?: number | null;
};

export function calculateOverallVariantB(input: ScoreInput): number {
  const weights = {
    pldPct: 0.25,
    examPct: 0.3,
    taskPct: 0.25,
    attendancePct: 0.2,
  } as const;

  const rows = (Object.keys(weights) as (keyof typeof weights)[])
    .map((k) => ({ value: input[k], weight: weights[k] }))
    .filter((r) => typeof r.value === 'number');

  if (!rows.length) return 0;
  const totalWeight = rows.reduce((a, b) => a + b.weight, 0);
  const sum = rows.reduce((a, b) => a + (b.value as number) * (b.weight / totalWeight), 0);
  return Math.round(sum * 100) / 100;
}

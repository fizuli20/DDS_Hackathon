export function getRiskLevel(score: number): 'strong' | 'medium' | 'weak' | 'at_risk' {
  if (score >= 85) return 'strong';
  if (score >= 70) return 'medium';
  if (score >= 50) return 'weak';
  return 'at_risk';
}

export function getTrend(currentAvg: number, prevAvg: number): 'up' | 'stable' | 'down' {
  if (currentAvg > prevAvg + 2) return 'up';
  if (currentAvg < prevAvg - 2) return 'down';
  return 'stable';
}

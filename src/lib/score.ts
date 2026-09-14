export function calculateScores(
  skinScore: number,
  avgBodyTemp: number | null,
  avgMovement: number | null,
  avgPressure: number | null,
  avgEnvTemp: number | null
) {
  const tempScore = avgBodyTemp != null ? (avgBodyTemp >= 38.0 && avgBodyTemp <= 39.5 ? 95 : 60) : 90;
  const motionScore = avgMovement != null ? (avgMovement > 0.5 ? 85 : 70) : 80;
  const pressureScore = avgPressure != null ? (avgPressure < 30 ? 90 : 50) : 85;
  const barkScore = 85;
  const envScore = avgEnvTemp != null ? (avgEnvTemp > 15 && avgEnvTemp < 30 ? 90 : 65) : 88;
  const lightScore = 90;

  const healthScore = Math.round((skinScore + tempScore + motionScore + pressureScore + barkScore + envScore) / 6);

  return { tempScore, motionScore, pressureScore, barkScore, envScore, lightScore, healthScore };
}

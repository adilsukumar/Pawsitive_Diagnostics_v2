export type MovementState = "moving" | "resting" | "unknown";

const EARTH_GRAVITY = 9.80665;
const MOVING_THRESHOLD_MPS2 = 0.75;

/**
 * The firmware may report either gravity-inclusive acceleration magnitude or
 * gravity-removed motion intensity. Normalising both shapes here keeps raw
 * engineering values out of everyday UI while retaining them in reports.
 */
export function interpretMovement(value: number | null | undefined): MovementState {
  if (value == null || !Number.isFinite(value)) return "unknown";
  const intensity = value > 4 ? Math.abs(value - EARTH_GRAVITY) : Math.abs(value);
  return intensity >= MOVING_THRESHOLD_MPS2 ? "moving" : "resting";
}

export function describeEnvironment(
  temperatureC: number | null | undefined,
  humidityRh: number | null | undefined,
): string {
  if (temperatureC == null || humidityRh == null) return "Waiting for readings";
  if (temperatureC >= 30 && humidityRh >= 70) return "Hot and humid";
  if (temperatureC >= 30) return "Warm environment";
  if (temperatureC <= 12) return "Cold environment";
  if (humidityRh >= 70) return "High humidity";
  if (humidityRh <= 30) return "Dry environment";
  return "Comfortable environment";
}

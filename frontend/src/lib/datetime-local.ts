/**
 * Helpers for <input type="datetime-local" /> using the browser's local calendar day.
 */

export function getTodayDatetimeLocalBounds(): { min: string; max: string } {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return { min: `${y}-${m}-${d}T00:00`, max: `${y}-${m}-${d}T23:59` };
}

export function nowLocalDatetimeLocalValue(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function clampDatetimeLocalToBounds(value: string, min: string, max: string): string {
  if (!value || value.length < 16) {
    return clampDatetimeLocalToBounds(nowLocalDatetimeLocalValue(), min, max);
  }
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function isDatetimeLocalWithinTodayBounds(
  value: string,
  bounds: { min: string; max: string },
): boolean {
  return value.length >= 16 && value >= bounds.min && value <= bounds.max;
}

export function formatDateAsDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ensure check-out is strictly after check-in on the same local calendar day; may return value > max. */
export function ensureCheckoutAfterCheckin(
  checkIn: string,
  checkOut: string,
  max: string,
): string {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return checkOut;
  if (b.getTime() > a.getTime()) return checkOut;
  const next = new Date(a.getTime() + 60_000);
  const formatted = formatDateAsDatetimeLocal(next);
  return formatted > max ? max : formatted;
}

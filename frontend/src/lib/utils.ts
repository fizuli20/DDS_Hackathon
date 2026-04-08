import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(cents: number, currency = "AZN") {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-AZ", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

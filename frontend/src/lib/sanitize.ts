"use client";

export function sanitizeTextInput(value: string): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
}

export function sanitizeLooseSlug(value: string): string {
  return sanitizeTextInput(value).replace(/[^\w-]/g, "");
}

export function isValidStudentId(value: string): boolean {
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,63}$/.test(value);
}

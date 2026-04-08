"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <label className="inline-flex items-center gap-2 text-sm font-semibold text-[#6b7280]">
      <span>{t("common.language", "Language")}</span>
      <select
        value={lang}
        onChange={(event) => setLang(event.target.value as "az" | "ru" | "en")}
        className="h-9 rounded-lg border border-[#e5e7eb] bg-white px-2 text-sm text-[#111827]"
      >
        <option value="az">AZ</option>
        <option value="ru">RU</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "az" | "ru" | "en";

type I18nContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const dictionary: Record<Language, Record<string, string>> = {
  az: {
    "common.language": "Dil",
    "common.login": "Login",
    "common.logout": "Logout",
    "common.register": "Qeydiyyat",
    "common.select": "Seç",
    "nav.overview": "Ümumi Baxış",
    "nav.students": "Tələbələr",
    "nav.studentPortal": "Tələbə Portalı",
    "nav.studentProfile": "Tələbə Profili",
    "nav.reports": "Hesabatlar",
    "shell.navigation": "Naviqasiya",
    "shell.campusView": "Kampus görünüşü",
    "shell.builtFor":
      "Təhsil əməliyyatları üçün: mentor müdaxiləsi, tələbə sağlamlığı və ixrac edilə bilən performans hesabatı.",
    "shell.search": "Tələbə, kohort, mentor, hesabat axtar...",
    "shell.role": "Akademik rəhbər",
    "shell.roleSub": "universitet admin",
    "auth.signIn": "Daxil ol",
    "auth.register": "Qeydiyyat",
    "auth.email": "Email",
    "auth.password": "Şifrə",
    "auth.fullName": "Ad Soyad",
    "auth.confirmPassword": "Şifrə təkrarı",
    "auth.noAccount": "Hesabın yoxdur?",
    "auth.haveAccount": "Hesabın var?",
    "portal.title": "Giriş / Çıxış və Aktivlik Skoru",
    "portal.studentSide": "Tələbə tərəfi",
    "portal.studentId": "Tələbə ID",
    "portal.checkIn": "Giriş vaxtı",
    "portal.checkOut": "Çıxış vaxtı",
    "portal.saveTime": "Vaxtı qeyd et",
    "portal.refreshScore": "Aktivlik skorunu yenilə",
    "reports.generatePdf": "PDF Yarat",
    "reports.exportExcel": "Excel İxrac et",
    "reports.selected": "seçilib",
    "overview.generateWeekly": "Həftəlik board hesabatı yarat",
    "overview.openList": "Tələbə siyahısını aç",
  },
  ru: {
    "common.language": "Язык",
    "common.login": "Вход",
    "common.logout": "Выход",
    "common.register": "Регистрация",
    "common.select": "Выбрать",
    "nav.overview": "Обзор",
    "nav.students": "Студенты",
    "nav.studentPortal": "Портал студента",
    "nav.studentProfile": "Профиль студента",
    "nav.reports": "Отчеты",
    "shell.navigation": "Навигация",
    "shell.campusView": "Вид кампуса",
    "shell.builtFor":
      "Для образовательных операций: вмешательство ментора, состояние студентов и экспортируемая отчетность.",
    "shell.search": "Поиск студента, когорты, ментора, отчета...",
    "shell.role": "Академический руководитель",
    "shell.roleSub": "администратор университета",
    "auth.signIn": "Войти",
    "auth.register": "Регистрация",
    "auth.email": "Email",
    "auth.password": "Пароль",
    "auth.fullName": "Имя Фамилия",
    "auth.confirmPassword": "Повтор пароля",
    "auth.noAccount": "Нет аккаунта?",
    "auth.haveAccount": "Уже есть аккаунт?",
    "portal.title": "Время входа/выхода и балл активности",
    "portal.studentSide": "Сторона студента",
    "portal.studentId": "ID студента",
    "portal.checkIn": "Время входа",
    "portal.checkOut": "Время выхода",
    "portal.saveTime": "Сохранить время",
    "portal.refreshScore": "Обновить балл активности",
    "reports.generatePdf": "Сформировать PDF",
    "reports.exportExcel": "Экспорт Excel",
    "reports.selected": "выбрано",
    "overview.generateWeekly": "Сформировать недельный отчет",
    "overview.openList": "Открыть список студентов",
  },
  en: {
    "common.language": "Language",
    "common.login": "Login",
    "common.logout": "Logout",
    "common.register": "Register",
    "common.select": "Select",
    "nav.overview": "Overview",
    "nav.students": "Students",
    "nav.studentPortal": "Student Portal",
    "nav.studentProfile": "Student Profile",
    "nav.reports": "Reports",
    "shell.navigation": "Navigation",
    "shell.campusView": "Campus view",
    "shell.builtFor":
      "Built for education operations: mentor intervention, student health, and exportable performance reporting.",
    "shell.search": "Search student, cohort, mentor, report...",
    "shell.role": "Academic Lead",
    "shell.roleSub": "university admin",
    "auth.signIn": "Sign In",
    "auth.register": "Register",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.fullName": "Full name",
    "auth.confirmPassword": "Confirm password",
    "auth.noAccount": "No account?",
    "auth.haveAccount": "Already have an account?",
    "portal.title": "Check-In / Check-Out and Activity Score",
    "portal.studentSide": "Student Side",
    "portal.studentId": "Student ID",
    "portal.checkIn": "Check-in time",
    "portal.checkOut": "Check-out time",
    "portal.saveTime": "Save time",
    "portal.refreshScore": "Refresh activity score",
    "reports.generatePdf": "Generate PDF",
    "reports.exportExcel": "Export Excel",
    "reports.selected": "selected",
    "overview.generateWeekly": "Generate weekly board report",
    "overview.openList": "Open student list",
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("az");

  useEffect(() => {
    const stored = localStorage.getItem("hspts_lang") as Language | null;
    if (stored && ["az", "ru", "en"].includes(stored)) {
      setLangState(stored);
    }
  }, []);

  const setLang = (next: Language) => {
    setLangState(next);
    localStorage.setItem("hspts_lang", next);
  };

  const value = useMemo<I18nContextType>(
    () => ({
      lang,
      setLang,
      t: (key: string, fallback = key) => dictionary[lang][key] || fallback,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside LanguageProvider");
  }
  return ctx;
}

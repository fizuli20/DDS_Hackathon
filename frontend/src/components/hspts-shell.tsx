"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

const navigation = [
  { href: "/admin", labelKey: "nav.overview", fallback: "Overview", icon: LayoutDashboard },
  { href: "/students", labelKey: "nav.students", fallback: "Students", icon: Users },
  { href: "/students/hspts-1004", labelKey: "nav.studentProfile", fallback: "Student Profile", icon: Sparkles },
  { href: "/reports", labelKey: "nav.reports", fallback: "Reports", icon: FileText },
  { href: "/data-sources", labelKey: "nav.dataSources", fallback: "Data Sources", icon: FileText },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav className="space-y-2">
      {navigation.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
              active
                ? "bg-[#F40F2C] text-white shadow-[0_18px_40px_-22px_rgba(244,15,44,0.85)]"
                : "text-[#4b5563] hover:bg-[#fff1f2] hover:text-[#111827]",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{t(item.labelKey, item.fallback)}</span>
            <span
              className={cn(
                "ml-auto h-2 w-2 rounded-full transition-opacity",
                active ? "bg-white/80 opacity-100" : "bg-[#F40F2C] opacity-0 group-hover:opacity-100",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

function HolbertonMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1f2] text-[#F40F2C] shadow-[0_18px_40px_-24px_rgba(244,15,44,0.85)]">
        <div className="grid grid-cols-2 gap-1">
          <span className="h-1.5 w-1.5 rounded-sm bg-current" />
          <span className="h-1.5 w-1.5 rounded-sm bg-current" />
          <span className="col-span-2 h-1.5 rounded-sm bg-current" />
          <span className="h-1.5 w-1.5 rounded-sm bg-current" />
          <span className="h-1.5 w-1.5 rounded-sm bg-current" />
        </div>
      </div>
      <div>
        <p className="text-lg font-black tracking-[-0.04em] text-[#F40F2C]">Holberton</p>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
          HSPTS
        </p>
      </div>
    </div>
  );
}

export function HsptsShell({
  children,
  universityName,
}: {
  children: React.ReactNode;
  universityName?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" || pathname === "/sign-in" || pathname === "/register";
  const isStudentPortalRoute = pathname === "/student-portal";
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "user">("user");
  const [authChecked, setAuthChecked] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const getSessionValue = (key: string) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    try {
      setIsLoggedIn(getSessionValue("hspts_auth") === "true");
      setUserRole(
        getSessionValue("hspts_user_role") === "admin" ? "admin" : "user",
      );
      // Clear legacy persisted auth from previous versions.
      localStorage.removeItem("hspts_auth");
      localStorage.removeItem("hspts_user_email");
      localStorage.removeItem("hspts_user_role");
    } catch {
      setIsLoggedIn(false);
      setUserRole("user");
    }
    setAuthChecked(true);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchValue = new URLSearchParams(window.location.search).get("q") ?? "";
    setGlobalSearch(searchValue);
  }, [pathname]);

  const handleGlobalSearchSubmit = () => {
    const value = globalSearch.trim();
    const query = value ? `?q=${encodeURIComponent(value)}` : "";
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("hspts-global-search", {
          detail: { value },
        }),
      );
    }
    router.push(`/students${query}`);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem("hspts_auth");
      sessionStorage.removeItem("hspts_user_email");
      sessionStorage.removeItem("hspts_user_role");
      localStorage.removeItem("hspts_auth");
      localStorage.removeItem("hspts_user_email");
      localStorage.removeItem("hspts_user_role");
    } catch {
      // Ignore storage access issues in restricted browsers.
    }
    setIsLoggedIn(false);
    router.push("/login");
  };

  useEffect(() => {
    if (!authChecked || isAuthRoute) {
      return;
    }
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    if (userRole === "user" && pathname !== "/student-portal") {
      router.replace("/student-portal");
      return;
    }

    if (userRole === "admin" && isStudentPortalRoute) {
      router.replace("/admin");
    }
  }, [authChecked, isAuthRoute, isLoggedIn, isStudentPortalRoute, pathname, router, userRole]);

  if (isAuthRoute) {
    return (
      <div
        className="min-h-screen bg-white text-[#111827]"
        style={{
          fontFamily:
            '"Avenir Next", "Segoe UI Variable", "SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        {children}
      </div>
    );
  }

  if (!authChecked || !isLoggedIn) {
    return null;
  }

  if (isStudentPortalRoute) {
    return (
      <div
        className="min-h-screen bg-white text-[#111827]"
        style={{
          fontFamily:
            '"Avenir Next", "Segoe UI Variable", "SF Pro Display", "Helvetica Neue", sans-serif',
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white text-[#111827]"
      style={{
        fontFamily:
          '"Avenir Next", "Segoe UI Variable", "SF Pro Display", "Helvetica Neue", sans-serif',
      }}
    >
      <div className="relative flex min-h-screen">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[-10%] top-[-12rem] h-[30rem] w-[30rem] rounded-full bg-[#F40F2C]/8 blur-3xl" />
          <div className="absolute right-[-8%] top-[10rem] h-[24rem] w-[24rem] rounded-full bg-[#fda4af]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(226,232,240,0.22)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,232,240,0.22)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" />
        </div>

        <aside className="relative hidden w-[288px] shrink-0 border-r border-[#f1f5f9] bg-white/90 px-5 py-6 backdrop-blur-xl xl:flex xl:flex-col">
          <HolbertonMark />
          <div className="mt-10">
            <p className="px-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#9ca3af]">
              {t("shell.navigation", "Navigation")}
            </p>
            <div className="mt-4">
              <NavLinks />
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-[#fecdd3] bg-[linear-gradient(180deg,_rgba(244,15,44,0.1),_rgba(255,255,255,0.96)_80%)] p-5 shadow-[0_24px_70px_-46px_rgba(244,15,44,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F40F2C]">
              {t("shell.campusView", "Campus view")}
            </p>
            <p className="mt-3 text-lg font-black tracking-tight text-[#111827]">
              {universityName ?? "Holberton School"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              {t(
                "shell.builtFor",
                "Built for education operations: mentor intervention, student health, and exportable performance reporting.",
              )}
            </p>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[#f1f5f9] bg-white/85 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6 xl:px-8">
              <div className="xl:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-11 w-11 rounded-xl border-[#e5e7eb] bg-white text-[#111827] hover:bg-[#fff1f2]"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[300px] border-[#f1f5f9] bg-white p-5 text-[#111827]"
                    closeLabel={t("common.close", "Close")}
                  >
                    <SheetTitle className="sr-only">{t("shell.navigation", "Navigation")}</SheetTitle>
                    <HolbertonMark />
                    <div className="mt-8">
                      <div className="mb-4">
                        <LanguageSwitcher />
                      </div>
                      <NavLinks />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              <div className="xl:hidden">
                <HolbertonMark />
              </div>

              <div className="relative ml-auto hidden max-w-xl flex-1 xl:block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
                <Input
                  value={globalSearch}
                  onChange={(event) => setGlobalSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleGlobalSearchSubmit();
                    }
                  }}
                  placeholder={t("shell.search", "Search student, cohort, mentor, report...")}
                  className="h-12 rounded-2xl border-[#e5e7eb] bg-white pl-11 text-[#111827] placeholder:text-[#9ca3af] focus-visible:ring-[#F40F2C]"
                />
              </div>

              <div className="ml-auto flex items-center gap-3 xl:ml-4">
                <div className="hidden lg:block">
                  <LanguageSwitcher />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogout}
                  className="h-11 rounded-xl border-[#fecdd3] bg-white px-4 text-[#111827] hover:bg-[#fff1f2]"
                >
                  {t("common.logout", "Logout")}
                </Button>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#111827] transition-colors hover:bg-[#fff1f2]"
                  aria-label={t("shell.notifications", "Notifications")}
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#F40F2C]" />
                </button>
                {notificationsOpen ? (
                  <div className="absolute right-4 top-[72px] z-40 w-[320px] rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_24px_50px_-30px_rgba(17,24,39,0.45)]">
                    <p className="text-sm font-semibold text-[#111827]">
                      {t("shell.notifications", "Notifications")}
                    </p>
                    <p className="mt-2 text-sm text-[#6b7280]">
                      {t("shell.noNotifications", "No new notifications.")}
                    </p>
                  </div>
                ) : null}

                <div className="hidden items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2 sm:flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1f2] font-bold text-[#F40F2C]">
                    HS
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">
                      {t("shell.role", "Academic Lead")}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                      {t("shell.roleSub", "university admin")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="relative flex-1 px-4 py-6 sm:px-6 xl:px-8 xl:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

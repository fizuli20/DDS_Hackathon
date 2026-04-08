"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navigation = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/students/hspts-1004", label: "Student Profile", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

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
            <span>{item.label}</span>
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
              Navigation
            </p>
            <div className="mt-4">
              <NavLinks />
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-[#fecdd3] bg-[linear-gradient(180deg,_rgba(244,15,44,0.1),_rgba(255,255,255,0.96)_80%)] p-5 shadow-[0_24px_70px_-46px_rgba(244,15,44,0.6)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#F40F2C]">
              Campus view
            </p>
            <p className="mt-3 text-lg font-black tracking-tight text-[#111827]">
              {universityName ?? "Holberton School"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6b7280]">
              Built for education operations: mentor intervention, student health, and exportable performance reporting.
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
                  <SheetContent side="left" className="w-[300px] border-[#f1f5f9] bg-white p-5 text-[#111827]">
                    <SheetTitle className="sr-only">Holberton navigation</SheetTitle>
                    <HolbertonMark />
                    <div className="mt-8">
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
                  placeholder="Search student, cohort, mentor, report..."
                  className="h-12 rounded-2xl border-[#e5e7eb] bg-white pl-11 text-[#111827] placeholder:text-[#9ca3af] focus-visible:ring-[#F40F2C]"
                />
              </div>

              <div className="ml-auto flex items-center gap-3 xl:ml-4">
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e5e7eb] bg-white text-[#111827] transition-colors hover:bg-[#fff1f2]"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-[#F40F2C]" />
                </button>

                <div className="hidden items-center gap-3 rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2 sm:flex">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff1f2] font-bold text-[#F40F2C]">
                    HS
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827]">Academic Lead</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9ca3af]">
                      university admin
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

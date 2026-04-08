"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { getStoredToken } from "@/lib/auth-client";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

type AuditRow = {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  diff: Record<string, unknown> | null;
  createdAt: string;
};

export default function AdminAuditPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      const token = getStoredToken();
      if (!token) {
        setError(t("audit.notSignedIn", "Sign in as an admin to view audit logs."));
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${apiBase}/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await res.json().catch(() => ({}))) as AuditRow[] | { message?: string };
        if (!res.ok) {
          const msg =
            typeof data === "object" && data && "message" in data && typeof data.message === "string"
              ? data.message
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t("common.unknownError", "Unknown error occurred."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-10 pt-4 sm:px-0">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="h-10 rounded-xl border-[#e5e7eb]">
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("audit.backToOverview", "Back to overview")}
          </Link>
        </Button>
      </div>

      <Card className="rounded-2xl border border-[#e5e7eb]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-black text-[#111827]">
            <ScrollText className="h-6 w-6 text-[#F40F2C]" />
            {t("audit.title", "Audit log")}
          </CardTitle>
          <p className="text-sm text-[#6b7280]">
            {t(
              "audit.description",
              "Recent security and account events (admin only). Requires API with database and JWT.",
            )}
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-[#6b7280]">{t("common.loading", "Loading...")}</p>
          ) : error ? (
            <p className="text-sm font-medium text-[#b91c1c]">{error}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-[#6b7280]">{t("audit.empty", "No audit entries yet.")}</p>
          ) : (
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e5e7eb] text-xs font-semibold uppercase tracking-[0.12em] text-[#9ca3af]">
                    <th className="py-3 pr-4">{t("audit.when", "When")}</th>
                    <th className="py-3 pr-4">{t("audit.action", "Action")}</th>
                    <th className="py-3 pr-4">{t("audit.actor", "Actor")}</th>
                    <th className="py-3">{t("audit.details", "Details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b border-[#f3f4f6] align-top">
                      <td className="py-2.5 pr-4 font-mono text-xs text-[#374151]">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-4 font-medium text-[#111827]">{row.action}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-[#6b7280]">
                        {row.actorUserId ?? "—"}
                      </td>
                      <td className="py-2.5 text-xs text-[#4b5563]">
                        <pre className="max-h-32 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-[#fafafa] p-2 font-mono text-[11px]">
                          {row.diff ? JSON.stringify(row.diff, null, 2) : "—"}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

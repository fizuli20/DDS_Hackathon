"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

type DataSource = {
  id: string;
  name: string;
  sheetUrl: string;
  type: string;
  cohort: string | null;
  active: boolean;
  priority: number;
  columnMapping: Record<string, string>;
  lastSyncedAt: string | null;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";

export function DataSourcesScreen() {
  const { t } = useI18n();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aggregate, setAggregate] = useState<{
    cohort: string;
    totalStudents: number;
    averages: { pld: number; task: number; exam: number; attendance: number; overall: number };
  } | null>(null);
  const [cohortFilter, setCohortFilter] = useState("all");
  const [form, setForm] = useState({
    name: "",
    sheetUrl: "",
    type: "combined",
    cohort: "",
    customCohort: "",
    priority: "100",
    mappingJson:
      '{\n  "name": "student name",\n  "studentId": "student id",\n  "pld": "pld score",\n  "task": "task score",\n  "exam": "exam score",\n  "attendance": "attendance activity",\n  "overall": "overall"\n}',
  });

  const fetchSources = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/data-sources`);
      if (!response.ok) throw new Error("Failed to load data sources.");
      const data = (await response.json()) as DataSource[];
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data sources.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAggregate = async (cohort?: string) => {
    const normalized = cohort && cohort !== "all" ? cohort.trim() : "";
    const query = normalized ? `?cohort=${encodeURIComponent(normalized)}` : "";
    const response = await fetch(`${apiBaseUrl}/data-sources/aggregate${query}`);
    if (!response.ok) throw new Error("Failed to load aggregate.");
    const data = await response.json();
    setAggregate(data);
  };

  useEffect(() => {
    void fetchSources();
    void fetchAggregate();
  }, []);

  const cohorts = useMemo(() => {
    return [...new Set(sources.map((item) => item.cohort).filter(Boolean))] as string[];
  }, [sources]);

  const resolvedFormCohort = useMemo(() => {
    if (form.cohort === "__custom__") {
      return form.customCohort.trim();
    }
    return form.cohort.trim();
  }, [form.cohort, form.customCohort]);

  const onCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const parsedMapping = JSON.parse(form.mappingJson) as Record<string, string>;
      const response = await fetch(`${apiBaseUrl}/data-sources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sheetUrl: form.sheetUrl,
          type: form.type,
          cohort: resolvedFormCohort || undefined,
          priority: Number(form.priority) || 100,
          active: true,
          columnMapping: parsedMapping,
        }),
      });
      if (!response.ok) throw new Error("Failed to create source.");
      setForm((prev) => ({ ...prev, name: "", sheetUrl: "", cohort: "", customCohort: "" }));
      await fetchSources();
      await fetchAggregate(cohortFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create source.");
    } finally {
      setSaving(false);
    }
  };

  const onSyncAll = async () => {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/data-sources/sync/all`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to sync sources.");
      await fetchSources();
      await fetchAggregate(cohortFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync sources.");
    }
  };

  const onSyncOne = async (id: string) => {
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/data-sources/${id}/sync`, { method: "POST" });
      if (!response.ok) throw new Error("Failed to sync source.");
      await fetchSources();
      await fetchAggregate(cohortFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync source.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-[#fecdd3]">
        <CardHeader>
          <CardTitle className="text-2xl font-black text-[#111827]">
            {t("dataSources.title", "Data Sources Admin")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-[#F40F2C] text-white hover:bg-[#d60d28]" onClick={onSyncAll}>
              {t("dataSources.syncAll", "Sync all active sources")}
            </Button>
            <Select value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger className="h-10 w-[260px] rounded-xl border-[#e5e7eb] bg-white">
                <SelectValue placeholder={t("dataSources.selectCohort", "Select cohort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dataSources.allCohorts", "All cohorts")}</SelectItem>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort} value={cohort}>
                    {cohort}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => void fetchAggregate(cohortFilter)}
              className="border-[#fecdd3]"
            >
              {t("dataSources.aggregateByCohort", "Aggregate by cohort")}
            </Button>
          </div>
          {aggregate ? (
            <div className="rounded-xl bg-[#fafafa] p-4 text-sm text-[#111827]">
              {t("dataSources.cohort", "Cohort")}: <b>{aggregate.cohort}</b> |{" "}
              {t("dataSources.students", "Students")}: <b>{aggregate.totalStudents}</b> |{" "}
              {t("dataSources.avgOverall", "Avg Overall")}: <b>{aggregate.averages.overall}</b>
            </div>
          ) : null}
          {error ? <p className="text-sm text-[#b91c1c]">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#e5e7eb]">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#111827]">
            {t("dataSources.addTitle", "Add Data Source")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2" onSubmit={onCreate}>
            <Input
              placeholder={t("dataSources.sourceName", "Source name")}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <Input
              placeholder={t("dataSources.sheetUrl", "Sheet URL")}
              value={form.sheetUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, sheetUrl: event.target.value }))}
              required
            />
            <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}>
              <SelectTrigger className="h-10 rounded-xl border-[#e5e7eb] bg-white">
                <SelectValue placeholder={t("dataSources.typePlaceholder", "Source type")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="combined">combined</SelectItem>
                <SelectItem value="pld">pld</SelectItem>
                <SelectItem value="task_exam">task_exam</SelectItem>
                <SelectItem value="attendance">attendance</SelectItem>
                <SelectItem value="custom">custom</SelectItem>
              </SelectContent>
            </Select>
            <Select value={form.cohort || "all"} onValueChange={(value) => setForm((prev) => ({ ...prev, cohort: value === "all" ? "" : value }))}>
              <SelectTrigger className="h-10 rounded-xl border-[#e5e7eb] bg-white">
                <SelectValue placeholder={t("dataSources.selectCohort", "Select cohort")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dataSources.allCohorts", "All cohorts")}</SelectItem>
                {cohorts.map((cohort) => (
                  <SelectItem key={cohort} value={cohort}>
                    {cohort}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">{t("dataSources.addNewCohort", "Add new cohort...")}</SelectItem>
              </SelectContent>
            </Select>
            {form.cohort === "__custom__" ? (
              <Input
                placeholder={t("dataSources.newCohortName", "New cohort name")}
                value={form.customCohort}
                onChange={(event) => setForm((prev) => ({ ...prev, customCohort: event.target.value }))}
              />
            ) : null}
            <Input
              placeholder={t("dataSources.priority", "Priority (1 = highest)")}
              value={form.priority}
              onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}
            />
            <textarea
              value={form.mappingJson}
              onChange={(event) => setForm((prev) => ({ ...prev, mappingJson: event.target.value }))}
              className="md:col-span-2 min-h-[160px] rounded-xl border border-[#e5e7eb] p-3 text-sm"
            />
            <div className="md:col-span-2">
              <Button type="submit" disabled={saving} className="bg-[#F40F2C] text-white hover:bg-[#d60d28]">
                {saving ? t("dataSources.saving", "Saving...") : t("dataSources.saveSync", "Save + Sync")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-[#e5e7eb]">
        <CardHeader>
          <CardTitle className="text-xl font-black text-[#111827]">
            {t("dataSources.registered", "Registered Sources")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-[#6b7280]">{t("common.loading", "Loading...")}</p> : null}
          <div className="space-y-3">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fafafa] p-3"
              >
                <div className="text-sm text-[#111827]">
                  <p className="font-semibold">{source.name}</p>
                  <p className="text-xs text-[#6b7280]">
                    {source.type} | cohort={source.cohort || "all"} | priority={source.priority} |{" "}
                    {source.active
                      ? t("dataSources.active", "active")
                      : t("dataSources.inactive", "inactive")}
                  </p>
                  <p className="text-xs text-[#6b7280]">
                    {t("dataSources.lastSync", "last sync")}:{" "}
                    {source.lastSyncedAt
                      ? new Date(source.lastSyncedAt).toLocaleString()
                      : t("dataSources.never", "never")}
                  </p>
                </div>
                <Button variant="outline" className="border-[#fecdd3]" onClick={() => void onSyncOne(source.id)}>
                  {t("dataSources.syncNow", "Sync now")}
                </Button>
              </div>
            ))}
          </div>
          {cohorts.length ? (
            <p className="mt-4 text-xs text-[#6b7280]">
              {t("dataSources.detectedCohorts", "Detected cohorts")}: {cohorts.join(", ")}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Serverless-friendly Data Sources registry + unified merge (mirrors Nest DataSourcesService).
 * Persists in globalThis across warm invocations; no separate Postgres required for Vercel demo.
 */

import { randomUUID } from "node:crypto";
import { csvToRows, fetchGoogleSheetCsv } from "@/lib/sheet-parser";
import { DEFAULT_GOOGLE_SHEET_URL } from "@/lib/sheet-config";

export type PublicDataSource = {
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

type InternalSource = PublicDataSource & { createdAt: string };

type UnifiedRow = {
  mergeKey: string;
  studentId: string | null;
  name: string;
  cohort: string | null;
  pld: number | null;
  task: number | null;
  exam: number | null;
  attendance: number | null;
  overall: number | null;
  sourcePriority: number;
  lastSourceType: string;
  lastSyncedAt: string;
  updatedAt: string;
};

type Store = {
  sources: InternalSource[];
  unified: Map<string, UnifiedRow>;
  initialSyncAttempted: boolean;
};

function normalizeHeader(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toNumber(value: string | undefined): number | null {
  if (!value || !value.trim()) return null;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function getStore(): Store {
  const g = globalThis as unknown as { __hspts_ds_store?: Store };
  if (!g.__hspts_ds_store) {
    g.__hspts_ds_store = {
      sources: [],
      unified: new Map(),
      initialSyncAttempted: false,
    };
    seedDefaultSource(g.__hspts_ds_store);
  }
  return g.__hspts_ds_store;
}

function seedDefaultSource(store: Store) {
  if (store.sources.length > 0) return;
  const now = new Date().toISOString();
  store.sources.push({
    id: randomUUID(),
    name: "Default cohort sheet",
    sheetUrl: DEFAULT_GOOGLE_SHEET_URL,
    type: "combined",
    cohort: null,
    active: true,
    priority: 100,
    columnMapping: {},
    lastSyncedAt: null,
    createdAt: now,
  });
}

function defaultMappingForType(type: string): Record<string, string> {
  const base = {
    studentId: "student id",
    name: "student name",
    cohort: "cohort",
  };
  if (type === "pld") {
    return { ...base, pld: "pld score", overall: "overall" };
  }
  if (type === "task_exam") {
    return { ...base, task: "task score", exam: "exam score", overall: "overall" };
  }
  if (type === "attendance") {
    return { ...base, attendance: "attendance activity", overall: "overall" };
  }
  return {
    ...base,
    pld: "pld score",
    task: "task score",
    exam: "exam score",
    attendance: "attendance activity",
    overall: "overall",
  };
}

function buildMergeKey(studentId: string | null, name: string, cohort: string | null) {
  if (studentId) {
    return `sid:${studentId.toLowerCase()}`;
  }
  return `name:${name.toLowerCase()}|cohort:${(cohort || "unknown").toLowerCase()}`;
}

type NormalizedRow = {
  mergeKey: string;
  studentId: string | null;
  name: string;
  cohort: string | null;
  pld: number | null;
  task: number | null;
  exam: number | null;
  attendance: number | null;
  overall: number | null;
};

function parseRowsForSource(source: InternalSource, rows: string[][]): NormalizedRow[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((item) => normalizeHeader(item));
  const mapping = {
    ...defaultMappingForType(source.type),
    ...(source.columnMapping || {}),
  };
  const colIndex = (key: string) => {
    const mapped = normalizeHeader(mapping[key] || "");
    if (!mapped) return -1;
    return headers.findIndex((item) => item === mapped);
  };

  const idx = {
    studentId: colIndex("studentId"),
    name: colIndex("name"),
    cohort: colIndex("cohort"),
    pld: colIndex("pld"),
    task: colIndex("task"),
    exam: colIndex("exam"),
    attendance: colIndex("attendance"),
    overall: colIndex("overall"),
  };

  return rows.slice(1).map((row) => {
    const studentId = idx.studentId >= 0 ? row[idx.studentId]?.trim() || null : null;
    const name = idx.name >= 0 ? row[idx.name]?.trim() || "" : "";
    const cohort = (idx.cohort >= 0 ? row[idx.cohort]?.trim() : source.cohort || "") || null;
    const safeName = name || (studentId ? `Student ${studentId}` : "Unknown Student");
    return {
      mergeKey: buildMergeKey(studentId, safeName, cohort),
      studentId,
      name: safeName,
      cohort,
      pld: idx.pld >= 0 ? toNumber(row[idx.pld]) : null,
      task: idx.task >= 0 ? toNumber(row[idx.task]) : null,
      exam: idx.exam >= 0 ? toNumber(row[idx.exam]) : null,
      attendance: idx.attendance >= 0 ? toNumber(row[idx.attendance]) : null,
      overall: idx.overall >= 0 ? toNumber(row[idx.overall]) : null,
    };
  });
}

function mergeIntoUnified(store: Store, source: InternalSource, normalized: NormalizedRow[]) {
  const now = new Date().toISOString();
  for (const item of normalized) {
    const existing = store.unified.get(item.mergeKey);
    if (!existing) {
      store.unified.set(item.mergeKey, {
        ...item,
        sourcePriority: source.priority,
        lastSourceType: source.type,
        lastSyncedAt: now,
        updatedAt: now,
      });
      continue;
    }

    const higherPriority = source.priority <= existing.sourcePriority;
    const patch: Partial<UnifiedRow> = {
      studentId: existing.studentId || item.studentId,
      name: item.name || existing.name,
      cohort: item.cohort || existing.cohort,
      lastSyncedAt: now,
      lastSourceType: source.type,
      updatedAt: now,
    };

    const fields: Array<keyof NormalizedRow> = ["pld", "task", "exam", "attendance", "overall"];
    for (const field of fields) {
      const incoming = item[field] as number | null;
      const current = existing[field] as number | null;
      if (incoming === null) continue;
      if (higherPriority || current === null) {
        (patch as Record<string, unknown>)[field] = incoming;
      }
    }

    if (higherPriority) {
      patch.sourcePriority = source.priority;
    }

    store.unified.set(item.mergeKey, { ...existing, ...patch } as UnifiedRow);
  }
}

async function syncSourceInternal(store: Store, source: InternalSource): Promise<{ rows: number }> {
  const csv = await fetchGoogleSheetCsv(source.sheetUrl);
  const rows = csvToRows(csv);
  const normalized = parseRowsForSource(source, rows);
  mergeIntoUnified(store, source, normalized);
  source.lastSyncedAt = new Date().toISOString();
  return { rows: normalized.length };
}

function sortSourcesForSync(sources: InternalSource[]) {
  return [...sources].filter((s) => s.active).sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
}

export async function listDataSources(): Promise<PublicDataSource[]> {
  const store = getStore();
  if (!store.initialSyncAttempted && store.unified.size === 0 && store.sources.some((s) => s.active)) {
    store.initialSyncAttempted = true;
    try {
      await syncAllActiveInternal(store);
    } catch {
      // keep UI usable; user can retry Sync
    }
  }
  return store.sources
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((s) => ({
      id: s.id,
      name: s.name,
      sheetUrl: s.sheetUrl,
      type: s.type,
      cohort: s.cohort,
      active: s.active,
      priority: s.priority,
      columnMapping: s.columnMapping,
      lastSyncedAt: s.lastSyncedAt,
    }));
}

export async function createDataSource(body: {
  name: string;
  sheetUrl: string;
  type: string;
  cohort?: string;
  active?: boolean;
  priority?: number;
  columnMapping?: Record<string, string>;
}): Promise<PublicDataSource> {
  const allowed = new Set(["pld", "task_exam", "attendance", "combined", "custom"]);
  if (!allowed.has(body.type)) {
    throw new Error("Invalid source type.");
  }
  const priority = body.priority != null ? Number(body.priority) : 100;
  if (!Number.isFinite(priority) || priority < 1) {
    throw new Error("priority must be >= 1.");
  }
  const store = getStore();
  const now = new Date().toISOString();
  const source: InternalSource = {
    id: randomUUID(),
    name: body.name.trim(),
    sheetUrl: body.sheetUrl.trim(),
    type: body.type,
    cohort: body.cohort?.trim() || null,
    active: body.active ?? true,
    priority,
    columnMapping: body.columnMapping ?? {},
    lastSyncedAt: null,
    createdAt: now,
  };
  store.sources.push(source);
  await syncSourceInternal(store, source);
  return {
    id: source.id,
    name: source.name,
    sheetUrl: source.sheetUrl,
    type: source.type,
    cohort: source.cohort,
    active: source.active,
    priority: source.priority,
    columnMapping: source.columnMapping,
    lastSyncedAt: source.lastSyncedAt,
  };
}

export async function updateDataSource(
  id: string,
  body: Partial<{
    name: string;
    sheetUrl: string;
    type: string;
    cohort: string | null;
    active: boolean;
    priority: number;
    columnMapping: Record<string, string>;
  }>,
): Promise<PublicDataSource> {
  const store = getStore();
  const source = store.sources.find((s) => s.id === id);
  if (!source) {
    throw new Error("Data source not found.");
  }
  const allowed = new Set(["pld", "task_exam", "attendance", "combined", "custom"]);
  if (body.type !== undefined && !allowed.has(body.type)) {
    throw new Error("Invalid source type.");
  }
  if (body.name !== undefined) source.name = body.name.trim();
  if (body.sheetUrl !== undefined) source.sheetUrl = body.sheetUrl.trim();
  if (body.type !== undefined) source.type = body.type;
  if (body.cohort !== undefined) source.cohort = body.cohort?.trim() || null;
  if (body.active !== undefined) source.active = body.active;
  if (body.priority !== undefined) {
    const p = Number(body.priority);
    if (!Number.isFinite(p) || p < 1) throw new Error("priority must be >= 1.");
    source.priority = p;
  }
  if (body.columnMapping !== undefined) source.columnMapping = body.columnMapping;

  return {
    id: source.id,
    name: source.name,
    sheetUrl: source.sheetUrl,
    type: source.type,
    cohort: source.cohort,
    active: source.active,
    priority: source.priority,
    columnMapping: source.columnMapping,
    lastSyncedAt: source.lastSyncedAt,
  };
}

async function rebuildUnified(store: Store) {
  store.unified.clear();
  const ordered = sortSourcesForSync(store.sources);
  for (const source of ordered) {
    await syncSourceInternal(store, source);
  }
}

export async function deleteDataSource(id: string): Promise<{ ok: boolean }> {
  const store = getStore();
  const idx = store.sources.findIndex((s) => s.id === id);
  if (idx === -1) {
    throw new Error("Data source not found.");
  }
  store.sources.splice(idx, 1);
  await rebuildUnified(store);
  return { ok: true };
}

async function syncAllActiveInternal(store: Store) {
  const ordered = sortSourcesForSync(store.sources);
  const results: Array<{ sourceId: string; rows: number }> = [];
  for (const source of ordered) {
    const stats = await syncSourceInternal(store, source);
    results.push({ sourceId: source.id, rows: stats.rows });
  }
  return { running: false, syncedSources: results.length, results };
}

export async function syncAllActive() {
  const store = getStore();
  return syncAllActiveInternal(store);
}

export async function syncOne(id: string) {
  const store = getStore();
  const source = store.sources.find((s) => s.id === id);
  if (!source) {
    throw new Error("Data source not found.");
  }
  const stats = await syncSourceInternal(store, source);
  return { sourceId: id, ...stats };
}

export async function aggregateByCohort(cohort?: string) {
  const store = getStore();
  if (store.unified.size === 0 && store.sources.some((s) => s.active)) {
    try {
      await syncAllActiveInternal(store);
    } catch {
      // Sheet/network issue; return zeros so UI still loads
    }
  }
  let students = [...store.unified.values()];
  if (cohort?.trim()) {
    const c = cohort.trim().toLowerCase();
    students = students.filter((u) => (u.cohort || "").toLowerCase() === c);
  }
  students.sort((a, b) => a.name.localeCompare(b.name));
  const count = students.length || 1;
  const avg = (field: keyof UnifiedRow) =>
    Number(
      (
        students.reduce((sum, item) => sum + Number((item[field] as number | null) ?? 0), 0) / count
      ).toFixed(2),
    );
  return {
    cohort: cohort?.trim() || "all",
    totalStudents: students.length,
    averages: {
      pld: avg("pld"),
      task: avg("task"),
      exam: avg("exam"),
      attendance: avg("attendance"),
      overall: avg("overall"),
    },
    students: students.map((item) => ({
      studentId: item.studentId,
      name: item.name,
      cohort: item.cohort,
      pld: item.pld,
      task: item.task,
      exam: item.exam,
      attendance: item.attendance,
      overall: item.overall,
      updatedAt: item.updatedAt,
    })),
  };
}

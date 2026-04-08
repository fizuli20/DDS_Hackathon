/**
 * Server-safe Google Sheet CSV fetch + parsing (mirrors backend AnalysisService logic).
 * Used by Next.js API routes so production works without a separate Nest backend.
 */

export type SheetStudent = {
  row: number;
  name: string;
  studentId: string;
  pld: number;
  task: number;
  exam: number;
  attendance: number;
  overall: number;
};

export type SheetSummary = {
  totalStudents: number;
  averages: { pld: number; task: number; exam: number; attendance: number; overall: number };
  weakestStudents: string[];
  students: SheetStudent[];
};

const DEFAULT_SHEET =
  process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL ||
  "https://docs.google.com/spreadsheets/d/1cgPq-M2cGkyElpf9ORcbp4uK-YhuHSODj00aTN9XZzg/edit?usp=sharing";

export function extractSheetId(sheetUrl: string): string {
  const direct = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (direct?.[1]) return direct[1];
  throw new Error("Invalid Google Sheet URL.");
}

export function extractGid(sheetUrl: string): string {
  const m = sheetUrl.match(/[#&?]gid=(\d+)/);
  return m?.[1] ?? "0";
}

function looksLikeHtml(text: string): boolean {
  const t = text.slice(0, 500).trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("<html");
}

export function csvToRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }
  return rows;
}

function normalizeHeader(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toNumber(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getColumnIndex(headers: string[], alternatives: string[]) {
  for (const candidate of alternatives) {
    const normalized = normalizeHeader(candidate);
    const idx = headers.findIndex((h) => h === normalized);
    if (idx !== -1) return idx;
  }
  return -1;
}

export function summarizeRows(rows: string[][]): SheetSummary {
  const headers = rows[0].map((h) => normalizeHeader(h));
  const dataRows = rows.slice(1);

  const nameIdx = getColumnIndex(headers, [
    "student name",
    "studentname",
    "full name",
    "fullname",
    "name",
  ]);
  const studentIdIdx = getColumnIndex(headers, ["student id", "studentid", "id"]);
  const pldIdx = getColumnIndex(headers, ["pld score", "pld"]);
  const taskIdx = getColumnIndex(headers, ["task score", "task"]);
  const attendanceIdx = getColumnIndex(headers, ["attendance activity", "attendance"]);
  const examIdx = getColumnIndex(headers, ["exam score", "exam", "examscore"]);
  const overallIdx = getColumnIndex(headers, ["overall", "overall score", "overallscore"]);

  if (pldIdx === -1 || taskIdx === -1 || attendanceIdx === -1 || overallIdx === -1) {
    throw new Error(
      "Required columns not found. Need: PLD score, task score, attendance activity, overall.",
    );
  }

  const students = dataRows.map((row, idx) => ({
    row: idx + 2,
    name: row[nameIdx] || `Student ${idx + 1}`,
    studentId: row[studentIdIdx] || `N/A-${idx + 1}`,
    pld: toNumber(row[pldIdx]),
    task: toNumber(row[taskIdx]),
    exam: examIdx === -1 ? 0 : toNumber(row[examIdx]),
    attendance: toNumber(row[attendanceIdx]),
    overall: toNumber(row[overallIdx]),
  }));

  const count = students.length || 1;
  const avg = (field: keyof SheetStudent) =>
    Number(
      (students.reduce((sum, student) => sum + Number(student[field]), 0) / count).toFixed(2),
    );
  const weakest = [...students]
    .sort((a, b) => a.overall - b.overall)
    .slice(0, 5)
    .map((s) => `${s.name} (${s.studentId}) overall=${s.overall}`);

  return {
    totalStudents: students.length,
    averages: {
      pld: avg("pld"),
      task: avg("task"),
      exam: avg("exam"),
      attendance: avg("attendance"),
      overall: avg("overall"),
    },
    weakestStudents: weakest,
    students,
  };
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; HSPTS/1.0; +https://www.holbertonschool.com) Node.js fetch",
  Accept: "text/csv,text/plain,*/*",
};

export async function fetchGoogleSheetCsv(sheetUrl: string): Promise<string> {
  const sheetId = extractSheetId(sheetUrl);
  const gid = extractGid(sheetUrl);
  const urls = [
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`,
    `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`,
  ];

  let lastMessage = "Failed to fetch Google Sheet.";
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: FETCH_HEADERS, redirect: "follow" });
      if (!response.ok) {
        lastMessage = `Google returned HTTP ${response.status} for sheet export.`;
        continue;
      }
      const text = await response.text();
      if (looksLikeHtml(text)) {
        lastMessage =
          "Sheet returned HTML instead of CSV. Publish the sheet: File → Share → Anyone with the link can view.";
        continue;
      }
      const rows = csvToRows(text);
      if (rows.length >= 2) {
        return text;
      }
      lastMessage = "Google Sheet has no data rows.";
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastMessage);
}

export function resolveSheetUrl(raw?: string | null): string {
  const candidate = raw?.trim();
  return candidate && candidate.length > 0 ? candidate : DEFAULT_SHEET;
}

export async function loadAndSummarizeSheet(sheetUrl?: string | null): Promise<{
  sheetUrl: string;
  summary: SheetSummary;
}> {
  const resolved = resolveSheetUrl(sheetUrl);
  const csv = await fetchGoogleSheetCsv(resolved);
  const rows = csvToRows(csv);
  if (rows.length < 2) {
    throw new Error("Google Sheet has no data rows.");
  }
  return { sheetUrl: resolved, summary: summarizeRows(rows) };
}

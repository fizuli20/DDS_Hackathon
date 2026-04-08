import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { OpenRouterAnalysisDto } from './dto/openrouter-analysis.dto';
import { GoogleSheetAnalysisDto } from './dto/google-sheet-analysis.dto';

type OpenRouterResponse = {
  id: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AiTrendItem = {
  studentId: string;
  trend: 'up' | 'down' | 'stable';
  delta: number;
  reason: string;
};

@Injectable()
export class AnalysisService {
  private readonly defaultSheetUrl =
    process.env.GOOGLE_SHEET_URL ||
    'https://docs.google.com/spreadsheets/d/1cgPq-M2cGkyElpf9ORcbp4uK-YhuHSODj00aTN9XZzg/edit?usp=sharing';

  private resolveSheetUrl(raw?: string) {
    const candidate = raw?.trim();
    return candidate && candidate.length > 0 ? candidate : this.defaultSheetUrl;
  }

  private fallbackInsightsText(summary: {
    totalStudents: number;
    averages: { pld: number; task: number; exam: number; attendance: number; overall: number };
    weakestStudents: string[];
  }) {
    return [
      `Total students: ${summary.totalStudents}`,
      `Average overall: ${summary.averages.overall}`,
      `Average attendance: ${summary.averages.attendance}`,
      '',
      'Top intervention priorities:',
      ...summary.weakestStudents.slice(0, 3).map((line) => `- ${line}`),
      '',
      'Action: Run weekly mentor check-ins for at-risk learners and monitor attendance/task completion.',
    ].join('\n');
  }

  private fallbackReportText(
    summary: {
      totalStudents: number;
      averages: { pld: number; task: number; exam: number; attendance: number; overall: number };
      weakestStudents: string[];
    },
    reportType: string,
  ) {
    return [
      `Executive summary (${reportType}):`,
      `- Students tracked: ${summary.totalStudents}`,
      `- Avg overall: ${summary.averages.overall}`,
      `- Avg attendance: ${summary.averages.attendance}`,
      '',
      'Risk diagnostics:',
      ...summary.weakestStudents.slice(0, 5).map((line) => `- ${line}`),
      '',
      'Weekly action plan:',
      '- Prioritize mentor outreach to weakest students within 24 hours.',
      '- Assign focused PLD/task recovery plans with measurable goals.',
      '- Review attendance dips and enforce daily check-ins.',
    ].join('\n');
  }

  private async runOpenRouter(
    prompt: string,
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENROUTER_API_KEY is not configured.',
      );
    }

    const model =
      options?.model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(process.env.OPENROUTER_SITE_URL
          ? { 'HTTP-Referer': process.env.OPENROUTER_SITE_URL }
          : {}),
        ...(process.env.OPENROUTER_APP_NAME
          ? { 'X-Title': process.env.OPENROUTER_APP_NAME }
          : {}),
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are an academic analytics assistant. Provide concise, actionable insights.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.3,
        max_tokens: options?.maxTokens ?? 700,
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;
    if (!response.ok) {
      throw new BadGatewayException(
        data?.error?.message || 'OpenRouter request failed.',
      );
    }

    return {
      provider: 'openrouter',
      model: data.model || model,
      text: data.choices?.[0]?.message?.content || '',
      usage: data.usage || null,
      requestId: data.id || null,
    };
  }

  async analyzeWithOpenRouter(payload: OpenRouterAnalysisDto) {
    const userPrompt = payload.context
      ? `${payload.prompt}\n\nContext:\n${payload.context}`
      : payload.prompt;

    return this.runOpenRouter(userPrompt, {
      model: payload.model,
      temperature: payload.temperature,
      maxTokens: payload.maxTokens,
    });
  }

  private extractSheetId(sheetUrl: string) {
    const direct = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (direct?.[1]) {
      return direct[1];
    }
    throw new BadGatewayException('Invalid Google Sheet URL.');
  }

  private csvToRows(csvText: string): string[][] {
    const rows: string[][] = [];
    let current = '';
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
      if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
        continue;
      }
      if ((char === '\n' || char === '\r') && !inQuotes) {
        if (char === '\r' && next === '\n') {
          i += 1;
        }
        row.push(current.trim());
        if (row.some((cell) => cell.length > 0)) {
          rows.push(row);
        }
        row = [];
        current = '';
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

  private normalizeHeader(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private toNumber(value: string | undefined) {
    if (!value) return 0;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private getColumnIndex(headers: string[], alternatives: string[]) {
    for (const candidate of alternatives) {
      const normalized = this.normalizeHeader(candidate);
      const idx = headers.findIndex((h) => h === normalized);
      if (idx !== -1) return idx;
    }
    return -1;
  }

  private async loadSheetRows(sheetUrl: string) {
    const sheetId = this.extractSheetId(sheetUrl);
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new BadGatewayException(
        'Failed to fetch Google Sheet. Ensure it is accessible.',
      );
    }
    const csv = await response.text();
    const rows = this.csvToRows(csv);
    if (rows.length < 2) {
      throw new BadGatewayException('Google Sheet has no data rows.');
    }
    return rows;
  }

  private summarizeRows(rows: string[][]) {
    const headers = rows[0].map((h) => this.normalizeHeader(h));
    const dataRows = rows.slice(1);

    const nameIdx = this.getColumnIndex(headers, [
      'student name',
      'studentname',
      'full name',
      'fullname',
      'name',
    ]);
    const studentIdIdx = this.getColumnIndex(headers, ['student id', 'studentid', 'id']);
    const pldIdx = this.getColumnIndex(headers, ['pld score', 'pld']);
    const taskIdx = this.getColumnIndex(headers, ['task score', 'task']);
    const attendanceIdx = this.getColumnIndex(headers, ['attendance activity', 'attendance']);
    const examIdx = this.getColumnIndex(headers, ['exam score', 'exam', 'examscore']);
    const overallIdx = this.getColumnIndex(headers, ['overall', 'overall score', 'overallscore']);

    if (pldIdx === -1 || taskIdx === -1 || attendanceIdx === -1 || overallIdx === -1) {
      throw new BadGatewayException(
        'Required columns not found. Need: pld score, task score, attendance activity, overall.',
      );
    }

    const students = dataRows.map((row, idx) => ({
      row: idx + 2,
      name: row[nameIdx] || `Student ${idx + 1}`,
      studentId: row[studentIdIdx] || `N/A-${idx + 1}`,
      pld: this.toNumber(row[pldIdx]),
      task: this.toNumber(row[taskIdx]),
      exam: examIdx === -1 ? 0 : this.toNumber(row[examIdx]),
      attendance: this.toNumber(row[attendanceIdx]),
      overall: this.toNumber(row[overallIdx]),
    }));

    const count = students.length || 1;
    const avg = (field: keyof (typeof students)[number]) =>
      Number(
        (
          students.reduce((sum, student) => sum + Number(student[field]), 0) / count
        ).toFixed(2),
      );
    const weakest = [...students]
      .sort((a, b) => a.overall - b.overall)
      .slice(0, 5)
      .map((s) => `${s.name} (${s.studentId}) overall=${s.overall}`);

    return {
      totalStudents: students.length,
      averages: {
        pld: avg('pld'),
        task: avg('task'),
        exam: avg('exam'),
        attendance: avg('attendance'),
        overall: avg('overall'),
      },
      weakestStudents: weakest,
      students,
    };
  }

  async analyzeGoogleSheet(payload: GoogleSheetAnalysisDto) {
    const sheetUrl = this.resolveSheetUrl(payload.sheetUrl);
    const rows = await this.loadSheetRows(sheetUrl);
    const summary = this.summarizeRows(rows);

    const prompt = [
      'Analyze student performance data and provide practical intervention insights.',
      `Total students: ${summary.totalStudents}`,
      `Average PLD: ${summary.averages.pld}`,
      `Average Task: ${summary.averages.task}`,
      `Average Attendance: ${summary.averages.attendance}`,
      `Average Overall: ${summary.averages.overall}`,
      'Lowest performers:',
      ...summary.weakestStudents.map((line) => `- ${line}`),
      'Return concise action points for mentors and admin.',
    ].join('\n');

    let ai: Awaited<ReturnType<typeof this.runOpenRouter>>;
    try {
      ai = await this.runOpenRouter(prompt, {
        model: payload.model,
        maxTokens: 900,
        temperature: 0.2,
      });
    } catch {
      ai = {
        provider: 'fallback',
        model: 'local-summary',
        text: this.fallbackInsightsText(summary),
        usage: null,
        requestId: null,
      };
    }

    return {
      sheetUrl,
      summary,
      ai,
    };
  }

  async getGoogleSheetData(payload: GoogleSheetAnalysisDto) {
    const sheetUrl = this.resolveSheetUrl(payload.sheetUrl);
    const rows = await this.loadSheetRows(sheetUrl);
    const summary = this.summarizeRows(rows);
    return {
      sheetUrl,
      summary,
      students: summary.students,
    };
  }

  async buildStudentReportFromSheet(payload: GoogleSheetAnalysisDto) {
    const sheetUrl = this.resolveSheetUrl(payload.sheetUrl);
    const rows = await this.loadSheetRows(sheetUrl);
    const summary = this.summarizeRows(rows);

    const reportType = payload.reportType || 'general';
    const prompt = [
      'Create an academic report for admins and mentors based on this student dataset.',
      `Report type: ${reportType}`,
      `Student count: ${summary.totalStudents}`,
      `Averages => PLD: ${summary.averages.pld}, Task: ${summary.averages.task}, Attendance: ${summary.averages.attendance}, Overall: ${summary.averages.overall}`,
      'At-risk/weakest students:',
      ...summary.weakestStudents.map((line) => `- ${line}`),
      'Report structure required: executive summary, risk diagnostics, student-level recommendations, and weekly action plan.',
      'Use clear bullet points.',
    ].join('\n');

    let ai: Awaited<ReturnType<typeof this.runOpenRouter>>;
    try {
      ai = await this.runOpenRouter(prompt, {
        model: payload.model,
        maxTokens: 1200,
        temperature: 0.3,
      });
    } catch {
      ai = {
        provider: 'fallback',
        model: 'local-report',
        text: this.fallbackReportText(summary, reportType),
        usage: null,
        requestId: null,
      };
    }

    return {
      sheetUrl,
      summary,
      report: ai,
    };
  }

  async analyzeStudentTrendsFromSheet(payload: GoogleSheetAnalysisDto) {
    const sheetUrl = this.resolveSheetUrl(payload.sheetUrl);
    const rows = await this.loadSheetRows(sheetUrl);
    const summary = this.summarizeRows(rows);

    const studentLines = summary.students
      .map((student, index) => {
        const id =
          !student.studentId || student.studentId.startsWith('N/A')
            ? `hspts-${1001 + index}`
            : student.studentId;
        return `${id} | ${student.name} | pld=${student.pld} task=${student.task} exam=${student.exam} attendance=${student.attendance} overall=${student.overall}`;
      })
      .join('\n');

    const prompt = [
      'Analyze performance trend for each student from provided scores.',
      'Return ONLY valid JSON array. No markdown, no explanation.',
      'JSON item format: {"studentId":"string","trend":"up|down|stable","delta":number,"reason":"short reason"}',
      `Reference average overall: ${summary.averages.overall}`,
      'Trend guidance:',
      '- up: overall above average or strong balanced metrics',
      '- down: overall far below average or multiple weak metrics',
      '- stable: around average with mixed metrics',
      'Students:',
      studentLines,
    ].join('\n');

    const ai = await this.runOpenRouter(prompt, {
      model: payload.model,
      maxTokens: 1400,
      temperature: 0.1,
    });

    let parsed: AiTrendItem[] = [];
    try {
      const cleaned = ai.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
      const json = JSON.parse(cleaned);
      if (Array.isArray(json)) {
        parsed = json
          .map((item) => ({
            studentId: String(item?.studentId ?? ''),
            trend:
              item?.trend === 'up' || item?.trend === 'down' || item?.trend === 'stable'
                ? item.trend
                : 'stable',
            delta: Number.isFinite(Number(item?.delta)) ? Number(item.delta) : 0,
            reason: String(item?.reason ?? ''),
          }))
          .filter((item) => item.studentId);
      }
    } catch {
      parsed = [];
    }

    if (parsed.length === 0) {
      parsed = summary.students.map((student, index) => {
        const id =
          !student.studentId || student.studentId.startsWith('N/A')
            ? `hspts-${1001 + index}`
            : student.studentId;
        const delta = Math.round(student.overall - summary.averages.overall);
        return {
          studentId: id,
          trend: delta > 2 ? 'up' : delta < -2 ? 'down' : 'stable',
          delta,
          reason: 'Fallback heuristic trend from overall vs average.',
        } as AiTrendItem;
      });
    }

    return {
      sheetUrl,
      summary: {
        totalStudents: summary.totalStudents,
        averages: summary.averages,
      },
      trends: parsed,
      aiMeta: {
        provider: ai.provider,
        model: ai.model,
        requestId: ai.requestId,
      },
    };
  }
}

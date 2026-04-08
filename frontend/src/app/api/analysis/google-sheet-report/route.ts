import { NextResponse } from "next/server";
import {
  type AiCompletionResult,
  fallbackReportText,
  runOpenRouter,
} from "@/lib/analysis-openrouter";
import { loadAndSummarizeSheet, resolveSheetUrl } from "@/lib/sheet-parser";

type Body = { sheetUrl?: string; model?: string; reportType?: string };

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }

  try {
    const { sheetUrl, summary } = await loadAndSummarizeSheet(
      body.sheetUrl ? resolveSheetUrl(body.sheetUrl) : undefined,
    );

    const reportType = body.reportType || "general";
    const prompt = [
      "Create an academic report for admins and mentors based on this student dataset.",
      `Report type: ${reportType}`,
      `Student count: ${summary.totalStudents}`,
      `Averages => PLD: ${summary.averages.pld}, Task: ${summary.averages.task}, Attendance: ${summary.averages.attendance}, Overall: ${summary.averages.overall}`,
      "At-risk/weakest students:",
      ...summary.weakestStudents.map((line) => `- ${line}`),
      "Report structure required: executive summary, risk diagnostics, student-level recommendations, and weekly action plan.",
      "Use clear bullet points.",
    ].join("\n");

    let ai: AiCompletionResult;
    try {
      ai = await runOpenRouter(prompt, {
        model: body.model,
        maxTokens: 1200,
        temperature: 0.3,
      });
    } catch {
      ai = {
        provider: "fallback",
        model: "local-report",
        text: fallbackReportText(summary, reportType),
        usage: null,
        requestId: null,
      };
    }

    return NextResponse.json({ sheetUrl, summary, report: ai });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google Sheet report failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

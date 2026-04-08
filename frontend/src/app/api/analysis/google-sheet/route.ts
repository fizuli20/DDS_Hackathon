import { NextResponse } from "next/server";
import {
  type AiCompletionResult,
  fallbackInsightsText,
  runOpenRouter,
} from "@/lib/analysis-openrouter";
import { loadAndSummarizeSheet, resolveSheetUrl } from "@/lib/sheet-parser";

type Body = { sheetUrl?: string; model?: string };

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

    const prompt = [
      "Analyze student performance data and provide practical intervention insights.",
      `Total students: ${summary.totalStudents}`,
      `Average PLD: ${summary.averages.pld}`,
      `Average Task: ${summary.averages.task}`,
      `Average Attendance: ${summary.averages.attendance}`,
      `Average Overall: ${summary.averages.overall}`,
      "Lowest performers:",
      ...summary.weakestStudents.map((line) => `- ${line}`),
      "Return concise action points for mentors and admin.",
    ].join("\n");

    let ai: AiCompletionResult;
    try {
      ai = await runOpenRouter(prompt, {
        model: body.model,
        maxTokens: 900,
        temperature: 0.2,
      });
    } catch {
      ai = {
        provider: "fallback",
        model: "local-summary",
        text: fallbackInsightsText(summary),
        usage: null,
        requestId: null,
      };
    }

    return NextResponse.json({ sheetUrl, summary, ai });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google Sheet analysis failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

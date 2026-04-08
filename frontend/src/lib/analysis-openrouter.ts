import type { SheetSummary } from "@/lib/sheet-parser";

type OpenRouterResponse = {
  id: string;
  model: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  error?: { message?: string };
};

export type AiCompletionResult = {
  provider: string;
  model: string;
  text: string;
  usage: unknown;
  requestId: string | null;
};

export function fallbackInsightsText(summary: SheetSummary) {
  return [
    `Total students: ${summary.totalStudents}`,
    `Average overall: ${summary.averages.overall}`,
    `Average attendance: ${summary.averages.attendance}`,
    "",
    "Top intervention priorities:",
    ...summary.weakestStudents.slice(0, 3).map((line) => `- ${line}`),
    "",
    "Action: Run weekly mentor check-ins for at-risk learners and monitor attendance/task completion.",
  ].join("\n");
}

export function fallbackReportText(summary: SheetSummary, reportType: string) {
  return [
    `Executive summary (${reportType}):`,
    `- Students tracked: ${summary.totalStudents}`,
    `- Avg overall: ${summary.averages.overall}`,
    `- Avg attendance: ${summary.averages.attendance}`,
    "",
    "Risk diagnostics:",
    ...summary.weakestStudents.slice(0, 5).map((line) => `- ${line}`),
    "",
    "Weekly action plan:",
    "- Prioritize mentor outreach to weakest students within 24 hours.",
    "- Assign focused PLD/task recovery plans with measurable goals.",
    "- Review attendance dips and enforce daily check-ins.",
  ].join("\n");
}

export async function runOpenRouter(
  prompt: string,
  options?: { model?: string; temperature?: number; maxTokens?: number },
): Promise<AiCompletionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured.");
  }

  const model = options?.model || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.OPENROUTER_SITE_URL ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL } : {}),
      ...(process.env.OPENROUTER_APP_NAME ? { "X-Title": process.env.OPENROUTER_APP_NAME } : {}),
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are an academic analytics assistant. Provide concise, actionable insights.",
        },
        { role: "user", content: prompt },
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 700,
    }),
  });

  const data = (await response.json()) as OpenRouterResponse;
  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenRouter request failed.");
  }

  return {
    provider: "openrouter",
    model: data.model || model,
    text: data.choices?.[0]?.message?.content || "",
    usage: data.usage || null,
    requestId: data.id || null,
  };
}

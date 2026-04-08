import { NextResponse } from "next/server";
import { runOpenRouter } from "@/lib/analysis-openrouter";
import { loadAndSummarizeSheet, resolveSheetUrl, type SheetStudent } from "@/lib/sheet-parser";

type Body = { sheetUrl?: string; model?: string };

type AiTrendItem = {
  studentId: string;
  trend: "up" | "down" | "stable";
  delta: number;
  reason: string;
};

function heuristicTrends(
  students: SheetStudent[],
  averages: { overall: number },
): AiTrendItem[] {
  return students.map((student, index) => {
    const id =
      !student.studentId || student.studentId.startsWith("N/A")
        ? `hspts-${1001 + index}`
        : student.studentId;
    const delta = Math.round(student.overall - averages.overall);
    return {
      studentId: id,
      trend: delta > 2 ? "up" : delta < -2 ? "down" : "stable",
      delta,
      reason: "Fallback heuristic trend from overall vs average.",
    };
  });
}

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

    const studentLines = summary.students
      .map((student, index) => {
        const id =
          !student.studentId || student.studentId.startsWith("N/A")
            ? `hspts-${1001 + index}`
            : student.studentId;
        return `${id} | ${student.name} | pld=${student.pld} task=${student.task} exam=${student.exam} attendance=${student.attendance} overall=${student.overall}`;
      })
      .join("\n");

    const prompt = [
      "Analyze performance trend for each student from provided scores.",
      "Return ONLY valid JSON array. No markdown, no explanation.",
      'JSON item format: {"studentId":"string","trend":"up|down|stable","delta":number,"reason":"short reason"}',
      `Reference average overall: ${summary.averages.overall}`,
      "Trend guidance:",
      "- up: overall above average or strong balanced metrics",
      "- down: overall far below average or multiple weak metrics",
      "- stable: around average with mixed metrics",
      "Students:",
      studentLines,
    ].join("\n");

    let ai: Awaited<ReturnType<typeof runOpenRouter>>;
    try {
      ai = await runOpenRouter(prompt, {
        model: body.model,
        maxTokens: 1400,
        temperature: 0.1,
      });
    } catch {
      return NextResponse.json({
        sheetUrl,
        summary: {
          totalStudents: summary.totalStudents,
          averages: summary.averages,
        },
        trends: heuristicTrends(summary.students, summary.averages),
        aiMeta: {
          provider: "fallback",
          model: "heuristic-trends",
          requestId: null,
        },
      });
    }

    let parsed: AiTrendItem[] = [];
    try {
      const cleaned = ai.text.trim().replace(/^```json\s*/i, "").replace(/```$/i, "");
      const json = JSON.parse(cleaned) as unknown;
      if (Array.isArray(json)) {
        parsed = json
          .map((item: Record<string, unknown>) => {
            const tr = item?.trend;
            const trend: AiTrendItem["trend"] =
              tr === "up" || tr === "down" || tr === "stable" ? tr : "stable";
            return {
              studentId: String(item?.studentId ?? ""),
              trend,
              delta: Number.isFinite(Number(item?.delta)) ? Number(item.delta) : 0,
              reason: String(item?.reason ?? ""),
            };
          })
          .filter((item) => item.studentId);
      }
    } catch {
      parsed = [];
    }

    if (parsed.length === 0) {
      parsed = heuristicTrends(summary.students, summary.averages);
    }

    return NextResponse.json({
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
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Trend analysis failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

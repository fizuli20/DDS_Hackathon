import { NextRequest, NextResponse } from "next/server";
import { loadAndSummarizeSheet, resolveSheetUrl } from "@/lib/sheet-parser";

export async function GET(request: NextRequest) {
  const sheetUrl = request.nextUrl.searchParams.get("sheetUrl");
  try {
    const { sheetUrl: resolved, summary } = await loadAndSummarizeSheet(
      sheetUrl ? resolveSheetUrl(sheetUrl) : undefined,
    );
    return NextResponse.json({
      sheetUrl: resolved,
      summary,
      students: summary.students,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Google Sheet fetch failed.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

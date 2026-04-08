import { NextRequest, NextResponse } from "next/server";
import { aggregateByCohort } from "@/lib/data-sources-server";

export async function GET(request: NextRequest) {
  try {
    const cohort = request.nextUrl.searchParams.get("cohort") ?? undefined;
    const data = await aggregateByCohort(cohort ?? undefined);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Aggregate failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

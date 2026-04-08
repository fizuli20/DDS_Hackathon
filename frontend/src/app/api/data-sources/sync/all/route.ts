import { NextResponse } from "next/server";
import { syncAllActive } from "@/lib/data-sources-server";

export async function POST() {
  try {
    const data = await syncAllActive();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

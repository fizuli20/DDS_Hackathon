import { NextResponse } from "next/server";
import { syncOne } from "@/lib/data-sources-server";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const data = await syncOne(id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Sync failed.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ message }, { status });
  }
}

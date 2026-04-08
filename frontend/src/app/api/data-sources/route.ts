import { NextResponse } from "next/server";
import { createDataSource, listDataSources } from "@/lib/data-sources-server";

export async function GET() {
  try {
    const data = await listDataSources();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list data sources.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const sheetUrl = String(body.sheetUrl ?? "").trim();
    const type = String(body.type ?? "").trim();
    if (!name || !sheetUrl || !type) {
      return NextResponse.json({ message: "name, sheetUrl, and type are required." }, { status: 400 });
    }
    const created = await createDataSource({
      name,
      sheetUrl,
      type,
      cohort: body.cohort != null ? String(body.cohort) : undefined,
      active: typeof body.active === "boolean" ? body.active : undefined,
      priority: body.priority != null ? Number(body.priority) : undefined,
      columnMapping:
        body.columnMapping && typeof body.columnMapping === "object"
          ? (body.columnMapping as Record<string, string>)
          : undefined,
    });
    return NextResponse.json(created);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create data source.";
    return NextResponse.json({ message }, { status: 400 });
  }
}

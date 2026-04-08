import { NextResponse } from "next/server";
import { deleteDataSource, updateDataSource } from "@/lib/data-sources-server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const updated = await updateDataSource(id, {
      ...(body.name !== undefined ? { name: String(body.name) } : {}),
      ...(body.sheetUrl !== undefined ? { sheetUrl: String(body.sheetUrl) } : {}),
      ...(body.type !== undefined ? { type: String(body.type) } : {}),
      ...(body.cohort !== undefined
        ? { cohort: body.cohort === null ? null : String(body.cohort) }
        : {}),
      ...(body.active !== undefined ? { active: Boolean(body.active) } : {}),
      ...(body.priority !== undefined ? { priority: Number(body.priority) } : {}),
      ...(body.columnMapping !== undefined && typeof body.columnMapping === "object"
        ? { columnMapping: body.columnMapping as Record<string, string> }
        : {}),
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(_request: Request, context: Ctx) {
  try {
    const { id } = await context.params;
    const data = await deleteDataSource(id);
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed.";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}

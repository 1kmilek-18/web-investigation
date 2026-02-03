import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma, SourceType } from "@prisma/client";
import { isValidUrl } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/sources/[id] — 1件取得（UI 編集用） */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const source = await prisma.source.findUnique({ where: { id } });
    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    return NextResponse.json(source);
  } catch (e) {
    console.error("[GET /api/sources/[id]]", e);
    return NextResponse.json(
      { error: "Failed to fetch source" },
      { status: 500 }
    );
  }
}

/** PUT /api/sources/[id] — 更新 (REQ-UI-002, SDD 9.2) */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    const body = await request.json();
    const { url, type, selector, config } = body;

    const data: {
      url?: string;
      type?: SourceType;
      selector?: string | null;
      config?: object | typeof Prisma.JsonNull;
    } = {};

    if (url !== undefined) {
      if (typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { error: "url must be a non-empty string" },
          { status: 400 }
        );
      }
      if (!isValidUrl(url.trim())) {
        return NextResponse.json(
          { error: "url must be a valid URL" },
          { status: 400 }
        );
      }
      data.url = url.trim();
    }
    if (type !== undefined) {
      if (type !== "single" && type !== "list") {
        return NextResponse.json(
          { error: "type must be 'single' or 'list'" },
          { status: 400 }
        );
      }
      data.type = type as SourceType;
    }
    if (selector !== undefined) {
      data.selector =
        typeof selector === "string" ? selector : selector === null ? null : undefined;
    }
    if (config !== undefined) {
      data.config =
        config != null && typeof config === "object"
          ? (config as object)
          : config === null
            ? Prisma.JsonNull
            : undefined;
    }

    const source = await prisma.source.update({
      where: { id },
      data,
    });
    return NextResponse.json(source);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A source with this URL already exists" },
        { status: 400 }
      );
    }
    console.error("[PUT /api/sources/[id]]", e);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

/** DELETE /api/sources/[id] — 削除 (REQ-UI-003, SDD 9.2) */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }
    await prisma.source.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[DELETE /api/sources/[id]]", e);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}

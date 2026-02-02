import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SourceType } from "@prisma/client";

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/** GET /api/sources — 一覧取得 (REQ-UI-004, SDD 9.2) */
export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ sources });
  } catch (e) {
    console.error("[GET /api/sources]", e);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

/** POST /api/sources — ソース追加 (REQ-UI-001, REQ-EXT-001, SDD 9.2) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type, selector, config } = body;

    if (typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { error: "url is required and must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!isValidUrl(url.trim())) {
      return NextResponse.json(
        { error: "url must be a valid URL" },
        { status: 400 }
      );
    }
    if (type !== "single" && type !== "list") {
      return NextResponse.json(
        { error: "type must be 'single' or 'list'" },
        { status: 400 }
      );
    }

    const source = await prisma.source.create({
      data: {
        url: url.trim(),
        type: type as SourceType,
        selector: typeof selector === "string" ? selector : undefined,
        config: config != null && typeof config === "object" ? config : undefined,
      },
    });
    return NextResponse.json(source, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "A source with this URL already exists" },
        { status: 400 }
      );
    }
    console.error("[POST /api/sources]", e);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}

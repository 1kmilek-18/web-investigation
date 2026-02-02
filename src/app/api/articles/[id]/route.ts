import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/articles/[id] — 記事詳細 (REQ-UI-011, SDD 9.4) */
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: { source: { select: { id: true, url: true, type: true } } },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch (e) {
    console.error("[GET /api/articles/[id]]", e);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}

/** PUT /api/articles/[id] — 記事更新（内部/スクレイパー用）(REQ-SCR-006) */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, rawContent, summary, sourceId, collectedAt } = body;

    const data: {
      title?: string | null;
      rawContent?: string;
      summary?: string | null;
      sourceId?: string | null;
      collectedAt?: Date;
    } = {};

    if (title !== undefined) {
      data.title = typeof title === "string" ? title : null;
    }
    if (rawContent !== undefined) {
      if (typeof rawContent !== "string") {
        return NextResponse.json(
          { error: "rawContent must be a string" },
          { status: 400 }
        );
      }
      data.rawContent = rawContent;
    }
    if (summary !== undefined) {
      data.summary = typeof summary === "string" ? summary : null;
    }
    if (sourceId !== undefined) {
      data.sourceId =
        typeof sourceId === "string" && sourceId ? sourceId : null;
    }
    if (collectedAt !== undefined) {
      const d = new Date(collectedAt);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json(
          { error: "collectedAt must be a valid ISO8601 date string" },
          { status: 400 }
        );
      }
      data.collectedAt = d;
    }

    const article = await prisma.article.update({
      where: { id },
      data,
      include: { source: { select: { id: true, url: true, type: true } } },
    });
    return NextResponse.json(article);
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "An article with this URL already exists" },
        { status: 400 }
      );
    }
    console.error("[PUT /api/articles/[id]]", e);
    return NextResponse.json(
      { error: "Failed to update article" },
      { status: 500 }
    );
  }
}

/** DELETE /api/articles/[id] — 記事削除（内部用） */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }
    await prisma.article.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error("[DELETE /api/articles/[id]]", e);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}

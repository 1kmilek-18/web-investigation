import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidUrl } from "@/lib/validation";
import type { Prisma } from "@prisma/client";

/** GET /api/articles — 一覧・検索・フィルタ (REQ-UI-008〜010, SDD 9.3) */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10))
    );
    const keyword = searchParams.get("keyword")?.trim() || undefined;
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;

    const where: Prisma.ArticleWhereInput = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: "insensitive" } },
        { summary: { contains: keyword, mode: "insensitive" } },
      ];
    }
    if (dateFrom || dateTo) {
      where.collectedAt = {};
      if (dateFrom) (where.collectedAt as { gte?: Date }).gte = new Date(dateFrom);
      if (dateTo) (where.collectedAt as { lte?: Date }).lte = new Date(dateTo);
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { collectedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { source: { select: { id: true, url: true, type: true } } },
      }),
      prisma.article.count({ where }),
    ]);

    return NextResponse.json({ articles, total, page, limit });
  } catch (e) {
    console.error("[GET /api/articles]", e);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

/** POST /api/articles — 記事作成（内部/スクレイパー用）(REQ-SCR-005, CODE_REVIEW §4.2: CRON_SECRET 認証) */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (token !== secret) {
      return NextResponse.json(
        { error: "Invalid or missing CRON_SECRET" },
        { status: 401 }
      );
    }
  } else {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { url, title, rawContent, summary, sourceId, collectedAt } = body;

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
    if (typeof rawContent !== "string") {
      return NextResponse.json(
        { error: "rawContent is required and must be a string" },
        { status: 400 }
      );
    }

    const collectedAtDate = collectedAt
      ? new Date(collectedAt)
      : new Date();
    if (Number.isNaN(collectedAtDate.getTime())) {
      return NextResponse.json(
        { error: "collectedAt must be a valid ISO8601 date string" },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: {
        url: url.trim(),
        title: typeof title === "string" ? title : undefined,
        rawContent,
        summary: typeof summary === "string" ? summary : undefined,
        sourceId:
          typeof sourceId === "string" && sourceId ? sourceId : undefined,
        collectedAt: collectedAtDate,
      },
      include: { source: { select: { id: true, url: true, type: true } } },
    });
    return NextResponse.json(article, { status: 201 });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json(
        { error: "An article with this URL already exists" },
        { status: 400 }
      );
    }
    console.error("[POST /api/articles]", e);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}

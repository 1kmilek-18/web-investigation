/**
 * Scraper Service (REQ-SCR-001〜010, REQ-SEC-004, REQ-SEC-005, REQ-SEC-006, REQ-EXT-002)
 * SDD 4.3: 単一/一覧ソース対応、並列制限（最大3ソース）、重複排除、robots.txt・レート制限・HTMLサニタイズ
 */

import * as cheerio from "cheerio";
import pLimit from "p-limit";
// @ts-expect-error sanitize-html has no types
import sanitizeHtml from "sanitize-html";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { Source } from "@prisma/client";

const CONCURRENT_SOURCES = 3; // REQ-SCR-010: 最大3ソース並列
const DELAY_MS_PER_ORIGIN = 1200; // REQ-SEC-004: 同一オリジン間の間隔（ミリ秒）
const USER_AGENT = "WebInvestigation/1.0 (+https://github.com/web-investigation)";
// テスト用: ミニマムな条件で動作確認できるように記事数を制限
const MAX_ARTICLE_URLS_PER_SOURCE = process.env.TEST_MODE === "true" ? 5 : 50; // テストモード時は5件、通常は50件
const MAX_SCRAPE_TIME_MS = process.env.TEST_MODE === "true" ? 60000 : 300000; // テストモード時は60秒、通常は5分

const originLastRequest = new Map<string, number>();

function getOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return url;
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 同一オリジンへの連続リクエスト間で待機 (REQ-SEC-004) */
async function rateLimit(url: string): Promise<void> {
  const origin = getOrigin(url);
  const last = originLastRequest.get(origin) ?? 0;
  const now = Date.now();
  const elapsed = now - last;
  if (elapsed < DELAY_MS_PER_ORIGIN) {
    await delay(DELAY_MS_PER_ORIGIN - elapsed);
  }
  originLastRequest.set(origin, Date.now());
}

/** robots.txt を確認し、パスが許可されているか返す (REQ-SEC-005) */
export async function isAllowedByRobotsTxt(url: string): Promise<boolean> {
  try {
    const u = new URL(url);
    const robotsUrl = `${u.origin}/robots.txt`;
    await rateLimit(robotsUrl);
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return true; // 404 等は許可とみなす
    const text = await res.text();
    const path = u.pathname || "/";
    const lines = text.split(/\r?\n/);
    let inRelevantBlock = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^User-agent:\s*\*/i.test(trimmed)) {
        inRelevantBlock = true;
        continue;
      }
      if (/^User-agent:/i.test(trimmed) && !trimmed.toLowerCase().includes("*")) {
        inRelevantBlock = false;
        continue;
      }
      const disallowMatch = inRelevantBlock ? trimmed.match(/^Disallow:\s*(.+)/i) : null;
      if (disallowMatch) {
        const disallowPath = disallowMatch[1].trim();
        if (!disallowPath) continue;
        // ReDoS 対策: 正規表現の特殊文字をエスケープし、* のみ .* に解釈（CODE_REVIEW §4.3）
        const escaped = disallowPath.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
        const re = new RegExp(`^${escaped}`);
        if (re.test(path)) return false;
      }
    }
    return true;
  } catch {
    return true; // エラー時は許可（ログは呼び出し元で）
  }
}

/** Source.config (Json) を型安全にパース（CODE_REVIEW §6.3） */
function parseSourceConfig(
  config: unknown
): { listLinkSelector?: string; articleUrlPattern?: string } | null {
  if (config == null || typeof config !== "object") return null;
  const c = config as Record<string, unknown>;
  return {
    listLinkSelector:
      typeof c.listLinkSelector === "string" ? c.listLinkSelector : undefined,
    articleUrlPattern:
      typeof c.articleUrlPattern === "string" ? c.articleUrlPattern : undefined,
  };
}

/** HTML をサニタイズ (REQ-SEC-006) */
function sanitize(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "a", "h1", "h2", "h3", "h4", "ul", "ol", "li",
      "strong", "em", "b", "i", "blockquote", "code", "pre", "span", "div",
    ],
    allowedAttributes: { a: ["href"], code: ["class"], span: ["class"], div: ["class"] },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

/** 一覧ページから記事 URL を抽出 (REQ-SCR-007, REQ-EXT-002) */
async function getArticleUrlsFromList(
  listPageUrl: string,
  config?: { listLinkSelector?: string; articleUrlPattern?: string } | null
): Promise<string[]> {
  await rateLimit(listPageUrl);
  const res = await fetch(listPageUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const baseUrl = new URL(listPageUrl);
  const selector = config?.listLinkSelector ?? "a[href]";
  const hrefs = new Set<string>();
  $(selector).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const absolute = new URL(href, listPageUrl).href;
      if (absolute.startsWith("http") && new URL(absolute).origin === baseUrl.origin) {
        const path = new URL(absolute);
        path.hash = "";
        const normalized = path.href;
        const pattern = config?.articleUrlPattern;
        if (pattern) {
          try {
            if (!new RegExp(pattern).test(normalized)) return;
          } catch {
            // invalid regex, allow
          }
        }
        hrefs.add(normalized);
      }
    } catch {
      // ignore invalid URL
    }
  });
  return Array.from(hrefs);
}

/** 記事ページからタイトルと本文を取得 (REQ-EXT-002) */
async function fetchArticleContent(
  articleUrl: string,
  contentSelector?: string | null
): Promise<{ title: string; rawContent: string }> {
  await rateLimit(articleUrl);
  const res = await fetch(articleUrl, {
    headers: { "User-Agent": USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    $("title").text().trim() ||
    "";
  let raw: string;
  if (contentSelector) {
    const el = $(contentSelector).first();
    raw = el.length ? el.html() ?? "" : $.html();
  } else {
    const candidates = [
      "article",
      "main",
      "[role='main']",
      ".content",
      ".post-content",
      ".article-body",
      ".entry-content",
      "#content",
      ".main",
    ];
    let found = "";
    for (const sel of candidates) {
      const el = $(sel).first();
      if (el.length) {
        found = el.html() ?? "";
        break;
      }
    }
    raw = found || ($("body").html() ?? "");
  }
  const cleaned = sanitize(raw);
  const rawContent = cleaned.trim() || "(no content)";
  return { title, rawContent };
}

/** 1ソースをスクレイプし、記事を upsert (REQ-SCR-005, REQ-SCR-006, REQ-SCR-008) */
export async function scrapeSource(source: Source): Promise<{
  collected: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let collected = 0;
  const sourceId = source.id;
  const config = parseSourceConfig(source.config);

  try {
    const allowed = await isAllowedByRobotsTxt(source.url);
    if (!allowed) {
      errors.push(`robots.txt disallows: ${source.url}`);
      return { collected: 0, errors };
    }
  } catch (e) {
    logger.warn("robots.txt check failed", { url: source.url, error: e instanceof Error ? e.message : String(e) });
    // 続行
  }

  let articleUrls: string[];
  if (source.type === "single") {
    articleUrls = [source.url];
  } else {
    try {
      articleUrls = await getArticleUrlsFromList(source.url, config);
      // パフォーマンス向上のため、記事数を制限
      if (articleUrls.length > MAX_ARTICLE_URLS_PER_SOURCE) {
        logger.info("Limiting articles per source", { count: articleUrls.length, max: MAX_ARTICLE_URLS_PER_SOURCE, url: source.url });
        articleUrls = articleUrls.slice(0, MAX_ARTICLE_URLS_PER_SOURCE);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${source.url}: ${msg}`);
      return { collected: 0, errors };
    }
  }

  const contentSelector = source.selector || undefined;
  const now = new Date();

  // sourceIdが有効か確認（削除されたソースの可能性があるため）
  let validSourceId: string | null = sourceId;
  if (sourceId) {
    const sourceExists = await prisma.source.findUnique({
      where: { id: sourceId },
      select: { id: true },
    });
    if (!sourceExists) {
      logger.warn("Source not found, using null for sourceId", { sourceId });
      validSourceId = null;
    }
  }

  for (const url of articleUrls) {
    try {
      const { title, rawContent } = await fetchArticleContent(url, contentSelector);
      await prisma.article.upsert({
        where: { url },
        create: {
          url,
          title: title || null,
          rawContent,
          sourceId: validSourceId,
          collectedAt: now,
        },
        update: {
          title: title || null,
          rawContent,
          collectedAt: now,
          summary: null, // REQ-SCR-006: 本文変更時は要約を再生成するため Phase 2 で利用
        },
      });
      collected++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`${url}: ${msg}`);
      logger.warn("article fetch failed", { url, error: msg });
    }
  }

  return { collected, errors };
}

export type ScrapeAllResult = {
  totalCollected: number;
  sourceResults: { sourceId: string; sourceUrl: string; collected: number; errors: string[] }[];
  allErrors: { sourceUrl: string; message: string }[];
};

/** 全ソースを並列制限付きでスクレイプ (REQ-SCR-002, REQ-SCR-009, REQ-SCR-010, REQ-SCR-004) */
export async function scrapeAll(sources: Source[]): Promise<ScrapeAllResult> {
  const startTime = Date.now();
  const limit = pLimit(CONCURRENT_SOURCES);
  const sourceResults: ScrapeAllResult["sourceResults"] = [];
  const allErrors: ScrapeAllResult["allErrors"] = [];
  let totalCollected = 0;

  const tasks = sources.map((source) =>
    limit(async () => {
      // タイムアウトチェック
      if (Date.now() - startTime > MAX_SCRAPE_TIME_MS) {
        allErrors.push({
          sourceUrl: source.url,
          message: `Scraping timeout: exceeded ${MAX_SCRAPE_TIME_MS}ms`,
        });
        return;
      }

      try {
        const { collected, errors } = await scrapeSource(source);
        sourceResults.push({
          sourceId: source.id,
          sourceUrl: source.url,
          collected,
          errors,
        });
        totalCollected += collected;
        errors.forEach((message) =>
          allErrors.push({ sourceUrl: source.url, message })
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        allErrors.push({
          sourceUrl: source.url,
          message: `Scraping failed: ${errorMessage}`,
        });
      }
    })
  );

  await Promise.all(tasks);
  return { totalCollected, sourceResults, allErrors };
}

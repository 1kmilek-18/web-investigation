/**
 * Sources API 統合テスト (TSK-REV-022, REQ-REV-022)
 * バリデーションエッジケース: 不正な body、不正な URL、必須項目欠如
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { prisma } from "@/lib/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    source: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("Sources API - バリデーション", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/sources", () => {
    it("url が空の場合は 400 を返す", async () => {
      const request = new NextRequest("http://localhost/api/sources", {
        method: "POST",
        body: JSON.stringify({ url: "", type: "list" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/url/);
      expect(prisma.source.create).not.toHaveBeenCalled();
    });

    it("url が不正な形式の場合は 400 を返す", async () => {
      const request = new NextRequest("http://localhost/api/sources", {
        method: "POST",
        body: JSON.stringify({ url: "not-a-valid-url", type: "list" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/valid URL|url/);
      expect(prisma.source.create).not.toHaveBeenCalled();
    });

    it("type が不正な場合は 400 を返す", async () => {
      const request = new NextRequest("http://localhost/api/sources", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/feed", type: "invalid" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/type/);
      expect(prisma.source.create).not.toHaveBeenCalled();
    });

    it("body が欠けている場合は 400 を返す", async () => {
      const request = new NextRequest("http://localhost/api/sources", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
      expect(prisma.source.create).not.toHaveBeenCalled();
    });

    it("正常な body の場合は 201 を返す", async () => {
      const created = {
        id: "source-1",
        url: "https://example.com/feed",
        type: "list" as const,
        selector: null,
        config: null,
        createdAt: new Date(),
      };

      vi.mocked(prisma.source.create).mockResolvedValue(created as any);

      const request = new NextRequest("http://localhost/api/sources", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com/feed", type: "list" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("source-1");
      expect(data.url).toBe("https://example.com/feed");
      expect(prisma.source.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/sources", () => {
    it("一覧を取得できる", async () => {
      vi.mocked(prisma.source.findMany).mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sources).toEqual([]);
      expect(prisma.source.findMany).toHaveBeenCalledTimes(1);
    });
  });
});

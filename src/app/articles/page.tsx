"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Search, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Article } from "@prisma/client";

interface ArticleWithSource extends Article {
  source?: {
    id: string;
    url: string;
    type: string;
  } | null;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const paramsRef = useRef({ page, keyword, dateFrom, dateTo });
  paramsRef.current = { page, keyword, dateFrom, dateTo };

  const fetchArticles = useCallback(async () => {
    const { page: p, keyword: k, dateFrom: df, dateTo: dt } = paramsRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: p.toString(),
        limit: limit.toString(),
      });
      if (k) params.append("keyword", k);
      if (df) params.append("dateFrom", df);
      if (dt) params.append("dateTo", dt);

      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setArticles(data.articles || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
    } finally {
      setLoading(false);
    }
  // page変更で再生成し、useEffectによる再取得をトリガー
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleSearch = () => {
    paramsRef.current.page = 1;
    setPage(1);
    fetchArticles();
  };

  const handleReset = () => {
    setKeyword("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    paramsRef.current = { page: 1, keyword: "", dateFrom: "", dateTo: "" };
    setTimeout(() => fetchArticles(), 0);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center space-x-2">
          <FileText className="h-8 w-8" />
          <span>記事一覧</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          収集された記事を閲覧・検索できます
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>検索・フィルタ</CardTitle>
          <CardDescription>キーワードや日付で記事を絞り込み</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="keyword">キーワード</Label>
                <div className="flex space-x-2">
                  <Input
                    id="keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="タイトル・要約で検索"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dateFrom">開始日</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">終了日</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                検索
              </Button>
              <Button variant="outline" onClick={handleReset}>
                リセット
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>記事一覧</CardTitle>
          <CardDescription>
            {total}件の記事が見つかりました
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              記事が見つかりませんでした
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>要約</TableHead>
                    <TableHead>収集日時</TableHead>
                    <TableHead>ソース</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium">
                        {article.title || "タイトルなし"}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {article.summary || "要約なし"}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(article.collectedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {article.source ? (
                          <a
                            href={article.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center space-x-1"
                          >
                            <span className="truncate max-w-[200px]">
                              {article.source.url}
                            </span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/articles/${article.id}`}>
                          <Button variant="ghost" size="sm">
                            詳細
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {total > 0
                    ? `${(page - 1) * limit + 1}〜${Math.min(
                        page * limit,
                        total
                      )}件 / 全${total}件`
                    : "0件"}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    前へ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                  >
                    次へ
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

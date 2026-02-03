"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Calendar, Globe } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Article } from "@prisma/client";

interface ArticleWithSource extends Article {
  source?: {
    id: string;
    url: string;
    type: string;
  } | null;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const [article, setArticle] = useState<ArticleWithSource | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchArticle = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch article");
      }
      const data = await res.json();
      setArticle(data.article);
    } catch (error) {
      console.error("Failed to fetch article:", error);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        読み込み中...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">記事が見つかりませんでした</p>
        <Link href="/articles">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/articles">
          <Button variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{article.title || "タイトルなし"}</CardTitle>
          <CardDescription className="flex items-center space-x-4 mt-2">
            <span className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>収集日時: {formatDate(article.collectedAt)}</span>
            </span>
            {article.source && (
              <span className="flex items-center space-x-1">
                <Globe className="h-4 w-4" />
                <span>ソース: {article.source.type === "single" ? "単一記事" : "一覧ページ"}</span>
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {article.summary && (
            <div>
              <h3 className="font-semibold mb-2">要約</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {article.summary}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">本文</h3>
            <div
              className="prose prose-sm max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: article.rawContent }}
            />
          </div>

          <div className="pt-4 border-t">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-primary hover:underline"
            >
              <span>元の記事を開く</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

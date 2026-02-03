import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Globe, Settings, Mail } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Web Investigation</h1>
        <p className="mt-2 text-muted-foreground">
          生産技術×デジタル 技術情報の収集・要約・配信
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>記事一覧</span>
            </CardTitle>
            <CardDescription>収集された記事を閲覧・検索</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/articles">
              <Button variant="outline" className="w-full">
                記事を見る
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>ソース設定</span>
            </CardTitle>
            <CardDescription>収集対象のWebサイトを管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sources">
              <Button variant="outline" className="w-full">
                ソースを管理
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>配信設定</span>
            </CardTitle>
            <CardDescription>メール配信の設定を変更</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/settings">
              <Button variant="outline" className="w-full">
                設定を変更
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

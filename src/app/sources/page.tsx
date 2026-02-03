"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Globe } from "lucide-react";
import type { Source, SourceType } from "@prisma/client";
import { fetchWithTimeout } from "@/lib/utils";

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [formData, setFormData] = useState({
    url: "",
    type: "list" as SourceType,
    selector: "",
  });

  const fetchSources = async () => {
    setFetchError(null);
    setLoading(true);
    try {
      const res = await fetchWithTimeout("/api/sources");
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "読み込みに失敗しました";
        setFetchError(typeof msg === "string" ? msg : "読み込みに失敗しました");
        setSources([]);
        return;
      }
      setSources(data.sources ?? []);
    } catch (error) {
      const message =
        error instanceof Error && error.name === "AbortError"
          ? "タイムアウトしました。しばらくしてから再読み込みしてください。"
          : "読み込みに失敗しました。ネットワークとAPIを確認してください。";
      setFetchError(message);
      setSources([]);
      console.error("Failed to fetch sources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSource
        ? `/api/sources/${editingSource.id}`
        : "/api/sources";
      const method = editingSource ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formData.url,
          type: formData.type,
          selector: formData.selector || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`エラー: ${error.error}`);
        return;
      }

      setDialogOpen(false);
      setEditingSource(null);
      setFormData({ url: "", type: "list", selector: "" });
      fetchSources();
    } catch (error) {
      console.error("Failed to save source:", error);
      alert("ソースの保存に失敗しました");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このソースを削除しますか？")) return;

    try {
      const res = await fetch(`/api/sources/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const error = await res.json();
        alert(`エラー: ${error.error}`);
        return;
      }
      fetchSources();
    } catch (error) {
      console.error("Failed to delete source:", error);
      alert("ソースの削除に失敗しました");
    }
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setFormData({
      url: source.url,
      type: source.type,
      selector: source.selector || "",
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingSource(null);
    setFormData({ url: "", type: "list", selector: "" });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Globe className="h-8 w-8" />
            <span>ソース設定</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            収集対象のWebサイトを追加・編集・削除できます
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              ソースを追加
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSource ? "ソースを編集" : "ソースを追加"}
              </DialogTitle>
              <DialogDescription>
                {editingSource
                  ? "ソースの設定を変更します"
                  : "新しい収集ソースを追加します"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">タイプ</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value as SourceType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">単一記事URL</SelectItem>
                      <SelectItem value="list">一覧ページURL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selector">CSSセレクタ（オプション）</Label>
                  <Textarea
                    id="selector"
                    value={formData.selector}
                    onChange={(e) =>
                      setFormData({ ...formData, selector: e.target.value })
                    }
                    placeholder="記事本文を抽出するCSSセレクタ"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  キャンセル
                </Button>
                <Button type="submit">
                  {editingSource ? "更新" : "追加"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>登録済みソース</CardTitle>
          <CardDescription>
            {sources.length}件のソースが登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : fetchError ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-destructive">{fetchError}</p>
              <Button variant="outline" onClick={() => fetchSources()}>
                再読み込み
              </Button>
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              ソースが登録されていません
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>タイプ</TableHead>
                  <TableHead>セレクタ</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-mono text-sm">
                      {source.url}
                    </TableCell>
                    <TableCell>
                      {source.type === "single" ? "単一記事" : "一覧ページ"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {source.selector || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(source)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ホームページのテスト (TSK-REV-021, REQ-REV-021)
 * クリティカルなUI: トップページの表示とナビゲーションリンク
 * @vitest-environment happy-dom
 */

import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("タイトルと説明が表示される", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Web Investigation");
    expect(screen.getByText(/生産技術×デジタル/)).toBeInTheDocument();
  });

  it("記事一覧へのリンクが表示される", () => {
    render(<HomePage />);
    const articlesLink = screen.getByRole("link", { name: /記事を見る/ });
    expect(articlesLink).toBeInTheDocument();
    expect(articlesLink).toHaveAttribute("href", "/articles");
  });

  it("ソース設定へのリンクが表示される", () => {
    render(<HomePage />);
    const sourcesLink = screen.getByRole("link", { name: /ソースを管理/ });
    expect(sourcesLink).toBeInTheDocument();
    expect(sourcesLink).toHaveAttribute("href", "/sources");
  });

  it("配信設定へのリンクが表示される", () => {
    render(<HomePage />);
    const settingsLink = screen.getByRole("link", { name: /設定を変更/ });
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });
});

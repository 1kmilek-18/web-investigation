/**
 * 構造化ログ (REQ-REV-020, TSK-REV-020, REQ-NFR-004)
 * レベル・メッセージ・タイムスタンプ・任意のコンテキストを JSON で出力する。
 * 本番のログ解析・監視で利用可能。
 */

export type LogLevel = "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  /** 任意のコンテキスト（エラー詳細・ID 等） */
  context?: Record<string, unknown>;
}

function formatEntry(level: LogLevel, message: string, context?: Record<string, unknown>): string {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context && Object.keys(context).length > 0 ? { context } : {}),
  };
  return JSON.stringify(entry);
}

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const line = formatEntry(level, message, context);
  if (level === "error") {
    process.stderr.write(line + "\n");
  } else {
    process.stdout.write(line + "\n");
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    write("info", message, context);
  },
  warn(message: string, context?: Record<string, unknown>): void {
    write("warn", message, context);
  },
  error(message: string, context?: Record<string, unknown>): void {
    write("error", message, context);
  },
};

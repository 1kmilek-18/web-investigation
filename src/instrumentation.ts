/**
 * Next.js Instrumentation (REQ-REV-014, TSK-REV-014)
 * next build のページデータ収集で spawn するワーカーでも File/Blob が参照できるよう、
 * 未定義の場合のみ Node.js の buffer から polyfill する。
 * 本番は Node.js 20+ を推奨（engines.node >= 20）。
 */

export async function register(): Promise<void> {
  if (typeof globalThis.File === "undefined" || typeof globalThis.Blob === "undefined") {
    const { Blob, File } = await import("node:buffer");
    (globalThis as unknown as { File: typeof File }).File = File;
    (globalThis as unknown as { Blob: typeof Blob }).Blob = Blob;
  }
}

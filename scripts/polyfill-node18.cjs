/**
 * Node 18 用: File/Blob ポリフィル（起動時に --require で読み込む）
 * cheerio/undici の "File is not defined" 対策
 */
if (typeof globalThis.File === "undefined" || typeof globalThis.Blob === "undefined") {
  const { Blob, File } = require("buffer");
  globalThis.Blob = Blob;
  globalThis.File = File;
}

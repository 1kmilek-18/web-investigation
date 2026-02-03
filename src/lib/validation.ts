/**
 * 共通バリデーション（CODE_REVIEW §6.1: isValidUrl 共通化）
 */

export function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

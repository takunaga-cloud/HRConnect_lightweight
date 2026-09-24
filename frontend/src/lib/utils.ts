import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { BACKEND_URL } from "@/lib/constants";

/**
 * URLのパスを安全に結合します。
 * 重複するスラッシュを除去し、正しく結合されたURL文字列を返します。
 * @param baseUrl ベースURL (例: "http://localhost:8000")
 * @param path パス (例: "/api/v1/users")
 */
export function joinUrl(baseUrl: string | undefined = BACKEND_URL, path: string): string {
  if (!baseUrl) return path;

  // 末尾のスラッシュを削除
  const cleanBase = baseUrl.replace(/\/+$/, '');
  // 先頭のスラッシュを削除
  const cleanPath = path.replace(/^\/+/, '');

  return `${cleanBase}/${cleanPath}`;
}

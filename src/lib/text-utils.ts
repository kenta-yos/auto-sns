// 単純な文字数カウント（280字上限）
export function weightedLength(text: string): number {
  return [...text].length;
}

export const MAX_WEIGHT = 280;

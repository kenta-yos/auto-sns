// X互換の重み付き文字数カウント（CJK等は2、Latin等は1）
export function weightedLength(text: string): number {
  let weight = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (
      (code >= 0x1100 && code <= 0x11ff) ||  // Hangul Jamo
      (code >= 0x2e80 && code <= 0x9fff) ||  // CJK
      (code >= 0xac00 && code <= 0xd7af) ||  // Hangul Syllables
      (code >= 0xf900 && code <= 0xfaff) ||  // CJK Compat
      (code >= 0xfe30 && code <= 0xfe4f) ||  // CJK Compat Forms
      (code >= 0xff01 && code <= 0xff60) ||  // Fullwidth Forms
      (code >= 0xffe0 && code <= 0xffe6) ||  // Fullwidth Signs
      (code >= 0x20000 && code <= 0x2fa1f)   // CJK Extension
    ) {
      weight += 2;
    } else {
      weight += 1;
    }
  }
  return weight;
}

export const MAX_WEIGHT = 280;

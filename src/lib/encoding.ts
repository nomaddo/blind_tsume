// テキストファイルのエンコーディング検出・デコードユーティリティ
// Shift_JIS と UTF-8 の両方に対応する

/** バイト列がUTF-8として有効かを判定 */
function isValidUtf8(bytes: Uint8Array): boolean {
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i];
    let remaining = 0;
    if (b <= 0x7f) {
      remaining = 0;
    } else if ((b & 0xe0) === 0xc0) {
      remaining = 1;
    } else if ((b & 0xf0) === 0xe0) {
      remaining = 2;
    } else if ((b & 0xf8) === 0xf0) {
      remaining = 3;
    } else {
      return false;
    }
    i++;
    for (let j = 0; j < remaining; j++) {
      if (i >= bytes.length || (bytes[i] & 0xc0) !== 0x80) {
        return false;
      }
      i++;
    }
  }
  return true;
}

/** バイト列をテキストにデコード（UTF-8を試し、ダメならShift_JISとして扱う） */
export function decodeText(bytes: Uint8Array): string {
  if (isValidUtf8(bytes)) {
    return new TextDecoder("utf-8").decode(bytes);
  }
  return new TextDecoder("shift_jis").decode(bytes);
}
